import { NextResponse } from 'next/server';
import { queryAll, queryOne, execute, runTransaction } from '@/lib/db';

export async function GET() {
  try {
    const expenses = queryAll(`
      SELECT e.*, u.name as user_name
      FROM expenses e
      JOIN users u ON e.user_id = u.id
      ORDER BY e.id DESC
      LIMIT 100
    `);

    const summaryByCategory = queryAll(`
      SELECT category, SUM(amount) as total_amount, COUNT(id) as count
      FROM expenses
      GROUP BY category
      ORDER BY total_amount DESC
    `);

    const totalToday = queryOne(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM expenses
      WHERE date(created_at) = date('now', 'localtime')
    `);

    return NextResponse.json({
      expenses,
      summary_by_category: summaryByCategory,
      total_today: totalToday?.total || 0
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { category, amount, payment_method = 'cash', note = '', user_id = 2, shift_id } = body;

    if (!category || !amount || amount <= 0) {
      return NextResponse.json({ error: 'หมวดหมู่และจำนวนเงินเป็นข้อมูลจำเป็น' }, { status: 400 });
    }

    const res = runTransaction(() => {
      const doc_no = `EXP-${Date.now().toString().slice(-6)}`;
      const activeShift = shift_id || queryOne("SELECT id FROM shifts WHERE status = 'open' ORDER BY id DESC LIMIT 1")?.id || null;

      const ins = execute(`
        INSERT INTO expenses (doc_no, category, amount, payment_method, shift_id, note, user_id)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [doc_no, category, amount, payment_method, activeShift, note, user_id]);

      return { id: Number(ins.lastInsertRowid), doc_no, amount };
    });

    return NextResponse.json({ success: true, expense: res });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
