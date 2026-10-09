'use client';

import React, { useState, useEffect } from 'react';
import { 
  Building, 
  DollarSign, 
  Clock, 
  CheckCircle2, 
  ShoppingCart, 
  Plus, 
  FileText
} from 'lucide-react';

interface ApViewProps {
  onRefresh: () => void;
}

export function ApView({ onRefresh }: ApViewProps) {
  const [data, setData] = useState<any>({ suppliers: [], orders: [], vouchers: [] });
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMethod, setPayMethod] = useState<string>('transfer');
  const [payNote, setPayNote] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchApData();
  }, []);

  const fetchApData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/ap');
      const d = await res.json();
      setData(d);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenPayModal = (order: any) => {
    setSelectedOrder(order);
    setPayAmount(order.total_amount);
    setPayNote('');
  };

  const handleExecutePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/ap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          po_id: selectedOrder.id,
          supplier_id: selectedOrder.supplier_id,
          amount: payAmount,
          payment_method: payMethod,
          note: payNote
        })
      });
      const d = await res.json();
      if (res.ok) {
        alert(`บันทึกจ่ายเงินเจ้าหนี้เรียบร้อย! ใบสำคัญจ่ายเลขที่: ${d.voucher.doc_no}`);
        setSelectedOrder(null);
        fetchApData();
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

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-hairline">
        <div>
          <h1 className="text-2xl font-bold text-ink tracking-tight">เจ้าหนี้การค้า & จ่ายชำระ (Accounts Payable)</h1>
          <p className="text-xs text-muted-text mt-0.5">
            ติดตามยอดค้างชำระผู้จำหน่าย (Suppliers) เครดิตเทอม และออกใบสำคัญจ่าย (FR-AP-001 - 005)
          </p>
        </div>
      </div>

      {/* Suppliers Directory */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {(data.suppliers || []).map((s: any) => (
          <div key={s.id} className="card-airbnb p-5 bg-white space-y-2">
            <div className="flex items-center gap-2">
              <Building className="w-4 h-4 text-muted-text" />
              <span className="font-bold text-xs text-ink truncate">{s.name}</span>
            </div>
            <div className="text-[11px] text-muted-text">
              ผู้ติดต่อ: {s.contact_name || '-'} • {s.phone || '-'}
            </div>
            <div className="pt-2 border-t border-hairline flex justify-between items-center text-xs">
              <span className="text-muted-text">เครดิต: {s.payment_term_days} วัน</span>
              <span className="font-bold text-ink">{s.po_count || 0} ใบสั่งซื้อ</span>
            </div>
          </div>
        ))}
      </div>

      {/* Open POs Table */}
      <div className="bg-white rounded-2xl border border-hairline overflow-hidden shadow-subtle">
        <div className="p-4 border-b border-hairline flex items-center justify-between">
          <div className="font-semibold text-sm text-ink flex items-center gap-2">
            <ShoppingCart className="w-4 h-4 text-[#ff385c]" />
            <span>ใบสั่งซื้อที่ต้องจ่ายชำระ (Purchase Orders)</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-surface-soft border-b border-hairline text-muted-text">
                <th className="py-3 px-4 font-semibold">เลขที่ PO</th>
                <th className="py-3 px-3 font-semibold">ผู้จำหน่าย</th>
                <th className="py-3 px-3 font-semibold">วันที่สั่ง</th>
                <th className="py-3 px-3 font-semibold text-center">สถานะของ</th>
                <th className="py-3 px-3 font-semibold text-right">ยอดเงินทั้งสิ้น</th>
                <th className="py-3 px-4 font-semibold text-right">การจ่ายเงิน</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {(data.orders || []).map((po: any) => (
                <tr key={po.id} className="hover:bg-surface-soft/50 transition">
                  <td className="py-3 px-4 font-bold text-ink">
                    {po.doc_no}
                  </td>
                  <td className="py-3 px-3 font-semibold text-ink">
                    {po.supplier_name}
                  </td>
                  <td className="py-3 px-3 text-muted-text">
                    {po.created_at}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full ${
                      po.status === 'received' ? 'bg-emerald-100 text-emerald-800' :
                      po.status === 'partial' ? 'bg-amber-100 text-amber-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {po.status === 'received' && 'รับของครบ'}
                      {po.status === 'partial' && 'รับบางส่วน'}
                      {po.status === 'ordered' && 'รอส่งของ'}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-bold text-ink text-right">
                    ฿{Number(po.total_amount).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleOpenPayModal(po)}
                      className="btn-rausch text-xs py-1 px-3 cursor-pointer shadow-xs"
                    >
                      จ่ายเงินเจ้าหนี้
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pay Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-canvas border border-hairline rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-fadeIn">
            
            <div className="flex justify-between items-center pb-3 border-b border-hairline">
              <div>
                <h3 className="font-bold text-base text-ink">ออกใบสำคัญจ่าย (Payment Voucher)</h3>
                <p className="text-xs text-muted-text">PO: {selectedOrder.doc_no} • {selectedOrder.supplier_name}</p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-muted-text hover:text-ink text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleExecutePayment} className="space-y-4 text-xs">
              <div className="p-3 rounded-xl bg-surface-soft border border-hairline text-center">
                <span className="text-muted-text block">ยอดเงินตามใบสั่งซื้อ</span>
                <span className="text-2xl font-bold text-ink">
                  ฿{Number(selectedOrder.total_amount).toLocaleString()}
                </span>
              </div>

              <div>
                <label className="font-semibold text-muted-text block mb-1">ยอดเงินที่จ่าย *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={payAmount}
                  onChange={(e) => setPayAmount(Number(e.target.value))}
                  className="w-full bg-surface-soft border border-hairline rounded-xl p-2.5 text-ink font-bold text-sm"
                />
              </div>

              <div>
                <label className="font-semibold text-muted-text block mb-1">ช่องทางการชำระ *</label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value)}
                  className="w-full bg-surface-soft border border-hairline rounded-xl p-2.5 text-ink"
                >
                  <option value="transfer">โอนเงินผ่านธนาคาร (Bank Transfer)</option>
                  <option value="cheque">เช็คสั่งจ่าย (Cheque)</option>
                  <option value="cash">เงินสด (Cash)</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-muted-text block mb-1">หมายเหตุ / อ้างอิงเลขที่เช็คหรือสลิป</label>
                <input
                  type="text"
                  placeholder="เช่น เช็คธนาคารกรุงเทพ เลขที่ 123456"
                  value={payNote}
                  onChange={(e) => setPayNote(e.target.value)}
                  className="w-full bg-surface-soft border border-hairline rounded-xl p-2.5 text-ink"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-hairline">
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="btn-secondary text-xs py-2 px-4 cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-rausch text-xs py-2 px-6 cursor-pointer"
                >
                  {isSubmitting ? 'กำลังบันทึก...' : 'บันทึกใบสำคัญจ่าย'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
