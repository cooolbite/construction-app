import { NextResponse } from 'next/server';
import { queryAll, execute } from '@/lib/db';

export async function GET() {
  try {
    const suppliers = queryAll('SELECT * FROM suppliers ORDER BY id ASC');
    return NextResponse.json(suppliers);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, contact_name = '', phone = '', email = '', address = '', tax_id = '', payment_term_days = 30 } = body;

    if (!name) return NextResponse.json({ error: 'ชื่อผู้จำหน่ายจำเป็นต้องกรอก' }, { status: 400 });

    const code = `SUP-${Date.now().toString().slice(-4)}`;
    const res = execute(`
      INSERT INTO suppliers (code, name, contact_name, phone, email, address, tax_id, payment_term_days)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [code, name, contact_name, phone, email, address, tax_id, payment_term_days]);

    return NextResponse.json({ success: true, id: Number(res.lastInsertRowid), code });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
