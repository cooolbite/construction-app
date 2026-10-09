'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  DollarSign, 
  AlertTriangle, 
  CheckCircle2, 
  Calendar, 
  ArrowRight, 
  FileText,
  Clock,
  Printer
} from 'lucide-react';

interface ArViewProps {
  onRefresh: () => void;
  onViewInvoice: (invoice: any) => void;
}

export function ArView({ onRefresh, onViewInvoice }: ArViewProps) {
  const [data, setData] = useState<any>({ customers: [], invoices: [], aging: {} });
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMethod, setPayMethod] = useState<string>('transfer');
  const [payNote, setPayNote] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchArData();
  }, []);

  const fetchArData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/ar');
      const d = await res.json();
      setData(d);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenPayment = (inv: any) => {
    setSelectedInvoice(inv);
    setPayAmount(inv.total_amount);
    setPayNote('');
  };

  const handleExecutePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/ar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sale_id: selectedInvoice.id,
          customer_id: selectedInvoice.customer_id,
          amount: payAmount,
          payment_method: payMethod,
          note: payNote
        })
      });
      const d = await res.json();
      if (res.ok) {
        alert(`บันทึกรับชำระหนี้เรียบร้อย! เลขที่ใบรับเงิน: ${d.payment.doc_no}`);
        setSelectedInvoice(null);
        fetchArData();
        onRefresh();
      } else {
        alert(d.error || 'Payment failed');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const aging = data.aging || {};

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-hairline">
        <div>
          <h1 className="text-2xl font-bold text-ink tracking-tight">ลูกหนี้การค้า & รับชำระ (Accounts Receivable)</h1>
          <p className="text-xs text-muted-text mt-0.5">
            ติดตามยอดค้างชำระ วงเงินเครดิต อายุหนี้ (AR Aging) และบันทึกตัดรับชำระเงิน (FR-AR-001 - 007)
          </p>
        </div>
      </div>

      {/* AR Aging Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="card-airbnb p-5 bg-white">
          <span className="text-xs text-muted-text font-medium block">ยอดหนี้ค้างชำระทั้งหมด</span>
          <span className="text-2xl font-bold text-ink mt-1 block">
            ฿{Number(aging.total_outstanding || 0).toLocaleString()}
          </span>
          <span className="text-[11px] text-muted-text mt-0.5 block">{data.invoices?.length || 0} บิลค้างชำระ</span>
        </div>

        <div className="card-airbnb p-5 bg-white">
          <span className="text-xs text-emerald-700 font-medium block">หนี้ปกติ (0 - 30 วัน)</span>
          <span className="text-2xl font-bold text-emerald-800 mt-1 block">
            ฿{Number(aging.current_0_30 || 0).toLocaleString()}
          </span>
          <span className="text-[11px] text-muted-text mt-0.5 block">ยังไม่เกินกำหนดชำระ</span>
        </div>

        <div className="card-airbnb p-5 bg-white">
          <span className="text-xs text-amber-700 font-medium block">เริ่มเกินกำหนด (31 - 60 วัน)</span>
          <span className="text-2xl font-bold text-amber-700 mt-1 block">
            ฿{Number(aging.overdue_31_60 || 0).toLocaleString()}
          </span>
          <span className="text-[11px] text-muted-text mt-0.5 block">ควรติดตามทวงถาม</span>
        </div>

        <div className="card-airbnb p-5 bg-white">
          <span className="text-xs text-red-600 font-medium block">เกินกำหนดมาก (&gt; 60 วัน)</span>
          <span className="text-2xl font-bold text-red-600 mt-1 block">
            ฿{Number(aging.overdue_60_plus || 0).toLocaleString()}
          </span>
          <span className="text-[11px] text-muted-text mt-0.5 block">หนี้ค้างเกิน 2 เดือน</span>
        </div>
      </div>

      {/* Unpaid Invoices Table */}
      <div className="bg-white rounded-2xl border border-hairline overflow-hidden shadow-subtle">
        <div className="p-4 border-b border-hairline flex items-center justify-between">
          <div className="font-semibold text-sm text-ink flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#ff385c]" />
            <span>รายการบิลขายเชื่อที่ยังไม่ชำระ (Unpaid Sales Invoices)</span>
          </div>
          <span className="text-xs text-muted-text">{data.invoices?.length || 0} รายการ</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-surface-soft border-b border-hairline text-muted-text">
                <th className="py-3 px-4 font-semibold">เลขที่บิล</th>
                <th className="py-3 px-3 font-semibold">ลูกค้า</th>
                <th className="py-3 px-3 font-semibold">วันที่เปิดบิล</th>
                <th className="py-3 px-3 font-semibold text-center">ค้างมาแล้ว</th>
                <th className="py-3 px-3 font-semibold text-right">ยอดค้างชำระ</th>
                <th className="py-3 px-4 font-semibold text-right">การรับชำระ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {(data.invoices || []).map((inv: any) => {
                const days = Math.floor(inv.days_overdue || 0);
                return (
                  <tr key={inv.id} className="hover:bg-surface-soft/50 transition">
                    <td className="py-3 px-4 font-bold text-ink">
                      {inv.doc_no}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-ink">{inv.customer_name}</div>
                      <div className="text-[10px] text-muted-text">{inv.customer_phone || '-'}</div>
                    </td>
                    <td className="py-3 px-3 text-muted-text">
                      {inv.created_at}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        days > 60 ? 'bg-red-100 text-red-800' :
                        days > 30 ? 'bg-amber-100 text-amber-800' :
                        'bg-surface-strong text-muted-text'
                      }`}>
                        {days} วัน
                      </span>
                    </td>
                    <td className="py-3 px-3 font-bold text-right text-red-600">
                      ฿{Number(inv.total_amount).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onViewInvoice(inv)}
                          className="p-1 rounded hover:bg-surface-strong text-muted-text hover:text-ink cursor-pointer"
                          title="พิมพ์บิล"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenPayment(inv)}
                          className="btn-rausch text-xs py-1 px-3 cursor-pointer shadow-xs"
                        >
                          รับชำระหนี้
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-canvas border border-hairline rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-fadeIn">
            
            <div className="flex justify-between items-center pb-3 border-b border-hairline">
              <div>
                <h3 className="font-bold text-base text-ink">บันทึกรับชำระหนี้ (Payment Receipt)</h3>
                <p className="text-xs text-muted-text">บิลเลขที่: {selectedInvoice.doc_no} • {selectedInvoice.customer_name}</p>
              </div>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="text-muted-text hover:text-ink text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleExecutePayment} className="space-y-4 text-xs">
              <div className="p-3 rounded-xl bg-surface-soft border border-hairline text-center">
                <span className="text-muted-text block">ยอดค้างชำระตามบิล</span>
                <span className="text-2xl font-bold text-ink">
                  ฿{Number(selectedInvoice.total_amount).toLocaleString()}
                </span>
              </div>

              <div>
                <label className="font-semibold text-muted-text block mb-1">ยอดเงินที่รับชำระ *</label>
                <input
                  type="number"
                  min="1"
                  max={selectedInvoice.total_amount}
                  required
                  value={payAmount}
                  onChange={(e) => setPayAmount(Number(e.target.value))}
                  className="w-full bg-surface-soft border border-hairline rounded-xl p-2.5 text-ink font-bold text-sm"
                />
              </div>

              <div>
                <label className="font-semibold text-muted-text block mb-1">ช่องทางการรับชำระ *</label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value)}
                  className="w-full bg-surface-soft border border-hairline rounded-xl p-2.5 text-ink"
                >
                  <option value="transfer">โอนเงินเข้าบัญชีธนาคาร (Bank Transfer)</option>
                  <option value="cash">เงินสด (Cash)</option>
                  <option value="credit_card">บัตรเครดิต (Credit Card)</option>
                  <option value="cheque">เช็คธนาคาร (Cheque)</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-muted-text block mb-1">หมายเหตุ / อ้างอิงสลิป</label>
                <input
                  type="text"
                  placeholder="เช่น สลิปโอนเงิน ธ.กสิกรไทย เวลา 10:15 น."
                  value={payNote}
                  onChange={(e) => setPayNote(e.target.value)}
                  className="w-full bg-surface-soft border border-hairline rounded-xl p-2.5 text-ink"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-hairline">
                <button
                  type="button"
                  onClick={() => setSelectedInvoice(null)}
                  className="btn-secondary text-xs py-2 px-4 cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-rausch text-xs py-2 px-6 cursor-pointer"
                >
                  {isSubmitting ? 'กำลังบันทึก...' : 'ยืนยันรับชำระเงิน'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
