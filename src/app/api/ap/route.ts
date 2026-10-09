import { NextResponse } from 'next/server';
import { queryAll, queryOne, execute, runTransaction } from '@/lib/db';

export async function GET() {
  try {
    const suppliers = queryAll(`
      SELECT 
        s.*,
        (SELECT COUNT(id) FROM purchase_orders WHERE supplier_id = s.id AND status IN ('ordered', 'partial', 'received')) as po_count,
        (SELECT COALESCE(SUM(total_amount), 0) FROM purchase_orders WHERE supplier_id = s.id AND status IN ('ordered', 'partial', 'received')) as total_ordered
      FROM suppliers s
    `);

    const pendingOrders = queryAll(`
      SELECT 
        po.*, s.name as supplier_name, s.phone as supplier_phone,
        julianday('now') - julianday(po.created_at) as days_open
      FROM purchase_orders po
      JOIN suppliers s ON po.supplier_id = s.id
      ORDER BY po.id DESC
    `);

    const vouchers = queryAll(`
      SELECT 
        p.*, s.name as supplier_name, u.name as user_name
      FROM payments p
      JOIN suppliers s ON p.supplier_id = s.id
      JOIN users u ON p.user_id = u.id
      WHERE p.payment_type = 'PAY'
      ORDER BY p.id DESC
      LIMIT 20
    `);

    return NextResponse.json({
      suppliers,
      orders: pendingOrders,
      vouchers
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { po_id, supplier_id, amount, payment_method = 'transfer', note = '', user_id = 5 } = body;

    if (!supplier_id || !amount || amount <= 0) {
      return NextResponse.json({ error: 'ข้อมูลการจ่ายเงินไม่ถูกต้อง' }, { status: 400 });
    }

    const res = runTransaction(() => {
      const payDocNo = `VOU-${Date.now().toString().slice(-6)}`;

      execute(`
        INSERT INTO payments (
          doc_no, ref_type, ref_id, supplier_id, payment_type, amount, payment_method, note, user_id
        ) VALUES (?, 'PO', ?, ?, 'PAY', ?, ?, ?, ?)
      `, [payDocNo, po_id || 0, supplier_id, amount, payment_method, note, user_id]);

      return { doc_no: payDocNo, amount };
    });

    return NextResponse.json({ success: true, voucher: res });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
