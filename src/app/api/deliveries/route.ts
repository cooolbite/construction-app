import { NextResponse } from 'next/server';
import { queryAll, queryOne, execute, runTransaction } from '@/lib/db';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    let sql = `
      SELECT 
        d.*, 
        c.name as customer_name, c.phone as customer_phone,
        so.doc_no as sale_doc_no, so.total_amount as sale_total
      FROM deliveries d
      JOIN customers c ON d.customer_id = c.id
      JOIN sales_orders so ON d.sale_id = so.id
      WHERE 1=1
    `;
    const params: any[] = [];
    if (status) {
      sql += ' AND d.status = ?';
      params.push(status);
    }
    sql += ' ORDER BY d.id DESC';

    const deliveries = queryAll(sql, params);
    return NextResponse.json(deliveries);
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
      recipient_name,
      recipient_phone,
      delivery_address,
      vehicle_type = 'รถกระบะ 4 ล้อ',
      vehicle_plate = '',
      driver_name = '',
      scheduled_date,
      proof_note = ''
    } = body;

    if (!sale_id || !recipient_name || !delivery_address) {
      return NextResponse.json({ error: 'ข้อมูลการจัดส่งไม่ครบถ้วน' }, { status: 400 });
    }

    const res = runTransaction(() => {
      const prefix = 'DEL-2026-';
      const last = queryOne('SELECT doc_no FROM deliveries WHERE doc_no LIKE ? ORDER BY id DESC LIMIT 1', [`${prefix}%`]);
      let seq = 1;
      if (last?.doc_no) {
        const num = parseInt(last.doc_no.replace(prefix, ''), 10);
        if (!isNaN(num)) seq = num + 1;
      }
      const doc_no = `${prefix}${String(seq).padStart(6, '0')}`;

      const insertD = execute(`
        INSERT INTO deliveries (
          doc_no, sale_id, customer_id, recipient_name, recipient_phone,
          delivery_address, vehicle_type, vehicle_plate, driver_name,
          scheduled_date, status, proof_note
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)
      `, [
        doc_no, sale_id, customer_id, recipient_name, recipient_phone,
        delivery_address, vehicle_type, vehicle_plate, driver_name,
        scheduled_date || new Date().toISOString().split('T')[0], proof_note
      ]);

      return { id: Number(insertD.lastInsertRowid), doc_no };
    });

    return NextResponse.json({ success: true, delivery: res });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, status, driver_name, vehicle_plate, proof_note } = body;

    if (!id || !status) {
      return NextResponse.json({ error: 'Missing id or status' }, { status: 400 });
    }

    execute(`
      UPDATE deliveries SET
        status = ?,
        driver_name = COALESCE(?, driver_name),
        vehicle_plate = COALESCE(?, vehicle_plate),
        proof_note = COALESCE(?, proof_note),
        updated_at = datetime('now', 'localtime')
      WHERE id = ?
    `, [status, driver_name, vehicle_plate, proof_note, id]);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
