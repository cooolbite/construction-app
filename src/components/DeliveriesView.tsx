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
  FileText
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
  const [isUpdating, setIsUpdating] = useState(false);

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

        {/* Filter Badges */}
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
      </div>

      {/* Delivery Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(del => (
          <div key={del.id} className="card-airbnb p-5 bg-white flex flex-col justify-between space-y-4">
            
            <div className="space-y-3">
              {/* Top row */}
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-ink">{del.doc_no}</span>
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

    </div>
  );
}
