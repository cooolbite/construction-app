import { NextResponse } from 'next/server';
import { queryAll, queryOne, execute, runTransaction } from '@/lib/db';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (id) {
      const quotation = queryOne(`
        SELECT q.*, c.name as customer_name, c.phone as customer_phone, c.address as customer_address, u.name as user_name
        FROM quotations q
        JOIN customers c ON q.customer_id = c.id
        JOIN users u ON q.user_id = u.id
        WHERE q.id = ?
      `, [id]);

      if (!quotation) {
        return NextResponse.json({ error: 'Quotation not found' }, { status: 404 });
      }

      quotation.items = queryAll(`
        SELECT qi.*, p.name as product_name, p.sku
        FROM quotation_items qi
        JOIN products p ON qi.product_id = p.id
        WHERE qi.quotation_id = ?
      `, [id]);

      return NextResponse.json(quotation);
    }

    const quotes = queryAll(`
      SELECT q.*, c.name as customer_name, c.phone as customer_phone, u.name as user_name
      FROM quotations q
      JOIN customers c ON q.customer_id = c.id
      JOIN users u ON q.user_id = u.id
      ORDER BY q.id DESC
    `);

    for (const q of quotes) {
      q.items = queryAll(`
        SELECT qi.*, p.name as product_name, p.sku
        FROM quotation_items qi
        JOIN products p ON qi.product_id = p.id
        WHERE qi.quotation_id = ?
      `, [q.id]);
    }

    return NextResponse.json(quotes);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      customer_id,
      user_id = 1,
      valid_days = 15,
      items = [],
      subtotal = 0,
      discount_amount = 0,
      vat_amount = 0,
      total_amount = 0,
      notes = ''
    } = body;

    if (!customer_id || !items.length) {
      return NextResponse.json({ error: 'กรุณาเลือกลูกค้าและเพิ่มสินค้าในใบเสนอราคา' }, { status: 400 });
    }

    const res = runTransaction(() => {
      const prefix = 'QUO-2026-';
      const last = queryOne('SELECT doc_no FROM quotations WHERE doc_no LIKE ? ORDER BY id DESC LIMIT 1', [`${prefix}%`]);
      let seq = 1;
      if (last?.doc_no) {
        const num = parseInt(last.doc_no.replace(prefix, ''), 10);
        if (!isNaN(num)) seq = num + 1;
      }
      const doc_no = `${prefix}${String(seq).padStart(6, '0')}`;

      const insertQ = execute(`
        INSERT INTO quotations (
          doc_no, customer_id, user_id, valid_until, status,
          subtotal, discount_amount, vat_amount, total_amount, notes
        ) VALUES (?, ?, ?, date('now', '+${valid_days} days'), 'draft', ?, ?, ?, ?, ?)
      `, [doc_no, customer_id, user_id, subtotal, discount_amount, vat_amount, total_amount, notes]);

      const qId = Number(insertQ.lastInsertRowid);

      for (const item of items) {
        execute(`
          INSERT INTO quotation_items (
            quotation_id, product_id, uom_id, unit_name, quantity, unit_price, discount, total_price
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          qId, item.product_id, item.uom_id || null, item.unit_name,
          item.quantity, item.unit_price, item.discount || 0, item.total_price
        ]);
      }

      return { id: qId, doc_no };
    });

    return NextResponse.json({ success: true, quotation: res });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, status } = body;
    if (!id || !status) {
      return NextResponse.json({ error: 'Missing id or status' }, { status: 400 });
    }

    execute('UPDATE quotations SET status = ? WHERE id = ?', [status, id]);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
