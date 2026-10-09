// SQLite database layer using Node.js built-in node:sqlite
import fs from 'node:fs';
import path from 'node:path';

// Use require or import for node:sqlite
// @ts-ignore
import { DatabaseSync } from 'node:sqlite';

let dbInstance: any = null;

export function getDb(): any {
  if (dbInstance) {
    return dbInstance;
  }

  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const dbPath = path.join(dataDir, 'construction.db');
  const db = new DatabaseSync(dbPath);

  // Enable WAL mode & foreign keys for optimal performance and data integrity
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec('PRAGMA foreign_keys = ON;');

  initSchema(db);

  dbInstance = db;
  return dbInstance;
}

function initSchema(db: any) {
  db.exec(`
    -- Users & Roles
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin', 'cashier', 'warehouse', 'purchasing', 'finance')),
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    );

    -- Settings (key-value)
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    -- Categories
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL
    );

    -- Units of Measure (UOM)
    CREATE TABLE IF NOT EXISTS units (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL
    );

    -- Warehouses / Branches
    CREATE TABLE IF NOT EXISTS warehouses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      location TEXT NOT NULL DEFAULT ''
    );

    -- Products
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sku TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      category_id INTEGER REFERENCES categories(id),
      base_unit_id INTEGER REFERENCES units(id),
      cost_price REAL NOT NULL DEFAULT 0,
      retail_price REAL NOT NULL DEFAULT 0,
      technician_price REAL NOT NULL DEFAULT 0,
      contractor_price REAL NOT NULL DEFAULT 0,
      project_price REAL NOT NULL DEFAULT 0,
      min_stock REAL NOT NULL DEFAULT 0,
      max_stock REAL NOT NULL DEFAULT 0,
      reorder_point REAL NOT NULL DEFAULT 0,
      image_url TEXT DEFAULT '',
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    );

    -- Product Multi-UOM
    CREATE TABLE IF NOT EXISTS product_uoms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      unit_id INTEGER NOT NULL REFERENCES units(id),
      conversion_factor REAL NOT NULL DEFAULT 1, -- factor to base unit
      barcode TEXT DEFAULT '',
      price_multiplier REAL NOT NULL DEFAULT 1
    );

    -- Product Barcodes
    CREATE TABLE IF NOT EXISTS product_barcodes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      barcode TEXT UNIQUE NOT NULL,
      uom_id INTEGER REFERENCES product_uoms(id)
    );

    -- Inventory Balances per Warehouse
    CREATE TABLE IF NOT EXISTS inventory_balances (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      warehouse_id INTEGER NOT NULL REFERENCES warehouses(id),
      quantity REAL NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      UNIQUE(product_id, warehouse_id)
    );

    -- Stock Movement Cards (Audit trail for FIFO/Cost & traceability)
    CREATE TABLE IF NOT EXISTS stock_cards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL REFERENCES products(id),
      warehouse_id INTEGER NOT NULL REFERENCES warehouses(id),
      doc_type TEXT NOT NULL,
      doc_no TEXT NOT NULL,
      movement_type TEXT NOT NULL CHECK(movement_type IN ('IN', 'OUT', 'ADJ')),
      quantity REAL NOT NULL,
      unit_cost REAL NOT NULL DEFAULT 0,
      balance_after REAL NOT NULL,
      note TEXT DEFAULT '',
      created_by TEXT NOT NULL DEFAULT 'admin',
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    );

    -- Customers
    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      customer_type TEXT NOT NULL DEFAULT 'contractor',
      phone TEXT DEFAULT '',
      address TEXT DEFAULT '',
      tax_id TEXT DEFAULT '',
      credit_limit REAL NOT NULL DEFAULT 0,
      credit_term_days INTEGER NOT NULL DEFAULT 30,
      current_balance REAL NOT NULL DEFAULT 0,
      price_tier TEXT NOT NULL DEFAULT 'contractor' CHECK(price_tier IN ('retail', 'technician', 'contractor', 'project'))
    );

    -- Suppliers
    CREATE TABLE IF NOT EXISTS suppliers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      contact_name TEXT DEFAULT '',
      phone TEXT DEFAULT '',
      email TEXT DEFAULT '',
      address TEXT DEFAULT '',
      tax_id TEXT DEFAULT '',
      payment_term_days INTEGER NOT NULL DEFAULT 30
    );

    -- POS Shifts (Open / Close Cash Drawers)
    CREATE TABLE IF NOT EXISTS shifts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      opening_cash REAL NOT NULL DEFAULT 0,
      closing_cash REAL DEFAULT NULL,
      expected_cash REAL DEFAULT NULL,
      opened_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      closed_at TEXT DEFAULT NULL,
      status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open', 'closed')),
      notes TEXT DEFAULT ''
    );

    -- Sales Orders & Invoices (POS & Credit Sales)
    CREATE TABLE IF NOT EXISTS sales_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      doc_no TEXT UNIQUE NOT NULL,
      doc_type TEXT NOT NULL DEFAULT 'POS' CHECK(doc_type IN ('POS', 'INVOICE', 'TAX_INVOICE')),
      customer_id INTEGER REFERENCES customers(id),
      shift_id INTEGER REFERENCES shifts(id),
      user_id INTEGER NOT NULL REFERENCES users(id),
      status TEXT NOT NULL DEFAULT 'completed' CHECK(status IN ('completed', 'held', 'cancelled')),
      subtotal REAL NOT NULL DEFAULT 0,
      discount_amount REAL NOT NULL DEFAULT 0,
      vat_rate REAL NOT NULL DEFAULT 7,
      vat_amount REAL NOT NULL DEFAULT 0,
      total_amount REAL NOT NULL DEFAULT 0,
      payment_status TEXT NOT NULL DEFAULT 'paid' CHECK(payment_status IN ('paid', 'partial', 'unpaid')),
      payment_method TEXT NOT NULL DEFAULT 'cash' CHECK(payment_method IN ('cash', 'transfer', 'credit_card', 'credit', 'mixed')),
      cash_tendered REAL NOT NULL DEFAULT 0,
      change_amount REAL NOT NULL DEFAULT 0,
      notes TEXT DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    );

    -- Sales Items
    CREATE TABLE IF NOT EXISTS sales_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sale_id INTEGER NOT NULL REFERENCES sales_orders(id) ON DELETE CASCADE,
      product_id INTEGER NOT NULL REFERENCES products(id),
      uom_id INTEGER REFERENCES product_uoms(id),
      unit_name TEXT NOT NULL,
      quantity REAL NOT NULL,
      base_quantity REAL NOT NULL,
      unit_price REAL NOT NULL,
      discount REAL NOT NULL DEFAULT 0,
      total_price REAL NOT NULL,
      unit_cost REAL NOT NULL DEFAULT 0
    );

    -- Quotations
    CREATE TABLE IF NOT EXISTS quotations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      doc_no TEXT UNIQUE NOT NULL,
      customer_id INTEGER NOT NULL REFERENCES customers(id),
      user_id INTEGER NOT NULL REFERENCES users(id),
      valid_until TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'sent', 'accepted', 'converted', 'rejected')),
      subtotal REAL NOT NULL DEFAULT 0,
      discount_amount REAL NOT NULL DEFAULT 0,
      vat_amount REAL NOT NULL DEFAULT 0,
      total_amount REAL NOT NULL DEFAULT 0,
      notes TEXT DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    );

    -- Quotation Items
    CREATE TABLE IF NOT EXISTS quotation_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      quotation_id INTEGER NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
      product_id INTEGER NOT NULL REFERENCES products(id),
      uom_id INTEGER REFERENCES product_uoms(id),
      unit_name TEXT NOT NULL,
      quantity REAL NOT NULL,
      unit_price REAL NOT NULL,
      discount REAL NOT NULL DEFAULT 0,
      total_price REAL NOT NULL
    );

    -- Purchase Orders (PO)
    CREATE TABLE IF NOT EXISTS purchase_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      doc_no TEXT UNIQUE NOT NULL,
      supplier_id INTEGER NOT NULL REFERENCES suppliers(id),
      user_id INTEGER NOT NULL REFERENCES users(id),
      status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'ordered', 'partial', 'received', 'cancelled')),
      expected_date TEXT NOT NULL,
      subtotal REAL NOT NULL DEFAULT 0,
      vat_amount REAL NOT NULL DEFAULT 0,
      total_amount REAL NOT NULL DEFAULT 0,
      notes TEXT DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    );

    -- Purchase Items
    CREATE TABLE IF NOT EXISTS purchase_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      po_id INTEGER NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
      product_id INTEGER NOT NULL REFERENCES products(id),
      uom_id INTEGER REFERENCES product_uoms(id),
      unit_name TEXT NOT NULL,
      quantity REAL NOT NULL,
      received_quantity REAL NOT NULL DEFAULT 0,
      unit_cost REAL NOT NULL,
      total_cost REAL NOT NULL
    );

    -- Goods Receipts (GRN)
    CREATE TABLE IF NOT EXISTS goods_receipts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      doc_no TEXT UNIQUE NOT NULL,
      po_id INTEGER REFERENCES purchase_orders(id),
      supplier_id INTEGER NOT NULL REFERENCES suppliers(id),
      warehouse_id INTEGER NOT NULL REFERENCES warehouses(id),
      received_date TEXT NOT NULL,
      ref_invoice_no TEXT DEFAULT '',
      user_id INTEGER NOT NULL REFERENCES users(id),
      notes TEXT DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    );

    -- Goods Receipt Items
    CREATE TABLE IF NOT EXISTS goods_receipt_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      grn_id INTEGER NOT NULL REFERENCES goods_receipts(id) ON DELETE CASCADE,
      product_id INTEGER NOT NULL REFERENCES products(id),
      uom_id INTEGER REFERENCES product_uoms(id),
      quantity REAL NOT NULL,
      base_quantity REAL NOT NULL,
      unit_cost REAL NOT NULL,
      total_cost REAL NOT NULL
    );

    -- Deliveries
    CREATE TABLE IF NOT EXISTS deliveries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      doc_no TEXT UNIQUE NOT NULL,
      sale_id INTEGER NOT NULL REFERENCES sales_orders(id),
      customer_id INTEGER NOT NULL REFERENCES customers(id),
      recipient_name TEXT NOT NULL,
      recipient_phone TEXT NOT NULL,
      delivery_address TEXT NOT NULL,
      vehicle_type TEXT NOT NULL,
      vehicle_plate TEXT NOT NULL,
      driver_name TEXT NOT NULL,
      scheduled_date TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'preparing', 'in_transit', 'delivered', 'failed')),
      proof_note TEXT DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    );

    -- Payments (AR Receipts & AP Vouchers)
    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      doc_no TEXT UNIQUE NOT NULL,
      ref_type TEXT NOT NULL CHECK(ref_type IN ('SALE', 'PO', 'EXPENSE')),
      ref_id INTEGER NOT NULL,
      customer_id INTEGER REFERENCES customers(id),
      supplier_id INTEGER REFERENCES suppliers(id),
      payment_type TEXT NOT NULL CHECK(payment_type IN ('RECEIVE', 'PAY')),
      amount REAL NOT NULL,
      payment_method TEXT NOT NULL,
      note TEXT DEFAULT '',
      user_id INTEGER NOT NULL REFERENCES users(id),
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    );

    -- Expenses / Petty Cash
    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      doc_no TEXT UNIQUE NOT NULL,
      category TEXT NOT NULL,
      amount REAL NOT NULL,
      payment_method TEXT NOT NULL DEFAULT 'cash',
      shift_id INTEGER REFERENCES shifts(id),
      note TEXT DEFAULT '',
      user_id INTEGER NOT NULL REFERENCES users(id),
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    );

    -- Stock Audit Counts
    CREATE TABLE IF NOT EXISTS stock_counts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      doc_no TEXT UNIQUE NOT NULL,
      warehouse_id INTEGER NOT NULL REFERENCES warehouses(id),
      status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'completed')),
      user_id INTEGER NOT NULL REFERENCES users(id),
      notes TEXT DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    );

    -- Stock Audit Items
    CREATE TABLE IF NOT EXISTS stock_count_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      count_id INTEGER NOT NULL REFERENCES stock_counts(id) ON DELETE CASCADE,
      product_id INTEGER NOT NULL REFERENCES products(id),
      system_qty REAL NOT NULL,
      counted_qty REAL NOT NULL,
      diff_qty REAL NOT NULL,
      notes TEXT DEFAULT ''
    );

    -- Audit Logs
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id INTEGER,
      details TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    );

    -- Create Indexes for blazing fast lookups
    CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
    CREATE INDEX IF NOT EXISTS idx_products_cat ON products(category_id);
    CREATE INDEX IF NOT EXISTS idx_product_barcodes ON product_barcodes(barcode);
    CREATE INDEX IF NOT EXISTS idx_sales_created ON sales_orders(created_at);
    CREATE INDEX IF NOT EXISTS idx_sales_customer ON sales_orders(customer_id);
    CREATE INDEX IF NOT EXISTS idx_stock_cards_prod ON stock_cards(product_id, warehouse_id);
    CREATE INDEX IF NOT EXISTS idx_inv_bal ON inventory_balances(product_id, warehouse_id);
  `);
}

// Helpers for queries
function sanitizeParams(params: any[]): any[] {
  return params.map(p => (p === undefined ? null : p));
}

export function queryAll<T = any>(sql: string, params: any[] = []): T[] {
  const db = getDb();
  const stmt = db.prepare(sql);
  return stmt.all(...sanitizeParams(params)) as T[];
}

export function queryOne<T = any>(sql: string, params: any[] = []): T | undefined {
  const db = getDb();
  const stmt = db.prepare(sql);
  return stmt.get(...sanitizeParams(params)) as T | undefined;
}

export function execute(sql: string, params: any[] = []): { changes: number; lastInsertRowid: number | bigint } {
  const db = getDb();
  const stmt = db.prepare(sql);
  return stmt.run(...sanitizeParams(params));
}

export function runTransaction<T>(fn: () => T): T {
  const db = getDb();
  db.exec('BEGIN TRANSACTION');
  try {
    const result = fn();
    db.exec('COMMIT');
    return result;
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}
