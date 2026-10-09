// Core types for Construction Materials ERP (ระบบ ERP ร้านวัสดุก่อสร้าง)

export interface User {
  id: number;
  username: string;
  name: string;
  role: 'admin' | 'cashier' | 'warehouse' | 'purchasing' | 'finance';
  active: number;
}

export interface Unit {
  id: number;
  code: string;
  name: string;
}

export interface Category {
  id: number;
  code: string;
  name: string;
}

export interface ProductUom {
  id: number;
  product_id: number;
  unit_id: number;
  unit_name: string;
  conversion_factor: number; // e.g. 1 bundle = 10 pieces
  barcode: string;
  price_multiplier: number;
}

export interface Product {
  id: number;
  sku: string;
  name: string;
  description: string;
  category_id: number;
  category_name?: string;
  base_unit_id: number;
  base_unit_name?: string;
  cost_price: number;
  retail_price: number; // ขายปลีก
  technician_price: number; // ช่าง
  contractor_price: number; // ผู้รับเหมา
  project_price: number; // โครงการ
  min_stock: number;
  max_stock: number;
  reorder_point: number;
  image_url: string;
  is_active: number;
  total_stock?: number;
  uoms?: ProductUom[];
  barcodes?: string[];
}

export interface Warehouse {
  id: number;
  code: string;
  name: string;
  location: string;
}

export interface InventoryBalance {
  product_id: number;
  warehouse_id: number;
  product_name: string;
  sku: string;
  warehouse_name: string;
  unit_name: string;
  quantity: number;
  min_stock: number;
  reorder_point: number;
}

export interface StockCard {
  id: number;
  product_id: number;
  product_name?: string;
  sku?: string;
  warehouse_id: number;
  warehouse_name?: string;
  doc_type: string;
  doc_no: string;
  movement_type: 'IN' | 'OUT' | 'ADJ';
  quantity: number;
  unit_name?: string;
  unit_cost: number;
  balance_after: number;
  note: string;
  created_by: string;
  created_at: string;
}

export interface Customer {
  id: number;
  code: string;
  name: string;
  customer_type: 'individual' | 'contractor' | 'project';
  phone: string;
  address: string;
  tax_id: string;
  credit_limit: number;
  credit_term_days: number;
  current_balance: number; // amount owed
  price_tier: 'retail' | 'technician' | 'contractor' | 'project';
}

export interface Supplier {
  id: number;
  code: string;
  name: string;
  contact_name: string;
  phone: string;
  email: string;
  address: string;
  tax_id: string;
  payment_term_days: number;
  current_balance?: number;
}

export interface Shift {
  id: number;
  user_id: number;
  user_name?: string;
  opening_cash: number;
  closing_cash?: number;
  expected_cash?: number;
  opened_at: string;
  closed_at?: string;
  status: 'open' | 'closed';
  notes?: string;
  total_sales?: number;
  cash_sales?: number;
}

export interface SalesItem {
  id?: number;
  sale_id?: number;
  product_id: number;
  product_name?: string;
  sku?: string;
  uom_id?: number;
  unit_name: string;
  quantity: number;
  base_quantity: number;
  unit_price: number;
  discount: number;
  total_price: number;
  unit_cost: number;
}

export interface SalesOrder {
  id: number;
  doc_no: string;
  doc_type: 'POS' | 'INVOICE' | 'TAX_INVOICE';
  customer_id?: number;
  customer_name?: string;
  shift_id?: number;
  user_id: number;
  user_name?: string;
  status: 'completed' | 'held' | 'cancelled';
  subtotal: number;
  discount_amount: number;
  vat_rate: number;
  vat_amount: number;
  total_amount: number;
  payment_status: 'paid' | 'partial' | 'unpaid';
  payment_method: 'cash' | 'transfer' | 'credit_card' | 'credit' | 'mixed';
  cash_tendered: number;
  change_amount: number;
  notes?: string;
  created_at: string;
  items?: SalesItem[];
}

export interface QuotationItem {
  id?: number;
  quotation_id?: number;
  product_id: number;
  product_name?: string;
  sku?: string;
  uom_id?: number;
  unit_name: string;
  quantity: number;
  unit_price: number;
  discount: number;
  total_price: number;
}

export interface Quotation {
  id: number;
  doc_no: string;
  customer_id: number;
  customer_name?: string;
  user_id: number;
  user_name?: string;
  valid_until: string;
  status: 'draft' | 'sent' | 'accepted' | 'converted' | 'rejected';
  subtotal: number;
  discount_amount: number;
  vat_amount: number;
  total_amount: number;
  notes?: string;
  created_at: string;
  items?: QuotationItem[];
}

export interface PurchaseItem {
  id?: number;
  po_id?: number;
  product_id: number;
  product_name?: string;
  sku?: string;
  uom_id?: number;
  unit_name: string;
  quantity: number;
  received_quantity: number;
  unit_cost: number;
  total_cost: number;
}

export interface PurchaseOrder {
  id: number;
  doc_no: string;
  supplier_id: number;
  supplier_name?: string;
  user_id: number;
  user_name?: string;
  status: 'draft' | 'ordered' | 'partial' | 'received' | 'cancelled';
  expected_date: string;
  subtotal: number;
  vat_amount: number;
  total_amount: number;
  notes?: string;
  created_at: string;
  items?: PurchaseItem[];
}

export interface Delivery {
  id: number;
  doc_no: string;
  sale_id: number;
  sale_doc_no?: string;
  customer_id: number;
  customer_name?: string;
  recipient_name: string;
  recipient_phone: string;
  delivery_address: string;
  vehicle_type: string; // กระบะ 4 ล้อ, รถ 6 ล้อ, รถเฮี๊ยบ
  vehicle_plate: string;
  driver_name: string;
  scheduled_date: string;
  status: 'pending' | 'preparing' | 'in_transit' | 'delivered' | 'failed';
  proof_note?: string;
  created_at: string;
}

export interface Expense {
  id: number;
  doc_no: string;
  category: string;
  amount: number;
  payment_method: string;
  shift_id?: number;
  note: string;
  user_id: number;
  user_name?: string;
  created_at: string;
}

export interface StockCountItem {
  id?: number;
  count_id?: number;
  product_id: number;
  product_name?: string;
  sku?: string;
  unit_name?: string;
  system_qty: number;
  counted_qty: number;
  diff_qty: number;
  notes?: string;
}

export interface StockCount {
  id: number;
  doc_no: string;
  warehouse_id: number;
  warehouse_name?: string;
  status: 'draft' | 'completed';
  user_id: number;
  user_name?: string;
  notes?: string;
  created_at: string;
  items?: StockCountItem[];
}

export interface SystemSettings {
  store_name: string;
  store_branch: string;
  tax_id: string;
  address: string;
  phone: string;
  vat_rate: number;
  default_warehouse_id: number;
  allow_negative_stock: boolean;
  prefix_inv: string;
  prefix_quo: string;
  prefix_po: string;
  prefix_grn: string;
  prefix_del: string;
}
