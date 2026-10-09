'use client';

import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Barcode, 
  Package, 
  AlertTriangle, 
  Check, 
  X, 
  Layers, 
  ArrowUpDown
} from 'lucide-react';

interface ProductsViewProps {
  products: any[];
  categories: any[];
  units: any[];
  warehouses: any[];
  onRefresh: () => void;
}

export function ProductsView({
  products,
  categories,
  units,
  warehouses,
  onRefresh
}: ProductsViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCat, setSelectedCat] = useState<string>('all');
  const [filterLowStock, setFilterLowStock] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New product form
  const [form, setForm] = useState<any>({
    sku: '',
    name: '',
    description: '',
    category_id: 1,
    base_unit_id: 1,
    cost_price: 100,
    retail_price: 125,
    technician_price: 120,
    contractor_price: 115,
    project_price: 110,
    min_stock: 50,
    max_stock: 500,
    reorder_point: 100,
    initial_stock: 100,
    initial_warehouse_id: 1,
    barcode: ''
  });

  const filtered = useMemo(() => {
    return products.filter(p => {
      const matchCat = selectedCat === 'all' || String(p.category_id) === selectedCat;
      const matchLow = !filterLowStock || p.total_stock <= p.reorder_point;
      const q = searchTerm.toLowerCase().trim();
      const matchSearch = !q ||
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        (p.barcodes && p.barcodes.some((b: string) => b.includes(q)));
      return matchCat && matchLow && matchSearch;
    });
  }, [products, selectedCat, filterLowStock, searchTerm]);

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      if (res.ok) {
        setShowAddModal(false);
        onRefresh();
      } else {
        const data = await res.json();
        alert(data.error || 'เกิดข้อผิดพลาดในการบันทึกสินค้า');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingProduct)
      });
      if (res.ok) {
        setEditingProduct(null);
        onRefresh();
      } else {
        const data = await res.json();
        alert(data.error || 'เกิดข้อผิดพลาดในการแก้ไขสินค้า');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeactivate = async (id: number) => {
    if (!confirm('ต้องการระงับการใช้งานสินค้านี้ใช่หรือไม่? (ประวัติการทำรายการในอดีตจะไม่สูญหาย)')) return;
    try {
      const res = await fetch(`/api/products?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        onRefresh();
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Top Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-hairline">
        <div>
          <h1 className="text-2xl font-bold text-ink tracking-tight">แคตตาล็อกสินค้า & สต็อก (Products)</h1>
          <p className="text-xs text-muted-text mt-0.5">
            จัดการข้อมูลสินค้า แปลงหลายหน่วยนับ (Multi-UOM) บาร์โค้ด และระดับราคา 4 ระดับ
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="btn-rausch text-xs py-2 px-3.5 flex items-center gap-2 cursor-pointer shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>เพิ่มสินค้าใหม่</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white rounded-2xl border border-hairline shadow-subtle">
        <div className="flex items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted-text" />
            <input
              type="text"
              placeholder="ค้นหาด้วย SKU, ชื่อสินค้า, หรือบาร์โค้ด..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-surface-soft border border-hairline rounded-xl text-xs text-ink focus:outline-none focus:ring-1 focus:ring-[#ff385c]"
            />
          </div>

          <select
            value={selectedCat}
            onChange={(e) => setSelectedCat(e.target.value)}
            className="bg-surface-soft border border-hairline rounded-xl px-3 py-2 text-xs text-ink focus:outline-none"
          >
            <option value="all">ทุกหมวดหมู่ ({categories.length})</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterLowStock(!filterLowStock)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium border flex items-center gap-1.5 cursor-pointer transition ${
              filterLowStock
                ? 'bg-amber-100 border-amber-300 text-amber-900 font-bold'
                : 'border-hairline hover:bg-surface-soft text-muted-text'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span>เฉพาะสต็อกต่ำ</span>
          </button>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl border border-hairline overflow-hidden shadow-subtle">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-surface-soft border-b border-hairline text-muted-text">
                <th className="py-3 px-4 font-semibold">สินค้า / SKU</th>
                <th className="py-3 px-3 font-semibold">หมวดหมู่</th>
                <th className="py-3 px-3 font-semibold">หน่วยนับ (UOM)</th>
                <th className="py-3 px-3 font-semibold text-right">คงเหลือรวม</th>
                <th className="py-3 px-3 font-semibold text-right">ราคาทุน</th>
                <th className="py-3 px-3 font-semibold text-right">ราคาขายปลีก</th>
                <th className="py-3 px-3 font-semibold text-right">ราคาผู้รับเหมา</th>
                <th className="py-3 px-3 font-semibold text-right">ราคาโครงการ</th>
                <th className="py-3 px-4 font-semibold text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {filtered.map(p => (
                <tr key={p.id} className="hover:bg-surface-soft/50 transition">
                  {/* Photo & SKU & Name */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={p.image_url}
                        alt={p.name}
                        className="w-10 h-10 rounded-lg object-cover bg-surface-strong shrink-0"
                      />
                      <div className="min-w-0 max-w-xs">
                        <div className="font-semibold text-xs text-ink truncate">{p.name}</div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-surface-strong text-muted-text">
                            {p.sku}
                          </span>
                          {p.barcodes && p.barcodes[0] && (
                            <span className="text-[10px] text-muted-text flex items-center gap-0.5 font-mono">
                              <Barcode className="w-3 h-3" />
                              {p.barcodes[0]}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Category */}
                  <td className="py-3 px-3 text-muted-text">
                    <span className="px-2 py-0.5 rounded bg-surface-strong text-[11px] text-ink">
                      {p.category_name}
                    </span>
                  </td>

                  {/* UOMs */}
                  <td className="py-3 px-3">
                    <div className="space-y-0.5">
                      <span className="font-semibold text-ink text-[11px] block">
                        {p.base_unit_name} (หน่วยหลัก)
                      </span>
                      {p.uoms && p.uoms.filter((u: any) => u.conversion_factor > 1).map((u: any) => (
                        <span key={u.id} className="text-[10px] text-muted-text block">
                          1 {u.unit_name} = {u.conversion_factor} {p.base_unit_name}
                        </span>
                      ))}
                    </div>
                  </td>

                  {/* Total Stock */}
                  <td className="py-3 px-3 text-right">
                    <div className="font-bold text-xs">
                      <span className={p.total_stock <= p.reorder_point ? 'text-amber-600 font-extrabold' : 'text-ink'}>
                        {p.total_stock}
                      </span>
                      <span className="text-[10px] text-muted-text ml-1">{p.base_unit_name}</span>
                    </div>
                    {p.total_stock <= p.reorder_point && (
                      <span className="text-[9px] text-amber-700 bg-amber-50 px-1 py-0.2 rounded font-semibold inline-block mt-0.5">
                        จุดสั่งซื้อ: {p.reorder_point}
                      </span>
                    )}
                  </td>

                  {/* Cost */}
                  <td className="py-3 px-3 text-right text-muted-text">
                    ฿{p.cost_price?.toLocaleString()}
                  </td>

                  {/* Retail */}
                  <td className="py-3 px-3 text-right font-semibold text-ink">
                    ฿{p.retail_price?.toLocaleString()}
                  </td>

                  {/* Contractor */}
                  <td className="py-3 px-3 text-right font-medium text-blue-700">
                    ฿{p.contractor_price?.toLocaleString()}
                  </td>

                  {/* Project */}
                  <td className="py-3 px-3 text-right font-medium text-emerald-700">
                    ฿{p.project_price?.toLocaleString()}
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setEditingProduct({ ...p })}
                        className="p-1.5 rounded hover:bg-surface-strong text-muted-text hover:text-ink cursor-pointer"
                        title="แก้ไขสินค้าและราคา"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeactivate(p.id)}
                        className="p-1.5 rounded hover:bg-surface-strong text-muted-text hover:text-red-600 cursor-pointer"
                        title="ระงับสินค้า"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-canvas border border-hairline rounded-2xl max-w-2xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto space-y-5 animate-fadeIn">
            
            <div className="flex justify-between items-center pb-3 border-b border-hairline">
              <h3 className="font-bold text-base text-ink">เพิ่มสินค้าใหม่ (New Material)</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-muted-text hover:text-ink text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-4 text-xs">
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-muted-text block mb-1">รหัสสินค้า (SKU) *</label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น CEMT-003, STEL-005"
                    value={form.sku}
                    onChange={(e) => setForm({ ...form, sku: e.target.value })}
                    className="w-full bg-surface-soft border border-hairline rounded-xl p-2 text-ink focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-semibold text-muted-text block mb-1">บาร์โค้ดสแกน (Barcode)</label>
                  <input
                    type="text"
                    placeholder="เช่น 885123456789"
                    value={form.barcode}
                    onChange={(e) => setForm({ ...form, barcode: e.target.value })}
                    className="w-full bg-surface-soft border border-hairline rounded-xl p-2 text-ink focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-muted-text block mb-1">ชื่อสินค้า (Product Name) *</label>
                <input
                  type="text"
                  required
                  placeholder="เช่น ปูนซีเมนต์ ปอร์ตแลนด์ ตราช้าง 50 กก."
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-surface-soft border border-hairline rounded-xl p-2 text-ink focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-muted-text block mb-1">หมวดหมู่สินค้า *</label>
                  <select
                    value={form.category_id}
                    onChange={(e) => setForm({ ...form, category_id: Number(e.target.value) })}
                    className="w-full bg-surface-soft border border-hairline rounded-xl p-2 text-ink focus:outline-none"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-muted-text block mb-1">หน่วยนับหลัก (Base UOM) *</label>
                  <select
                    value={form.base_unit_id}
                    onChange={(e) => setForm({ ...form, base_unit_id: Number(e.target.value) })}
                    className="w-full bg-surface-soft border border-hairline rounded-xl p-2 text-ink focus:outline-none"
                  >
                    {units.map(u => (
                      <option key={u.id} value={u.id}>{u.name} ({u.code})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Pricing Section (4 tiers) */}
              <div className="p-3 bg-surface-soft rounded-xl border border-hairline space-y-3">
                <span className="font-bold text-ink block text-[11px]">โครงสร้างราคา (Pricing Structure)</span>
                <div className="grid grid-cols-4 gap-3">
                  <div>
                    <label className="text-[10px] text-muted-text block mb-0.5">ราคาทุน</label>
                    <input
                      type="number"
                      value={form.cost_price}
                      onChange={(e) => setForm({ ...form, cost_price: Number(e.target.value) })}
                      className="w-full bg-white border border-hairline rounded-lg p-1.5 text-xs text-ink"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-text block mb-0.5">ราคาขายปลีก</label>
                    <input
                      type="number"
                      value={form.retail_price}
                      onChange={(e) => setForm({ ...form, retail_price: Number(e.target.value) })}
                      className="w-full bg-white border border-hairline rounded-lg p-1.5 text-xs text-ink font-semibold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-text block mb-0.5">ราคาผู้รับเหมา</label>
                    <input
                      type="number"
                      value={form.contractor_price}
                      onChange={(e) => setForm({ ...form, contractor_price: Number(e.target.value) })}
                      className="w-full bg-white border border-hairline rounded-lg p-1.5 text-xs text-ink text-blue-700 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-text block mb-0.5">ราคาโครงการ</label>
                    <input
                      type="number"
                      value={form.project_price}
                      onChange={(e) => setForm({ ...form, project_price: Number(e.target.value) })}
                      className="w-full bg-white border border-hairline rounded-lg p-1.5 text-xs text-ink text-emerald-700 font-semibold"
                    />
                  </div>
                </div>
              </div>

              {/* Inventory & Reorder Point */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-muted-text block mb-1">สต็อกเริ่มต้น</label>
                  <input
                    type="number"
                    value={form.initial_stock}
                    onChange={(e) => setForm({ ...form, initial_stock: Number(e.target.value) })}
                    className="w-full bg-surface-soft border border-hairline rounded-xl p-2 text-ink"
                  />
                </div>
                <div>
                  <label className="font-semibold text-muted-text block mb-1">จัดเก็บที่คลัง</label>
                  <select
                    value={form.initial_warehouse_id}
                    onChange={(e) => setForm({ ...form, initial_warehouse_id: Number(e.target.value) })}
                    className="w-full bg-surface-soft border border-hairline rounded-xl p-2 text-ink"
                  >
                    {warehouses.map(w => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-muted-text block mb-1">จุดเตือนสั่งซื้อ (Reorder Point)</label>
                  <input
                    type="number"
                    value={form.reorder_point}
                    onChange={(e) => setForm({ ...form, reorder_point: Number(e.target.value) })}
                    className="w-full bg-surface-soft border border-hairline rounded-xl p-2 text-ink"
                  />
                </div>
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
                  {isSubmitting ? 'กำลังบันทึก...' : 'บันทึกสินค้า'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-canvas border border-hairline rounded-2xl max-w-2xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto space-y-5 animate-fadeIn">
            
            <div className="flex justify-between items-center pb-3 border-b border-hairline">
              <div>
                <h3 className="font-bold text-base text-ink">แก้ไขข้อมูลสินค้า ({editingProduct.sku})</h3>
                <p className="text-xs text-muted-text">{editingProduct.name}</p>
              </div>
              <button
                onClick={() => setEditingProduct(null)}
                className="text-muted-text hover:text-ink text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateProduct} className="space-y-4 text-xs">
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-muted-text block mb-1">รหัสสินค้า (SKU) *</label>
                  <input
                    type="text"
                    required
                    value={editingProduct.sku || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, sku: e.target.value })}
                    className="w-full bg-surface-soft border border-hairline rounded-xl p-2 text-ink focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-semibold text-muted-text block mb-1">หมวดหมู่สินค้า *</label>
                  <select
                    value={editingProduct.category_id || 1}
                    onChange={(e) => setEditingProduct({ ...editingProduct, category_id: Number(e.target.value) })}
                    className="w-full bg-surface-soft border border-hairline rounded-xl p-2 text-ink focus:outline-none"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-muted-text block mb-1">ชื่อสินค้า (Product Name) *</label>
                <input
                  type="text"
                  required
                  value={editingProduct.name || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  className="w-full bg-surface-soft border border-hairline rounded-xl p-2 text-ink focus:outline-none"
                />
              </div>

              {/* Pricing Section (4 tiers) */}
              <div className="p-3 bg-surface-soft rounded-xl border border-hairline space-y-3">
                <span className="font-bold text-ink block text-[11px]">ปรับแก้ราคาขาย 4 ระดับ (Pricing Structure)</span>
                <div className="grid grid-cols-4 gap-3">
                  <div>
                    <label className="text-[10px] text-muted-text block mb-0.5">ราคาทุน</label>
                    <input
                      type="number"
                      value={editingProduct.cost_price || 0}
                      onChange={(e) => setEditingProduct({ ...editingProduct, cost_price: Number(e.target.value) })}
                      className="w-full bg-white border border-hairline rounded-lg p-1.5 text-xs text-ink"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-text block mb-0.5">ราคาขายปลีก</label>
                    <input
                      type="number"
                      value={editingProduct.retail_price || 0}
                      onChange={(e) => setEditingProduct({ ...editingProduct, retail_price: Number(e.target.value) })}
                      className="w-full bg-white border border-hairline rounded-lg p-1.5 text-xs text-ink font-semibold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-text block mb-0.5">ราคาผู้รับเหมา</label>
                    <input
                      type="number"
                      value={editingProduct.contractor_price || 0}
                      onChange={(e) => setEditingProduct({ ...editingProduct, contractor_price: Number(e.target.value) })}
                      className="w-full bg-white border border-hairline rounded-lg p-1.5 text-xs text-ink text-blue-700 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-text block mb-0.5">ราคาโครงการ</label>
                    <input
                      type="number"
                      value={editingProduct.project_price || 0}
                      onChange={(e) => setEditingProduct({ ...editingProduct, project_price: Number(e.target.value) })}
                      className="w-full bg-white border border-hairline rounded-lg p-1.5 text-xs text-ink text-emerald-700 font-semibold"
                    />
                  </div>
                </div>
              </div>

              {/* Stock Thresholds */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-muted-text block mb-1">จุดเตือนสั่งซื้อ (Reorder Point)</label>
                  <input
                    type="number"
                    value={editingProduct.reorder_point || 0}
                    onChange={(e) => setEditingProduct({ ...editingProduct, reorder_point: Number(e.target.value) })}
                    className="w-full bg-surface-soft border border-hairline rounded-xl p-2 text-ink"
                  />
                </div>
                <div>
                  <label className="font-semibold text-muted-text block mb-1">สต็อกขั้นต่ำ (Min)</label>
                  <input
                    type="number"
                    value={editingProduct.min_stock || 0}
                    onChange={(e) => setEditingProduct({ ...editingProduct, min_stock: Number(e.target.value) })}
                    className="w-full bg-surface-soft border border-hairline rounded-xl p-2 text-ink"
                  />
                </div>
                <div>
                  <label className="font-semibold text-muted-text block mb-1">สต็อกสูงสุด (Max)</label>
                  <input
                    type="number"
                    value={editingProduct.max_stock || 0}
                    onChange={(e) => setEditingProduct({ ...editingProduct, max_stock: Number(e.target.value) })}
                    className="w-full bg-surface-soft border border-hairline rounded-xl p-2 text-ink"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-hairline">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="btn-secondary text-xs py-2 px-4 cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-rausch text-xs py-2 px-6 cursor-pointer"
                >
                  {isSubmitting ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
