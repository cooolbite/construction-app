'use client';

import React from 'react';
import { 
  DollarSign, 
  ShoppingBag, 
  AlertTriangle, 
  TrendingUp, 
  Users, 
  Building, 
  Truck, 
  ArrowUpRight, 
  PlusCircle, 
  FileText, 
  Printer,
  ChevronRight,
  PackageCheck
} from 'lucide-react';

interface DashboardViewProps {
  data: any;
  loading: boolean;
  onNavigateTab: (tab: any) => void;
  onViewInvoice: (invoice: any) => void;
  onOpenShiftModal: () => void;
}

export function DashboardView({
  data,
  loading,
  onNavigateTab,
  onViewInvoice,
  onOpenShiftModal
}: DashboardViewProps) {
  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-2 border-hairline border-t-[#ff385c] rounded-full animate-spin" />
        <span className="text-xs text-muted-text">กำลังโหลดข้อมูลแดชบอร์ด...</span>
      </div>
    );
  }

  const kpis = data?.kpis || {};
  const lowStock = data?.low_stock_items || [];
  const recentSales = data?.recent_sales || [];
  const topProducts = data?.top_products || [];
  const deliveries = data?.pending_deliveries || [];

  return (
    <div className="space-y-8 animate-fadeIn">
      
      {/* Welcome Banner & Quick Action Buttons */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-hairline">
        <div>
          <h1 className="text-2xl font-bold text-ink tracking-tight">ภาพรวมธุรกิจ (ERP Dashboard)</h1>
          <p className="text-xs text-muted-text mt-0.5">
            ระบบจัดการร้านจำหน่ายวัสดุก่อสร้าง • ข้อมูลอัปเดตแบบเรียลไทม์
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => onNavigateTab('pos')}
            className="btn-rausch text-xs py-2 px-3.5 cursor-pointer shadow-sm"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>เปิดบิลขาย POS</span>
          </button>

          <button
            onClick={() => onNavigateTab('purchasing')}
            className="btn-secondary text-xs py-2 px-3 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 text-muted-text" />
            <span>สร้างใบสั่งซื้อ (PO)</span>
          </button>

          <button
            onClick={() => onNavigateTab('quotations')}
            className="btn-secondary text-xs py-2 px-3 cursor-pointer"
          >
            <FileText className="w-4 h-4 text-muted-text" />
            <span>ใบเสนอราคา</span>
          </button>

          <button
            onClick={onOpenShiftModal}
            className="btn-secondary text-xs py-2 px-3 cursor-pointer"
          >
            <PackageCheck className="w-4 h-4 text-muted-text" />
            <span>จัดการกะขาย</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid (Airbnb style cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Sales Today */}
        <div className="card-airbnb p-5 bg-white flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-text mb-3">
            <span className="text-xs font-medium">ยอดขายวันนี้</span>
            <div className="w-8 h-8 rounded-full bg-red-50 text-[#ff385c] flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-ink tracking-tight">
              ฿{Number(kpis.sales_today || 0).toLocaleString()}
            </div>
            <div className="text-[11px] text-muted-text mt-1 flex items-center gap-1">
              <span className="font-semibold text-ink">{kpis.bills_today || 0}</span> บิลขายสำเร็จวันนี้
            </div>
          </div>
        </div>

        {/* Estimated Profit */}
        <div className="card-airbnb p-5 bg-white flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-text mb-3">
            <span className="text-xs font-medium">กำไรเบื้องต้นวันนี้</span>
            <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-emerald-700 tracking-tight">
              ฿{Number(kpis.profit_today || 0).toLocaleString()}
            </div>
            <div className="text-[11px] text-muted-text mt-1">
              คำนวณจากราคาขายหักต้นทุนจริง
            </div>
          </div>
        </div>

        {/* Sales This Month */}
        <div className="card-airbnb p-5 bg-white flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-text mb-3">
            <span className="text-xs font-medium">ยอดขายเดือนนี้</span>
            <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-ink tracking-tight">
              ฿{Number(kpis.sales_month || 0).toLocaleString()}
            </div>
            <div className="text-[11px] text-muted-text mt-1">
              สะสม {kpis.bills_month || 0} บิลในเดือนนี้
            </div>
          </div>
        </div>

        {/* Outstanding AR (Debt) */}
        <div className="card-airbnb p-5 bg-white flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-text mb-3">
            <span className="text-xs font-medium">ลูกหนี้คงค้าง (AR)</span>
            <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-amber-600 tracking-tight">
              ฿{Number(kpis.total_ar || 0).toLocaleString()}
            </div>
            <div className="text-[11px] text-muted-text mt-1 flex items-center justify-between">
              <span>{kpis.unpaid_ar_count || 0} บิลค้างชำระ</span>
              <button
                onClick={() => onNavigateTab('ar')}
                className="text-[#ff385c] hover:underline font-medium text-[11px] cursor-pointer"
              >
                ดูรายละเอียด &rarr;
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Main Grid: Low Stock Alert & Recent Sales */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Low Stock Alerts (Takes 1 Col) */}
        <div className="card-airbnb p-5 bg-white flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-hairline mb-4">
            <div className="flex items-center gap-2 text-ink font-semibold text-sm">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span>สินค้าสต็อกต่ำ / ต้องสั่งเพิ่ม</span>
            </div>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
              {lowStock.length} รายการ
            </span>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto max-h-[360px]">
            {lowStock.length === 0 ? (
              <div className="text-center py-10 text-xs text-muted-text">
                สต็อกสินค้าอยู่ในเกณฑ์ปกติทุกรายการ
              </div>
            ) : (
              lowStock.map((it: any) => (
                <div 
                  key={it.id} 
                  className="p-3 rounded-xl border border-hairline hover:bg-surface-soft transition flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="font-semibold text-xs text-ink truncate">{it.name}</div>
                    <div className="text-[10px] text-muted-text">SKU: {it.sku}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className={`text-xs font-bold ${it.total_stock <= 0 ? 'text-red-600' : 'text-amber-600'}`}>
                      เหลือ {it.total_stock} {it.unit_name}
                    </div>
                    <div className="text-[10px] text-muted-text">
                      จุดสั่งซื้อ: {it.reorder_point}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="pt-3 border-t border-hairline mt-3 text-right">
            <button
              onClick={() => onNavigateTab('warehouse')}
              className="text-xs text-[#ff385c] font-medium hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              <span>ไปจัดการคลังสินค้า</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Recent Sales Transactions (Takes 2 Cols) */}
        <div className="lg:col-span-2 card-airbnb p-5 bg-white flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-hairline mb-4">
            <div className="font-semibold text-ink text-sm flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-ink" />
              <span>บิลขายล่าสุด (Recent Transactions)</span>
            </div>
            <button
              onClick={() => onNavigateTab('reports')}
              className="text-xs text-[#ff385c] hover:underline font-medium cursor-pointer"
            >
              ดูรายงานทั้งหมด &rarr;
            </button>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-muted-text border-b border-hairline pb-2">
                  <th className="pb-2 font-medium">เลขที่บิล</th>
                  <th className="pb-2 font-medium">ลูกค้า</th>
                  <th className="pb-2 font-medium">ช่องทางชำระ</th>
                  <th className="pb-2 font-medium text-right">ยอดเงิน</th>
                  <th className="pb-2 font-medium text-center">สถานะ</th>
                  <th className="pb-2 font-medium text-right">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline">
                {recentSales.map((sale: any) => (
                  <tr key={sale.id} className="hover:bg-surface-soft/60 transition">
                    <td className="py-2.5 font-semibold text-ink">{sale.doc_no}</td>
                    <td className="py-2.5 text-muted-text">{sale.customer_name}</td>
                    <td className="py-2.5">
                      <span className="capitalize px-2 py-0.5 rounded bg-surface-strong text-ink text-[10px]">
                        {sale.payment_method === 'cash' && 'เงินสด'}
                        {sale.payment_method === 'transfer' && 'โอนเงิน'}
                        {sale.payment_method === 'credit_card' && 'บัตรเครดิต'}
                        {sale.payment_method === 'credit' && 'ขายเชื่อ'}
                      </span>
                    </td>
                    <td className="py-2.5 font-bold text-ink text-right">
                      ฿{Number(sale.total_amount).toLocaleString()}
                    </td>
                    <td className="py-2.5 text-center">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        sale.payment_status === 'paid'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}>
                        {sale.payment_status === 'paid' ? 'ชำระแล้ว' : 'ค้างชำระ'}
                      </span>
                    </td>
                    <td className="py-2.5 text-right">
                      <button
                        onClick={() => onViewInvoice(sale)}
                        className="p-1 rounded hover:bg-surface-strong text-muted-text hover:text-ink cursor-pointer"
                        title="พิมพ์ใบเสร็จ"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Bottom Grid: Top Selling Materials & Deliveries */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Top Products */}
        <div className="card-airbnb p-5 bg-white">
          <div className="font-semibold text-ink text-sm pb-3 border-b border-hairline mb-4 flex items-center justify-between">
            <span>5 อันดับสินค้าขายดี (Top Sellers)</span>
            <span className="text-xs text-muted-text font-normal">เรียงตามยอดขาย</span>
          </div>

          <div className="space-y-3">
            {topProducts.map((p: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between p-2.5 rounded-lg border border-hairline">
                <div className="flex items-center gap-3">
                  <span className="w-5 h-5 rounded-full bg-surface-strong text-ink font-bold text-xs flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <div>
                    <div className="font-semibold text-xs text-ink">{p.name}</div>
                    <div className="text-[10px] text-muted-text">SKU: {p.sku} • ขายไป {p.total_qty} {p.unit_name}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-xs text-ink">฿{Number(p.total_revenue).toLocaleString()}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pending Deliveries */}
        <div className="card-airbnb p-5 bg-white">
          <div className="font-semibold text-ink text-sm pb-3 border-b border-hairline mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-[#ff385c]" />
              <span>คิวจัดส่งสินค้า (Pending Deliveries)</span>
            </div>
            <button
              onClick={() => onNavigateTab('deliveries')}
              className="text-xs text-[#ff385c] hover:underline cursor-pointer font-medium"
            >
              ดูทั้งหมด &rarr;
            </button>
          </div>

          <div className="space-y-3">
            {deliveries.length === 0 ? (
              <div className="text-center py-8 text-xs text-muted-text">
                ไม่มีคิวจัดส่งค้างอยู่
              </div>
            ) : (
              deliveries.map((del: any) => (
                <div key={del.id} className="p-3 rounded-xl border border-hairline flex items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-ink">{del.doc_no}</span>
                      <span className="text-[10px] px-2 py-0.2 rounded-full font-medium bg-blue-50 text-blue-700">
                        {del.status === 'in_transit' && 'กำลังจัดส่ง'}
                        {del.status === 'preparing' && 'กำลังจัดของ'}
                        {del.status === 'pending' && 'รอจัดส่ง'}
                      </span>
                    </div>
                    <div className="text-[11px] text-muted-text mt-0.5 truncate max-w-xs">
                      ลูกค้า: {del.customer_name} • {del.delivery_address}
                    </div>
                    <div className="text-[10px] text-muted-text">
                      รถ: {del.vehicle_type} ({del.vehicle_plate}) • คนขับ: {del.driver_name}
                    </div>
                  </div>

                  <button
                    onClick={() => onNavigateTab('deliveries')}
                    className="p-1.5 rounded-lg border border-hairline hover:bg-surface-soft text-muted-text cursor-pointer"
                  >
                    <ArrowUpRight className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
