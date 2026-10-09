import { NextResponse } from 'next/server';
import { queryAll, queryOne, execute, runTransaction } from '@/lib/db';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const customerId = searchParams.get('customer_id');

    // 1. Customer balances
    let custSql = `
      SELECT 
        c.*,
        (SELECT COUNT(id) FROM sales_orders WHERE customer_id = c.id AND payment_status IN ('unpaid', 'partial')) as unpaid_invoices_count
      FROM customers c
      WHERE c.current_balance > 0 OR c.id IN (SELECT DISTINCT customer_id FROM sales_orders WHERE payment_status IN ('unpaid', 'partial'))
    `;
    const customers = queryAll(custSql);

    // 2. Unpaid invoices
    let invSql = `
      SELECT 
        so.*, c.name as customer_name, c.phone as customer_phone, c.credit_limit,
        julianday('now') - julianday(so.created_at) as days_overdue
      FROM sales_orders so
      JOIN customers c ON so.customer_id = c.id
      WHERE so.payment_status IN ('unpaid', 'partial') AND so.status = 'completed'
    `;
    const params: any[] = [];
    if (customerId) {
      invSql += ' AND so.customer_id = ?';
      params.push(customerId);
    }
    invSql += ' ORDER BY so.id ASC';

    const invoices = queryAll(invSql, params);

    // Aging breakdown
    let current_0_30 = 0;
    let overdue_31_60 = 0;
    let overdue_60_plus = 0;

    for (const inv of invoices) {
      const days = inv.days_overdue || 0;
      const amt = inv.total_amount || 0;
      if (days <= 30) current_0_30 += amt;
      else if (days <= 60) overdue_31_60 += amt;
      else overdue_60_plus += amt;
    }

    return NextResponse.json({
      customers,
      invoices,
      aging: {
        total_outstanding: current_0_30 + overdue_31_60 + overdue_60_plus,
        current_0_30,
        overdue_31_60,
        overdue_60_plus
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      sale_id,
      customer_id,
      amount,
      payment_method = 'transfer',
      note = '',
      user_id = 5
    } = body;

    if (!sale_id || !amount || amount <= 0) {
      return NextResponse.json({ error: 'ข้อมูลการชำระเงินไม่ถูกต้อง' }, { status: 400 });
    }

    const sale = queryOne('SELECT * FROM sales_orders WHERE id = ?', [sale_id]);
    if (!sale) return NextResponse.json({ error: 'ไม่พบบิลหนี้' }, { status: 404 });

    const res = runTransaction(() => {
      const payDocNo = `REC-${Date.now().toString().slice(-6)}`;

      // 1. Record payment
      execute(`
        INSERT INTO payments (
          doc_no, ref_type, ref_id, customer_id, payment_type, amount, payment_method, note, user_id
        ) VALUES (?, 'SALE', ?, ?, 'RECEIVE', ?, ?, ?, ?)
      `, [payDocNo, sale_id, customer_id || sale.customer_id, amount, payment_method, note, user_id]);

      // 2. Update sale invoice
      const newStatus = amount >= sale.total_amount ? 'paid' : 'partial';
      execute('UPDATE sales_orders SET payment_status = ? WHERE id = ?', [newStatus, sale_id]);

      // 3. Decrease customer current balance
      const targetCustId = customer_id || sale.customer_id;
      if (targetCustId) {
        execute('UPDATE customers SET current_balance = MAX(0, current_balance - ?) WHERE id = ?', [
          amount, targetCustId
        ]);
      }

      return { doc_no: payDocNo, paid_amount: amount, new_status: newStatus };
    });

    return NextResponse.json({ success: true, payment: res });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
