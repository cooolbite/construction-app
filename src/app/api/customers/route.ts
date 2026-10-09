import { NextResponse } from 'next/server';
import { queryAll, execute } from '@/lib/db';

export async function GET() {
  try {
    const customers = queryAll('SELECT * FROM customers ORDER BY id ASC');
    return NextResponse.json(customers);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, customer_type = 'contractor', phone = '', address = '', tax_id = '', credit_limit = 0, credit_term_days = 30, price_tier = 'contractor' } = body;

    if (!name) return NextResponse.json({ error: 'ชื่อลูกค้าจำเป็นต้องกรอก' }, { status: 400 });

    const code = `CUST-${Date.now().toString().slice(-4)}`;
    const res = execute(`
      INSERT INTO customers (code, name, customer_type, phone, address, tax_id, credit_limit, credit_term_days, current_balance, price_tier)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
    `, [code, name, customer_type, phone, address, tax_id, credit_limit, credit_term_days, price_tier]);

    return NextResponse.json({ success: true, id: Number(res.lastInsertRowid), code });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
