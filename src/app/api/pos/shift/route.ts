import { NextResponse } from 'next/server';
import { queryOne, execute } from '@/lib/db';

export async function GET() {
  try {
    const activeShift = queryOne(`
      SELECT s.*, u.name as user_name
      FROM shifts s
      JOIN users u ON s.user_id = u.id
      WHERE s.status = 'open'
      ORDER BY s.id DESC
      LIMIT 1
    `);

    if (!activeShift) {
      return NextResponse.json({ active_shift: null });
    }

    // Calculate cash sales and total sales in this shift
    const salesSummary = queryOne(`
      SELECT 
        COALESCE(SUM(total_amount), 0) as total_sales,
        COALESCE(SUM(CASE WHEN payment_method = 'cash' THEN total_amount ELSE 0 END), 0) as cash_sales,
        COALESCE(SUM(CASE WHEN payment_method = 'transfer' THEN total_amount ELSE 0 END), 0) as transfer_sales,
        COALESCE(SUM(CASE WHEN payment_method = 'credit_card' THEN total_amount ELSE 0 END), 0) as card_sales,
        COALESCE(SUM(CASE WHEN payment_method = 'credit' THEN total_amount ELSE 0 END), 0) as credit_sales,
        COUNT(id) as bill_count
      FROM sales_orders
      WHERE shift_id = ? AND status = 'completed'
    `, [activeShift.id]);

    // Calculate petty cash expenses from this shift
    const expenseSummary = queryOne(`
      SELECT COALESCE(SUM(amount), 0) as total_expenses
      FROM expenses
      WHERE shift_id = ? AND payment_method = 'cash'
    `, [activeShift.id]);

    const openingCash = activeShift.opening_cash || 0;
    const cashSales = salesSummary?.cash_sales || 0;
    const expenses = expenseSummary?.total_expenses || 0;
    const expectedCash = openingCash + cashSales - expenses;

    return NextResponse.json({
      active_shift: {
        ...activeShift,
        total_sales: salesSummary?.total_sales || 0,
        cash_sales: cashSales,
        transfer_sales: salesSummary?.transfer_sales || 0,
        card_sales: salesSummary?.card_sales || 0,
        credit_sales: salesSummary?.credit_sales || 0,
        bill_count: salesSummary?.bill_count || 0,
        expenses,
        expected_cash: expectedCash
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, user_id = 2, opening_cash = 0, closing_cash = 0, notes = '' } = body;

    if (action === 'open') {
      // Check if already open
      const existing = queryOne("SELECT id FROM shifts WHERE status = 'open'");
      if (existing) {
        return NextResponse.json({ error: 'มีกะขายที่เปิดใช้งานอยู่แล้ว กรุณาปิดกะเดิมก่อน' }, { status: 400 });
      }

      const res = execute(`
        INSERT INTO shifts (user_id, opening_cash, opened_at, status, notes)
        VALUES (?, ?, datetime('now', 'localtime'), 'open', ?)
      `, [user_id, opening_cash, notes || `เปิดกะ เงินทอนเริ่มต้น ฿${opening_cash.toLocaleString()}`]);

      return NextResponse.json({ success: true, shift_id: Number(res.lastInsertRowid) });
    }

    if (action === 'close') {
      const active = queryOne("SELECT * FROM shifts WHERE status = 'open' ORDER BY id DESC LIMIT 1");
      if (!active) {
        return NextResponse.json({ error: 'ไม่พบกะขายที่เปิดอยู่' }, { status: 400 });
      }

      // Calculate expected cash
      const sales = queryOne(`
        SELECT COALESCE(SUM(total_amount), 0) as cash_sales
        FROM sales_orders
        WHERE shift_id = ? AND status = 'completed' AND payment_method = 'cash'
      `, [active.id]);

      const exp = queryOne(`
        SELECT COALESCE(SUM(amount), 0) as expenses
        FROM expenses
        WHERE shift_id = ? AND payment_method = 'cash'
      `, [active.id]);

      const expected = (active.opening_cash || 0) + (sales?.cash_sales || 0) - (exp?.expenses || 0);
      const diff = closing_cash - expected;

      execute(`
        UPDATE shifts SET
          closing_cash = ?,
          expected_cash = ?,
          closed_at = datetime('now', 'localtime'),
          status = 'closed',
          notes = ?
        WHERE id = ?
      `, [closing_cash, expected, `${notes} | นับได้จริง ฿${closing_cash.toLocaleString()} (ส่วนต่าง: ฿${diff.toLocaleString()})`, active.id]);

      return NextResponse.json({
        success: true,
        summary: {
          opening_cash: active.opening_cash,
          cash_sales: sales?.cash_sales || 0,
          expenses: exp?.expenses || 0,
          expected_cash: expected,
          closing_cash,
          diff
        }
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
