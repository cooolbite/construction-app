'use client';

import React, { useState, useEffect } from 'react';
import { 
  Warehouse as WarehouseIcon, 
  Layers, 
  ArrowRightLeft, 
  SlidersHorizontal, 
  ClipboardCheck, 
  History, 
  Search, 
  Plus, 
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  RotateCcw
} from 'lucide-react';

interface WarehouseViewProps {
  products: any[];
  warehouses: any[];
  onRefresh: () => void;
}

export function WarehouseView({
  products,
  warehouses,
  onRefresh
}: WarehouseViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<'balance' | 'cards' | 'transfer' | 'adjust'>('balance');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Stock Card Movements state
  const [stockCards, setStockCards] = useState<any[]>([]);
  const [loadingCards, setLoadingCards] = useState(false);
  const [selectedProdForCard, setSelectedProdForCard] = useState<string>('');

  // Transfer Form state
  const [transferProdId, setTransferProdId] = useState<number>(products[0]?.id || 1);
  const [fromWhId, setFromWhId] = useState<number>(1); // Main
  const [toWhId, setToWhId] = useState<number>(2); // Storefront
  const [transferQty, setTransferQty] = useState<number>(20);
  const [transferNotes, setTransferNotes] = useState('');

  // Adjust Form state
  const [adjustProdId, setAdjustProdId] = useState<number>(products[0]?.id || 1);
  const [adjustWhId, setAdjustWhId] = useState<number>(2);
  const [newAdjustQty, setNewAdjustQty] = useState<number>(50);
  const [adjustReason, setAdjustReason] = useState('สินค้าชำรุดจากการขนย้าย');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load Stock Cards when switching to 'cards'
  useEffect(() => {
    if (activeSubTab === 'cards') {
      fetchStockCards();
    }
  }, [activeSubTab, selectedProdForCard]);

  const fetchStockCards = async () => {
    setLoadingCards(true);
    try {
      let url = '/api/inventory?view=cards';
      if (selectedProdForCard) url += `&product_id=${selectedProdForCard}`;
      const res = await fetch(url);
      const data = await res.json();
      setStockCards(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingCards(false);
    }
  };

  const handleExecuteTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (fromWhId === toWhId) {
      alert('คลังต้นทางและปลายทางต้องไม่เหมือนกัน');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'transfer',
          product_id: transferProdId,
          from_warehouse_id: fromWhId,
          to_warehouse_id: toWhId,
          quantity: transferQty,
          notes: transferNotes
        })
      });
      const data = await res.json();
      if (res.ok) {
        alert('โอนย้ายสินค้าระหว่างคลังเรียบร้อยแล้ว!');
        onRefresh();
        setActiveSubTab('balance');
      } else {
        alert(data.error || 'Transfer failed');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExecuteAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'adjust',
          product_id: adjustProdId,
          warehouse_id: adjustWhId,
          new_quantity: newAdjustQty,
          reason: adjustReason
        })
      });
      if (res.ok) {
        alert('ปรับปรุงยอดสต็อกเรียบร้อยแล้ว!');
        onRefresh();
        setActiveSubTab('balance');
      } else {
        const d = await res.json();
        alert(d.error || 'Adjustment failed');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredProducts = products.filter(p => {
    const q = searchTerm.toLowerCase();
    return !q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-hairline">
        <div>
          <h1 className="text-2xl font-bold text-ink tracking-tight">คลังสินค้า & สต็อกการ์ด (Warehouse & Inventory)</h1>
          <p className="text-xs text-muted-text mt-0.5">
            ยอดคงเหลือแยกตามคลัง ประวัติการเคลื่อนไหว Stock Card โอนย้ายคลัง และปรับปรุงยอดสินค้า
          </p>
        </div>

        {/* Sub-tabs pills */}
        <div className="flex bg-surface-soft p-1 rounded-xl border border-hairline text-xs font-medium">
          <button
            onClick={() => setActiveSubTab('balance')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              activeSubTab === 'balance' ? 'bg-white text-ink font-semibold shadow-xs' : 'text-muted-text hover:text-ink'
            }`}
          >
            ยอดคงเหลือแยกคลัง
          </button>
          <button
            onClick={() => setActiveSubTab('cards')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              activeSubTab === 'cards' ? 'bg-white text-ink font-semibold shadow-xs' : 'text-muted-text hover:text-ink'
            }`}
          >
            สต็อกการ์ด (Movement)
          </button>
          <button
            onClick={() => setActiveSubTab('transfer')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              activeSubTab === 'transfer' ? 'bg-white text-ink font-semibold shadow-xs' : 'text-muted-text hover:text-ink'
            }`}
          >
            โอนย้ายคลัง
          </button>
          <button
            onClick={() => setActiveSubTab('adjust')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              activeSubTab === 'adjust' ? 'bg-white text-ink font-semibold shadow-xs' : 'text-muted-text hover:text-ink'
            }`}
          >
            ปรับปรุงยอด
          </button>
        </div>
      </div>

      {/* Subtab 1: Inventory Balance by Warehouse */}
      {activeSubTab === 'balance' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted-text" />
              <input
                type="text"
                placeholder="ค้นหาสินค้าในคลัง..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-hairline rounded-xl text-xs text-ink focus:outline-none"
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-hairline overflow-hidden shadow-subtle">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-surface-soft border-b border-hairline text-muted-text">
                  <th className="py-3 px-4 font-semibold">สินค้า / SKU</th>
                  <th className="py-3 px-3 font-semibold text-center">หน่วยหลัก</th>
                  <th className="py-3 px-3 font-semibold text-right">ยอดรวมทุกคลัง</th>
                  {warehouses.map(w => (
                    <th key={w.id} className="py-3 px-3 font-semibold text-right">
                      {w.name}
                    </th>
                  ))}
                  <th className="py-3 px-4 font-semibold text-center">สถานะ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline">
                {filteredProducts.map(p => {
                  return (
                    <tr key={p.id} className="hover:bg-surface-soft/50 transition">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-xs text-ink">{p.name}</div>
                        <div className="text-[10px] text-muted-text font-mono">SKU: {p.sku}</div>
                      </td>
                      <td className="py-3 px-3 text-center text-muted-text">
                        {p.base_unit_name}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-ink">
                        {p.total_stock} {p.base_unit_name}
                      </td>

                      {/* Warehouse balances */}
                      {warehouses.map(w => {
                        const whStock = p.warehouse_stocks?.find((ws: any) => ws.warehouse_id === w.id);
                        const qty = whStock ? whStock.quantity : 0;
                        return (
                          <td key={w.id} className="py-3 px-3 text-right font-medium text-muted-text">
                            <span className={qty > 0 ? 'text-ink font-semibold' : 'text-muted-text/50'}>
                              {qty}
                            </span>
                          </td>
                        );
                      })}

                      <td className="py-3 px-4 text-center">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          p.total_stock <= 0 ? 'bg-red-100 text-red-800' :
                          p.total_stock <= p.reorder_point ? 'bg-amber-100 text-amber-800' :
                          'bg-emerald-100 text-emerald-800'
                        }`}>
                          {p.total_stock <= 0 ? 'สินค้าหมด' :
                           p.total_stock <= p.reorder_point ? 'ใกล้หมด' : 'ปกติ'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Subtab 2: Stock Card Audit Trail */}
      {activeSubTab === 'cards' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <select
              value={selectedProdForCard}
              onChange={(e) => setSelectedProdForCard(e.target.value)}
              className="bg-white border border-hairline rounded-xl px-3 py-2 text-xs text-ink focus:outline-none"
            >
              <option value="">ทุกสินค้า (รายการล่าสุด 100 รายการ)</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.sku} - {p.name}</option>
              ))}
            </select>

            <button
              onClick={fetchStockCards}
              className="p-2 border border-hairline rounded-xl bg-white hover:bg-surface-soft text-muted-text hover:text-ink cursor-pointer"
              title="รีเฟรชข้อมูล"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-hairline overflow-hidden shadow-subtle">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-surface-soft border-b border-hairline text-muted-text">
                  <th className="py-3 px-4 font-semibold">วัน-เวลา</th>
                  <th className="py-3 px-3 font-semibold">สินค้า</th>
                  <th className="py-3 px-3 font-semibold">คลัง</th>
                  <th className="py-3 px-3 font-semibold">ประเภท</th>
                  <th className="py-3 px-3 font-semibold">เลขที่เอกสาร</th>
                  <th className="py-3 px-3 font-semibold text-right">จำนวน</th>
                  <th className="py-3 px-3 font-semibold text-right">คงเหลือหลังทำ</th>
                  <th className="py-3 px-3 font-semibold">หมายเหตุ</th>
                  <th className="py-3 px-4 font-semibold">ผู้ทำรายการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline">
                {stockCards.map(sc => (
                  <tr key={sc.id} className="hover:bg-surface-soft/50 transition">
                    <td className="py-3 px-4 text-muted-text whitespace-nowrap">
                      {sc.created_at}
                    </td>
                    <td className="py-3 px-3 font-semibold text-ink">
                      {sc.product_name}
                      <span className="text-[10px] text-muted-text block font-mono">{sc.sku}</span>
                    </td>
                    <td className="py-3 px-3 text-muted-text">
                      {sc.warehouse_name}
                    </td>
                    <td className="py-3 px-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        sc.movement_type === 'IN' ? 'bg-emerald-100 text-emerald-800' :
                        sc.movement_type === 'OUT' ? 'bg-red-100 text-red-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {sc.movement_type === 'IN' && '+ รับเข้า'}
                        {sc.movement_type === 'OUT' && '- จ่ายออก'}
                        {sc.movement_type === 'ADJ' && '± ปรับปรุง'}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono font-medium text-ink">
                      {sc.doc_no}
                    </td>
                    <td className="py-3 px-3 text-right font-bold">
                      <span className={sc.movement_type === 'IN' ? 'text-emerald-700' : sc.movement_type === 'OUT' ? 'text-red-600' : 'text-blue-700'}>
                        {sc.movement_type === 'OUT' ? `-${sc.quantity}` : `+${sc.quantity}`}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-ink">
                      {sc.balance_after}
                    </td>
                    <td className="py-3 px-3 text-muted-text text-[11px] max-w-xs truncate">
                      {sc.note}
                    </td>
                    <td className="py-3 px-4 text-muted-text font-medium">
                      {sc.created_by}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Subtab 3: Inter-Warehouse Transfer */}
      {activeSubTab === 'transfer' && (
        <div className="max-w-xl mx-auto bg-white rounded-2xl border border-hairline p-6 shadow-subtle space-y-4">
          <div className="border-b border-hairline pb-3">
            <h3 className="font-bold text-base text-ink flex items-center gap-2">
              <ArrowRightLeft className="w-4 h-4 text-[#ff385c]" />
              <span>โอนย้ายสินค้าระหว่างคลัง (Inter-warehouse Transfer)</span>
            </h3>
            <p className="text-xs text-muted-text mt-0.5">
              ย้ายสินค้าจากคลังสินค้าหลักไปยังหน้าร้าน หรือลานเก็บวัสดุ โดยระบบจะสร้างสต็อกการ์ดทั้งสองฝั่งอัตโนมัติ
            </p>
          </div>

          <form onSubmit={handleExecuteTransfer} className="space-y-4 text-xs">
            <div>
              <label className="font-semibold text-muted-text block mb-1">เลือกสินค้าที่จะโอนย้าย *</label>
              <select
                value={transferProdId}
                onChange={(e) => setTransferProdId(Number(e.target.value))}
                className="w-full bg-surface-soft border border-hairline rounded-xl p-2.5 text-ink text-xs"
              >
                {products.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.sku} - {p.name} (คงเหลือรวม: {p.total_stock} {p.base_unit_name})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="font-semibold text-muted-text block mb-1">จากคลังต้นทาง (From) *</label>
                <select
                  value={fromWhId}
                  onChange={(e) => setFromWhId(Number(e.target.value))}
                  className="w-full bg-surface-soft border border-hairline rounded-xl p-2 text-ink text-xs"
                >
                  {warehouses.map(w => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-muted-text block mb-1">ไปยังคลังปลายทาง (To) *</label>
                <select
                  value={toWhId}
                  onChange={(e) => setToWhId(Number(e.target.value))}
                  className="w-full bg-surface-soft border border-hairline rounded-xl p-2 text-ink text-xs"
                >
                  {warehouses.map(w => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="font-semibold text-muted-text block mb-1">จำนวนที่ต้องการโอน *</label>
              <input
                type="number"
                min="1"
                required
                value={transferQty}
                onChange={(e) => setTransferQty(Number(e.target.value))}
                className="w-full bg-surface-soft border border-hairline rounded-xl p-2 text-ink text-xs font-bold"
              />
            </div>

            <div>
              <label className="font-semibold text-muted-text block mb-1">บันทึกเหตุผล / หมายเหตุ</label>
              <input
                type="text"
                placeholder="เช่น เติมสต็อกเชลฟ์หน้าร้านสำหรับขายประจำวัน..."
                value={transferNotes}
                onChange={(e) => setTransferNotes(e.target.value)}
                className="w-full bg-surface-soft border border-hairline rounded-xl p-2 text-ink text-xs"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full btn-rausch text-xs py-2.5 cursor-pointer font-semibold shadow-sm"
            >
              {isSubmitting ? 'กำลังโอนย้าย...' : 'ยืนยันโอนย้ายสินค้า'}
            </button>
          </form>
        </div>
      )}

      {/* Subtab 4: Stock Adjustment */}
      {activeSubTab === 'adjust' && (
        <div className="max-w-xl mx-auto bg-white rounded-2xl border border-hairline p-6 shadow-subtle space-y-4">
          <div className="border-b border-hairline pb-3">
            <h3 className="font-bold text-base text-ink flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-[#ff385c]" />
              <span>ปรับปรุงยอดสต็อก (Stock Adjustment)</span>
            </h3>
            <p className="text-xs text-muted-text mt-0.5">
              ปรับปรุงยอดคงเหลือจริง พร้อมระบุเหตุผลและบันทึกประวัติความปลอดภัย Audit Log (FR-STK-004)
            </p>
          </div>

          <form onSubmit={handleExecuteAdjust} className="space-y-4 text-xs">
            <div>
              <label className="font-semibold text-muted-text block mb-1">เลือกสินค้าที่จะปรับยอด *</label>
              <select
                value={adjustProdId}
                onChange={(e) => setAdjustProdId(Number(e.target.value))}
                className="w-full bg-surface-soft border border-hairline rounded-xl p-2.5 text-ink text-xs"
              >
                {products.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.sku} - {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-semibold text-muted-text block mb-1">เลือกคลังสินค้าที่ต้องการปรับ *</label>
              <select
                value={adjustWhId}
                onChange={(e) => setAdjustWhId(Number(e.target.value))}
                className="w-full bg-surface-soft border border-hairline rounded-xl p-2 text-ink text-xs"
              >
                {warehouses.map(w => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-semibold text-muted-text block mb-1">จำนวนที่นับได้จริงใหม่ (New Quantity) *</label>
              <input
                type="number"
                min="0"
                required
                value={newAdjustQty}
                onChange={(e) => setNewAdjustQty(Number(e.target.value))}
                className="w-full bg-surface-soft border border-hairline rounded-xl p-2 text-ink text-xs font-bold"
              />
            </div>

            <div>
              <label className="font-semibold text-muted-text block mb-1">เหตุผลในการปรับปรุง *</label>
              <input
                type="text"
                required
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                placeholder="เช่น สินค้าแตกหักชำรุด, ตรวจนับสต็อกประจำเดือนพบยอดเกิน..."
                className="w-full bg-surface-soft border border-hairline rounded-xl p-2 text-ink text-xs"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full btn-rausch text-xs py-2.5 cursor-pointer font-semibold shadow-sm"
            >
              {isSubmitting ? 'กำลังบันทึก...' : 'บันทึกการปรับปรุงยอด'}
            </button>
          </form>
        </div>
      )}

    </div>
  );
}
