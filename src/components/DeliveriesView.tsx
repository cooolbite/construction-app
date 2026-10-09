'use client';

import React, { useState } from 'react';
import { 
  Truck, 
  MapPin, 
  Phone, 
  User, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Plus, 
  ChevronRight,
  Calendar,
  FileText,
  Printer
} from 'lucide-react';

interface DeliveriesViewProps {
  deliveries: any[];
  customers: any[];
  onRefresh: () => void;
}

export function DeliveriesView({
  deliveries,
  customers,
  onRefresh
}: DeliveriesViewProps) {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [editingDelivery, setEditingDelivery] = useState<any>(null);
  const [viewingDelivery, setViewingDelivery] = useState<any>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const [createForm, setCreateForm] = useState({
    sale_id: 1,
    customer_id: customers[0]?.id || 1,
    recipient_name: '',
    recipient_phone: '',
    delivery_address: '',
    vehicle_type: 'รถกระบะ 4 ล้อ',
    vehicle_plate: '',
    driver_name: '',
    scheduled_date: new Date().toISOString().split('T')[0],
    proof_note: ''
  });

  const statuses = [
    { id: 'all', label: 'ทั้งหมด' },
    { id: 'pending', label: 'รอจัดสินค้า' },
    { id: 'preparing', label: 'กำลังจัดของ' },
    { id: 'in_transit', label: 'กำลังจัดส่ง' },
    { id: 'delivered', label: 'ส่งสำเร็จ' },
    { id: 'failed', label: 'ส่งไม่สำเร็จ' }
  ];

  const filtered = deliveries.filter(d => {
    return filterStatus === 'all' || d.status === filterStatus;
  });

  const handleUpdateStatus = async (id: number, newStatus: string) => {
    try {
      const res = await fetch('/api/deliveries', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus })
      });
      if (res.ok) onRefresh();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCreateDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      const res = await fetch('/api/deliveries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createForm)
      });
      const data = await res.json();
      if (res.ok) {
        setShowCreateModal(false);
        onRefresh();
      } else {
        alert(data.error || 'Failed to create delivery');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleSaveDriverVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDelivery) return;
    setIsUpdating(true);
    try {
      const res = await fetch('/api/deliveries', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingDelivery.id,
          status: editingDelivery.status,
          driver_name: editingDelivery.driver_name,
          vehicle_plate: editingDelivery.vehicle_plate,
          proof_note: editingDelivery.proof_note
        })
      });
      if (res.ok) {
        setEditingDelivery(null);
        onRefresh();
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-hairline">
        <div>
          <h1 className="text-2xl font-bold text-ink tracking-tight">คิวจัดส่งสินค้า (Delivery Management)</h1>
          <p className="text-xs text-muted-text mt-0.5">
            มอบหมายคนขับรถ ทะเบียนรถ ติดตามสถานะจัดส่งถึงหน้างาน (FR-DEL-001 - 006)
          </p>
        </div>

        {/* Filter Badges & Create Action */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {statuses.map(st => (
              <button
                key={st.id}
                onClick={() => setFilterStatus(st.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition cursor-pointer ${
                  filterStatus === st.id
                    ? 'bg-ink text-white'
                    : 'bg-surface-soft text-muted-text hover:text-ink'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-rausch text-xs py-2 px-3.5 flex items-center gap-1.5 cursor-pointer shadow-xs shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>สร้างใบจัดส่ง</span>
          </button>
        </div>
      </div>

      {/* Delivery Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(del => (
          <div key={del.id} className="card-airbnb p-5 bg-white flex flex-col justify-between space-y-4">
            
            <div className="space-y-3">
              {/* Top row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-ink">{del.doc_no}</span>
                  <button
                    onClick={() => setViewingDelivery(del)}
                    className="p-1 rounded hover:bg-surface-strong text-muted-text hover:text-ink cursor-pointer"
                    title="ดูใบกำกับส่งของ / พิมพ์"
                  >
                    <FileText className="w-3.5 h-3.5" />
                  </button>
                </div>
                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                  del.status === 'delivered' ? 'bg-emerald-100 text-emerald-800' :
                  del.status === 'in_transit' ? 'bg-blue-100 text-blue-800' :
                  del.status === 'preparing' ? 'bg-amber-100 text-amber-800' :
                  del.status === 'failed' ? 'bg-red-100 text-red-800' :
                  'bg-surface-strong text-muted-text'
                }`}>
                  {del.status === 'delivered' && '✓ ส่งสำเร็จ'}
                  {del.status === 'in_transit' && '🚛 กำลังจัดส่ง'}
                  {del.status === 'preparing' && '📦 กำลังจัดของ'}
                  {del.status === 'pending' && '⏳ รอจัดสินค้า'}
                  {del.status === 'failed' && '✕ ไม่สำเร็จ'}
                </span>
              </div>

              {/* Customer & Address */}
              <div className="space-y-1.5 text-xs">
                <div className="font-semibold text-ink flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-muted-text" />
                  <span>{del.recipient_name} ({del.customer_name})</span>
                </div>
                <div className="text-muted-text flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-muted-text" />
                  <span>{del.recipient_phone}</span>
                </div>
                <div className="text-muted-text flex items-start gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-muted-text shrink-0 mt-0.5" />
                  <span className="line-clamp-2">{del.delivery_address}</span>
                </div>
              </div>

              {/* Vehicle & Driver Info */}
              <div className="p-3 rounded-xl bg-surface-soft border border-hairline text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-text">รถขนส่ง:</span>
                  <span className="font-semibold text-ink">{del.vehicle_type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-text">ทะเบียนรถ:</span>
                  <span className="font-mono font-medium text-ink">{del.vehicle_plate || 'ยังไม่กำหนด'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-text">พนักงานขับรถ:</span>
                  <span className="font-semibold text-ink">{del.driver_name || 'ยังไม่กำหนด'}</span>
                </div>
              </div>

              {del.proof_note && (
                <div className="text-[11px] text-muted-text italic bg-amber-50/50 p-2 rounded-lg border border-amber-100">
                  หมายเหตุ: {del.proof_note}
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="pt-3 border-t border-hairline flex items-center justify-between gap-2">
              <button
                onClick={() => setEditingDelivery(del)}
                className="text-xs text-muted-text hover:text-ink font-medium cursor-pointer"
              >
                แก้ไขคนขับ/รถ
              </button>

              <div className="flex items-center gap-1">
                {del.status === 'pending' && (
                  <button
                    onClick={() => handleUpdateStatus(del.id, 'preparing')}
                    className="px-2.5 py-1 rounded bg-amber-50 text-amber-800 text-[11px] font-semibold hover:bg-amber-100 cursor-pointer"
                  >
                    จัดของ
                  </button>
                )}
                {del.status === 'preparing' && (
                  <button
                    onClick={() => handleUpdateStatus(del.id, 'in_transit')}
                    className="px-2.5 py-1 rounded bg-blue-50 text-blue-800 text-[11px] font-semibold hover:bg-blue-100 cursor-pointer"
                  >
                    ออกส่ง
                  </button>
                )}
                {del.status === 'in_transit' && (
                  <button
                    onClick={() => handleUpdateStatus(del.id, 'delivered')}
                    className="px-2.5 py-1 rounded bg-emerald-50 text-emerald-800 text-[11px] font-semibold hover:bg-emerald-100 cursor-pointer"
                  >
                    ส่งสำเร็จ
                  </button>
                )}
              </div>
            </div>

          </div>
        ))}
      </div>

      {/* Edit Driver & Vehicle Modal */}
      {editingDelivery && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-canvas border border-hairline rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-fadeIn">
            
            <div className="flex justify-between items-center pb-3 border-b border-hairline">
              <h3 className="font-bold text-base text-ink">กำหนดรถและคนขับ ({editingDelivery.doc_no})</h3>
              <button
                onClick={() => setEditingDelivery(null)}
                className="text-muted-text hover:text-ink text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveDriverVehicle} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-muted-text block mb-1">ประเภทรถขนส่ง</label>
                <select
                  value={editingDelivery.vehicle_type}
                  onChange={(e) => setEditingDelivery({ ...editingDelivery, vehicle_type: e.target.value })}
                  className="w-full bg-surface-soft border border-hairline rounded-xl p-2 text-ink"
                >
                  <option value="รถกระบะ 4 ล้อ">รถกระบะ 4 ล้อ (บรรทุก 1.5 ตัน)</option>
                  <option value="รถ 6 ล้อคอก">รถ 6 ล้อคอก (บรรทุก 5 ตัน)</option>
                  <option value="รถ 6 ล้อติดเครนเฮี๊ยบ">รถ 6 ล้อติดเครนเฮี๊ยบ (ยกพาเลท/เหล็ก)</option>
                  <option value="รถ 10 ล้อดั๊มพ์">รถ 10 ล้อดั๊มพ์ (หินทรายเทกอง)</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-muted-text block mb-1">ทะเบียนรถ</label>
                <input
                  type="text"
                  placeholder="เช่น 83-5599 นนทบุรี"
                  value={editingDelivery.vehicle_plate}
                  onChange={(e) => setEditingDelivery({ ...editingDelivery, vehicle_plate: e.target.value })}
                  className="w-full bg-surface-soft border border-hairline rounded-xl p-2 text-ink font-mono"
                />
              </div>

              <div>
                <label className="font-semibold text-muted-text block mb-1">ชื่อคนขับรถ</label>
                <input
                  type="text"
                  placeholder="เช่น นายสุรเดช พร้อมส่ง"
                  value={editingDelivery.driver_name}
                  onChange={(e) => setEditingDelivery({ ...editingDelivery, driver_name: e.target.value })}
                  className="w-full bg-surface-soft border border-hairline rounded-xl p-2 text-ink"
                />
              </div>

              <div>
                <label className="font-semibold text-muted-text block mb-1">สถานะจัดส่ง</label>
                <select
                  value={editingDelivery.status}
                  onChange={(e) => setEditingDelivery({ ...editingDelivery, status: e.target.value })}
                  className="w-full bg-surface-soft border border-hairline rounded-xl p-2 text-ink"
                >
                  <option value="pending">รอจัดสินค้า</option>
                  <option value="preparing">กำลังจัดของ</option>
                  <option value="in_transit">กำลังจัดส่ง</option>
                  <option value="delivered">ส่งสำเร็จ</option>
                  <option value="failed">ส่งไม่สำเร็จ</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-muted-text block mb-1">หลักฐาน / หมายเหตุการส่ง</label>
                <input
                  type="text"
                  placeholder="เช่น ช่างหน้างานเซ็นรับมอบเรียบร้อย..."
                  value={editingDelivery.proof_note || ''}
                  onChange={(e) => setEditingDelivery({ ...editingDelivery, proof_note: e.target.value })}
                  className="w-full bg-surface-soft border border-hairline rounded-xl p-2 text-ink"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-hairline">
                <button
                  type="button"
                  onClick={() => setEditingDelivery(null)}
                  className="btn-secondary text-xs py-2 px-4 cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="btn-rausch text-xs py-2 px-6 cursor-pointer"
                >
                  {isUpdating ? 'กำลังบันทึก...' : 'บันทึก'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* Create Delivery Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-canvas border border-hairline rounded-2xl max-w-lg w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto space-y-4 animate-fadeIn">
            
            <div className="flex justify-between items-center pb-3 border-b border-hairline">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-[#ff385c]" />
                <h3 className="font-bold text-base text-ink">สร้างใบจัดส่งสินค้าใหม่ (New Delivery)</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-muted-text hover:text-ink text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateDelivery} className="space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-muted-text block mb-1">เลือกลูกค้า (Customer) *</label>
                <select
                  value={createForm.customer_id}
                  onChange={(e) => {
                    const cId = Number(e.target.value);
                    const cust = customers.find(c => c.id === cId);
                    setCreateForm({
                      ...createForm,
                      customer_id: cId,
                      recipient_name: cust?.name || '',
                      recipient_phone: cust?.phone || '',
                      delivery_address: cust?.address || ''
                    });
                  }}
                  className="w-full bg-surface-soft border border-hairline rounded-xl p-2.5 text-ink"
                >
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.price_tier})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-muted-text block mb-1">ชื่อผู้รับสินค้าหน้างาน *</label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น ช่างสมหมาย, นายกิตติศักดิ์"
                    value={createForm.recipient_name}
                    onChange={(e) => setCreateForm({ ...createForm, recipient_name: e.target.value })}
                    className="w-full bg-surface-soft border border-hairline rounded-xl p-2.5 text-ink"
                  />
                </div>
                <div>
                  <label className="font-semibold text-muted-text block mb-1">เบอร์โทรศัพท์ผู้รับ *</label>
                  <input
                    type="text"
                    required
                    placeholder="081-xxx-xxxx"
                    value={createForm.recipient_phone}
                    onChange={(e) => setCreateForm({ ...createForm, recipient_phone: e.target.value })}
                    className="w-full bg-surface-soft border border-hairline rounded-xl p-2.5 text-ink"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-muted-text block mb-1">สถานที่จัดส่ง / ไซต์งานก่อสร้าง *</label>
                <textarea
                  rows={2}
                  required
                  placeholder="ระบุที่อยู่ไซต์งาน ซอย ถนน ตำบล จุดสังเกต..."
                  value={createForm.delivery_address}
                  onChange={(e) => setCreateForm({ ...createForm, delivery_address: e.target.value })}
                  className="w-full bg-surface-soft border border-hairline rounded-xl p-2.5 text-ink"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-muted-text block mb-1">ประเภทรถขนส่ง</label>
                  <select
                    value={createForm.vehicle_type}
                    onChange={(e) => setCreateForm({ ...createForm, vehicle_type: e.target.value })}
                    className="w-full bg-surface-soft border border-hairline rounded-xl p-2.5 text-ink"
                  >
                    <option value="รถกระบะ 4 ล้อ">รถกระบะ 4 ล้อ (บรรทุก 1.5 ตัน)</option>
                    <option value="รถ 6 ล้อคอก">รถ 6 ล้อคอก (บรรทุก 5 ตัน)</option>
                    <option value="รถ 6 ล้อติดเครนเฮี๊ยบ">รถ 6 ล้อติดเครนเฮี๊ยบ (ยกพาเลท/เหล็ก)</option>
                    <option value="รถ 10 ล้อดั๊มพ์">รถ 10 ล้อดั๊มพ์ (หินทรายเทกอง)</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-muted-text block mb-1">วันที่นัดหมายจัดส่ง</label>
                  <input
                    type="date"
                    value={createForm.scheduled_date}
                    onChange={(e) => setCreateForm({ ...createForm, scheduled_date: e.target.value })}
                    className="w-full bg-surface-soft border border-hairline rounded-xl p-2.5 text-ink"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-muted-text block mb-1">ทะเบียนรถ</label>
                  <input
                    type="text"
                    placeholder="เช่น 83-5599 นนทบุรี"
                    value={createForm.vehicle_plate}
                    onChange={(e) => setCreateForm({ ...createForm, vehicle_plate: e.target.value })}
                    className="w-full bg-surface-soft border border-hairline rounded-xl p-2.5 text-ink"
                  />
                </div>
                <div>
                  <label className="font-semibold text-muted-text block mb-1">พนักงานขับรถ</label>
                  <input
                    type="text"
                    placeholder="เช่น นายสุรเดช พร้อมส่ง"
                    value={createForm.driver_name}
                    onChange={(e) => setCreateForm({ ...createForm, driver_name: e.target.value })}
                    className="w-full bg-surface-soft border border-hairline rounded-xl p-2.5 text-ink"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-muted-text block mb-1">หมายเหตุเพิ่มเติม</label>
                <input
                  type="text"
                  placeholder="เช่น ต้องการรถเครนยกพาเลทลงข้างบ้าน..."
                  value={createForm.proof_note}
                  onChange={(e) => setCreateForm({ ...createForm, proof_note: e.target.value })}
                  className="w-full bg-surface-soft border border-hairline rounded-xl p-2.5 text-ink"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-hairline">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn-secondary text-xs py-2 px-4 cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="btn-rausch text-xs py-2 px-6 cursor-pointer"
                >
                  {isCreating ? 'กำลังบันทึก...' : 'บันทึกใบจัดส่ง'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* View Delivery Note / Slip Modal */}
      {viewingDelivery && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-canvas border border-hairline rounded-2xl max-w-2xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto space-y-4 animate-fadeIn">
            
            <div className="flex justify-between items-center pb-3 border-b border-hairline no-print">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-[#ff385c]" />
                <h3 className="font-bold text-base text-ink">ใบกำกับการขนส่งและส่งมอบสินค้า ({viewingDelivery.doc_no})</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>พิมพ์ใบส่งของ</span>
                </button>
                <button
                  onClick={() => setViewingDelivery(null)}
                  className="text-muted-text hover:text-ink text-sm cursor-pointer p-1"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Document Content */}
            <div className="space-y-4 text-xs bg-white p-5 rounded-xl border border-hairline">
              <div className="flex justify-between items-start pb-3 border-b border-hairline">
                <div>
                  <h2 className="text-base font-bold text-ink">สมบูรณ์ ค้าวัสดุก่อสร้าง</h2>
                  <p className="text-muted-text text-[11px]">ใบส่งของชั่วคราว / ใบนำส่งสินค้าหน้างาน</p>
                </div>
                <div className="text-right">
                  <div className="font-bold text-sm text-ink">{viewingDelivery.doc_no}</div>
                  <div className="text-muted-text text-[11px]">วันที่ส่ง: {viewingDelivery.scheduled_date || '-'}</div>
                  <div className="text-[11px] font-semibold text-emerald-700">สถานะ: {viewingDelivery.status}</div>
                </div>
              </div>

              {/* Delivery Details Grid */}
              <div className="grid grid-cols-2 gap-4 p-3 bg-surface-soft rounded-xl border border-hairline">
                <div>
                  <span className="font-bold text-ink block mb-1">ข้อมูลผู้รับและสถานที่จัดส่ง:</span>
                  <div className="space-y-1 text-muted-text">
                    <div>ผู้รับ: <strong className="text-ink">{viewingDelivery.recipient_name}</strong> ({viewingDelivery.customer_name})</div>
                    <div>โทรศัพท์: <strong className="text-ink">{viewingDelivery.recipient_phone}</strong></div>
                    <div>สถานที่: {viewingDelivery.delivery_address}</div>
                  </div>
                </div>
                <div>
                  <span className="font-bold text-ink block mb-1">ข้อมูลพาหนะและพนักงานส่ง:</span>
                  <div className="space-y-1 text-muted-text">
                    <div>ประเภทรถ: <strong className="text-ink">{viewingDelivery.vehicle_type}</strong></div>
                    <div>ทะเบียน: <strong className="text-ink font-mono">{viewingDelivery.vehicle_plate || '-'}</strong></div>
                    <div>คนขับรถ: <strong className="text-ink">{viewingDelivery.driver_name || '-'}</strong></div>
                  </div>
                </div>
              </div>

              {viewingDelivery.proof_note && (
                <div className="p-2.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 text-[11px]">
                  หมายเหตุ / ผลการส่ง: {viewingDelivery.proof_note}
                </div>
              )}

              {/* Signatures */}
              <div className="grid grid-cols-2 gap-8 pt-8 mt-4 border-t border-hairline">
                <div className="text-center space-y-8">
                  <div className="border-b border-dashed border-gray-400 w-3/4 mx-auto" />
                  <div className="text-muted-text text-[11px]">
                    (......................................................)<br />
                    พนักงานขับรถ / ผู้ส่งมอบ
                  </div>
                </div>
                <div className="text-center space-y-8">
                  <div className="border-b border-dashed border-gray-400 w-3/4 mx-auto" />
                  <div className="text-muted-text text-[11px]">
                    (......................................................)<br />
                    ผู้รับมอบสินค้าหน้างาน
                  </div>
                </div>
              </div>

            </div>

            <div className="flex justify-end pt-2 border-t border-hairline no-print">
              <button
                type="button"
                onClick={() => setViewingDelivery(null)}
                className="btn-secondary text-xs py-2 px-5 cursor-pointer"
              >
                ปิดหน้าต่าง
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
