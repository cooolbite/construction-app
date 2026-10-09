'use client';

import React from 'react';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Boxes, 
  FileText, 
  ShoppingCart, 
  Warehouse, 
  Truck, 
  Users, 
  Building, 
  Wallet, 
  BarChart3, 
  Settings
} from 'lucide-react';

export type NavTab = 
  | 'dashboard'
  | 'pos'
  | 'products'
  | 'quotations'
  | 'purchasing'
  | 'warehouse'
  | 'deliveries'
  | 'ar'
  | 'ap'
  | 'finance'
  | 'reports'
  | 'settings';

interface NavigationProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  cartCount?: number;
}

export function Navigation({ activeTab, onTabChange, cartCount = 0 }: NavigationProps) {
  const tabs = [
    { id: 'dashboard', label: 'แดชบอร์ด', icon: LayoutDashboard },
    { id: 'pos', label: 'ขาย POS', icon: ShoppingBag, badge: cartCount > 0 ? cartCount : undefined },
    { id: 'products', label: 'สินค้า & ราคา', icon: Boxes },
    { id: 'quotations', label: 'ใบเสนอราคา', icon: FileText },
    { id: 'purchasing', label: 'จัดซื้อ & รับของ', icon: ShoppingCart },
    { id: 'warehouse', label: 'คลังสินค้า', icon: Warehouse },
    { id: 'deliveries', label: 'จัดส่งสินค้า', icon: Truck },
    { id: 'ar', label: 'ลูกหนี้ AR', icon: Users },
    { id: 'ap', label: 'เจ้าหนี้ AP', icon: Building },
    { id: 'finance', label: 'การเงิน & กะ', icon: Wallet },
    { id: 'reports', label: 'รายงาน', icon: BarChart3 },
    { id: 'settings', label: 'ตั้งค่าระบบ', icon: Settings },
  ];

  return (
    <nav className="bg-canvas border-b border-hairline overflow-x-auto scrollbar-none sticky top-20 z-30 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-start sm:justify-center gap-6 sm:gap-8 min-w-max">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id as NavTab)}
              className={`flex flex-col items-center justify-center py-3.5 px-1 relative transition group cursor-pointer ${
                isActive 
                  ? 'text-ink font-semibold' 
                  : 'text-muted-text hover:text-ink font-normal'
              }`}
            >
              <div className="relative mb-1">
                <Icon className={`w-5 h-5 transition ${isActive ? 'stroke-[2.2px] text-ink' : 'stroke-[1.6px] text-muted-text group-hover:text-ink'}`} />
                {tab.badge !== undefined && (
                  <span className="absolute -top-1.5 -right-2.5 bg-[#ff385c] text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full min-w-4 text-center">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="text-xs tracking-tight whitespace-nowrap">
                {tab.label}
              </span>

              {/* Airbnb Signature 2px bottom underline */}
              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-ink rounded-t-sm" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
