import { NextResponse } from 'next/server';
import { queryAll, queryOne } from '@/lib/db';
import { seedDatabase } from '@/lib/seed';

export async function GET() {
  try {
    // Ensure initial seed exists
    seedDatabase(false);

    // 1. Sales Today & Sales This Month
    const salesToday = queryOne(`
      SELECT 
        COALESCE(SUM(total_amount), 0) as total_sales,
        COUNT(id) as bill_count
      FROM sales_orders 
      WHERE status = 'completed' AND date(created_at) = date('now', 'localtime')
    `);

    const salesMonth = queryOne(`
      SELECT 
        COALESCE(SUM(total_amount), 0) as total_sales,
        COUNT(id) as bill_count
      FROM sales_orders 
      WHERE status = 'completed' AND strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now', 'localtime')
    `);

    // 2. Gross profit estimation (Total Revenue - Total Cost)
    const profitToday = queryOne(`
      SELECT 
        COALESCE(SUM(si.total_price - (si.quantity * si.unit_cost)), 0) as profit
      FROM sales_items si
      JOIN sales_orders so ON si.sale_id = so.id
      WHERE so.status = 'completed' AND date(so.created_at) = date('now', 'localtime')
    `);

    // 3. Low stock & out of stock products
    const lowStockItems = queryAll(`
      SELECT 
        p.id, p.sku, p.name, p.min_stock, p.reorder_point, u.name as unit_name,
        COALESCE(SUM(ib.quantity), 0) as total_stock
      FROM products p
      LEFT JOIN inventory_balances ib ON p.id = ib.product_id
      LEFT JOIN units u ON p.base_unit_id = u.id
      WHERE p.is_active = 1
      GROUP BY p.id
      HAVING total_stock <= p.reorder_point
      ORDER BY total_stock ASC
      LIMIT 6
    `);

    // 4. Accounts Receivable (AR) & Accounts Payable (AP)
    const arSummary = queryOne(`
      SELECT 
        COALESCE(SUM(total_amount), 0) as total_ar,
        COUNT(id) as unpaid_count
      FROM sales_orders 
      WHERE payment_status IN ('unpaid', 'partial') AND status = 'completed'
    `);

    const apSummary = queryOne(`
      SELECT 
        COALESCE(SUM(total_amount), 0) as total_ap,
        COUNT(id) as pending_po_count
      FROM purchase_orders 
      WHERE status IN ('ordered', 'partial')
    `);

    // 5. Active shift status
    const activeShift = queryOne(`
      SELECT s.*, u.name as user_name
      FROM shifts s
      JOIN users u ON s.user_id = u.id
      WHERE s.status = 'open'
      ORDER BY s.id DESC
      LIMIT 1
    `);

    // 6. Recent sales orders
    const recentSales = queryAll(`
      SELECT 
        so.id, so.doc_no, so.doc_type, so.total_amount, so.payment_status, so.payment_method,
        so.created_at, COALESCE(c.name, 'ลูกค้าทั่วไป') as customer_name
      FROM sales_orders so
      LEFT JOIN customers c ON so.customer_id = c.id
      ORDER BY so.id DESC
      LIMIT 7
    `);

    // 7. Top selling items (by revenue)
    const topProducts = queryAll(`
      SELECT 
        p.name, p.sku, u.name as unit_name,
        SUM(si.quantity) as total_qty,
        SUM(si.total_price) as total_revenue
      FROM sales_items si
      JOIN products p ON si.product_id = p.id
      JOIN units u ON p.base_unit_id = u.id
      JOIN sales_orders so ON si.sale_id = so.id
      WHERE so.status = 'completed'
      GROUP BY p.id
      ORDER BY total_revenue DESC
      LIMIT 5
    `);

    // 8. Pending deliveries
    const pendingDeliveries = queryAll(`
      SELECT d.*, c.name as customer_name
      FROM deliveries d
      JOIN customers c ON d.customer_id = c.id
      WHERE d.status IN ('pending', 'preparing', 'in_transit')
      ORDER BY d.id DESC
      LIMIT 5
    `);

    return NextResponse.json({
      kpis: {
        sales_today: salesToday?.total_sales || 0,
        bills_today: salesToday?.bill_count || 0,
        profit_today: profitToday?.profit || 0,
        sales_month: salesMonth?.total_sales || 0,
        bills_month: salesMonth?.bill_count || 0,
        total_ar: arSummary?.total_ar || 0,
        unpaid_ar_count: arSummary?.unpaid_count || 0,
        total_ap: apSummary?.total_ap || 0,
        pending_ap_count: apSummary?.pending_po_count || 0,
        low_stock_count: lowStockItems.length
      },
      low_stock_items: lowStockItems,
      recent_sales: recentSales,
      top_products: topProducts,
      pending_deliveries: pendingDeliveries,
      active_shift: activeShift || null
    });
  } catch (error: any) {
    console.error('Dashboard API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
