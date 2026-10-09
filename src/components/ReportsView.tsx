'use client';

import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  Boxes, 
  Users, 
  Printer, 
  Download,
  Calendar,
  Layers
} from 'lucide-react';

export function ReportsView() {
  const [reportType, setReportType] = useState<'sales' | 'profit' | 'stock' | 'aging'>('sales');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReport(reportType);
  }, [reportType]);

  const fetchReport = async (type: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports?type=${type}`);
      const d = await res.json();
      setData(d);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-hairline">
        <div>
          <h1 className="text-2xl font-bold text-ink tracking-tight">รายงาน & สรุปผลประกอบการ (ERP Reports)</h1>
          <p className="text-xs text-muted-text mt-0.5">
            วิเคราะห์ยอดขาย กำไรขั้นต้น (Gross Profit Margin) มูลค่าสต็อก และอายุลูกหนี้ (FR-REP-001 - 009)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="btn-secondary text-xs py-2 px-3.5 flex items-center gap-1.5 cursor-pointer no-print"
          >
            <Printer className="w-4 h-4" />
            <span>พิมพ์รายงาน</span>
          </button>
        </div>
      </div>

      {/* Report Type Selector Pills (Airbnb style) */}
      <div className="flex bg-surface-soft p-1 rounded-xl border border-hairline text-xs font-medium max-w-fit no-print">
        <button
          onClick={() => setReportType('sales')}
          className={`px-3.5 py-1.5 rounded-lg transition cursor-pointer ${
            reportType === 'sales' ? 'bg-white text-ink font-semibold shadow-xs' : 'text-muted-text hover:text-ink'
          }`}
        >
          ยอดขายตามช่วงวัน & หมวดหมู่
        </button>
        <button
          onClick={() => setReportType('profit')}
          className={`px-3.5 py-1.5 rounded-lg transition cursor-pointer ${
            reportType === 'profit' ? 'bg-white text-ink font-semibold shadow-xs' : 'text-muted-text hover:text-ink'
          }`}
        >
          กำไรขั้นต้น (Gross Margin)
        </button>
        <button
          onClick={() => setReportType('stock')}
          className={`px-3.5 py-1.5 rounded-lg transition cursor-pointer ${
            reportType === 'stock' ? 'bg-white text-ink font-semibold shadow-xs' : 'text-muted-text hover:text-ink'
          }`}
        >
          มูลค่าสินค้าคงคลัง (Stock Valuation)
        </button>
        <button
          onClick={() => setReportType('aging')}
          className={`px-3.5 py-1.5 rounded-lg transition cursor-pointer ${
            reportType === 'aging' ? 'bg-white text-ink font-semibold shadow-xs' : 'text-muted-text hover:text-ink'
          }`}
        >
          อายุหนี้ลูกหนี้ (AR Aging)
        </button>
      </div>

      {/* Report Content */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-2">
          <div className="w-8 h-8 border-2 border-hairline border-t-[#ff385c] rounded-full animate-spin" />
          <span className="text-xs text-muted-text">กำลังประมวลผลรายงาน...</span>
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* 1. Sales Report */}
          {reportType === 'sales' && data && (
            <div className="space-y-6">
              
              {/* Category Breakdown */}
              <div className="bg-white rounded-2xl border border-hairline p-5 shadow-subtle">
                <h3 className="font-bold text-sm text-ink mb-3">ยอดขายแยกตามหมวดหมู่วัสดุ</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {(data.sales_by_category || []).map((cat: any, i: number) => (
                    <div key={i} className="p-3 rounded-xl bg-surface-soft border border-hairline">
                      <span className="text-xs font-semibold text-ink block truncate">{cat.category_name}</span>
                      <span className="text-lg font-bold text-ink mt-1 block">
                        ฿{Number(cat.total_sales).toLocaleString()}
                      </span>
                      <span className="text-[10px] text-muted-text mt-0.5 block">
                        ปริมาณขาย {cat.total_qty} หน่วย
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Daily Sales Table */}
              <div className="bg-white rounded-2xl border border-hairline overflow-hidden shadow-subtle">
                <div className="p-4 border-b border-hairline">
                  <h3 className="font-bold text-sm text-ink">ตารางสรุปยอดขายรายวัน</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-surface-soft border-b border-hairline text-muted-text">
                        <th className="py-3 px-4 font-semibold">วันที่</th>
                        <th className="py-3 px-3 font-semibold text-center">จำนวนบิล</th>
                        <th className="py-3 px-3 font-semibold text-right">ยอดก่อนลด</th>
                        <th className="py-3 px-3 font-semibold text-right">ส่วนลด</th>
                        <th className="py-3 px-3 font-semibold text-right">ภาษี VAT</th>
                        <th className="py-3 px-4 font-semibold text-right">ยอดสุทธิรวม</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-hairline">
                      {(data.sales_by_date || []).map((d: any, i: number) => (
                        <tr key={i} className="hover:bg-surface-soft/50 transition">
                          <td className="py-3 px-4 font-semibold text-ink">{d.sale_date}</td>
                          <td className="py-3 px-3 text-center">{d.bill_count} บิล</td>
                          <td className="py-3 px-3 text-right">฿{Number(d.subtotal).toLocaleString()}</td>
                          <td className="py-3 px-3 text-right text-red-600">-฿{Number(d.total_discount).toLocaleString()}</td>
                          <td className="py-3 px-3 text-right text-muted-text">฿{Number(d.total_vat).toLocaleString()}</td>
                          <td className="py-3 px-4 text-right font-bold text-ink">฿{Number(d.total_revenue).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* 2. Gross Profit Report */}
          {reportType === 'profit' && data && (
            <div className="space-y-6">
              
              {/* Overall Profit Summary Banner */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="card-airbnb p-5 bg-white">
                  <span className="text-xs text-muted-text font-medium block">ยอดขายรวมทั้งหมด</span>
                  <span className="text-2xl font-bold text-ink mt-1 block">
                    ฿{Number(data.overall?.total_revenue || 0).toLocaleString()}
                  </span>
                </div>
                <div className="card-airbnb p-5 bg-white">
                  <span className="text-xs text-muted-text font-medium block">ต้นทุนขายรวม (Cost of Goods)</span>
                  <span className="text-2xl font-bold text-muted-text mt-1 block">
                    ฿{Number(data.overall?.total_cost || 0).toLocaleString()}
                  </span>
                </div>
                <div className="card-airbnb p-5 bg-white">
                  <span className="text-xs text-emerald-700 font-medium block">กำไรขั้นต้นรวม (Gross Profit)</span>
                  <span className="text-2xl font-extrabold text-emerald-800 mt-1 block">
                    ฿{Number(data.overall?.gross_profit || 0).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Profit by Product Table */}
              <div className="bg-white rounded-2xl border border-hairline overflow-hidden shadow-subtle">
                <div className="p-4 border-b border-hairline">
                  <h3 className="font-bold text-sm text-ink">วิเคราะห์กำไรขั้นต้นและ Margin แยกตามสินค้า</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-surface-soft border-b border-hairline text-muted-text">
                        <th className="py-3 px-4 font-semibold">สินค้า / SKU</th>
                        <th className="py-3 px-3 font-semibold">หมวดหมู่</th>
                        <th className="py-3 px-3 font-semibold text-center">ขายไป</th>
                        <th className="py-3 px-3 font-semibold text-right">ยอดขายรวม</th>
                        <th className="py-3 px-3 font-semibold text-right">ต้นทุนรวม</th>
                        <th className="py-3 px-3 font-semibold text-right">กำไรขั้นต้น</th>
                        <th className="py-3 px-4 font-semibold text-center">Margin %</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-hairline">
                      {(data.items || []).map((it: any, i: number) => (
                        <tr key={i} className="hover:bg-surface-soft/50 transition">
                          <td className="py-3 px-4">
                            <div className="font-semibold text-ink">{it.product_name}</div>
                            <div className="text-[10px] text-muted-text font-mono">{it.sku}</div>
                          </td>
                          <td className="py-3 px-3 text-muted-text">{it.category_name}</td>
                          <td className="py-3 px-3 text-center">{it.sold_qty} {it.unit_name}</td>
                          <td className="py-3 px-3 text-right">฿{Number(it.total_revenue).toLocaleString()}</td>
                          <td className="py-3 px-3 text-right text-muted-text">฿{Number(it.total_cost).toLocaleString()}</td>
                          <td className="py-3 px-3 text-right font-bold text-emerald-700">
                            +฿{Number(it.gross_profit).toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="font-bold text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800">
                              {it.margin_pct}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* 3. Stock Valuation Report */}
          {reportType === 'stock' && data && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="card-airbnb p-5 bg-white">
                  <span className="text-xs text-muted-text font-medium block">มูลค่าสต็อกตามราคาทุนรวม (Asset Value)</span>
                  <span className="text-2xl font-extrabold text-ink mt-1 block">
                    ฿{Number(data.totals?.total_asset_value || 0).toLocaleString()}
                  </span>
                </div>
                <div className="card-airbnb p-5 bg-white">
                  <span className="text-xs text-muted-text font-medium block">จำนวน SKU ที่มีในคลัง</span>
                  <span className="text-2xl font-bold text-ink mt-1 block">
                    {data.totals?.total_active_skus || 0} รายการ
                  </span>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-hairline overflow-hidden shadow-subtle">
                <div className="p-4 border-b border-hairline">
                  <h3 className="font-bold text-sm text-ink">ตารางมูลค่าสต็อกสินค้าคงเหลือ</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-surface-soft border-b border-hairline text-muted-text">
                        <th className="py-3 px-4 font-semibold">สินค้า / SKU</th>
                        <th className="py-3 px-3 font-semibold">หมวดหมู่</th>
                        <th className="py-3 px-3 font-semibold text-right">จำนวนคงเหลือ</th>
                        <th className="py-3 px-3 font-semibold text-right">ราคาทุน</th>
                        <th className="py-3 px-3 font-semibold text-right">มูลค่ารวม (ทุน)</th>
                        <th className="py-3 px-4 font-semibold text-center">สถานะสต็อก</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-hairline">
                      {(data.items || []).map((it: any, i: number) => (
                        <tr key={i} className="hover:bg-surface-soft/50 transition">
                          <td className="py-3 px-4">
                            <div className="font-semibold text-ink">{it.product_name}</div>
                            <div className="text-[10px] text-muted-text font-mono">{it.sku}</div>
                          </td>
                          <td className="py-3 px-3 text-muted-text">{it.category_name}</td>
                          <td className="py-3 px-3 text-right font-bold text-ink">
                            {it.total_quantity} {it.unit_name}
                          </td>
                          <td className="py-3 px-3 text-right text-muted-text">
                            ฿{Number(it.cost_price).toLocaleString()}
                          </td>
                          <td className="py-3 px-3 text-right font-bold text-ink">
                            ฿{Number(it.total_cost_value).toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full ${
                              it.stock_status === 'OUT_OF_STOCK' ? 'bg-red-100 text-red-800' :
                              it.stock_status === 'LOW_STOCK' ? 'bg-amber-100 text-amber-800' :
                              'bg-emerald-100 text-emerald-800'
                            }`}>
                              {it.stock_status === 'OUT_OF_STOCK' && 'หมดสต็อก'}
                              {it.stock_status === 'LOW_STOCK' && 'จุดสั่งซื้อ'}
                              {it.stock_status === 'NORMAL' && 'ปกติ'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* 4. AR Aging Report */}
          {reportType === 'aging' && data && (
            <div className="bg-white rounded-2xl border border-hairline overflow-hidden shadow-subtle">
              <div className="p-4 border-b border-hairline">
                <h3 className="font-bold text-sm text-ink">รายงานอายุหนี้ลูกหนี้การค้า (Accounts Receivable Aging)</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-surface-soft border-b border-hairline text-muted-text">
                      <th className="py-3 px-4 font-semibold">ลูกค้า</th>
                      <th className="py-3 px-3 font-semibold text-center">บิลค้าง</th>
                      <th className="py-3 px-3 font-semibold text-right">วงเงินเครดิต</th>
                      <th className="py-3 px-3 font-semibold text-right">0 - 30 วัน</th>
                      <th className="py-3 px-3 font-semibold text-right">31 - 60 วัน</th>
                      <th className="py-3 px-3 font-semibold text-right">&gt; 60 วัน</th>
                      <th className="py-3 px-4 font-semibold text-right">หนี้รวมคงค้าง</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-hairline">
                    {(data.ar_aging || []).map((ag: any, i: number) => (
                      <tr key={i} className="hover:bg-surface-soft/50 transition">
                        <td className="py-3 px-4 font-semibold text-ink">
                          {ag.customer_name}
                        </td>
                        <td className="py-3 px-3 text-center">{ag.unpaid_bills} บิล</td>
                        <td className="py-3 px-3 text-right text-muted-text">
                          ฿{Number(ag.credit_limit).toLocaleString()}
                        </td>
                        <td className="py-3 px-3 text-right text-emerald-700">
                          ฿{Number(ag.bucket_0_30).toLocaleString()}
                        </td>
                        <td className="py-3 px-3 text-right text-amber-700 font-medium">
                          ฿{Number(ag.bucket_31_60).toLocaleString()}
                        </td>
                        <td className="py-3 px-3 text-right text-red-600 font-bold">
                          ฿{Number(ag.bucket_over_60).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right font-extrabold text-red-600">
                          ฿{Number(ag.total_due).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
