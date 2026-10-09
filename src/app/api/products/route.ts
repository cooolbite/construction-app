import { NextResponse } from 'next/server';
import { queryAll, queryOne, execute, runTransaction } from '@/lib/db';
import { seedDatabase } from '@/lib/seed';

export async function GET(req: Request) {
  try {
    seedDatabase(false);
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || '';
    const categoryId = searchParams.get('category_id');
    const lowStock = searchParams.get('low_stock');
    const activeOnly = searchParams.get('active_only') !== 'false';

    let sql = `
      SELECT 
        p.*, 
        c.name as category_name,
        u.name as base_unit_name,
        COALESCE((SELECT SUM(quantity) FROM inventory_balances WHERE product_id = p.id), 0) as total_stock
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN units u ON p.base_unit_id = u.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (activeOnly) {
      sql += ' AND p.is_active = 1';
    }

    if (categoryId) {
      sql += ' AND p.category_id = ?';
      params.push(categoryId);
    }

    if (query) {
      sql += ` AND (
        p.sku LIKE ? OR 
        p.name LIKE ? OR 
        p.description LIKE ? OR
        p.id IN (SELECT product_id FROM product_barcodes WHERE barcode LIKE ?)
      )`;
      const wild = `%${query}%`;
      params.push(wild, wild, wild, wild);
    }

    sql += ' ORDER BY p.id ASC';

    const products = queryAll(sql, params);

    // Fetch UOMs and barcodes for each product
    for (const prod of products) {
      prod.uoms = queryAll(`
        SELECT pu.*, u.name as unit_name
        FROM product_uoms pu
        JOIN units u ON pu.unit_id = u.id
        WHERE pu.product_id = ?
      `, [prod.id]);

      const barcodes = queryAll<{ barcode: string }>(`
        SELECT barcode FROM product_barcodes WHERE product_id = ?
      `, [prod.id]);
      prod.barcodes = barcodes.map(b => b.barcode);

      // Warehouse breakdown
      prod.warehouse_stocks = queryAll(`
        SELECT ib.quantity, w.name as warehouse_name, w.id as warehouse_id
        FROM inventory_balances ib
        JOIN warehouses w ON ib.warehouse_id = w.id
        WHERE ib.product_id = ?
      `, [prod.id]);
    }

    if (lowStock === 'true') {
      return NextResponse.json(products.filter(p => p.total_stock <= p.reorder_point));
    }

    return NextResponse.json(products);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      sku, name, description, category_id, base_unit_id,
      cost_price, retail_price, technician_price, contractor_price, project_price,
      min_stock, max_stock, reorder_point, image_url, barcode,
      secondary_uoms, initial_stock, initial_warehouse_id
    } = body;

    if (!sku || !name || !base_unit_id) {
      return NextResponse.json({ error: 'SKU, ชื่อสินค้า และหน่วยนับหลัก เป็นข้อมูลจำเป็น' }, { status: 400 });
    }

    const result = runTransaction(() => {
      // 1. Insert product
      const insertProd = execute(`
        INSERT INTO products (
          sku, name, description, category_id, base_unit_id,
          cost_price, retail_price, technician_price, contractor_price, project_price,
          min_stock, max_stock, reorder_point, image_url
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        sku, name, description || '', category_id || 1, base_unit_id,
        cost_price || 0, retail_price || 0, technician_price || retail_price || 0,
        contractor_price || retail_price || 0, project_price || retail_price || 0,
        min_stock || 0, max_stock || 0, reorder_point || 0,
        image_url || 'https://images.unsplash.com/photo-1590069261209-f8e9b8642343?auto=format&fit=crop&w=400&q=80'
      ]);

      const prodId = Number(insertProd.lastInsertRowid);

      // 2. Insert Base UOM
      const prodBarcode = barcode || `885${Date.now().toString().slice(-9)}`;
      const baseUom = execute(`
        INSERT INTO product_uoms (product_id, unit_id, conversion_factor, barcode, price_multiplier)
        VALUES (?, ?, 1, ?, 1)
      `, [prodId, base_unit_id, prodBarcode]);

      execute(`
        INSERT INTO product_barcodes (product_id, barcode, uom_id)
        VALUES (?, ?, ?)
      `, [prodId, prodBarcode, Number(baseUom.lastInsertRowid)]);

      // 3. Secondary UOMs (if provided)
      if (Array.isArray(secondary_uoms)) {
        for (const uom of secondary_uoms) {
          if (uom.unit_id && uom.conversion_factor) {
            const secUom = execute(`
              INSERT INTO product_uoms (product_id, unit_id, conversion_factor, barcode, price_multiplier)
              VALUES (?, ?, ?, ?, ?)
            `, [prodId, uom.unit_id, uom.conversion_factor, uom.barcode || '', uom.conversion_factor]);

            if (uom.barcode) {
              execute(`
                INSERT INTO product_barcodes (product_id, barcode, uom_id)
                VALUES (?, ?, ?)
              `, [prodId, uom.barcode, Number(secUom.lastInsertRowid)]);
            }
          }
        }
      }

      // 4. Initial Stock & Stock Card
      const initQty = Number(initial_stock) || 0;
      const whId = Number(initial_warehouse_id) || 1;
      if (initQty > 0) {
        execute(`
          INSERT INTO inventory_balances (product_id, warehouse_id, quantity)
          VALUES (?, ?, ?)
        `, [prodId, whId, initQty]);

        execute(`
          INSERT INTO stock_cards (product_id, warehouse_id, doc_type, doc_no, movement_type, quantity, unit_cost, balance_after, note, created_by)
          VALUES (?, ?, 'INIT', 'INIT-ITEM', 'IN', ?, ?, ?, 'ยอดยกมาเริ่มต้นสร้างสินค้า', 'admin')
        `, [prodId, whId, initQty, cost_price || 0, initQty]);
      }

      return { id: prodId, sku, name };
    });

    return NextResponse.json({ success: true, product: result });
  } catch (error: any) {
    console.error('Create product error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const {
      id, sku, name, description, category_id, base_unit_id,
      cost_price, retail_price, technician_price, contractor_price, project_price,
      min_stock, max_stock, reorder_point, image_url, is_active
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'Missing product ID' }, { status: 400 });
    }

    execute(`
      UPDATE products SET
        sku = COALESCE(?, sku),
        name = COALESCE(?, name),
        description = COALESCE(?, description),
        category_id = COALESCE(?, category_id),
        base_unit_id = COALESCE(?, base_unit_id),
        cost_price = COALESCE(?, cost_price),
        retail_price = COALESCE(?, retail_price),
        technician_price = COALESCE(?, technician_price),
        contractor_price = COALESCE(?, contractor_price),
        project_price = COALESCE(?, project_price),
        min_stock = COALESCE(?, min_stock),
        max_stock = COALESCE(?, max_stock),
        reorder_point = COALESCE(?, reorder_point),
        image_url = COALESCE(?, image_url),
        is_active = COALESCE(?, is_active)
      WHERE id = ?
    `, [
      sku, name, description, category_id, base_unit_id,
      cost_price, retail_price, technician_price, contractor_price, project_price,
      min_stock, max_stock, reorder_point, image_url, is_active, id
    ]);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Missing product ID' }, { status: 400 });
    }

    // Soft delete according to SRS FR-ITEM-001 (keep transaction history intact)
    execute('UPDATE products SET is_active = 0 WHERE id = ?', [id]);
    return NextResponse.json({ success: true, message: 'ระงับการใช้งานสินค้าเรียบร้อยแล้ว' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
