import { getDb } from './db';

export function seedDatabase(force: boolean = false) {
  const db = getDb();

  // Check if already seeded
  const userCount = db.prepare('SELECT count(*) as count FROM users').get() as { count: number };
  if (userCount.count > 0 && !force) {
    return { status: 'already_seeded', message: 'Database already has data.' };
  }

  if (force) {
    db.exec('PRAGMA foreign_keys = OFF;');
  }

  db.exec('BEGIN TRANSACTION');
  try {
    if (force) {
      // Clear existing data cleanly in reverse order of constraints
      db.exec(`
        DELETE FROM audit_logs;
        DELETE FROM stock_count_items;
        DELETE FROM stock_counts;
        DELETE FROM expenses;
        DELETE FROM payments;
        DELETE FROM deliveries;
        DELETE FROM goods_receipt_items;
        DELETE FROM goods_receipts;
        DELETE FROM purchase_items;
        DELETE FROM purchase_orders;
        DELETE FROM quotation_items;
        DELETE FROM quotations;
        DELETE FROM sales_items;
        DELETE FROM sales_orders;
        DELETE FROM shifts;
        DELETE FROM stock_cards;
        DELETE FROM inventory_balances;
        DELETE FROM product_barcodes;
        DELETE FROM product_uoms;
        DELETE FROM products;
        DELETE FROM suppliers;
        DELETE FROM customers;
        DELETE FROM warehouses;
        DELETE FROM units;
        DELETE FROM categories;
        DELETE FROM settings;
        DELETE FROM users;
        DELETE FROM sqlite_sequence;
      `);
    }

    // 1. Settings
    const settings = [
      ['store_name', 'สมบูรณ์ ค้าวัสดุก่อสร้าง'],
      ['store_branch', 'สำนักงานใหญ่ บางบัวทอง (สาขา 00000)'],
      ['tax_id', '0105562098765'],
      ['address', '88/9 หมู่ 4 ถ.บางกรวย-ไทรน้อย ต.บางบัวทอง อ.บางบัวทอง จ.นนทบุรี 11110'],
      ['phone', '02-987-6543, 081-234-5678'],
      ['vat_rate', '7'],
      ['default_warehouse_id', '1'],
      ['allow_negative_stock', '0'],
      ['prefix_inv', 'INV-2026-'],
      ['prefix_quo', 'QUO-2026-'],
      ['prefix_po', 'PO-2026-'],
      ['prefix_grn', 'GRN-2026-'],
      ['prefix_del', 'DEL-2026-']
    ];
    const insertSetting = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)');
    for (const [k, v] of settings) {
      insertSetting.run(k, v);
    }

    // 2. Users
    const users = [
      ['admin', 'admin123', 'สมศักดิ์ ผู้จัดการใหญ่', 'admin'],
      ['cashier1', 'cashier123', 'วิภา สุขใส (แคชเชียร์)', 'cashier'],
      ['warehouse1', 'stock123', 'ชาญชัย คลังสินค้า', 'warehouse'],
      ['purchasing1', 'buy123', 'นันทนา ฝ่ายจัดซื้อ', 'purchasing'],
      ['finance1', 'fin123', 'สุพัตรา บัญชีการเงิน', 'finance']
    ];
    const insertUser = db.prepare('INSERT INTO users (username, password_hash, name, role) VALUES (?, ?, ?, ?)');
    for (const u of users) {
      insertUser.run(u[0], u[1], u[2], u[3]);
    }

    // 3. Categories
    const categories = [
      ['CAT-01', 'ปูนซีเมนต์และคอนกรีต'],
      ['CAT-02', 'เหล็กเส้นและเหล็กรูปพรรณ'],
      ['CAT-03', 'ท่อประปาและข้อต่อ PVC'],
      ['CAT-04', 'กระเบื้องและเคมีปูกระเบื้อง'],
      ['CAT-05', 'สีทาอาคารและเคมีภัณฑ์'],
      ['CAT-06', 'แผ่นยิปซัมและสมาร์ทบอร์ด'],
      ['CAT-07', 'หิน ทราย ดินเทกอง'],
      ['CAT-08', 'เครื่องมือช่างและฮาร์ดแวร์']
    ];
    const insertCat = db.prepare('INSERT INTO categories (code, name) VALUES (?, ?)');
    for (const c of categories) {
      insertCat.run(c[0], c[1]);
    }

    // 4. Units
    const units = [
      ['BAG', 'ถุง'],
      ['BAR', 'เส้น'],
      ['BDL', 'มัด'],
      ['LGT', 'ท่อน'],
      ['BOX', 'กล่อง'],
      ['SHT', 'แผ่น'],
      ['CBM', 'คิว'],
      ['TON', 'ตัน'],
      ['PAL', 'ถัง'],
      ['PCS', 'ชิ้น'],
      ['ROL', 'ม้วน']
    ];
    const insertUnit = db.prepare('INSERT INTO units (code, name) VALUES (?, ?)');
    for (const u of units) {
      insertUnit.run(u[0], u[1]);
    }

    // 5. Warehouses
    const warehouses = [
      ['WH-01', 'คลังสินค้าหลัก (Main Warehouse)', 'โกดัง 1 ล็อต A-B'],
      ['WH-02', 'หน้าร้านและโชว์รูม (Storefront)', 'อาคารพาณิชย์ด้านหน้า'],
      ['WH-03', 'ลานเหล็กและหลังคา (Steel Yard)', 'ลานกลางแจ้ง โซน C'],
      ['WH-04', 'ลานหินทรายเทกอง (Bulk Yard)', 'ลานท้ายโกดัง โซน D']
    ];
    const insertWh = db.prepare('INSERT INTO warehouses (code, name, location) VALUES (?, ?, ?)');
    for (const w of warehouses) {
      insertWh.run(w[0], w[1], w[2]);
    }

    // 6. Customers
    const customers = [
      ['CUST-0001', 'ลูกค้าทั่วไป (Walk-in)', 'individual', '080-000-0000', 'หน้าร้าน', '', 0, 0, 0, 'retail'],
      ['CUST-0002', 'หจก. วีระการช่าง ก่อสร้าง', 'contractor', '081-445-6789', '45/12 ม.2 ถ.กาญจนาภิเษก นนทบุรี', '0123548965001', 300000, 30, 48500, 'contractor'],
      ['CUST-0003', 'บจก. บ้านทิวไผ่ พร็อพเพอร์ตี้', 'project', '02-889-9900', '199/8 อาคารทิวไผ่ทาวเวอร์ ถ.รัตนาธิเบศร์', '0105559874123', 1500000, 45, 185000, 'project'],
      ['CUST-0004', 'ช่างสมชาย ประปาและไฟ', 'contractor', '089-123-9876', '12 ซอยวัดลาดปลาดุก นนทบุรี', '', 40000, 15, 6200, 'technician'],
      ['CUST-0005', 'บจก. สยาม ซิวิล คอนสตรัคชั่น', 'contractor', '02-555-1234', '500 ม.5 ต.บางแม่นาง อ.บางใหญ่ นนทบุรี', '0105561002341', 500000, 30, 0, 'contractor']
    ];
    const insertCust = db.prepare(`
      INSERT INTO customers (code, name, customer_type, phone, address, tax_id, credit_limit, credit_term_days, current_balance, price_tier)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const cust of customers) {
      insertCust.run(...cust);
    }

    // 7. Suppliers
    const suppliers = [
      ['SUP-001', 'บมจ. ปูนซิเมนต์ไทย (SCG Distribution)', 'คุณพิชัย', '02-586-3333', 'scg_sales@scg.com', '1 ถ.ปูนซิเมนต์ไทย บางซื่อ กทม.', '0107537000981', 45],
      ['SUP-002', 'บมจ. ทาทา สตีล (ประเทศไทย)', 'คุณเกรียงไกร', '02-937-1000', 'orders@tatasteel.co.th', 'อาคารรสาทาวเวอร์ 2 ถ.พหลโยธิน จตุจักร', '0107545000101', 30],
      ['SUP-003', 'บมจ. ทีโอเอ เพ้นท์ (ประเทศไทย)', 'คุณกานดา', '02-335-5555', 'toa_partner@toagroup.com', '31/2 หมู่ 3 ถ.บางนา-ตราด กม.23 สมุทรปราการ', '0107560000185', 30],
      ['SUP-004', 'บจก. นวพลาสติกอุตสาหกรรม (SCG Piping)', 'คุณสุรชัย', '02-555-7777', 'nawapipe@scg.com', '1 ถ.ปูนซิเมนต์ไทย บางซื่อ กทม.', '0105513000543', 30]
    ];
    const insertSup = db.prepare(`
      INSERT INTO suppliers (code, name, contact_name, phone, email, address, tax_id, payment_term_days)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const sup of suppliers) {
      insertSup.run(...sup);
    }

    // 8. Products
    // Category mapping:
    // 1: ปูน, 2: เหล็ก, 3: ท่อ, 4: กระเบื้อง, 5: สี, 6: ยิปซัม, 7: หินทราย, 8: เครื่องมือ
    // Unit mapping:
    // 1: ถุง, 2: เส้น, 3: มัด, 4: ท่อน, 5: กล่อง, 6: แผ่น, 7: คิว, 8: ตัน, 9: ถัง, 10: ชิ้น, 11: ม้วน

    const products = [
      // SKU, Name, Desc, CatId, BaseUnitId, Cost, Retail, Tech, Cont, Proj, Min, Max, Reorder, Img
      ['CEMT-001', 'ปูนเสือ มอร์ตาร์ ฉาบทั่วไป 50 กก.', 'ปูนซีเมนต์สำเร็จรูปสำหรับงานฉาบผนังก่ออิฐมอญ อิฐบล็อก', 1, 1, 125, 150, 142, 138, 132, 100, 1000, 200, 'https://images.unsplash.com/photo-1590069261209-f8e9b8642343?auto=format&fit=crop&w=400&q=80'],
      ['CEMT-002', 'ปูนช้าง ไฮดรอลิก โครงสร้าง 50 กก.', 'ปูนโครงสร้าง ทนทาน สำหรับงานเสา คาน รากฐาน', 1, 1, 150, 175, 168, 162, 155, 100, 1500, 300, 'https://images.unsplash.com/photo-1590069261209-f8e9b8642343?auto=format&fit=crop&w=400&q=80'],
      ['STEL-001', 'เหล็กข้ออ้อย DB12 มอก. SD40 ยาว 10 ม.', 'เหล็กข้ออ้อยขนาด 12 มม. เกรด SD40 โรงใหญ่มาตรฐาน มอก.', 2, 2, 185, 220, 210, 202, 195, 200, 2000, 400, 'https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?auto=format&fit=crop&w=400&q=80'],
      ['STEL-002', 'เหล็กเส้นกลม RB9 มอก. SR24 ยาว 10 ม.', 'เหล็กเส้นกลม 9 มม. มาตรฐานงานปลอกเสา คาน', 2, 2, 105, 130, 124, 118, 112, 150, 1500, 300, 'https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?auto=format&fit=crop&w=400&q=80'],
      ['STEL-003', 'ลวดผูกเหล็ก เบอร์ 18 (2.5 กก./ขด)', 'ลวดผูกเหล็กเหนียวนุ่ม ดัดง่าย ไม่เปราะหักง่าย', 2, 11, 95, 125, 118, 112, 105, 50, 500, 100, 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=400&q=80'],
      ['PIPE-001', 'ท่อ PVC SCG ตราช้าง สีฟ้า 1/2 นิ้ว (4 หุน) ชั้น 8.5 ยาว 4 ม.', 'ท่อน้ำประปาตราช้าง เหนียว ทนแรงดันสูง 8.5 บาร์', 3, 4, 42, 58, 54, 50, 46, 50, 800, 150, 'https://images.unsplash.com/photo-1542013936693-884638332954?auto=format&fit=crop&w=400&q=80'],
      ['PIPE-002', 'ท่อ PVC SCG ตราช้าง สีฟ้า 2 นิ้ว ชั้น 8.5 ยาว 4 ม.', 'ท่อน้ำประปาเมนหลัก ตราช้าง ทนทาน มอก.17-2532', 3, 4, 165, 210, 198, 188, 178, 30, 300, 60, 'https://images.unsplash.com/photo-1542013936693-884638332954?auto=format&fit=crop&w=400&q=80'],
      ['PIPE-003', 'ข้องอ 90 องศา PVC ตราช้าง 1/2 นิ้ว', 'ข้อต่อท่อประปา 90 องศา แบบหนา', 3, 10, 5.5, 10, 9, 8, 7, 100, 2000, 300, 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=400&q=80'],
      ['TILE-001', 'กระเบื้องปูพื้น COTTO 60x60 ซม. คาราโม่ ขาว (1.44 ตร.ม./กล่อง)', 'กระเบื้องพอร์ซเลน ผิวเงา ลายหินอ่อนธรรมชาติ', 4, 5, 290, 375, 360, 345, 325, 40, 500, 80, 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=400&q=80'],
      ['TILE-002', 'กาวซีเมนต์ จระเข้เขียว 20 กก.', 'ปูนกาวปูกระเบื้องเซรามิก แกรนิตโต้ มาตรฐานยอดนิยม', 4, 1, 118, 150, 142, 135, 128, 50, 600, 120, 'https://images.unsplash.com/photo-1590069261209-f8e9b8642343?auto=format&fit=crop&w=400&q=80'],
      ['TILE-003', 'กาวยาแนว จระเข้พรีเมี่ยมพลัส ป้องกันราดำ สีขาว (1 กก.)', 'ยาแนวยับยั้งราดำ สำหรับร่องกระเบื้องกว้าง 1-7 มม.', 4, 1, 38, 55, 50, 46, 42, 60, 400, 100, 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=400&q=80'],
      ['PNT-001', 'สีน้ำทาภายนอก TOA 4Seasons กึ่งเงา ขาว #A100 (2.5 แกลลอน)', 'สีน้ำอะคริลิกแท้ 100% สะท้อนความร้อน เช็ดล้างได้', 5, 9, 740, 920, 880, 840, 800, 20, 150, 40, 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=400&q=80'],
      ['PNT-002', 'น้ำยารองพื้นปูนเก่า TOA Contact Primer 1 แกลลอน', 'น้ำยารองพื้นปูนเก่าสูตรน้ำมัน แทรกซึมลึก เสริมการยึดเกาะ', 5, 9, 490, 610, 580, 550, 520, 15, 100, 25, 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=400&q=80'],
      ['GYP-001', 'แผ่นยิปซัม ตราช้าง ขอบลาด หนา 9 มม. (1.20x2.40 ม.)', 'แผ่นฝ้ายิปซัมมาตรฐาน เรียบเนียน ไม่แอ่นตัว ป้องกันความร้อน', 6, 6, 130, 160, 152, 145, 138, 100, 1200, 200, 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=400&q=80'],
      ['GYP-002', 'สมาร์ทบอร์ด SCG ขอบเรียบ หนา 6 มม. (1.20x2.40 ม.)', 'ไฟเบอร์ซีเมนต์บอร์ด ปลวกไม่กิน ทนน้ำ ทนชื้น เหมาะกับฝ้าภายนอก', 6, 6, 145, 180, 170, 162, 154, 80, 800, 150, 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=400&q=80'],
      ['SAND-001', 'ทรายหยาบผสมปูนเทเสาคาน (คิว)', 'ทรายหยาบสะอาด เม็ดเหลี่ยม คัดเกรดสำหรับงานโครงสร้าง', 7, 7, 390, 520, 490, 460, 430, 50, 500, 100, 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=400&q=80'],
      ['SAND-002', 'หิน 1 คอนกรีต (3/4 นิ้ว) (คิว)', 'หินบดคัดขนาดสำหรับเทคอนกรีตผสมเสร็จ', 7, 7, 410, 540, 510, 480, 450, 50, 500, 100, 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=400&q=80'],
      ['TOOL-001', 'เกรียงขัดมันด้ามไม้ ตราตา ขนาด 11 นิ้ว', 'เกรียงปาดปูนเหล็กสปริงคุณภาพสูง ช่างปูนมืออาชีพ', 8, 10, 78, 115, 105, 98, 90, 20, 200, 40, 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=400&q=80'],
      ['TOOL-002', 'ตะปูตอกไม้ ขนาด 3 นิ้ว (กล่อง 1 กก.)', 'ตะปูเหล็กหัวโต ลำตัวตรง แข็งแรง ตอกไม่บิดงอ', 8, 5, 46, 68, 62, 58, 52, 30, 300, 60, 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=400&q=80'],
      ['TOOL-003', 'ใบตัดคอนกรีต 4 นิ้ว BOSCH Eco Universal', 'ใบเพชรตัดคอนกรีต อิฐ กระเบื้อง คม ทนทาน ไม่แตกง่าย', 8, 10, 140, 195, 180, 168, 155, 25, 250, 50, 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=400&q=80']
    ];

    const insertProd = db.prepare(`
      INSERT INTO products (sku, name, description, category_id, base_unit_id, cost_price, retail_price, technician_price, contractor_price, project_price, min_stock, max_stock, reorder_point, image_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertUom = db.prepare(`
      INSERT INTO product_uoms (product_id, unit_id, conversion_factor, barcode, price_multiplier)
      VALUES (?, ?, ?, ?, ?)
    `);

    const insertBarcode = db.prepare(`
      INSERT OR IGNORE INTO product_barcodes (product_id, barcode, uom_id)
      VALUES (?, ?, ?)
    `);

    const insertBal = db.prepare(`
      INSERT INTO inventory_balances (product_id, warehouse_id, quantity)
      VALUES (?, ?, ?)
    `);

    const insertStockCard = db.prepare(`
      INSERT INTO stock_cards (product_id, warehouse_id, doc_type, doc_no, movement_type, quantity, unit_cost, balance_after, note, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    let prodId = 1;
    for (const p of products) {
      insertProd.run(...p);

      const baseUnitId = p[4] as number;
      const sku = p[0] as string;
      const cost = p[5] as number;
      const baseBarcode = `8851${String(prodId).padStart(8, '0')}`;

      // Insert Base UOM
      const baseUomRes = insertUom.run(prodId, baseUnitId, 1, baseBarcode, 1);
      const baseUomId = Number(baseUomRes.lastInsertRowid);
      insertBarcode.run(prodId, baseBarcode, baseUomId);

      // Insert Secondary UOM for relevant products (e.g. CEMT in TON = 20 BAG, STEL in BDL = 100 BAR, PIPE in BDL = 10/25 LGT)
      if (sku.startsWith('CEMT')) {
        // 1 Ton = 20 Bags (Unit 8 is TON)
        const tonBarcode = `8852${String(prodId).padStart(8, '0')}`;
        const tonUomRes = insertUom.run(prodId, 8, 20, tonBarcode, 20);
        insertBarcode.run(prodId, tonBarcode, Number(tonUomRes.lastInsertRowid));
      } else if (sku === 'STEL-001') {
        // 1 Bundle = 100 Bars (Unit 3 is BDL)
        const bdlBarcode = `8853${String(prodId).padStart(8, '0')}`;
        const bdlUomRes = insertUom.run(prodId, 3, 100, bdlBarcode, 100);
        insertBarcode.run(prodId, bdlBarcode, Number(bdlUomRes.lastInsertRowid));
      } else if (sku === 'PIPE-001') {
        // 1 Bundle = 25 Pipes
        const pipeBdlBarcode = `8854${String(prodId).padStart(8, '0')}`;
        const bdlUomRes = insertUom.run(prodId, 3, 25, pipeBdlBarcode, 25);
        insertBarcode.run(prodId, pipeBdlBarcode, Number(bdlUomRes.lastInsertRowid));
      }

      // Warehouse Balances & Starting Stock Cards
      // Assign starting inventory: WH 1 (Main) has good stock, WH 2 (Storefront) has active shelf stock
      let wh1Qty = 350;
      let wh2Qty = 50;
      if (sku.startsWith('SAND')) {
        wh1Qty = 120;
        wh2Qty = 0; // bulk stays in yard (WH 4)
        insertBal.run(prodId, 4, 180);
        insertStockCard.run(prodId, 4, 'OPENING', 'INIT-2026', 'IN', 180, cost, 180, 'ยอดยกมารอบต้นปี ลานหินทราย', 'admin');
      } else if (sku.startsWith('STEL')) {
        wh1Qty = 80;
        wh2Qty = 20;
        insertBal.run(prodId, 3, 400); // Steel Yard (WH 3)
        insertStockCard.run(prodId, 3, 'OPENING', 'INIT-2026', 'IN', 400, cost, 400, 'ยอดยกมารอบต้นปี ลานเหล็ก', 'admin');
      }

      insertBal.run(prodId, 1, wh1Qty);
      insertStockCard.run(prodId, 1, 'OPENING', 'INIT-2026', 'IN', wh1Qty, cost, wh1Qty, 'ยอดยกมารอบต้นปี คลังหลัก', 'admin');

      if (wh2Qty > 0) {
        insertBal.run(prodId, 2, wh2Qty);
        insertStockCard.run(prodId, 2, 'OPENING', 'INIT-2026', 'IN', wh2Qty, cost, wh2Qty, 'ยอดยกมารอบต้นปี หน้าร้าน', 'admin');
      }

      prodId++;
    }

    // 9. Active Shift for POS
    const insertShift = db.prepare(`
      INSERT INTO shifts (user_id, opening_cash, opened_at, status, notes)
      VALUES (?, ?, datetime('now', '-5 hours', 'localtime'), 'open', ?)
    `);
    const shiftRes = insertShift.run(2, 5000, 'กะเช้า แคชเชียร์วิภา เงินทอนเริ่มต้น 5,000 บาท');
    const activeShiftId = Number(shiftRes.lastInsertRowid);

    // 10. Preloaded Past Sales Orders (POS & Credit Invoices)
    const insertSale = db.prepare(`
      INSERT INTO sales_orders (doc_no, doc_type, customer_id, shift_id, user_id, status, subtotal, discount_amount, vat_rate, vat_amount, total_amount, payment_status, payment_method, cash_tendered, change_amount, notes, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', ?, 'localtime'))
    `);

    const insertSaleItem = db.prepare(`
      INSERT INTO sales_items (sale_id, product_id, uom_id, unit_name, quantity, base_quantity, unit_price, discount, total_price, unit_cost)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // Sale 1: Completed Cash Sale
    const s1 = insertSale.run(
      'INV-2026-000101', 'POS', 1, activeShiftId, 2, 'completed',
      2940, 40, 7, 203, 3103, 'paid', 'cash', 4000, 897, 'ลูกค้ามารับเองหน้าร้าน ชำระเงินสด', '-4 hours'
    );
    const s1Id = Number(s1.lastInsertRowid);
    insertSaleItem.run(s1Id, 1, 1, 'ถุง', 10, 10, 150, 0, 1500, 125); // 10 bags Cement
    insertSaleItem.run(s1Id, 6, 6, 'ท่อน', 10, 10, 58, 40, 540, 42); // 10 PVC Pipes
    insertSaleItem.run(s1Id, 12, 12, 'ถัง', 1, 1, 920, 0, 920, 740); // 1 Paint
    // Record Stock Card OUT
    insertStockCard.run(1, 2, 'POS', 'INV-2026-000101', 'OUT', 10, 125, 40, 'ขายหน้าร้าน บิล INV-2026-000101', 'cashier1');
    insertStockCard.run(6, 2, 'POS', 'INV-2026-000101', 'OUT', 10, 42, 40, 'ขายหน้าร้าน บิล INV-2026-000101', 'cashier1');
    insertStockCard.run(12, 2, 'POS', 'INV-2026-000101', 'OUT', 1, 740, 19, 'ขายหน้าร้าน บิล INV-2026-000101', 'cashier1');

    // Sale 2: Credit Sale to Contractor (หจก. วีระการช่าง)
    const s2 = insertSale.run(
      'INV-2026-000102', 'INVOICE', 2, activeShiftId, 2, 'completed',
      45327.1, 0, 7, 3172.9, 48500, 'unpaid', 'credit', 0, 0, 'สั่งของลงหน้างาน ม.พฤกษาวิลล์ บางบัวทอง นัดชำระ 30 วัน', '-2 hours'
    );
    const s2Id = Number(s2.lastInsertRowid);
    insertSaleItem.run(s2Id, 3, 3, 'เส้น', 150, 150, 202, 0, 30300, 185); // 150 Rebar DB12
    insertSaleItem.run(s2Id, 4, 4, 'เส้น', 100, 100, 118, 0, 11800, 105); // 100 Round bar RB9
    insertSaleItem.run(s2Id, 5, 5, 'ขด', 20, 20, 112, 0, 2240, 95); // 20 wire rolls
    insertStockCard.run(3, 3, 'INVOICE', 'INV-2026-000102', 'OUT', 150, 185, 250, 'ขายเชื่อส่งโครงการ บิล INV-2026-000102', 'cashier1');
    insertStockCard.run(4, 3, 'INVOICE', 'INV-2026-000102', 'OUT', 100, 105, 50, 'ขายเชื่อส่งโครงการ บิล INV-2026-000102', 'cashier1');

    // 11. Quotation (ใบเสนอราคา)
    const insertQuo = db.prepare(`
      INSERT INTO quotations (doc_no, customer_id, user_id, valid_until, status, subtotal, discount_amount, vat_amount, total_amount, notes, created_at)
      VALUES (?, ?, ?, date('now', '+15 days'), ?, ?, ?, ?, ?, ?, datetime('now', '-1 day', 'localtime'))
    `);
    const insertQuoItem = db.prepare(`
      INSERT INTO quotation_items (quotation_id, product_id, uom_id, unit_name, quantity, unit_price, discount, total_price)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const q1 = insertQuo.run(
      'QUO-2026-000045', 3, 1, 'sent', 125000, 2500, 8575, 131075, 'เสนอราคาโครงการก่อสร้างอาคารสโมสร บ้านทิวไผ่ ยื่นข้อเสนอราคาโครงการพิเศษ'
    );
    const q1Id = Number(q1.lastInsertRowid);
    insertQuoItem.run(q1Id, 2, 2, 'ถุง', 300, 155, 0, 46500); // 300 bags Elephant Cement
    insertQuoItem.run(q1Id, 9, 9, 'กล่อง', 150, 325, 1500, 47250); // Tiles
    insertQuoItem.run(q1Id, 10, 10, 'ถุง', 100, 128, 1000, 11800); // Tile glue
    insertQuoItem.run(q1Id, 14, 14, 'แผ่น', 150, 138, 0, 20700); // Gypsum

    // 12. Purchase Order (PO) & Goods Receipt (GRN)
    const insertPo = db.prepare(`
      INSERT INTO purchase_orders (doc_no, supplier_id, user_id, status, expected_date, subtotal, vat_amount, total_amount, notes, created_at)
      VALUES (?, ?, ?, ?, date('now', '+3 days'), ?, ?, ?, ?, datetime('now', '-2 days', 'localtime'))
    `);
    const insertPoItem = db.prepare(`
      INSERT INTO purchase_items (po_id, product_id, uom_id, unit_name, quantity, received_quantity, unit_cost, total_cost)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const po1 = insertPo.run(
      'PO-2026-000028', 1, 4, 'received', 112500, 7875, 120375, 'สั่งซื้อปูนซีเมนต์เติมสต็อกประจำสัปดาห์ ส่งคลังหลัก'
    );
    const po1Id = Number(po1.lastInsertRowid);
    insertPoItem.run(po1Id, 1, 1, 'ถุง', 500, 500, 125, 62500);
    insertPoItem.run(po1Id, 2, 2, 'ถุง', 300, 300, 150, 45000);

    // GRN for PO 1
    const insertGrn = db.prepare(`
      INSERT INTO goods_receipts (doc_no, po_id, supplier_id, warehouse_id, received_date, ref_invoice_no, user_id, notes, created_at)
      VALUES (?, ?, ?, ?, date('now'), ?, ?, ?, datetime('now', '-1 day', 'localtime'))
    `);
    const insertGrnItem = db.prepare(`
      INSERT INTO goods_receipt_items (grn_id, product_id, uom_id, quantity, base_quantity, unit_cost, total_cost)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const grn1 = insertGrn.run(
      'GRN-2026-000031', po1Id, 1, 1, 'SCG-INV-889912', 3, 'รับสินค้าครบถ้วน ตรวจนับถูกต้อง ไม่มีถุงฉีกขาด'
    );
    const grn1Id = Number(grn1.lastInsertRowid);
    insertGrnItem.run(grn1Id, 1, 1, 500, 500, 125, 62500);
    insertGrnItem.run(grn1Id, 2, 2, 300, 300, 150, 45000);

    // 13. Deliveries
    const insertDel = db.prepare(`
      INSERT INTO deliveries (doc_no, sale_id, customer_id, recipient_name, recipient_phone, delivery_address, vehicle_type, vehicle_plate, driver_name, scheduled_date, status, proof_note, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, date('now'), ?, ?, datetime('now', '-2 hours', 'localtime'))
    `);
    insertDel.run(
      'DEL-2026-000055', s2Id, 2, 'นายสมศักดิ์ ช่างคุมงาน', '089-988-7766',
      'หน้างาน ม.พฤกษาวิลล์ ซอย 4 ถ.บางกรวย-ไทรน้อย นนทบุรี', 'รถ 6 ล้อติดเครนเฮี๊ยบ', '83-5599 นนทบุรี',
      'นายสุรเดช พร้อมส่ง', 'in_transit', 'กำลังเดินทางไปยังหน้างาน คาดถึง 14:30 น.'
    );

    // 14. Expenses (Petty cash)
    const insertExp = db.prepare(`
      INSERT INTO expenses (doc_no, category, amount, payment_method, shift_id, note, user_id, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now', '-3 hours', 'localtime'))
    `);
    insertExp.run('EXP-2026-000012', 'ค่าน้ำมันรถส่งของ', 1200, 'cash', activeShiftId, 'เติมน้ำมันดีเซล รถ 6 ล้อ ป้าย 83-5599 ใบเสร็จ ปตท.', 2);
    insertExp.run('EXP-2026-000013', 'ค่าอาหารและเครื่องดื่มพนักงาน', 350, 'cash', activeShiftId, 'น้ำดื่มและของว่างช่วงลงสินค้าคลัง', 2);

    // 15. Audit Log
    const insertLog = db.prepare(`
      INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
      VALUES (?, ?, ?, ?, ?)
    `);
    insertLog.run(1, 'SEED_DATABASE', 'SYSTEM', 1, 'Initial ERP setup and sample Thai construction materials loaded successfully');

    db.exec('COMMIT');
    return { success: true, status: 'success', message: 'Seed data generated successfully.' };
  } catch (err: any) {
    db.exec('ROLLBACK');
    console.error('Seed error:', err);
    throw err;
  } finally {
    if (force) {
      db.exec('PRAGMA foreign_keys = ON;');
    }
  }
}
