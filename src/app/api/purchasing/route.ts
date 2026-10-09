import { NextResponse } from 'next/server';
import { queryAll, queryOne, execute, runTransaction } from '@/lib/db';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (id) {
      const po = queryOne(`
        SELECT po.*, s.name as supplier_name, s.phone as supplier_phone, s.contact_name, u.name as user_name
        FROM purchase_orders po
        JOIN suppliers s ON po.supplier_id = s.id
        JOIN users u ON po.user_id = u.id
        WHERE po.id = ?
      `, [id]);

      if (!po) return NextResponse.json({ error: 'PO not found' }, { status: 404 });

      po.items = queryAll(`
        SELECT pi.*, p.name as product_name, p.sku
        FROM purchase_items pi
        JOIN products p ON pi.product_id = p.id
        WHERE pi.po_id = ?
      `, [id]);

      return NextResponse.json(po);
    }

    const pos = queryAll(`
      SELECT po.*, s.name as supplier_name, s.phone as supplier_phone, s.contact_name, u.name as user_name
      FROM purchase_orders po
      JOIN suppliers s ON po.supplier_id = s.id
      JOIN users u ON po.user_id = u.id
      ORDER BY po.id DESC
    `);

    for (const po of pos) {
      po.items = queryAll(`
        SELECT pi.*, p.name as product_name, p.sku
        FROM purchase_items pi
        JOIN products p ON pi.product_id = p.id
        WHERE pi.po_id = ?
      `, [po.id]);
    }

    return NextResponse.json(pos);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      supplier_id,
      user_id = 4,
      expected_date,
      items = [],
      subtotal = 0,
      vat_amount = 0,
      total_amount = 0,
      notes = ''
    } = body;

    if (!supplier_id || !items.length) {
      return NextResponse.json({ error: 'กรุณาเลือกผู้จำหน่ายและระบุรายการสั่งซื้อ' }, { status: 400 });
    }

    const res = runTransaction(() => {
      const prefix = 'PO-2026-';
      const last = queryOne('SELECT doc_no FROM purchase_orders WHERE doc_no LIKE ? ORDER BY id DESC LIMIT 1', [`${prefix}%`]);
      let seq = 1;
      if (last?.doc_no) {
        const num = parseInt(last.doc_no.replace(prefix, ''), 10);
        if (!isNaN(num)) seq = num + 1;
      }
      const doc_no = `${prefix}${String(seq).padStart(6, '0')}`;

      const insertPo = execute(`
        INSERT INTO purchase_orders (
          doc_no, supplier_id, user_id, status, expected_date,
          subtotal, vat_amount, total_amount, notes
        ) VALUES (?, ?, ?, 'ordered', ?, ?, ?, ?, ?)
      `, [
        doc_no, supplier_id, user_id,
        expected_date || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
        subtotal, vat_amount, total_amount, notes
      ]);

      const poId = Number(insertPo.lastInsertRowid);

      for (const item of items) {
        execute(`
          INSERT INTO purchase_items (
            po_id, product_id, uom_id, unit_name, quantity, received_quantity, unit_cost, total_cost
          ) VALUES (?, ?, ?, ?, ?, 0, ?, ?)
        `, [
          poId, item.product_id, item.uom_id || null, item.unit_name || 'ชิ้น',
          item.quantity, item.unit_cost, item.total_cost || (item.quantity * item.unit_cost)
        ]);
      }

      return { id: poId, doc_no };
    });

    return NextResponse.json({ success: true, po: res });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
