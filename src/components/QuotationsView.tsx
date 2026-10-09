'use client';

import React, { useState } from 'react';
import { 
  Plus, 
  FileText, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  Send, 
  Printer, 
  Trash2,
  Calendar,
  Layers
} from 'lucide-react';

interface QuotationsViewProps {
  quotations: any[];
  customers: any[];
  products: any[];
  onRefresh: () => void;
  onViewInvoice: (invoice: any) => void;
}

export function QuotationsView({
  quotations,
  customers,
  products,
  onRefresh,
  onViewInvoice
}: QuotationsViewProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New quotation form
  const [customerId, setCustomerId] = useState<number>(customers[1]?.id || 1);
  const [validDays, setValidDays] = useState<number>(15);
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<any[]>([
    { product_id: products[0]?.id || 1, quantity: 50, discount: 0 }
  ]);

  const addItemRow = () => {
    setItems([...items, { product_id: products[0]?.id || 1, quantity: 10, discount: 0 }]);
  };

  const removeItemRow = (idx: number) => {
    setItems(items.filter((_, i) => i !== idx));
  };

  const updateItem = (idx: number, field: string, val: any) => {
    const next = [...items];
    next[idx][field] = val;
    setItems(next);
  };

  // Calculate quotation preview
  const calculatedItems = items.map(it => {
    const prod = products.find(p => p.id === Number(it.product_id)) || products[0];
    const qty = Number(it.quantity) || 1;
    const price = prod?.contractor_price || prod?.retail_price || 0;
    const disc = Number(it.discount) || 0;
    const total = (qty * price) - disc;
    return {
      product_id: prod?.id,
      product_name: prod?.name,
      unit_name: prod?.base_unit_name,
      quantity: qty,
      unit_price: price,
      discount: disc,
      total_price: total
    };
  });

  const subtotal = calculatedItems.reduce((sum, it) => sum + (it.quantity * it.unit_price), 0);
  const totalDiscount = calculatedItems.reduce((sum, it) => sum + it.discount, 0);
  const vatAmount = Math.round(((subtotal - totalDiscount) * 0.07) * 100) / 100;
  const totalAmount = (subtotal - totalDiscount) + vatAmount;

  const handleCreateQuotation = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/quotations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: customerId,
          valid_days: validDays,
          items: calculatedItems,
          subtotal,
          discount_amount: totalDiscount,
          vat_amount: vatAmount,
          total_amount: totalAmount,
          notes
        })
      });
      if (res.ok) {
        setShowAddModal(false);
        onRefresh();
      } else {
        const d = await res.json();
        alert(d.error || 'Failed to create quotation');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (id: number, status: string) => {
    try {
      const res = await fetch('/api/quotations', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status })
      });
      if (res.ok) onRefresh();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleConvertToInvoice = async (quoteId: number) => {
    if (!confirm('ยืนยันแปลงใบเสนอราคานี้เป็นบิลขาย (ตัดสต็อกและบันทึกหนี้สิน)?')) return;
    try {
      const res = await fetch('/api/quotations/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quotation_id: quoteId })
      });
      const data = await res.json();
      if (res.ok) {
        alert(`แปลงเป็นบิลขายสำเร็จ! เลขที่: ${data.converted_invoice.doc_no}`);
        onRefresh();
      } else {
        alert(data.error || 'Conversion failed');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-hairline">
        <div>
          <h1 className="text-2xl font-bold text-ink tracking-tight">ใบเสนอราคา & สั่งขาย (Quotations)</h1>
          <p className="text-xs text-muted-text mt-0.5">
            สร้างใบเสนอราคา กำหนดราคางานโครงการ และแปลงเป็นบิลขายอัตโนมัติในคลิกเดียว (FR-QUOTE-003)
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="btn-rausch text-xs py-2 px-3.5 flex items-center gap-2 cursor-pointer shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>สร้างใบเสนอราคาใหม่</span>
        </button>
      </div>

      {/* Quotations Table */}
      <div className="bg-white rounded-2xl border border-hairline overflow-hidden shadow-subtle">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-surface-soft border-b border-hairline text-muted-text">
                <th className="py-3 px-4 font-semibold">เลขที่เอกสาร</th>
                <th className="py-3 px-3 font-semibold">ลูกค้า</th>
                <th className="py-3 px-3 font-semibold">ใช้ได้ถึงวันที่</th>
                <th className="py-3 px-3 font-semibold">จำนวนรายการ</th>
                <th className="py-3 px-3 font-semibold text-right">ยอดรวมสุทธิ</th>
                <th className="py-3 px-3 font-semibold text-center">สถานะ</th>
                <th className="py-3 px-4 font-semibold text-right">การดำเนินการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {quotations.map(q => (
                <tr key={q.id} className="hover:bg-surface-soft/50 transition">
                  <td className="py-3 px-4 font-bold text-ink flex items-center gap-2">
                    <FileText className="w-4 h-4 text-muted-text" />
                    <span>{q.doc_no}</span>
                  </td>
                  <td className="py-3 px-3">
                    <div className="font-semibold text-ink">{q.customer_name}</div>
                    <div className="text-[10px] text-muted-text">{q.customer_phone || '-'}</div>
                  </td>
                  <td className="py-3 px-3 text-muted-text">
                    {q.valid_until}
                  </td>
                  <td className="py-3 px-3 text-muted-text">
                    {q.items?.length || 0} รายการ
                  </td>
                  <td className="py-3 px-3 font-bold text-ink text-right">
                    ฿{Number(q.total_amount).toLocaleString()}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full ${
                      q.status === 'converted' ? 'bg-emerald-100 text-emerald-800' :
                      q.status === 'accepted' ? 'bg-blue-100 text-blue-800' :
                      q.status === 'sent' ? 'bg-amber-100 text-amber-800' :
                      'bg-surface-strong text-muted-text'
                    }`}>
                      {q.status === 'draft' && 'ร่าง'}
                      {q.status === 'sent' && 'ส่งแล้ว'}
                      {q.status === 'accepted' && 'ลูกค้ายอมรับ'}
                      {q.status === 'converted' && 'แปลงเป็นบิลแล้ว'}
                      {q.status === 'rejected' && 'ปฏิเสธ'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {q.status === 'draft' && (
                        <button
                          onClick={() => handleUpdateStatus(q.id, 'sent')}
                          className="px-2 py-1 rounded bg-surface-soft hover:bg-surface-strong text-[11px] font-medium text-ink cursor-pointer"
                        >
                          ส่งให้ลูกค้า
                        </button>
                      )}
                      {q.status === 'sent' && (
                        <button
                          onClick={() => handleUpdateStatus(q.id, 'accepted')}
                          className="px-2 py-1 rounded bg-blue-50 hover:bg-blue-100 text-[11px] font-medium text-blue-800 cursor-pointer"
                        >
                          อนุมัติ
                        </button>
                      )}
                      {(q.status === 'accepted' || q.status === 'sent') && (
                        <button
                          onClick={() => handleConvertToInvoice(q.id)}
                          className="px-2.5 py-1 rounded bg-[#ff385c] hover:bg-[#e00b41] text-[11px] font-medium text-white cursor-pointer shadow-xs flex items-center gap-1"
                        >
                          <span>แปลงเป็นบิลขาย</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Quotation Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-canvas border border-hairline rounded-2xl max-w-3xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto space-y-5 animate-fadeIn">
            
            <div className="flex justify-between items-center pb-3 border-b border-hairline">
              <h3 className="font-bold text-base text-ink">สร้างใบเสนอราคาใหม่ (Quotation)</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-muted-text hover:text-ink text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateQuotation} className="space-y-4 text-xs">
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-muted-text block mb-1">เลือกลูกค้า (Customer) *</label>
                  <select
                    value={customerId}
                    onChange={(e) => setCustomerId(Number(e.target.value))}
                    className="w-full bg-surface-soft border border-hairline rounded-xl p-2 text-ink"
                  >
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.price_tier})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-muted-text block mb-1">ระยะเวลายืนราคา (วัน) *</label>
                  <input
                    type="number"
                    value={validDays}
                    onChange={(e) => setValidDays(Number(e.target.value))}
                    className="w-full bg-surface-soft border border-hairline rounded-xl p-2 text-ink"
                  />
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-ink">รายการสินค้าเสนอราคา</span>
                  <button
                    type="button"
                    onClick={addItemRow}
                    className="text-[#ff385c] font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>เพิ่มรายการ</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {items.map((it, idx) => (
                    <div key={idx} className="p-2.5 bg-surface-soft rounded-xl border border-hairline flex items-center gap-3">
                      <div className="flex-1">
                        <select
                          value={it.product_id}
                          onChange={(e) => updateItem(idx, 'product_id', Number(e.target.value))}
                          className="w-full bg-white border border-hairline rounded-lg p-1.5 text-xs text-ink"
                        >
                          {products.map(p => (
                            <option key={p.id} value={p.id}>
                              {p.sku} - {p.name} (฿{p.contractor_price || p.retail_price}/{p.base_unit_name})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="w-24">
                        <input
                          type="number"
                          placeholder="จำนวน"
                          value={it.quantity}
                          onChange={(e) => updateItem(idx, 'quantity', Number(e.target.value))}
                          className="w-full bg-white border border-hairline rounded-lg p-1.5 text-xs text-right font-medium"
                        />
                      </div>

                      <div className="w-24">
                        <input
                          type="number"
                          placeholder="ส่วนลด"
                          value={it.discount}
                          onChange={(e) => updateItem(idx, 'discount', Number(e.target.value))}
                          className="w-full bg-white border border-hairline rounded-lg p-1.5 text-xs text-right"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => removeItemRow(idx)}
                        disabled={items.length <= 1}
                        className="text-muted-text hover:text-red-600 p-1 cursor-pointer disabled:opacity-20"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals Summary */}
              <div className="p-3 bg-surface-soft rounded-xl border border-hairline space-y-1 text-right text-xs">
                <div className="flex justify-between text-muted-text">
                  <span>ยอดรวมก่อนภาษี:</span>
                  <span>฿{subtotal.toLocaleString()}</span>
                </div>
                {totalDiscount > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>ส่วนลด:</span>
                    <span>-฿{totalDiscount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-muted-text">
                  <span>ภาษีมูลค่าเพิ่ม 7%:</span>
                  <span>฿{vatAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold text-sm text-ink pt-1 border-t border-hairline">
                  <span>ยอดสุทธิทั้งสิ้น:</span>
                  <span className="text-[#ff385c]">฿{totalAmount.toLocaleString()}</span>
                </div>
              </div>

              <div>
                <label className="font-semibold text-muted-text block mb-1">เงื่อนไข / หมายเหตุ</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="เช่น ราคาพิเศษสำหรับงานโครงการ ชำระเงินภายใน 30 วัน..."
                  className="w-full bg-surface-soft border border-hairline rounded-xl p-2 text-ink"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-hairline">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn-secondary text-xs py-2 px-4 cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-rausch text-xs py-2 px-6 cursor-pointer"
                >
                  {isSubmitting ? 'กำลังบันทึก...' : 'บันทึกใบเสนอราคา'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
