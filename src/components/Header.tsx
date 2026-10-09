'use client';

import React from 'react';
import { 
  Building2, 
  Search, 
  UserCircle2, 
  Clock, 
  MapPin, 
  ShieldCheck, 
  RotateCcw
} from 'lucide-react';

interface HeaderProps {
  currentRole: string;
  onRoleChange: (role: string) => void;
  activeShift: any;
  onOpenShiftModal: () => void;
  onQuickSearch: (query: string) => void;
  onResetSeed: () => void;
  isReseeding: boolean;
}

export function Header({
  currentRole,
  onRoleChange,
  activeShift,
  onOpenShiftModal,
  onQuickSearch,
  onResetSeed,
  isReseeding
}: HeaderProps) {
  const [searchTerm, setSearchTerm] = React.useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onQuickSearch(searchTerm);
  };

  return (
    <header className="bg-canvas border-b border-hairline sticky top-0 z-40 bg-white/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between gap-4">
        
        {/* Brand Logo & Store Info */}
        <div className="flex items-center gap-3 min-w-[260px]">
          <div className="w-11 h-11 rounded-xl bg-[#ff385c] flex items-center justify-center text-white shadow-sm">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg text-ink tracking-tight">CONSTRUCT ERP</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-surface-strong text-muted-text border border-hairline">
                v1.0
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-text font-normal">
              <MapPin className="w-3.5 h-3.5 text-muted-text" />
              <span>สมบูรณ์ ค้าวัสดุก่อสร้าง (สาขาใหญ่)</span>
            </div>
          </div>
        </div>

        {/* Global Pill Search Bar (Airbnb Style) */}
        <form onSubmit={handleSearchSubmit} className="hidden md:flex flex-1 max-w-md items-center">
          <div className="search-bar-pill flex items-center w-full px-2 py-1.5 gap-2">
            <div className="flex-1 px-3">
              <div className="text-[10px] font-semibold tracking-wider uppercase text-muted-text">ค้นหาสินค้า / บาร์โค้ด</div>
              <input
                type="text"
                placeholder="เช่น ปูนเสือ, DB12, 885123..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full text-xs text-ink bg-transparent focus:outline-none placeholder:text-muted-text/60"
              />
            </div>
            <button 
              type="submit" 
              className="search-orb cursor-pointer shrink-0"
              title="ค้นหา"
            >
              <Search className="w-4 h-4" />
            </button>
          </div>
        </form>

        {/* Utilities & Role Switcher */}
        <div className="flex items-center gap-3">
          
          {/* Shift Status Pill */}
          <button
            onClick={onOpenShiftModal}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border flex items-center gap-2 transition cursor-pointer ${
              activeShift
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100'
                : 'bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>{activeShift ? `กะเปิดอยู่ (#${activeShift.id})` : 'กะปิดอยู่'}</span>
          </button>

          {/* Quick Reseed DB Button */}
          <button
            onClick={onResetSeed}
            disabled={isReseeding}
            className="p-2 rounded-lg border border-hairline hover:bg-surface-soft text-muted-text hover:text-ink transition cursor-pointer text-xs flex items-center gap-1"
            title="รีเซ็ตและโหลดข้อมูลตัวอย่าง (Mockup Data)"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isReseeding ? 'animate-spin' : ''}`} />
            <span className="hidden lg:inline">{isReseeding ? 'กำลังรีเซ็ต...' : 'รีเซ็ตข้อมูล'}</span>
          </button>

          {/* Role Switcher Pill */}
          <div className="flex items-center gap-2 pl-2 border-l border-hairline">
            <UserCircle2 className="w-5 h-5 text-muted-text" />
            <div className="text-right hidden sm:block">
              <div className="text-xs font-semibold text-ink">
                {currentRole === 'admin' && 'สมศักดิ์ (ผู้จัดการ)'}
                {currentRole === 'cashier' && 'วิภา (แคชเชียร์)'}
                {currentRole === 'warehouse' && 'ชาญชัย (คลัง)'}
                {currentRole === 'purchasing' && 'นันทนา (จัดซื้อ)'}
                {currentRole === 'finance' && 'สุพัตรา (การเงิน)'}
              </div>
              <div className="text-[10px] text-muted-text uppercase font-medium">สิทธิ์: {currentRole}</div>
            </div>
            
            <select
              value={currentRole}
              onChange={(e) => onRoleChange(e.target.value)}
              className="text-xs bg-surface-soft border border-hairline rounded-lg px-2 py-1 text-ink focus:outline-none focus:ring-1 focus:ring-[#ff385c]"
            >
              <option value="admin">Admin</option>
              <option value="cashier">Cashier</option>
              <option value="warehouse">Warehouse</option>
              <option value="purchasing">Purchasing</option>
              <option value="finance">Finance</option>
            </select>
          </div>

        </div>

      </div>
    </header>
  );
}
