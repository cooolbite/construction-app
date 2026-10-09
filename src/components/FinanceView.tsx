'use client';

import React, { useState, useEffect } from 'react';
import { 
  Wallet, 
  DollarSign, 
  TrendingDown, 
  Clock, 
  Plus, 
  CheckCircle2, 
  AlertCircle,
  FileText
} from 'lucide-react';

interface FinanceViewProps {
  activeShift: any;
  onOpenShiftModal: () => void;
  onRefresh: () => void;
}

export function FinanceView({
  activeShift,
  onOpenShiftModal,
  onRefresh
}: FinanceViewProps) {
  const [data, setData] = useState<any>({ expenses: [], summary_by_category: [], total_today: 0 });
  const [loading, setLoading] = useState(true);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [expCategory, setExpCategory] = useState('ค่าน้ำมันรถส่งของ');
  const [expAmount, setExpAmount] = useState<number>(500);
  const [expMethod, setExpMethod] = useState('cash');
  const [expNote, setExpNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchFinance();
  }, []);

  const fetchFinance = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/finance');
      const d = await res.json();
      setData(d);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/finance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: expCategory,
          amount: expAmount,
          payment_method: expMethod,
          note: expNote
        })
      });
      if (res.ok) {
        setShowAddExpense(false);
        fetchFinance();
        onRefresh();
      } else {
        const d = await res.json();
        alert(d.error || 'Failed to record expense');
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
          <h1 className="text-2xl font-bold text-ink tracking-tight">การเงิน & กะขาย (Finance & Petty Cash)</h1>
          <p className="text-xs text-muted-text mt-0.5">
            กระทบยอดเงินสดในลิ้นชัก เปิด/ปิดกะขาย และบันทึกค่าใช้จ่ายรายวัน (FR-FIN-001 - 005)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddExpense(true)}
            className="btn-secondary text-xs py-2 px-3.5 flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>บันทึกค่าใช้จ่าย</span>
          </button>

          <button
            onClick={onOpenShiftModal}
            className="btn-rausch text-xs py-2 px-3.5 flex items-center gap-2 cursor-pointer shadow-sm"
          >
            <Clock className="w-4 h-4" />
            <span>จัดการกะขาย</span>
          </button>
        </div>
      </div>

      {/* Shift Drawer Status Card */}
      <div className="card-airbnb p-6 bg-white border border-hairline shadow-subtle">
        <div className="flex items-center justify-between pb-3 border-b border-hairline mb-4">
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-[#ff385c]" />
            <h3 className="font-bold text-sm text-ink">สถานะลิ้นชักเงินสดประจำกะ (Current Shift Drawer)</h3>
          </div>
          <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
            activeShift ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
          }`}>
            {activeShift ? `กะเปิดอยู่ (#${activeShift.id}) โดย ${activeShift.user_name || 'แคชเชียร์'}` : 'ยังไม่มีกะเปิด'}
          </span>
        </div>

        {activeShift ? (
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
            <div className="p-3 rounded-xl bg-surface-soft border border-hairline">
              <span className="text-muted-text block">เงินทอนเริ่มต้น</span>
              <span className="text-xl font-bold text-ink mt-1 block">
                ฿{Number(activeShift.opening_cash || 0).toLocaleString()}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-surface-soft border border-hairline">
              <span className="text-muted-text block">ยอดขายเงินสดในกะ</span>
              <span className="text-xl font-bold text-emerald-700 mt-1 block">
                +฿{Number(activeShift.cash_sales || 0).toLocaleString()}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-surface-soft border border-hairline">
              <span className="text-muted-text block">จ่ายเบิกเงินสดออก</span>
              <span className="text-xl font-bold text-red-600 mt-1 block">
                -฿{Number(activeShift.expenses || 0).toLocaleString()}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-red-50/50 border border-red-200">
              <span className="text-[#ff385c] font-semibold block">เงินสดที่ควรมีในลิ้นชัก</span>
              <span className="text-xl font-extrabold text-[#ff385c] mt-1 block">
                ฿{Number(activeShift.expected_cash || 0).toLocaleString()}
              </span>
            </div>
          </div>
        ) : (
          <div className="text-center py-6 text-xs text-muted-text">
            กะขายปิดอยู่ กรุณากดปุ่ม "จัดการกะขาย" เพื่อเปิดกะและบันทึกเงินทอนเริ่มต้น
          </div>
        )}
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-2xl border border-hairline overflow-hidden shadow-subtle">
        <div className="p-4 border-b border-hairline flex items-center justify-between">
          <div className="font-semibold text-sm text-ink flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-red-600" />
            <span>ประวัติค่าใช้จ่ายรายวัน (Petty Cash Expenses)</span>
          </div>
          <span className="text-xs text-muted-text">รวมวันนี้: ฿{Number(data.total_today || 0).toLocaleString()}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-surface-soft border-b border-hairline text-muted-text">
                <th className="py-3 px-4 font-semibold">เลขที่เอกสาร</th>
                <th className="py-3 px-3 font-semibold">หมวดหมู่ค่าใช้จ่าย</th>
                <th className="py-3 px-3 font-semibold">วัน-เวลา</th>
                <th className="py-3 px-3 font-semibold">ช่องทางจ่าย</th>
                <th className="py-3 px-3 font-semibold">รายละเอียด / หมายเหตุ</th>
                <th className="py-3 px-3 font-semibold">ผู้บันทึก</th>
                <th className="py-3 px-4 font-semibold text-right">จำนวนเงิน</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {(data.expenses || []).map((exp: any) => (
                <tr key={exp.id} className="hover:bg-surface-soft/50 transition">
                  <td className="py-3 px-4 font-mono font-medium text-ink">
                    {exp.doc_no}
                  </td>
                  <td className="py-3 px-3 font-semibold text-ink">
                    {exp.category}
                  </td>
                  <td className="py-3 px-3 text-muted-text">
                    {exp.created_at}
                  </td>
                  <td className="py-3 px-3">
                    <span className="capitalize px-2 py-0.5 rounded bg-surface-strong text-[11px] text-ink">
                      {exp.payment_method === 'cash' ? 'เงินสด' : 'โอนเงิน'}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-muted-text">
                    {exp.note || '-'}
                  </td>
                  <td className="py-3 px-3 text-muted-text">
                    {exp.user_name}
                  </td>
                  <td className="py-3 px-4 font-bold text-red-600 text-right">
                    -฿{Number(exp.amount).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Expense Modal */}
      {showAddExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-canvas border border-hairline rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-fadeIn">
            
            <div className="flex justify-between items-center pb-3 border-b border-hairline">
              <h3 className="font-bold text-base text-ink">บันทึกค่าใช้จ่าย / สุมเงินสดย่อย</h3>
              <button
                onClick={() => setShowAddExpense(false)}
                className="text-muted-text hover:text-ink text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateExpense} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-muted-text block mb-1">หมวดหมู่ค่าใช้จ่าย *</label>
                <select
                  value={expCategory}
                  onChange={(e) => setExpCategory(e.target.value)}
                  className="w-full bg-surface-soft border border-hairline rounded-xl p-2.5 text-ink"
                >
                  <option value="ค่าน้ำมันรถส่งของ">ค่าน้ำมันรถส่งของ</option>
                  <option value="ค่าอาหารและเครื่องดื่มพนักงาน">ค่าอาหารและเครื่องดื่มพนักงาน</option>
                  <option value="ค่าอุปกรณ์และเครื่องใช้สำนักงาน">ค่าอุปกรณ์และเครื่องใช้สำนักงาน</option>
                  <option value="ค่าซ่อมแซมและบำรุงรักษา">ค่าซ่อมแซมและบำรุงรักษา</option>
                  <option value="ค่าสาธารณูปโภค">ค่าสาธารณูปโภค (น้ำ, ไฟ, ขยะ)</option>
                  <option value="ค่าใช้จ่ายเบ็ดเตล็ด">ค่าใช้จ่ายเบ็ดเตล็ด</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-muted-text block mb-1">จำนวนเงิน (บาท) *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={expAmount}
                  onChange={(e) => setExpAmount(Number(e.target.value))}
                  className="w-full bg-surface-soft border border-hairline rounded-xl p-2.5 text-ink font-bold text-sm"
                />
              </div>

              <div>
                <label className="font-semibold text-muted-text block mb-1">จ่ายจาก *</label>
                <select
                  value={expMethod}
                  onChange={(e) => setExpMethod(e.target.value)}
                  className="w-full bg-surface-soft border border-hairline rounded-xl p-2.5 text-ink"
                >
                  <option value="cash">เงินสดจากลิ้นชัก (หักยอดเงินในกะ)</option>
                  <option value="transfer">โอนเงินจากบัญชีธนาคาร</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-muted-text block mb-1">บันทึกรายละเอียด / เลขที่ใบเสร็จ</label>
                <input
                  type="text"
                  placeholder="เช่น เติมดีเซล ป้ายทะเบียน 83-5599 บิล ปตท."
                  value={expNote}
                  onChange={(e) => setExpNote(e.target.value)}
                  className="w-full bg-surface-soft border border-hairline rounded-xl p-2.5 text-ink"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-hairline">
                <button
                  type="button"
                  onClick={() => setShowAddExpense(false)}
                  className="btn-secondary text-xs py-2 px-4 cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-rausch text-xs py-2 px-6 cursor-pointer"
                >
                  {isSubmitting ? 'กำลังบันทึก...' : 'บันทึกรายการ'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
