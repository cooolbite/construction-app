import { NextResponse } from 'next/server';
import { queryAll, queryOne, execute, runTransaction } from '@/lib/db';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const view = searchParams.get('view') || 'balance'; // 'balance' | 'cards' | 'counts'
    const warehouseId = searchParams.get('warehouse_id');
    const productId = searchParams.get('product_id');

    if (view === 'cards') {
      let sql = `
        SELECT 
          sc.*, p.name as product_name, p.sku, u.name as unit_name, w.name as warehouse_name
        FROM stock_cards sc
        JOIN products p ON sc.product_id = p.id
        JOIN units u ON p.base_unit_id = u.id
        JOIN warehouses w ON sc.warehouse_id = w.id
        WHERE 1=1
      `;
      const params: any[] = [];
      if (productId) {
        sql += ' AND sc.product_id = ?';
        params.push(productId);
      }
      if (warehouseId) {
        sql += ' AND sc.warehouse_id = ?';
        params.push(warehouseId);
      }
      sql += ' ORDER BY sc.id DESC LIMIT 100';
      const cards = queryAll(sql, params);
      return NextResponse.json(cards);
    }

    if (view === 'counts') {
      const counts = queryAll(`
        SELECT sc.*, w.name as warehouse_name, u.name as user_name
        FROM stock_counts sc
        JOIN warehouses w ON sc.warehouse_id = w.id
        JOIN users u ON sc.user_id = u.id
        ORDER BY sc.id DESC
      `);
      for (const c of counts) {
        c.items = queryAll(`
          SELECT sci.*, p.name as product_name, p.sku, u.name as unit_name
          FROM stock_count_items sci
          JOIN products p ON sci.product_id = p.id
          JOIN units u ON p.base_unit_id = u.id
          WHERE sci.count_id = ?
        `, [c.id]);
      }
      return NextResponse.json(counts);
    }

    // Default: 'balance'
    let sql = `
      SELECT 
        p.id as product_id, p.sku, p.name as product_name, p.cost_price, p.reorder_point, p.min_stock,
        c.name as category_name, u.name as base_unit_name,
        COALESCE((SELECT SUM(quantity) FROM inventory_balances WHERE product_id = p.id), 0) as total_stock,
        (SELECT json_group_array(
          json_object('warehouse_id', w.id, 'warehouse_name', w.name, 'quantity', COALESCE(ib.quantity, 0))
        )
        FROM warehouses w
        LEFT JOIN inventory_balances ib ON ib.warehouse_id = w.id AND ib.product_id = p.id
        ) as warehouse_breakdown
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN units u ON p.base_unit_id = u.id
      WHERE p.is_active = 1
    `;
    const params: any[] = [];
    if (productId) {
      sql += ' AND p.id = ?';
      params.push(productId);
    }
    sql += ' ORDER BY p.id ASC';

    const rows = queryAll(sql, params);
    const result = rows.map(r => ({
      ...r,
      warehouse_breakdown: JSON.parse(r.warehouse_breakdown || '[]')
    }));

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action } = body;

    // 1. Stock Adjustment
    if (action === 'adjust') {
      const { product_id, warehouse_id, new_quantity, reason = '', user_id = 3 } = body;
      if (!product_id || !warehouse_id || new_quantity === undefined) {
        return NextResponse.json({ error: 'Missing parameters for adjustment' }, { status: 400 });
      }

      const res = runTransaction(() => {
        const cur = queryOne('SELECT quantity FROM inventory_balances WHERE product_id = ? AND warehouse_id = ?', [
          product_id, warehouse_id
        ]);
        const oldQty = cur ? cur.quantity : 0;
        const diff = new_quantity - oldQty;

        if (cur) {
          execute('UPDATE inventory_balances SET quantity = ? WHERE product_id = ? AND warehouse_id = ?', [
            new_quantity, product_id, warehouse_id
          ]);
        } else {
          execute('INSERT INTO inventory_balances (product_id, warehouse_id, quantity) VALUES (?, ?, ?)', [
            product_id, warehouse_id, new_quantity
          ]);
        }

        const prod = queryOne('SELECT cost_price FROM products WHERE id = ?', [product_id]);
        const cost = prod ? prod.cost_price : 0;

        execute(`
          INSERT INTO stock_cards (
            product_id, warehouse_id, doc_type, doc_no, movement_type,
            quantity, unit_cost, balance_after, note, created_by
          ) VALUES (?, ?, 'ADJUST', 'ADJ-' || strftime('%s','now'), 'ADJ', ?, ?, ?, ?, 'warehouse')
        `, [product_id, warehouse_id, Math.abs(diff), cost, new_quantity, `ปรับปรุงยอดสต็อก: ${reason} (ต่าง ${diff > 0 ? '+' : ''}${diff})`]);

        execute(`
          INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
          VALUES (?, 'STOCK_ADJUST', 'INVENTORY', ?, ?)
        `, [user_id, product_id, `ปรับยอดสต็อกคลัง ${warehouse_id} จาก ${oldQty} เป็น ${new_quantity} เหตุผล: ${reason}`]);

        return { oldQty, new_quantity, diff };
      });

      return NextResponse.json({ success: true, adjustment: res });
    }

    // 2. Inter-Warehouse Transfer
    if (action === 'transfer') {
      const { product_id, from_warehouse_id, to_warehouse_id, quantity, notes = '' } = body;
      if (!product_id || !from_warehouse_id || !to_warehouse_id || !quantity || quantity <= 0) {
        return NextResponse.json({ error: 'ข้อมูลการโอนย้ายไม่ครบถ้วน' }, { status: 400 });
      }

      const res = runTransaction(() => {
        // Source
        const src = queryOne('SELECT quantity FROM inventory_balances WHERE product_id = ? AND warehouse_id = ?', [
          product_id, from_warehouse_id
        ]);
        const srcQty = src ? src.quantity : 0;
        if (srcQty < quantity) {
          throw new Error(`ยอดสต็อกในคลังต้นทางไม่เพียงพอ (มีอยู่: ${srcQty}, ต้องการโอน: ${quantity})`);
        }

        const newSrcQty = srcQty - quantity;
        execute('UPDATE inventory_balances SET quantity = ? WHERE product_id = ? AND warehouse_id = ?', [
          newSrcQty, product_id, from_warehouse_id
        ]);

        // Dest
        const dst = queryOne('SELECT quantity FROM inventory_balances WHERE product_id = ? AND warehouse_id = ?', [
          product_id, to_warehouse_id
        ]);
        const dstQty = dst ? dst.quantity : 0;
        const newDstQty = dstQty + quantity;

        if (dst) {
          execute('UPDATE inventory_balances SET quantity = ? WHERE product_id = ? AND warehouse_id = ?', [
            newDstQty, product_id, to_warehouse_id
          ]);
        } else {
          execute('INSERT INTO inventory_balances (product_id, warehouse_id, quantity) VALUES (?, ?, ?)', [
            product_id, to_warehouse_id, newDstQty
          ]);
        }

        const prod = queryOne('SELECT cost_price FROM products WHERE id = ?', [product_id]);
        const cost = prod ? prod.cost_price : 0;
        const doc_no = `TRF-${Date.now().toString().slice(-6)}`;

        // Stock cards for both sides
        execute(`
          INSERT INTO stock_cards (
            product_id, warehouse_id, doc_type, doc_no, movement_type,
            quantity, unit_cost, balance_after, note, created_by
          ) VALUES (?, ?, 'TRANSFER', ?, 'OUT', ?, ?, ?, ?, 'warehouse')
        `, [product_id, from_warehouse_id, doc_no, quantity, cost, newSrcQty, `โอนย้ายออกไปคลัง ${to_warehouse_id}: ${notes}`]);

        execute(`
          INSERT INTO stock_cards (
            product_id, warehouse_id, doc_type, doc_no, movement_type,
            quantity, unit_cost, balance_after, note, created_by
          ) VALUES (?, ?, 'TRANSFER', ?, 'IN', ?, ?, ?, ?, 'warehouse')
        `, [product_id, to_warehouse_id, doc_no, quantity, cost, newDstQty, `โอนย้ายรับเข้าจากคลัง ${from_warehouse_id}: ${notes}`]);

        return { doc_no, transferred_qty: quantity };
      });

      return NextResponse.json({ success: true, transfer: res });
    }

    // 3. Physical Stock Audit Count
    if (action === 'count') {
      const { warehouse_id, items = [], notes = '', user_id = 3 } = body;
      const res = runTransaction(() => {
        const doc_no = `CNT-${Date.now().toString().slice(-6)}`;
        const countRes = execute(`
          INSERT INTO stock_counts (doc_no, warehouse_id, status, user_id, notes)
          VALUES (?, ?, 'completed', ?, ?)
        `, [doc_no, warehouse_id, user_id, notes]);
        const countId = Number(countRes.lastInsertRowid);

        for (const it of items) {
          const sysBal = queryOne('SELECT quantity FROM inventory_balances WHERE product_id = ? AND warehouse_id = ?', [
            it.product_id, warehouse_id
          ]);
          const system_qty = sysBal ? sysBal.quantity : 0;
          const counted_qty = Number(it.counted_qty) || 0;
          const diff_qty = counted_qty - system_qty;

          execute(`
            INSERT INTO stock_count_items (count_id, product_id, system_qty, counted_qty, diff_qty, notes)
            VALUES (?, ?, ?, ?, ?, ?)
          `, [countId, it.product_id, system_qty, counted_qty, diff_qty, it.notes || '']);

          // If auto-adjust is confirmed
          if (it.apply_adjustment && diff_qty !== 0) {
            if (sysBal) {
              execute('UPDATE inventory_balances SET quantity = ? WHERE product_id = ? AND warehouse_id = ?', [
                counted_qty, it.product_id, warehouse_id
              ]);
            } else {
              execute('INSERT INTO inventory_balances (product_id, warehouse_id, quantity) VALUES (?, ?, ?)', [
                it.product_id, warehouse_id, counted_qty
              ]);
            }

            const prod = queryOne('SELECT cost_price FROM products WHERE id = ?', [it.product_id]);
            execute(`
              INSERT INTO stock_cards (
                product_id, warehouse_id, doc_type, doc_no, movement_type,
                quantity, unit_cost, balance_after, note, created_by
              ) VALUES (?, ?, 'COUNT', ?, 'ADJ', ?, ?, ?, ?, 'warehouse')
            `, [it.product_id, warehouse_id, doc_no, Math.abs(diff_qty), prod?.cost_price || 0, counted_qty, `ปรับยอดจากการตรวจนับนับจริง (${diff_qty > 0 ? '+' : ''}${diff_qty})`]);
          }
        }

        return { countId, doc_no };
      });

      return NextResponse.json({ success: true, count: res });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
