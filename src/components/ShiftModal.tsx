'use client';

import React, { useState } from 'react';
import { Clock, CheckCircle2, AlertTriangle, ArrowRight, X } from 'lucide-react';

interface ShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeShift: any;
  onRefresh: () => void;
}

export function ShiftModal({
  isOpen,
  onClose,
  activeShift,
  onRefresh
}: ShiftModalProps) {
  const [openingCash, setOpeningCash] = useState<number>(5000);
  const [closingCash, setClosingCash] = useState<number>(activeShift?.expected_cash || 0);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [diffSummary, setDiffSummary] = useState<any>(null);

  if (!isOpen) return null;

  const handleOpenShift = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/pos/shift', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'open',
          user_id: 2,
          opening_cash: openingCash,
          notes
        })
      });
      if (res.ok) {
        onRefresh();
        onClose();
      } else {
        const d = await res.json();
        alert(d.error || 'Failed to open shift');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseShift = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/pos/shift', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'close',
          closing_cash: closingCash,
          notes
        })
      });
      const d = await res.json();
      if (res.ok) {
        setDiffSummary(d.summary);
        onRefresh();
      } else {
        alert(d.error || 'Failed to close shift');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-canvas border border-hairline rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-fadeIn">
        
        <div className="flex justify-between items-center pb-3 border-b border-hairline">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-[#ff385c]" />
            <h3 className="font-bold text-base text-ink">
              {activeShift ? 'สรุปและปิดกะขาย (Close Shift)' : 'เปิดกะขายใหม่ (Open Shift)'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-muted-text hover:text-ink text-sm cursor-pointer"
          >
            ✕
          </button>
        </div>

        {diffSummary ? (
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-center space-y-1">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
              <h4 className="font-bold text-sm text-emerald-900">ปิดกะการขายสำเร็จ</h4>
              <p className="text-emerald-700">บันทึกประวัติการปิดกะและกระทบยอดเงินสดเรียบร้อยแล้ว</p>
            </div>

            <div className="p-3 bg-surface-soft rounded-xl border border-hairline space-y-1.5">
              <div className="flex justify-between">
                <span className="text-muted-text">เงินทอนเริ่มต้น:</span>
                <span className="font-semibold">฿{diffSummary.opening_cash?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-text">ยอดขายเงินสด:</span>
                <span className="font-semibold text-emerald-700">+฿{diffSummary.cash_sales?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-text">เบิกเงินสดออก:</span>
                <span className="font-semibold text-red-600">-฿{diffSummary.expenses?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-bold border-t border-hairline pt-1">
                <span>เงินสดที่ควรมี:</span>
                <span>฿{diffSummary.expected_cash?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>นับได้จริง:</span>
                <span>฿{diffSummary.closing_cash?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-bold pt-1 border-t border-hairline">
                <span>ส่วนต่าง (Diff):</span>
                <span className={diffSummary.diff === 0 ? 'text-emerald-700' : diffSummary.diff > 0 ? 'text-blue-700' : 'text-red-600'}>
                  {diffSummary.diff === 0 ? 'พอดี (0 บาท)' : `${diffSummary.diff > 0 ? 'เกิน' : 'ขาด'} ฿${Math.abs(diffSummary.diff).toLocaleString()}`}
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                setDiffSummary(null);
                onClose();
              }}
              className="w-full btn-rausch text-xs py-2.5 cursor-pointer"
            >
              เสร็จสิ้น
            </button>
          </div>
        ) : !activeShift ? (
          /* Form Open Shift */
          <form onSubmit={handleOpenShift} className="space-y-4 text-xs">
            <div>
              <label className="font-semibold text-muted-text block mb-1">
                เงินทอนเริ่มต้นในลิ้นชัก (บาท) *
              </label>
              <input
                type="number"
                min="0"
                required
                value={openingCash}
                onChange={(e) => setOpeningCash(Number(e.target.value))}
                className="w-full bg-surface-soft border border-hairline rounded-xl p-2.5 text-ink font-bold text-base"
              />
            </div>

            <div>
              <label className="font-semibold text-muted-text block mb-1">
                บันทึกหมายเหตุ (ถ้ามี)
              </label>
              <input
                type="text"
                placeholder="เช่น กะเช้า แคชเชียร์วิภา..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-surface-soft border border-hairline rounded-xl p-2.5 text-ink"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-hairline">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary text-xs py-2 px-4 cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-rausch text-xs py-2 px-6 cursor-pointer"
              >
                {isSubmitting ? 'กำลังบันทึก...' : 'เปิดกะขาย'}
              </button>
            </div>
          </form>
        ) : (
          /* Form Close Shift */
          <form onSubmit={handleCloseShift} className="space-y-4 text-xs">
            <div className="p-3 bg-surface-soft rounded-xl border border-hairline space-y-1">
              <div className="flex justify-between text-muted-text">
                <span>เงินทอนเริ่มต้น:</span>
                <span>฿{Number(activeShift.opening_cash || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-emerald-700">
                <span>ยอดขายเงินสด:</span>
                <span>+฿{Number(activeShift.cash_sales || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-red-600">
                <span>จ่ายเงินสดย่อย:</span>
                <span>-฿{Number(activeShift.expenses || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-bold text-ink border-t border-hairline pt-1 text-sm">
                <span>เงินสดที่ควรมี:</span>
                <span>฿{Number(activeShift.expected_cash || 0).toLocaleString()}</span>
              </div>
            </div>

            <div>
              <label className="font-semibold text-muted-text block mb-1">
                ยอดเงินสดที่นับได้จริงในลิ้นชัก (บาท) *
              </label>
              <input
                type="number"
                min="0"
                required
                value={closingCash}
                onChange={(e) => setClosingCash(Number(e.target.value))}
                className="w-full bg-surface-soft border border-hairline rounded-xl p-2.5 text-ink font-bold text-base"
              />
            </div>

            <div>
              <label className="font-semibold text-muted-text block mb-1">
                หมายเหตุการปิดกะ
              </label>
              <input
                type="text"
                placeholder="เช่น เงินครบถ้วน ส่งมอบกะบ่าย..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-surface-soft border border-hairline rounded-xl p-2.5 text-ink"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-hairline">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary text-xs py-2 px-4 cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-rausch text-xs py-2 px-6 cursor-pointer"
              >
                {isSubmitting ? 'กำลังบันทึก...' : 'ยืนยันปิดกะ'}
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}
