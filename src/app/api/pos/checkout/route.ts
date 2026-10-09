import { NextResponse } from 'next/server';
import { queryOne, execute, runTransaction } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      customer_id = 1,
      user_id = 2,
      warehouse_id = 2, // Default Storefront
      items = [],
      subtotal = 0,
      discount_amount = 0,
      vat_rate = 7,
      vat_amount = 0,
      total_amount = 0,
      payment_method = 'cash',
      cash_tendered = 0,
      change_amount = 0,
      doc_type = 'POS',
      notes = ''
    } = body;

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'ไม่มีรายการสินค้าในบิล' }, { status: 400 });
    }

    const result = runTransaction(() => {
      // 1. Get Active Shift
      let shift = queryOne("SELECT id FROM shifts WHERE status = 'open' ORDER BY id DESC LIMIT 1");
      let shiftId = shift?.id;
      if (!shiftId) {
        // Auto open shift if none open
        const newShift = execute(`
          INSERT INTO shifts (user_id, opening_cash, opened_at, status, notes)
          VALUES (?, 0, datetime('now', 'localtime'), 'open', 'เปิดกะอัตโนมัติขณะขาย')
        `, [user_id]);
        shiftId = Number(newShift.lastInsertRowid);
      }

      // 2. Generate Document Number
      const prefixSetting = queryOne("SELECT value FROM settings WHERE key = 'prefix_inv'");
      const prefix = prefixSetting ? prefixSetting.value : 'INV-2026-';
      const lastDoc = queryOne(`
        SELECT doc_no FROM sales_orders WHERE doc_no LIKE ? ORDER BY id DESC LIMIT 1
      `, [`${prefix}%`]);
      let nextSeq = 1;
      if (lastDoc && lastDoc.doc_no) {
        const parts = lastDoc.doc_no.replace(prefix, '');
        const num = parseInt(parts, 10);
        if (!isNaN(num)) nextSeq = num + 1;
      }
      const doc_no = `${prefix}${String(nextSeq).padStart(6, '0')}`;

      // 3. Check customer credit if credit sale
      const payment_status = payment_method === 'credit' ? 'unpaid' : 'paid';
      if (payment_method === 'credit' && customer_id > 1) {
        const cust = queryOne('SELECT * FROM customers WHERE id = ?', [customer_id]);
        if (cust) {
          const newBal = (cust.current_balance || 0) + total_amount;
          if (cust.credit_limit > 0 && newBal > cust.credit_limit) {
            throw new Error(`ยอดค้างชำระจะเกินวงเงินเครดิตที่กำหนด (วงเงิน: ฿${cust.credit_limit.toLocaleString()}, ยอดเดิม: ฿${cust.current_balance.toLocaleString()}, บิลนี้: ฿${total_amount.toLocaleString()})`);
          }
          execute('UPDATE customers SET current_balance = current_balance + ? WHERE id = ?', [total_amount, customer_id]);
        }
      }

      // 4. Insert Sales Order
      const saleRes = execute(`
        INSERT INTO sales_orders (
          doc_no, doc_type, customer_id, shift_id, user_id, status,
          subtotal, discount_amount, vat_rate, vat_amount, total_amount,
          payment_status, payment_method, cash_tendered, change_amount, notes
        ) VALUES (?, ?, ?, ?, ?, 'completed', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        doc_no, doc_type, customer_id, shiftId, user_id,
        subtotal, discount_amount, vat_rate, vat_amount, total_amount,
        payment_status, payment_method, cash_tendered, change_amount, notes
      ]);
      const saleId = Number(saleRes.lastInsertRowid);

      // 5. Insert Items & Deduct Stock
      for (const item of items) {
        const baseQty = (item.quantity || 1) * (item.conversion_factor || 1);
        const unitCost = item.unit_cost || item.cost_price || 0;

        execute(`
          INSERT INTO sales_items (
            sale_id, product_id, uom_id, unit_name, quantity, base_quantity,
            unit_price, discount, total_price, unit_cost
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          saleId, item.product_id, item.uom_id || null, item.unit_name || 'ชิ้น',
          item.quantity, baseQty, item.unit_price, item.discount || 0,
          item.total_price, unitCost
        ]);

        // Check stock balance
        const currentBal = queryOne(`
          SELECT quantity FROM inventory_balances WHERE product_id = ? AND warehouse_id = ?
        `, [item.product_id, warehouse_id]);

        const oldQty = currentBal ? currentBal.quantity : 0;
        const newQty = oldQty - baseQty;

        if (currentBal) {
          execute(`
            UPDATE inventory_balances SET quantity = ?, updated_at = datetime('now', 'localtime')
            WHERE product_id = ? AND warehouse_id = ?
          `, [newQty, item.product_id, warehouse_id]);
        } else {
          execute(`
            INSERT INTO inventory_balances (product_id, warehouse_id, quantity)
            VALUES (?, ?, ?)
          `, [item.product_id, warehouse_id, newQty]);
        }

        // Record Stock Card
        execute(`
          INSERT INTO stock_cards (
            product_id, warehouse_id, doc_type, doc_no, movement_type,
            quantity, unit_cost, balance_after, note, created_by
          ) VALUES (?, ?, 'SALE', ?, 'OUT', ?, ?, ?, ?, ?)
        `, [
          item.product_id, warehouse_id, doc_no, baseQty,
          unitCost, newQty, `ขายหน้าร้าน บิล ${doc_no}`, 'cashier'
        ]);
      }

      // 6. Record Payment record if paid
      if (payment_status === 'paid') {
        execute(`
          INSERT INTO payments (
            doc_no, ref_type, ref_id, customer_id, payment_type, amount, payment_method, note, user_id
          ) VALUES (?, 'SALE', ?, ?, 'RECEIVE', ?, ?, 'ชำระค่าสินค้าหน้าร้าน', ?)
        `, [
          `PAY-${doc_no}`, saleId, customer_id, total_amount, payment_method, user_id
        ]);
      }

      return {
        saleId,
        doc_no,
        total_amount,
        payment_method,
        cash_tendered,
        change_amount,
        created_at: new Date().toISOString()
      };
    });

    return NextResponse.json({ success: true, invoice: result });
  } catch (error: any) {
    console.error('POS Checkout error:', error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
