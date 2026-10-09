'use client';

import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Store, 
  RotateCcw, 
  Users, 
  Warehouse, 
  FileText, 
  Check, 
  AlertTriangle 
} from 'lucide-react';

interface SettingsViewProps {
  onResetSeed: () => void;
  isReseeding: boolean;
}

export function SettingsView({ onResetSeed, isReseeding }: SettingsViewProps) {
  const [settings, setSettings] = useState<any>({});
  const [users, setUsers] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [saved, setSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      const d = await res.json();
      setSettings(d.settings || {});
      setUsers(d.users || []);
      setWarehouses(d.warehouses || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn max-w-4xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-hairline">
        <div>
          <h1 className="text-2xl font-bold text-ink tracking-tight">ตั้งค่าระบบ (System Configuration)</h1>
          <p className="text-xs text-muted-text mt-0.5">
            ข้อมูลร้านค้า เลขประจำตัวผู้เสียภาษี รูปแบบเลขที่เอกสาร และการจัดการข้อมูลตัวอย่าง (FR-SET-001 - 005)
          </p>
        </div>

        {saved && (
          <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
            <Check className="w-4 h-4" />
            <span>บันทึกการตั้งค่าเรียบร้อยแล้ว</span>
          </span>
        )}
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSave} className="space-y-6">
        
        {/* Store Profile Card */}
        <div className="card-airbnb p-6 bg-white space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-hairline">
            <Store className="w-5 h-5 text-[#ff385c]" />
            <h3 className="font-bold text-sm text-ink">ข้อมูลกิจการร้านค้า (Store Profile)</h3>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-semibold text-muted-text block mb-1">ชื่อร้านจำหน่าย *</label>
              <input
                type="text"
                value={settings.store_name || ''}
                onChange={(e) => setSettings({ ...settings, store_name: e.target.value })}
                className="w-full bg-surface-soft border border-hairline rounded-xl p-2.5 text-ink text-xs"
              />
            </div>

            <div>
              <label className="font-semibold text-muted-text block mb-1">ชื่อสาขา *</label>
              <input
                type="text"
                value={settings.store_branch || ''}
                onChange={(e) => setSettings({ ...settings, store_branch: e.target.value })}
                className="w-full bg-surface-soft border border-hairline rounded-xl p-2.5 text-ink text-xs"
              />
            </div>

            <div>
              <label className="font-semibold text-muted-text block mb-1">เลขประจำตัวผู้เสียภาษี (Tax ID) *</label>
              <input
                type="text"
                value={settings.tax_id || ''}
                onChange={(e) => setSettings({ ...settings, tax_id: e.target.value })}
                className="w-full bg-surface-soft border border-hairline rounded-xl p-2.5 text-ink text-xs font-mono"
              />
            </div>

            <div>
              <label className="font-semibold text-muted-text block mb-1">เบอร์โทรศัพท์ติดต่อ *</label>
              <input
                type="text"
                value={settings.phone || ''}
                onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                className="w-full bg-surface-soft border border-hairline rounded-xl p-2.5 text-ink text-xs"
              />
            </div>

            <div className="col-span-2">
              <label className="font-semibold text-muted-text block mb-1">ที่อยู่สถานประกอบการ *</label>
              <input
                type="text"
                value={settings.address || ''}
                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                className="w-full bg-surface-soft border border-hairline rounded-xl p-2.5 text-ink text-xs"
              />
            </div>
          </div>
        </div>

        {/* Document Numbering Prefixes */}
        <div className="card-airbnb p-6 bg-white space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-hairline">
            <FileText className="w-5 h-5 text-ink" />
            <h3 className="font-bold text-sm text-ink">คำนำหน้าเลขที่เอกสาร (Document Prefixes)</h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="font-semibold text-muted-text block mb-1">บิลขาย (Invoice)</label>
              <input
                type="text"
                value={settings.prefix_inv || ''}
                onChange={(e) => setSettings({ ...settings, prefix_inv: e.target.value })}
                className="w-full bg-surface-soft border border-hairline rounded-xl p-2 text-ink font-mono text-xs"
              />
            </div>
            <div>
              <label className="font-semibold text-muted-text block mb-1">ใบเสนอราคา (Quotation)</label>
              <input
                type="text"
                value={settings.prefix_quo || ''}
                onChange={(e) => setSettings({ ...settings, prefix_quo: e.target.value })}
                className="w-full bg-surface-soft border border-hairline rounded-xl p-2 text-ink font-mono text-xs"
              />
            </div>
            <div>
              <label className="font-semibold text-muted-text block mb-1">ใบสั่งซื้อ (PO)</label>
              <input
                type="text"
                value={settings.prefix_po || ''}
                onChange={(e) => setSettings({ ...settings, prefix_po: e.target.value })}
                className="w-full bg-surface-soft border border-hairline rounded-xl p-2 text-ink font-mono text-xs"
              />
            </div>
            <div>
              <label className="font-semibold text-muted-text block mb-1">ใบรับสินค้า (GRN)</label>
              <input
                type="text"
                value={settings.prefix_grn || ''}
                onChange={(e) => setSettings({ ...settings, prefix_grn: e.target.value })}
                className="w-full bg-surface-soft border border-hairline rounded-xl p-2 text-ink font-mono text-xs"
              />
            </div>
          </div>
        </div>

        {/* Save button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="btn-rausch text-xs py-2.5 px-8 cursor-pointer font-semibold shadow-sm"
          >
            {isSaving ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}
          </button>
        </div>

      </form>

      {/* Database Mockup Seeding Card */}
      <div className="card-airbnb p-6 bg-white border border-red-200 space-y-3">
        <div className="flex items-center gap-2 text-red-600 font-bold text-sm">
          <AlertTriangle className="w-5 h-5" />
          <span>รีเซ็ตและสร้างข้อมูลจำลองใหม่ (Reset & Re-seed Mockup Data)</span>
        </div>
        <p className="text-xs text-muted-text leading-relaxed">
          หากต้องการเริ่มทดสอบระบบใหม่ทั้งหมด คุณสามารถกดปุ่มนี้เพื่อล้างข้อมูลและโหลดข้อมูลตัวอย่างวัสดุก่อสร้างไทย (ปูน SCG, เหล็ก TATA, ท่อตราช้าง, ยาแนวจระเข้, สี TOA, ลูกหนี้ผู้รับเหมา, ยอดสต็อก 4 คลัง, กะขาย และบิลตัวอย่าง) กลับมาใหม่ได้ทันที
        </p>

        <div className="pt-2">
          <button
            type="button"
            onClick={onResetSeed}
            disabled={isReseeding}
            className="px-4 py-2 rounded-xl bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 text-xs font-bold transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <RotateCcw className={`w-4 h-4 ${isReseeding ? 'animate-spin' : ''}`} />
            <span>{isReseeding ? 'กำลังสร้างข้อมูลจำลอง...' : 'ล้างและโหลดข้อมูลจำลองใหม่เดี๋ยวนี้'}</span>
          </button>
        </div>
      </div>

    </div>
  );
}
