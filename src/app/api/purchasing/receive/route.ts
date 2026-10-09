import { NextResponse } from 'next/server';
import { queryAll, queryOne, execute, runTransaction } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      po_id,
      warehouse_id = 1, // Main Warehouse
      ref_invoice_no = '',
      user_id = 3, // Warehouse keeper
      items = [], // array of { po_item_id, product_id, uom_id, receive_qty, unit_cost }
      notes = ''
    } = body;

    if (!po_id || !items.length) {
      return NextResponse.json({ error: 'Missing po_id or items' }, { status: 400 });
    }

    const po = queryOne('SELECT * FROM purchase_orders WHERE id = ?', [po_id]);
    if (!po) return NextResponse.json({ error: 'ไม่พบใบสั่งซื้อ' }, { status: 404 });

    const result = runTransaction(() => {
      // 1. Generate GRN doc_no
      const prefix = 'GRN-2026-';
      const last = queryOne('SELECT doc_no FROM goods_receipts WHERE doc_no LIKE ? ORDER BY id DESC LIMIT 1', [`${prefix}%`]);
      let seq = 1;
      if (last?.doc_no) {
        const num = parseInt(last.doc_no.replace(prefix, ''), 10);
        if (!isNaN(num)) seq = num + 1;
      }
      const grn_doc_no = `${prefix}${String(seq).padStart(6, '0')}`;

      // 2. Insert goods_receipts
      const grnRes = execute(`
        INSERT INTO goods_receipts (
          doc_no, po_id, supplier_id, warehouse_id, received_date, ref_invoice_no, user_id, notes
        ) VALUES (?, ?, ?, ?, date('now'), ?, ?, ?)
      `, [grn_doc_no, po_id, po.supplier_id, warehouse_id, ref_invoice_no, user_id, notes]);
      const grnId = Number(grnRes.lastInsertRowid);

      // 3. Process items
      let allCompleted = true;
      for (const item of items) {
        const receiveQty = Number(item.receive_qty) || 0;
        if (receiveQty <= 0) continue;

        const poItem = queryOne('SELECT * FROM purchase_items WHERE id = ?', [item.po_item_id]);
        if (!poItem) continue;

        const newReceivedTotal = (poItem.received_quantity || 0) + receiveQty;
        execute('UPDATE purchase_items SET received_quantity = ? WHERE id = ?', [newReceivedTotal, item.po_item_id]);

        if (newReceivedTotal < poItem.quantity) {
          allCompleted = false;
        }

        // Get UOM conversion factor
        let factor = 1;
        if (item.uom_id) {
          const uom = queryOne('SELECT conversion_factor FROM product_uoms WHERE id = ?', [item.uom_id]);
          if (uom) factor = uom.conversion_factor;
        }

        const baseQty = receiveQty * factor;
        const unitCost = Number(item.unit_cost) || poItem.unit_cost;
        const totalCost = receiveQty * unitCost;

        // Insert GRN Item
        execute(`
          INSERT INTO goods_receipt_items (
            grn_id, product_id, uom_id, quantity, base_quantity, unit_cost, total_cost
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [grnId, item.product_id, item.uom_id || null, receiveQty, baseQty, unitCost, totalCost]);

        // Update warehouse inventory balance
        const curBal = queryOne('SELECT quantity FROM inventory_balances WHERE product_id = ? AND warehouse_id = ?', [
          item.product_id, warehouse_id
        ]);
        const oldQty = curBal ? curBal.quantity : 0;
        const newQty = oldQty + baseQty;

        if (curBal) {
          execute('UPDATE inventory_balances SET quantity = ? WHERE product_id = ? AND warehouse_id = ?', [
            newQty, item.product_id, warehouse_id
          ]);
        } else {
          execute('INSERT INTO inventory_balances (product_id, warehouse_id, quantity) VALUES (?, ?, ?)', [
            item.product_id, warehouse_id, newQty
          ]);
        }

        // Record Stock Card (IN)
        execute(`
          INSERT INTO stock_cards (
            product_id, warehouse_id, doc_type, doc_no, movement_type,
            quantity, unit_cost, balance_after, note, created_by
          ) VALUES (?, ?, 'GRN', ?, 'IN', ?, ?, ?, ?, ?)
        `, [
          item.product_id, warehouse_id, grn_doc_no, baseQty,
          unitCost, newQty, `รับสินค้าตามใบสั่งซื้อ ${po.doc_no} (ใบส่งของ: ${ref_invoice_no || '-'})`, 'warehouse'
        ]);

        // Update moving average cost price in products table
        // (old_qty * old_cost + in_qty * in_cost) / (old_qty + in_qty)
        const prod = queryOne('SELECT cost_price FROM products WHERE id = ?', [item.product_id]);
        if (prod && newQty > 0) {
          const weightedCost = ((oldQty * (prod.cost_price || 0)) + (baseQty * unitCost)) / newQty;
          execute('UPDATE products SET cost_price = ? WHERE id = ?', [
            Math.round(weightedCost * 100) / 100, item.product_id
          ]);
        }
      }

      // Update PO status
      const updatedPoItems = queryAll('SELECT quantity, received_quantity FROM purchase_items WHERE po_id = ?', [po_id]);
      const fullyReceived = updatedPoItems.every(pi => pi.received_quantity >= pi.quantity);
      execute('UPDATE purchase_orders SET status = ? WHERE id = ?', [
        fullyReceived ? 'received' : 'partial', po_id
      ]);

      return { grnId, doc_no: grn_doc_no, status: fullyReceived ? 'received' : 'partial' };
    });

    return NextResponse.json({ success: true, grn: result });
  } catch (error: any) {
    console.error('Receive goods error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
