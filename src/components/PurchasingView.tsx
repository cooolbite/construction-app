'use client';

import React, { useState } from 'react';
import { 
  Plus, 
  ShoppingCart, 
  PackageCheck, 
  CheckCircle2, 
  Clock, 
  Building, 
  Trash2, 
  FileText,
  Calendar,
  Layers,
  ArrowRight
} from 'lucide-react';

interface PurchasingViewProps {
  purchaseOrders: any[];
  suppliers: any[];
  products: any[];
  warehouses: any[];
  onRefresh: () => void;
}

export function PurchasingView({
  purchaseOrders,
  suppliers,
  products,
  warehouses,
  onRefresh
}: PurchasingViewProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [receivingPo, setReceivingPo] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New PO Form
  const [supplierId, setSupplierId] = useState<number>(suppliers[0]?.id || 1);
  const [expectedDate, setExpectedDate] = useState<string>(
    new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState('');
  const [poItems, setPoItems] = useState<any[]>([
    { product_id: products[0]?.id || 1, quantity: 100, unit_cost: products[0]?.cost_price || 120 }
  ]);

  // GRN Form
  const [grnWarehouseId, setGrnWarehouseId] = useState<number>(1); // Main Warehouse
  const [refInvoiceNo, setRefInvoiceNo] = useState('');
  const [receiveQuantities, setReceiveQuantities] = useState<Record<number, number>>({});

  const addItemRow = () => {
    setPoItems([...poItems, { product_id: products[0]?.id || 1, quantity: 50, unit_cost: products[0]?.cost_price || 120 }]);
  };

  const removeItemRow = (idx: number) => {
    setPoItems(poItems.filter((_, i) => i !== idx));
  };

  const updateItem = (idx: number, field: string, val: any) => {
    const next = [...poItems];
    next[idx][field] = val;
    if (field === 'product_id') {
      const prod = products.find(p => p.id === Number(val));
      if (prod) next[idx].unit_cost = prod.cost_price;
    }
    setPoItems(next);
  };

  const poSubtotal = poItems.reduce((sum, it) => sum + (Number(it.quantity) * Number(it.unit_cost)), 0);
  const poVat = Math.round((poSubtotal * 0.07) * 100) / 100;
  const poTotal = poSubtotal + poVat;

  const handleCreatePo = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/purchasing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplier_id: supplierId,
          expected_date: expectedDate,
          items: poItems.map(it => {
            const p = products.find(prod => prod.id === Number(it.product_id));
            return {
              product_id: it.product_id,
              unit_name: p?.base_unit_name || 'ชิ้น',
              quantity: Number(it.quantity),
              unit_cost: Number(it.unit_cost)
            };
          }),
          subtotal: poSubtotal,
          vat_amount: poVat,
          total_amount: poTotal,
          notes
        })
      });
      if (res.ok) {
        setShowAddModal(false);
        onRefresh();
      } else {
        const d = await res.json();
        alert(d.error || 'Failed to create PO');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenReceive = (po: any) => {
    setReceivingPo(po);
    const initialQtys: Record<number, number> = {};
    for (const item of po.items || []) {
      const remaining = Math.max(0, item.quantity - (item.received_quantity || 0));
      initialQtys[item.id] = remaining;
    }
    setReceiveQuantities(initialQtys);
    setRefInvoiceNo('');
  };

  const handleExecuteReceive = async () => {
    if (!receivingPo) return;
    setIsSubmitting(true);

    const receiveItems = (receivingPo.items || []).map((it: any) => ({
      po_item_id: it.id,
      product_id: it.product_id,
      uom_id: it.uom_id,
      receive_qty: Number(receiveQuantities[it.id]) || 0,
      unit_cost: it.unit_cost
    })).filter((it: any) => it.receive_qty > 0);

    if (receiveItems.length === 0) {
      alert('กรุณาระบุจำนวนสินค้าที่ตรวจรับอย่างน้อย 1 รายการ');
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await fetch('/api/purchasing/receive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          po_id: receivingPo.id,
          warehouse_id: grnWarehouseId,
          ref_invoice_no: refInvoiceNo,
          items: receiveItems
        })
      });
      const d = await res.json();
      if (res.ok) {
        alert(`รับสินค้าเข้าคลังสำเร็จ! เลขที่ใบรับ (GRN): ${d.grn.doc_no}`);
        setReceivingPo(null);
        onRefresh();
      } else {
        alert(d.error || 'Receive failed');
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
          <h1 className="text-2xl font-bold text-ink tracking-tight">จัดซื้อ & ตรวจรับสินค้า (Procurement & GRN)</h1>
          <p className="text-xs text-muted-text mt-0.5">
            ออกใบสั่งซื้อ (PO) ตรวจรับสินค้าเข้าคลัง (GRN) อัปเดตสต็อกการ์ด และคำนวณต้นทุนเฉลี่ยอัตโนมัติ
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="btn-rausch text-xs py-2 px-3.5 flex items-center gap-2 cursor-pointer shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>สร้างใบสั่งซื้อ (PO)</span>
        </button>
      </div>

      {/* Purchase Orders Table */}
      <div className="bg-white rounded-2xl border border-hairline overflow-hidden shadow-subtle">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-surface-soft border-b border-hairline text-muted-text">
                <th className="py-3 px-4 font-semibold">เลขที่ PO</th>
                <th className="py-3 px-3 font-semibold">ผู้จำหน่าย (Supplier)</th>
                <th className="py-3 px-3 font-semibold">กำหนดรับของ</th>
                <th className="py-3 px-3 font-semibold">รายการ & ตรวจรับแล้ว</th>
                <th className="py-3 px-3 font-semibold text-right">ยอดรวมสุทธิ</th>
                <th className="py-3 px-3 font-semibold text-center">สถานะ</th>
                <th className="py-3 px-4 font-semibold text-right">การรับของ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {purchaseOrders.map(po => {
                const totalOrdered = (po.items || []).reduce((s: number, i: any) => s + i.quantity, 0);
                const totalReceived = (po.items || []).reduce((s: number, i: any) => s + (i.received_quantity || 0), 0);
                return (
                  <tr key={po.id} className="hover:bg-surface-soft/50 transition">
                    <td className="py-3 px-4 font-bold text-ink flex items-center gap-2">
                      <ShoppingCart className="w-4 h-4 text-muted-text" />
                      <span>{po.doc_no}</span>
                    </td>

                    <td className="py-3 px-3">
                      <div className="font-semibold text-ink">{po.supplier_name}</div>
                      <div className="text-[10px] text-muted-text">{po.supplier_phone || '-'}</div>
                    </td>

                    <td className="py-3 px-3 text-muted-text">
                      {po.expected_date}
                    </td>

                    <td className="py-3 px-3">
                      <div className="font-medium text-ink">
                        {po.items?.length || 0} รายการ
                      </div>
                      <div className="text-[10px] text-muted-text">
                        รับแล้ว {totalReceived} / {totalOrdered} ชิ้น
                      </div>
                    </td>

                    <td className="py-3 px-3 font-bold text-ink text-right">
                      ฿{Number(po.total_amount).toLocaleString()}
                    </td>

                    <td className="py-3 px-3 text-center">
                      <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full ${
                        po.status === 'received' ? 'bg-emerald-100 text-emerald-800' :
                        po.status === 'partial' ? 'bg-amber-100 text-amber-800' :
                        po.status === 'ordered' ? 'bg-blue-100 text-blue-800' :
                        'bg-surface-strong text-muted-text'
                      }`}>
                        {po.status === 'received' && 'รับครบแล้ว'}
                        {po.status === 'partial' && 'รับบางส่วน'}
                        {po.status === 'ordered' && 'สั่งแล้ว-รอส่ง'}
                        {po.status === 'draft' && 'ร่าง'}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      {po.status !== 'received' ? (
                        <button
                          onClick={() => handleOpenReceive(po)}
                          className="px-2.5 py-1 rounded bg-[#ff385c] hover:bg-[#e00b41] text-[11px] font-medium text-white cursor-pointer shadow-xs flex items-center gap-1.5 ml-auto"
                        >
                          <PackageCheck className="w-3.5 h-3.5" />
                          <span>รับสินค้า (GRN)</span>
                        </button>
                      ) : (
                        <span className="text-[11px] text-emerald-700 font-medium flex items-center gap-1 justify-end">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>รับสมบูรณ์</span>
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create PO Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-canvas border border-hairline rounded-2xl max-w-3xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto space-y-5 animate-fadeIn">
            
            <div className="flex justify-between items-center pb-3 border-b border-hairline">
              <h3 className="font-bold text-base text-ink">สร้างใบสั่งซื้อสินค้า (Purchase Order)</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-muted-text hover:text-ink text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePo} className="space-y-4 text-xs">
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-muted-text block mb-1">ผู้จำหน่าย (Supplier) *</label>
                  <select
                    value={supplierId}
                    onChange={(e) => setSupplierId(Number(e.target.value))}
                    className="w-full bg-surface-soft border border-hairline rounded-xl p-2 text-ink"
                  >
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-muted-text block mb-1">วันที่คาดว่าจะได้รับ *</label>
                  <input
                    type="date"
                    value={expectedDate}
                    onChange={(e) => setExpectedDate(e.target.value)}
                    className="w-full bg-surface-soft border border-hairline rounded-xl p-2 text-ink"
                  />
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-ink">รายการวัสดุที่ต้องการสั่งซื้อ</span>
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
                  {poItems.map((it, idx) => (
                    <div key={idx} className="p-2.5 bg-surface-soft rounded-xl border border-hairline flex items-center gap-3">
                      <div className="flex-1">
                        <select
                          value={it.product_id}
                          onChange={(e) => updateItem(idx, 'product_id', Number(e.target.value))}
                          className="w-full bg-white border border-hairline rounded-lg p-1.5 text-xs text-ink"
                        >
                          {products.map(p => (
                            <option key={p.id} value={p.id}>
                              {p.sku} - {p.name} ({p.base_unit_name})
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

                      <div className="w-28">
                        <input
                          type="number"
                          placeholder="ราคาทุน/หน่วย"
                          value={it.unit_cost}
                          onChange={(e) => updateItem(idx, 'unit_cost', Number(e.target.value))}
                          className="w-full bg-white border border-hairline rounded-lg p-1.5 text-xs text-right"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => removeItemRow(idx)}
                        disabled={poItems.length <= 1}
                        className="text-muted-text hover:text-red-600 p-1 cursor-pointer disabled:opacity-20"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="p-3 bg-surface-soft rounded-xl border border-hairline space-y-1 text-right text-xs">
                <div className="flex justify-between text-muted-text">
                  <span>ยอดสั่งซื้อก่อนภาษี:</span>
                  <span>฿{poSubtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-muted-text">
                  <span>ภาษีมูลค่าเพิ่ม 7%:</span>
                  <span>฿{poVat.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold text-sm text-ink pt-1 border-t border-hairline">
                  <span>ยอดสุทธิทั้งสิ้น:</span>
                  <span className="text-[#ff385c]">฿{poTotal.toLocaleString()}</span>
                </div>
              </div>

              <div>
                <label className="font-semibold text-muted-text block mb-1">หมายเหตุ</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="เช่น สั่งของเข้าคลังหลัก ส่งช่วงบ่าย..."
                  className="w-full bg-surface-soft border border-hairline rounded-xl p-2 text-ink"
                />
              </div>

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
                  {isSubmitting ? 'กำลังบันทึก...' : 'ออกใบสั่งซื้อ (PO)'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* GRN Receive Modal */}
      {receivingPo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-canvas border border-hairline rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 animate-fadeIn">
            
            <div className="flex justify-between items-center pb-3 border-b border-hairline">
              <div>
                <h3 className="font-bold text-base text-ink">ตรวจรับสินค้าเข้าคลัง (Goods Receipt Note)</h3>
                <p className="text-xs text-muted-text">อ้างอิงใบสั่งซื้อ: {receivingPo.doc_no} • ผู้จำหน่าย: {receivingPo.supplier_name}</p>
              </div>
              <button
                onClick={() => setReceivingPo(null)}
                className="text-muted-text hover:text-ink text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <label className="font-semibold text-muted-text block mb-1">รับเข้าคลังสินค้า *</label>
                <select
                  value={grnWarehouseId}
                  onChange={(e) => setGrnWarehouseId(Number(e.target.value))}
                  className="w-full bg-surface-soft border border-hairline rounded-xl p-2 text-ink"
                >
                  {warehouses.map(w => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-muted-text block mb-1">เลขที่ใบส่งของจากผู้จำหน่าย</label>
                <input
                  type="text"
                  placeholder="เช่น INV-SCG-998811"
                  value={refInvoiceNo}
                  onChange={(e) => setRefInvoiceNo(e.target.value)}
                  className="w-full bg-surface-soft border border-hairline rounded-xl p-2 text-ink"
                />
              </div>
            </div>

            {/* Item receiving table */}
            <div className="border border-hairline rounded-xl overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-surface-soft border-b border-hairline text-muted-text">
                  <tr>
                    <th className="p-2.5">สินค้า</th>
                    <th className="p-2.5 text-center">สั่งซื้อ</th>
                    <th className="p-2.5 text-center">รับแล้ว</th>
                    <th className="p-2.5 text-right w-28">รับเข้าครั้งนี้</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline">
                  {(receivingPo.items || []).map((it: any) => {
                    const remaining = Math.max(0, it.quantity - (it.received_quantity || 0));
                    return (
                      <tr key={it.id}>
                        <td className="p-2.5">
                          <div className="font-semibold text-ink">{it.product_name || it.sku}</div>
                          <div className="text-[10px] text-muted-text">หน่วย: {it.unit_name}</div>
                        </td>
                        <td className="p-2.5 text-center text-muted-text">{it.quantity}</td>
                        <td className="p-2.5 text-center font-semibold text-emerald-700">{it.received_quantity || 0}</td>
                        <td className="p-2.5 text-right">
                          <input
                            type="number"
                            min="0"
                            max={remaining}
                            value={receiveQuantities[it.id] || 0}
                            onChange={(e) => setReceiveQuantities({
                              ...receiveQuantities,
                              [it.id]: Number(e.target.value) || 0
                            })}
                            className="w-20 text-right bg-white border border-hairline rounded-lg p-1.5 font-bold text-ink"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-800 space-y-1">
              <div className="font-bold">ระบบจะทำการโดยอัตโนมัติ:</div>
              <div>• เพิ่มยอดคงเหลือในคลังที่ระบุทันที</div>
              <div>• สร้างรายการสต็อกการ์ด (Stock Card IN) สำหรับตรวจสอบย้อนหลัง</div>
              <div>• คำนวณต้นทุนสินค้าถัวเฉลี่ยเคลื่อนที่ (Moving Average Cost) ใหม่อัตโนมัติ</div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-hairline">
              <button
                type="button"
                onClick={() => setReceivingPo(null)}
                className="btn-secondary text-xs py-2 px-4 cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleExecuteReceive}
                disabled={isSubmitting}
                className="btn-rausch text-xs py-2 px-6 cursor-pointer"
              >
                {isSubmitting ? 'กำลังบันทึก...' : 'ยืนยันรับเข้าคลัง'}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
