import { NextResponse } from 'next/server';
import { queryAll, queryOne } from '@/lib/db';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const reportType = searchParams.get('type') || 'sales'; // 'sales' | 'profit' | 'stock' | 'aging'

    // 1. Sales Report
    if (reportType === 'sales') {
      const salesByDate = queryAll(`
        SELECT 
          date(created_at) as sale_date,
          COUNT(id) as bill_count,
          SUM(subtotal) as subtotal,
          SUM(discount_amount) as total_discount,
          SUM(vat_amount) as total_vat,
          SUM(total_amount) as total_revenue
        FROM sales_orders
        WHERE status = 'completed'
        GROUP BY date(created_at)
        ORDER BY sale_date DESC
        LIMIT 30
      `);

      const salesByCategory = queryAll(`
        SELECT 
          c.name as category_name,
          SUM(si.quantity) as total_qty,
          SUM(si.total_price) as total_sales
        FROM sales_items si
        JOIN products p ON si.product_id = p.id
        JOIN categories c ON p.category_id = c.id
        JOIN sales_orders so ON si.sale_id = so.id
        WHERE so.status = 'completed'
        GROUP BY c.id
        ORDER BY total_sales DESC
      `);

      const salesByPaymentMethod = queryAll(`
        SELECT 
          payment_method,
          COUNT(id) as count,
          SUM(total_amount) as total
        FROM sales_orders
        WHERE status = 'completed'
        GROUP BY payment_method
      `);

      return NextResponse.json({
        sales_by_date: salesByDate,
        sales_by_category: salesByCategory,
        sales_by_payment: salesByPaymentMethod
      });
    }

    // 2. Gross Profit Report
    if (reportType === 'profit') {
      const profitByProduct = queryAll(`
        SELECT 
          p.sku, p.name as product_name, c.name as category_name,
          SUM(si.quantity) as sold_qty,
          u.name as unit_name,
          SUM(si.total_price) as total_revenue,
          SUM(si.quantity * si.unit_cost) as total_cost,
          SUM(si.total_price - (si.quantity * si.unit_cost)) as gross_profit,
          ROUND((SUM(si.total_price - (si.quantity * si.unit_cost)) / NULLIF(SUM(si.total_price), 0)) * 100, 2) as margin_pct
        FROM sales_items si
        JOIN products p ON si.product_id = p.id
        JOIN categories c ON p.category_id = c.id
        JOIN units u ON p.base_unit_id = u.id
        JOIN sales_orders so ON si.sale_id = so.id
        WHERE so.status = 'completed'
        GROUP BY p.id
        ORDER BY gross_profit DESC
      `);

      const overallProfit = queryOne(`
        SELECT 
          SUM(si.total_price) as total_revenue,
          SUM(si.quantity * si.unit_cost) as total_cost,
          SUM(si.total_price - (si.quantity * si.unit_cost)) as gross_profit
        FROM sales_items si
        JOIN sales_orders so ON si.sale_id = so.id
        WHERE so.status = 'completed'
      `);

      return NextResponse.json({
        items: profitByProduct,
        overall: overallProfit || { total_revenue: 0, total_cost: 0, gross_profit: 0 }
      });
    }

    // 3. Stock Valuation Report
    if (reportType === 'stock') {
      const stockValuation = queryAll(`
        SELECT 
          p.id, p.sku, p.name as product_name, c.name as category_name, u.name as unit_name,
          p.cost_price, p.retail_price,
          COALESCE(SUM(ib.quantity), 0) as total_quantity,
          COALESCE(SUM(ib.quantity * p.cost_price), 0) as total_cost_value,
          COALESCE(SUM(ib.quantity * p.retail_price), 0) as total_retail_value,
          p.reorder_point,
          CASE 
            WHEN COALESCE(SUM(ib.quantity), 0) = 0 THEN 'OUT_OF_STOCK'
            WHEN COALESCE(SUM(ib.quantity), 0) <= p.reorder_point THEN 'LOW_STOCK'
            ELSE 'NORMAL'
          END as stock_status
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN units u ON p.base_unit_id = u.id
        LEFT JOIN inventory_balances ib ON p.id = ib.product_id
        WHERE p.is_active = 1
        GROUP BY p.id
        ORDER BY total_cost_value DESC
      `);

      const totals = queryOne(`
        SELECT 
          SUM(ib.quantity * p.cost_price) as total_asset_value,
          COUNT(DISTINCT p.id) as total_active_skus
        FROM products p
        JOIN inventory_balances ib ON p.id = ib.product_id
        WHERE p.is_active = 1
      `);

      return NextResponse.json({
        items: stockValuation,
        totals: totals || { total_asset_value: 0, total_active_skus: 0 }
      });
    }

    // 4. Aging Report
    if (reportType === 'aging') {
      const arAging = queryAll(`
        SELECT 
          c.name as customer_name, c.phone, c.credit_limit, c.credit_term_days,
          COUNT(so.id) as unpaid_bills,
          SUM(so.total_amount) as total_due,
          SUM(CASE WHEN (julianday('now') - julianday(so.created_at)) <= 30 THEN so.total_amount ELSE 0 END) as bucket_0_30,
          SUM(CASE WHEN (julianday('now') - julianday(so.created_at)) BETWEEN 31 AND 60 THEN so.total_amount ELSE 0 END) as bucket_31_60,
          SUM(CASE WHEN (julianday('now') - julianday(so.created_at)) > 60 THEN so.total_amount ELSE 0 END) as bucket_over_60
        FROM customers c
        JOIN sales_orders so ON c.id = so.customer_id
        WHERE so.payment_status IN ('unpaid', 'partial') AND so.status = 'completed'
        GROUP BY c.id
        ORDER BY total_due DESC
      `);

      return NextResponse.json({ ar_aging: arAging });
    }

    return NextResponse.json({ error: 'Invalid report type' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
