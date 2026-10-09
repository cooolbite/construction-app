import { NextResponse } from 'next/server';
import { queryAll, queryOne, execute, runTransaction } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const { quotation_id, user_id = 2, payment_method = 'credit', warehouse_id = 2 } = await req.json();

    if (!quotation_id) {
      return NextResponse.json({ error: 'Missing quotation_id' }, { status: 400 });
    }

    const quotation = queryOne('SELECT * FROM quotations WHERE id = ?', [quotation_id]);
    if (!quotation) {
      return NextResponse.json({ error: 'ไม่พบใบเสนอราคา' }, { status: 404 });
    }

    const items = queryAll(`
      SELECT qi.*, p.cost_price, pu.conversion_factor
      FROM quotation_items qi
      JOIN products p ON qi.product_id = p.id
      LEFT JOIN product_uoms pu ON qi.uom_id = pu.id
      WHERE qi.quotation_id = ?
    `, [quotation_id]);

    const result = runTransaction(() => {
      // 1. Generate Invoice doc_no
      const prefix = 'INV-2026-';
      const lastDoc = queryOne('SELECT doc_no FROM sales_orders WHERE doc_no LIKE ? ORDER BY id DESC LIMIT 1', [`${prefix}%`]);
      let nextSeq = 1;
      if (lastDoc?.doc_no) {
        const num = parseInt(lastDoc.doc_no.replace(prefix, ''), 10);
        if (!isNaN(num)) nextSeq = num + 1;
      }
      const doc_no = `${prefix}${String(nextSeq).padStart(6, '0')}`;

      // 2. Active shift
      const shift = queryOne("SELECT id FROM shifts WHERE status = 'open' ORDER BY id DESC LIMIT 1");
      const shiftId = shift ? shift.id : 1;

      // 3. Insert sales order
      const payment_status = payment_method === 'credit' ? 'unpaid' : 'paid';
      const saleRes = execute(`
        INSERT INTO sales_orders (
          doc_no, doc_type, customer_id, shift_id, user_id, status,
          subtotal, discount_amount, vat_rate, vat_amount, total_amount,
          payment_status, payment_method, notes
        ) VALUES (?, 'INVOICE', ?, ?, ?, 'completed', ?, ?, 7, ?, ?, ?, ?, ?)
      `, [
        doc_no, quotation.customer_id, shiftId, user_id,
        quotation.subtotal, quotation.discount_amount, quotation.vat_amount,
        quotation.total_amount, payment_status, payment_method,
        `แปลงจากใบเสนอราคา ${quotation.doc_no}`
      ]);
      const saleId = Number(saleRes.lastInsertRowid);

      // 4. Update customer balance if credit
      if (payment_method === 'credit' && quotation.customer_id > 1) {
        execute('UPDATE customers SET current_balance = current_balance + ? WHERE id = ?', [
          quotation.total_amount, quotation.customer_id
        ]);
      }

      // 5. Insert sales items and deduct stock
      for (const item of items) {
        const factor = item.conversion_factor || 1;
        const baseQty = item.quantity * factor;
        const unitCost = item.cost_price || 0;

        execute(`
          INSERT INTO sales_items (
            sale_id, product_id, uom_id, unit_name, quantity, base_quantity,
            unit_price, discount, total_price, unit_cost
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          saleId, item.product_id, item.uom_id, item.unit_name,
          item.quantity, baseQty, item.unit_price, item.discount || 0,
          item.total_price, unitCost
        ]);

        // Stock deduction
        const curBal = queryOne('SELECT quantity FROM inventory_balances WHERE product_id = ? AND warehouse_id = ?', [
          item.product_id, warehouse_id
        ]);
        const oldQty = curBal ? curBal.quantity : 0;
        const newQty = oldQty - baseQty;

        if (curBal) {
          execute('UPDATE inventory_balances SET quantity = ? WHERE product_id = ? AND warehouse_id = ?', [
            newQty, item.product_id, warehouse_id
          ]);
        } else {
          execute('INSERT INTO inventory_balances (product_id, warehouse_id, quantity) VALUES (?, ?, ?)', [
            item.product_id, warehouse_id, newQty
          ]);
        }

        execute(`
          INSERT INTO stock_cards (
            product_id, warehouse_id, doc_type, doc_no, movement_type,
            quantity, unit_cost, balance_after, note, created_by
          ) VALUES (?, ?, 'INVOICE', ?, 'OUT', ?, ?, ?, ?, ?)
        `, [
          item.product_id, warehouse_id, doc_no, baseQty,
          unitCost, newQty, `ตัดสต็อกจากใบเสนอราคา ${quotation.doc_no} (บิล ${doc_no})`, 'cashier'
        ]);
      }

      // 6. Update Quotation status to 'converted'
      execute("UPDATE quotations SET status = 'converted' WHERE id = ?", [quotation_id]);

      return { saleId, doc_no, total_amount: quotation.total_amount };
    });

    return NextResponse.json({ success: true, converted_invoice: result });
  } catch (error: any) {
    console.error('Convert quotation error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
