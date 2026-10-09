'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Navigation, NavTab } from '@/components/Navigation';
import { DashboardView } from '@/components/DashboardView';
import { PosView } from '@/components/PosView';
import { ProductsView } from '@/components/ProductsView';
import { QuotationsView } from '@/components/QuotationsView';
import { PurchasingView } from '@/components/PurchasingView';
import { WarehouseView } from '@/components/WarehouseView';
import { DeliveriesView } from '@/components/DeliveriesView';
import { ArView } from '@/components/ArView';
import { ApView } from '@/components/ApView';
import { FinanceView } from '@/components/FinanceView';
import { ReportsView } from '@/components/ReportsView';
import { SettingsView } from '@/components/SettingsView';
import { ReceiptModal } from '@/components/ReceiptModal';
import { ShiftModal } from '@/components/ShiftModal';

export default function Home() {
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [currentRole, setCurrentRole] = useState<string>('admin');

  // Core Data States
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [quotations, setQuotations] = useState<any[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [activeShift, setActiveShift] = useState<any>(null);

  // Modals
  const [receiptInvoice, setReceiptInvoice] = useState<any>(null);
  const [showShiftModal, setShowShiftModal] = useState<boolean>(false);
  const [isReseeding, setIsReseeding] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  // Initial load
  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      // 1. Dashboard & Shift
      const [dashRes, prodRes, custRes, supRes, setRes, quoRes, poRes, delRes, shiftRes] = await Promise.all([
        fetch('/api/dashboard').then(r => r.json()),
        fetch('/api/products').then(r => r.json()),
        fetch('/api/customers').then(r => r.json()),
        fetch('/api/suppliers').then(r => r.json()),
        fetch('/api/settings').then(r => r.json()),
        fetch('/api/quotations').then(r => r.json()),
        fetch('/api/purchasing').then(r => r.json()),
        fetch('/api/deliveries').then(r => r.json()),
        fetch('/api/pos/shift').then(r => r.json())
      ]);

      setDashboardData(dashRes);
      setProducts(Array.isArray(prodRes) ? prodRes : []);
      setCustomers(Array.isArray(custRes) ? custRes : []);
      setSuppliers(Array.isArray(supRes) ? supRes : []);
      setWarehouses(setRes?.warehouses || []);
      setUnits(setRes?.units || []);
      setCategories(setRes?.categories || []);
      setQuotations(Array.isArray(quoRes) ? quoRes : []);
      setPurchaseOrders(Array.isArray(poRes) ? poRes : []);
      setDeliveries(Array.isArray(delRes) ? delRes : []);
      setActiveShift(shiftRes?.active_shift || null);
    } catch (e) {
      console.error('Error fetching data:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleResetSeed = async () => {
    if (!confirm('ยืนยันรีเซ็ตฐานข้อมูลและสร้างข้อมูลตัวอย่างใหม่? ข้อมูลที่มีอยู่จะถูกแทนที่ด้วยข้อมูลตั้งต้นสำหรับทดสอบ')) {
      return;
    }
    setIsReseeding(true);
    try {
      const res = await fetch('/api/seed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ force: true })
      });
      if (res.ok) {
        alert('รีเซ็ตและโหลดข้อมูลตัวอย่างวัสดุก่อสร้างสำเร็จ!');
        await fetchAllData();
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsReseeding(false);
    }
  };

  const handleQuickSearch = (query: string) => {
    if (!query) return;
    setActiveTab('products');
  };

  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col font-sans">
      
      {/* 1. Global Header */}
      <Header
        currentRole={currentRole}
        onRoleChange={setCurrentRole}
        activeShift={activeShift}
        onOpenShiftModal={() => setShowShiftModal(true)}
        onQuickSearch={handleQuickSearch}
        onResetSeed={handleResetSeed}
        isReseeding={isReseeding}
      />

      {/* 2. Airbnb-inspired Product/Module Tabs Navigation */}
      <Navigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* 3. Main Workspace Canvas */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        
        {activeTab === 'dashboard' && (
          <DashboardView
            data={dashboardData}
            loading={loading}
            onNavigateTab={setActiveTab}
            onViewInvoice={(inv) => setReceiptInvoice(inv)}
            onOpenShiftModal={() => setShowShiftModal(true)}
          />
        )}

        {activeTab === 'pos' && (
          <PosView
            products={products}
            customers={customers}
            warehouses={warehouses}
            activeShift={activeShift}
            onOpenShiftModal={() => setShowShiftModal(true)}
            onCheckoutSuccess={(inv) => {
              setReceiptInvoice(inv);
              fetchAllData();
            }}
          />
        )}

        {activeTab === 'products' && (
          <ProductsView
            products={products}
            categories={categories}
            units={units}
            warehouses={warehouses}
            onRefresh={fetchAllData}
          />
        )}

        {activeTab === 'quotations' && (
          <QuotationsView
            quotations={quotations}
            customers={customers}
            products={products}
            onRefresh={fetchAllData}
            onViewInvoice={(inv) => setReceiptInvoice(inv)}
          />
        )}

        {activeTab === 'purchasing' && (
          <PurchasingView
            purchaseOrders={purchaseOrders}
            suppliers={suppliers}
            products={products}
            warehouses={warehouses}
            onRefresh={fetchAllData}
          />
        )}

        {activeTab === 'warehouse' && (
          <WarehouseView
            products={products}
            warehouses={warehouses}
            onRefresh={fetchAllData}
          />
        )}

        {activeTab === 'deliveries' && (
          <DeliveriesView
            deliveries={deliveries}
            customers={customers}
            onRefresh={fetchAllData}
          />
        )}

        {activeTab === 'ar' && (
          <ArView
            onRefresh={fetchAllData}
            onViewInvoice={(inv) => setReceiptInvoice(inv)}
          />
        )}

        {activeTab === 'ap' && (
          <ApView
            onRefresh={fetchAllData}
          />
        )}

        {activeTab === 'finance' && (
          <FinanceView
            activeShift={activeShift}
            onOpenShiftModal={() => setShowShiftModal(true)}
            onRefresh={fetchAllData}
          />
        )}

        {activeTab === 'reports' && (
          <ReportsView />
        )}

        {activeTab === 'settings' && (
          <SettingsView
            onResetSeed={handleResetSeed}
            isReseeding={isReseeding}
          />
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-hairline py-6 text-center text-xs text-muted-text bg-white mt-12 no-print">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            © 2026 สมบูรณ์ ค้าวัสดุก่อสร้าง • Construction Materials ERP System
          </div>
          <div className="flex items-center gap-4 text-muted-text">
            <span>ฐานข้อมูล: SQLite (WAL Mode)</span>
            <span>ดีไซน์: Airbnb Design Guidelines</span>
            <span>สกุลเงิน: THB (บาท)</span>
          </div>
        </div>
      </footer>

      {/* Global Modals */}
      <ReceiptModal
        isOpen={!!receiptInvoice}
        onClose={() => setReceiptInvoice(null)}
        invoice={receiptInvoice}
      />

      <ShiftModal
        isOpen={showShiftModal}
        onClose={() => setShowShiftModal(false)}
        activeShift={activeShift}
        onRefresh={fetchAllData}
      />

    </div>
  );
}
