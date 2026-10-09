'use client';

import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Barcode, 
  Plus, 
  Minus, 
  Trash2, 
  CreditCard, 
  Banknote, 
  ArrowRight, 
  Clock, 
  User, 
  Layers, 
  CheckCircle2, 
  PauseCircle, 
  PlayCircle,
  FileCheck
} from 'lucide-react';

interface PosViewProps {
  products: any[];
  customers: any[];
  warehouses: any[];
  activeShift: any;
  onOpenShiftModal: () => void;
  onCheckoutSuccess: (invoice: any) => void;
}

export function PosView({
  products,
  customers,
  warehouses,
  activeShift,
  onOpenShiftModal,
  onCheckoutSuccess
}: PosViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<number>(2); // Default หน้าร้าน
  const [selectedCustomerId, setSelectedCustomerId] = useState<number>(1); // Default ลูกค้าทั่วไป
  
  // Cart state
  const [cart, setCart] = useState<any[]>([]);
  const [heldCarts, setHeldCarts] = useState<any[]>([]);

  // Checkout Modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer' | 'credit_card' | 'credit'>('cash');
  const [cashTendered, setCashTendered] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  // Selected customer details
  const selectedCustomer = useMemo(() => {
    return customers.find(c => c.id === Number(selectedCustomerId)) || customers[0] || { price_tier: 'retail', name: 'ลูกค้าทั่วไป' };
  }, [customers, selectedCustomerId]);

  // Categories list
  const categories = useMemo(() => {
    const map = new Map<number, string>();
    for (const p of products) {
      if (p.category_id && p.category_name) {
        map.set(p.category_id, p.category_name);
      }
    }
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [products]);

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchCat = selectedCategory === null || p.category_id === selectedCategory;
      const q = searchTerm.toLowerCase().trim();
      const matchSearch = !q || 
        p.name.toLowerCase().includes(q) || 
        p.sku.toLowerCase().includes(q) || 
        (p.barcodes && p.barcodes.some((b: string) => b.includes(q)));
      return matchCat && matchSearch;
    });
  }, [products, selectedCategory, searchTerm]);

  // Determine unit price based on customer price tier
  const getProductPrice = (p: any, uomFactor: number = 1) => {
    const tier = selectedCustomer.price_tier || 'retail';
    let basePrice = p.retail_price;
    if (tier === 'technician') basePrice = p.technician_price || p.retail_price;
    else if (tier === 'contractor') basePrice = p.contractor_price || p.retail_price;
    else if (tier === 'project') basePrice = p.project_price || p.retail_price;
    return basePrice * uomFactor;
  };

  // Add item to cart
  const addToCart = (product: any, selectedUom?: any) => {
    const uom = selectedUom || (product.uoms && product.uoms[0]) || {
      unit_id: product.base_unit_id,
      unit_name: product.base_unit_name || 'ชิ้น',
      conversion_factor: 1,
      id: null
    };

    const factor = uom.conversion_factor || 1;
    const unitPrice = getProductPrice(product, factor);

    setCart(prev => {
      const existingIdx = prev.findIndex(item => item.product_id === product.id && item.uom_id === uom.id);
      if (existingIdx >= 0) {
        const next = [...prev];
        next[existingIdx].quantity += 1;
        next[existingIdx].total_price = (next[existingIdx].quantity * next[existingIdx].unit_price) - (next[existingIdx].discount || 0);
        return next;
      } else {
        return [...prev, {
          product_id: product.id,
          sku: product.sku,
          product_name: product.name,
          uom_id: uom.id,
          unit_name: uom.unit_name || product.base_unit_name,
          conversion_factor: factor,
          cost_price: product.cost_price * factor,
          unit_price: unitPrice,
          quantity: 1,
          discount: 0,
          total_price: unitPrice,
          available_uoms: product.uoms || []
        }];
      }
    });
  };

  // Update item quantity
  const updateQuantity = (index: number, delta: number) => {
    setCart(prev => {
      const next = [...prev];
      const newQty = next[index].quantity + delta;
      if (newQty <= 0) {
        return next.filter((_, i) => i !== index);
      }
      next[index].quantity = newQty;
      next[index].total_price = (newQty * next[index].unit_price) - (next[index].discount || 0);
      return next;
    });
  };

  // Remove item
  const removeItem = (index: number) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  };

  // Change UOM in cart
  const changeUom = (index: number, newUomId: number, productOriginal: any) => {
    setCart(prev => {
      const next = [...prev];
      const targetUom = productOriginal?.uoms?.find((u: any) => u.id === Number(newUomId));
      if (targetUom) {
        const factor = targetUom.conversion_factor || 1;
        const newPrice = getProductPrice(productOriginal, factor);
        next[index].uom_id = targetUom.id;
        next[index].unit_name = targetUom.unit_name;
        next[index].conversion_factor = factor;
        next[index].unit_price = newPrice;
        next[index].total_price = (next[index].quantity * newPrice) - (next[index].discount || 0);
      }
      return next;
    });
  };

  // Cart totals
  const subtotal = useMemo(() => {
    return cart.reduce((sum, it) => sum + (it.quantity * it.unit_price), 0);
  }, [cart]);

  const discountAmount = useMemo(() => {
    return cart.reduce((sum, it) => sum + (Number(it.discount) || 0), 0);
  }, [cart]);

  const vatAmount = useMemo(() => {
    const afterDiscount = Math.max(0, subtotal - discountAmount);
    return Math.round((afterDiscount * 0.07) * 100) / 100;
  }, [subtotal, discountAmount]);

  const grandTotal = useMemo(() => {
    return (subtotal - discountAmount) + vatAmount;
  }, [subtotal, discountAmount, vatAmount]);

  // Hold cart
  const handleHoldCart = () => {
    if (cart.length === 0) return;
    setHeldCarts(prev => [
      ...prev,
      {
        id: Date.now(),
        cart,
        customer_id: selectedCustomerId,
        customer_name: selectedCustomer.name,
        time: new Date().toLocaleTimeString('th-TH')
      }
    ]);
    setCart([]);
  };

  // Recall cart
  const handleRecallCart = (heldId: number) => {
    const held = heldCarts.find(h => h.id === heldId);
    if (held) {
      setCart(held.cart);
      setSelectedCustomerId(held.customer_id);
      setHeldCarts(prev => prev.filter(h => h.id !== heldId));
    }
  };

  // Handle open checkout
  const handleOpenPayment = () => {
    if (cart.length === 0) return;
    setCashTendered(grandTotal);
    setCheckoutError(null);
    setShowPaymentModal(true);
  };

  // Submit checkout
  const handleExecuteCheckout = async () => {
    setIsSubmitting(true);
    setCheckoutError(null);

    try {
      const change = Math.max(0, cashTendered - grandTotal);
      const res = await fetch('/api/pos/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: selectedCustomerId,
          user_id: 2,
          warehouse_id: selectedWarehouseId,
          items: cart,
          subtotal,
          discount_amount: discountAmount,
          vat_rate: 7,
          vat_amount: vatAmount,
          total_amount: grandTotal,
          payment_method: paymentMethod,
          cash_tendered: paymentMethod === 'cash' ? cashTendered : grandTotal,
          change_amount: paymentMethod === 'cash' ? change : 0,
          doc_type: 'POS'
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'การชำระเงินขัดข้อง');
      }

      // Clear cart
      const completedInvoice = {
        ...data.invoice,
        customer_name: selectedCustomer.name,
        items: [...cart],
        subtotal,
        discount_amount: discountAmount,
        vat_amount: vatAmount,
        total_amount: grandTotal
      };
      setCart([]);
      setShowPaymentModal(false);
      onCheckoutSuccess(completedInvoice);
    } catch (err: any) {
      setCheckoutError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-160px)]">
      
      {/* Left Column: Product Catalog & Scanner */}
      <div className="flex-1 flex flex-col min-w-0 bg-white rounded-2xl border border-hairline p-4 overflow-hidden">
        
        {/* Top Filter Bar */}
        <div className="space-y-3 pb-3 border-b border-hairline">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-3 text-muted-text" />
              <input
                type="text"
                placeholder="สแกนบาร์โค้ด หรือ พิมพ์ค้นหา (SKU, ชื่อสินค้า)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-surface-soft border border-hairline rounded-xl text-xs text-ink focus:outline-none focus:ring-1 focus:ring-[#ff385c]"
              />
            </div>
            
            <button
              onClick={() => setSearchTerm('')}
              className="p-2 border border-hairline rounded-xl hover:bg-surface-soft text-muted-text hover:text-ink cursor-pointer"
              title="ล้างคำค้นหา"
            >
              <Barcode className="w-4 h-4" />
            </button>
          </div>

          {/* Category Filter Badges */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition cursor-pointer ${
                selectedCategory === null 
                  ? 'bg-ink text-white' 
                  : 'bg-surface-soft text-muted-text hover:text-ink'
              }`}
            >
              ทั้งหมด ({products.length})
            </button>
            {categories.map(c => (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.id)}
                className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition cursor-pointer ${
                  selectedCategory === c.id 
                    ? 'bg-ink text-white' 
                    : 'bg-surface-soft text-muted-text hover:text-ink'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        {/* Product Cards Grid */}
        <div className="flex-1 overflow-y-auto pt-3 pr-1 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
          {filteredProducts.map(p => {
            const defaultUom = p.uoms && p.uoms[0];
            const currentPrice = getProductPrice(p, defaultUom?.conversion_factor || 1);
            return (
              <div
                key={p.id}
                onClick={() => addToCart(p, defaultUom)}
                className="card-airbnb p-3 flex flex-col justify-between hover:border-[#ff385c] cursor-pointer group transition"
              >
                <div className="space-y-2">
                  <div className="relative aspect-video rounded-lg overflow-hidden bg-surface-strong">
                    <img
                      src={p.image_url}
                      alt={p.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                    <span className="absolute top-1 left-1 text-[9px] font-bold px-1.5 py-0.5 rounded bg-black/60 text-white backdrop-blur-xs">
                      {p.sku}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-semibold text-xs text-ink line-clamp-2 leading-tight">
                      {p.name}
                    </h4>
                    <span className="text-[10px] text-muted-text block mt-0.5">
                      คลัง: {p.total_stock} {p.base_unit_name}
                    </span>
                  </div>
                </div>

                <div className="pt-2 mt-2 border-t border-hairline-soft flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-ink">
                      ฿{currentPrice.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-muted-text ml-0.5">
                      /{defaultUom?.unit_name || p.base_unit_name}
                    </span>
                  </div>
                  <div className="w-6 h-6 rounded-full bg-surface-soft group-hover:bg-[#ff385c] group-hover:text-white flex items-center justify-center text-muted-text transition">
                    <Plus className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>

      {/* Right Column: Active Cart & Cashier Control */}
      <div className="w-full lg:w-[420px] bg-white rounded-2xl border border-hairline p-4 flex flex-col justify-between shadow-sm">
        
        {/* Cart Header (Customer & Warehouse Selectors) */}
        <div className="space-y-3 pb-3 border-b border-hairline">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-sm text-ink flex items-center gap-1.5">
              <span>รายการขายหน้าร้าน</span>
              <span className="text-xs font-normal text-muted-text">({cart.length} รายการ)</span>
            </h2>

            {/* Held Cart indicator */}
            {heldCarts.length > 0 && (
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-amber-700 font-semibold bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                  พักบิลไว้ {heldCarts.length} ใบ
                </span>
                <button
                  onClick={() => handleRecallCart(heldCarts[0].id)}
                  className="text-[11px] text-[#ff385c] font-semibold hover:underline cursor-pointer"
                >
                  เรียกคืน
                </button>
              </div>
            )}
          </div>

          {/* Customer Selector */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <label className="text-[10px] font-semibold text-muted-text block mb-1">
                ลูกค้า (Customer)
              </label>
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(Number(e.target.value))}
                className="w-full bg-surface-soft border border-hairline rounded-lg p-1.5 text-xs text-ink focus:outline-none"
              >
                {customers.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.price_tier})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-semibold text-muted-text block mb-1">
                ตัดจากคลัง (Warehouse)
              </label>
              <select
                value={selectedWarehouseId}
                onChange={(e) => setSelectedWarehouseId(Number(e.target.value))}
                className="w-full bg-surface-soft border border-hairline rounded-lg p-1.5 text-xs text-ink focus:outline-none"
              >
                {warehouses.map(w => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto py-3 space-y-2.5 max-h-[360px]">
          {cart.length === 0 ? (
            <div className="text-center py-16 text-muted-text">
              <Layers className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-xs">ยังไม่มีรายการสินค้า</p>
              <p className="text-[10px] mt-0.5">เลือกสินค้าจากรายการด้านซ้ายเพื่อเปิดบิล</p>
            </div>
          ) : (
            cart.map((item, idx) => {
              const originalProd = products.find(p => p.id === item.product_id);
              return (
                <div key={idx} className="p-2.5 rounded-xl border border-hairline bg-surface-soft/40 flex flex-col gap-2">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <div className="font-semibold text-xs text-ink">{item.product_name}</div>
                      <div className="text-[10px] text-muted-text">SKU: {item.sku}</div>
                    </div>
                    <button
                      onClick={() => removeItem(idx)}
                      className="text-muted-text hover:text-red-600 transition p-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-hairline-soft">
                    {/* Multi-UOM Selector */}
                    {item.available_uoms && item.available_uoms.length > 1 ? (
                      <select
                        value={item.uom_id}
                        onChange={(e) => changeUom(idx, Number(e.target.value), originalProd)}
                        className="text-[11px] bg-white border border-hairline rounded px-1.5 py-0.5 text-ink"
                      >
                        {item.available_uoms.map((u: any) => (
                          <option key={u.id} value={u.id}>
                            {u.unit_name} (x{u.conversion_factor})
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-[11px] text-muted-text">{item.unit_name}</span>
                    )}

                    {/* Quantity Stepper */}
                    <div className="flex items-center border border-hairline rounded-lg bg-white overflow-hidden">
                      <button
                        onClick={() => updateQuantity(idx, -1)}
                        className="px-2 py-0.5 hover:bg-surface-strong text-muted-text cursor-pointer"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="px-2 text-xs font-bold text-ink min-w-5 text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(idx, 1)}
                        className="px-2 py-0.5 hover:bg-surface-strong text-muted-text cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Line total */}
                    <div className="text-right">
                      <span className="font-bold text-xs text-ink">
                        ฿{item.total_price.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Cart Calculation & Action Buttons */}
        <div className="pt-3 border-t border-hairline space-y-2">
          <div className="space-y-1 text-xs">
            <div className="flex justify-between text-muted-text">
              <span>ยอดรวมสินค้า:</span>
              <span>฿{subtotal.toLocaleString()}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-red-600">
                <span>ส่วนลด:</span>
                <span>-฿{discountAmount.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between text-muted-text">
              <span>ภาษีมูลค่าเพิ่ม (VAT 7%):</span>
              <span>฿{vatAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-ink pt-1.5 border-t border-hairline">
              <span>ยอดสุทธิทั้งสิ้น:</span>
              <span className="text-base text-[#ff385c]">
                ฿{grandTotal.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={handleHoldCart}
              disabled={cart.length === 0}
              className="btn-secondary text-xs py-2.5 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40"
            >
              <PauseCircle className="w-4 h-4 text-muted-text" />
              <span>พักบิล</span>
            </button>

            <button
              onClick={handleOpenPayment}
              disabled={cart.length === 0}
              className="btn-rausch text-xs py-2.5 flex items-center justify-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-40"
            >
              <Banknote className="w-4 h-4" />
              <span>ชำระเงิน</span>
            </button>
          </div>
        </div>

      </div>

      {/* Payment Tender Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-canvas border border-hairline rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-fadeIn">
            
            <div className="flex justify-between items-center pb-3 border-b border-hairline">
              <h3 className="font-bold text-base text-ink">รับชำระเงิน (Payment)</h3>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-muted-text hover:text-ink text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Total due display */}
            <div className="p-4 rounded-xl bg-surface-soft text-center">
              <span className="text-xs text-muted-text block">ยอดที่ต้องชำระ</span>
              <span className="text-3xl font-extrabold text-ink tracking-tight">
                ฿{grandTotal.toLocaleString()}
              </span>
              <span className="text-[11px] text-muted-text block mt-1">
                ลูกค้า: {selectedCustomer.name} (ระดับราคา: {selectedCustomer.price_tier})
              </span>
            </div>

            {/* Payment Method Selector */}
            <div className="grid grid-cols-4 gap-2 text-xs">
              {[
                { id: 'cash', label: 'เงินสด', icon: Banknote },
                { id: 'transfer', label: 'โอนเงิน', icon: CheckCircle2 },
                { id: 'credit_card', label: 'บัตรเครดิต', icon: CreditCard },
                { id: 'credit', label: 'ขายเชื่อ (AR)', icon: FileCheck },
              ].map(method => {
                const Icon = method.icon;
                const isSelected = paymentMethod === method.id;
                return (
                  <button
                    key={method.id}
                    onClick={() => setPaymentMethod(method.id as any)}
                    className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 transition cursor-pointer ${
                      isSelected
                        ? 'border-[#ff385c] bg-red-50/50 text-[#ff385c] font-bold'
                        : 'border-hairline hover:bg-surface-soft text-muted-text'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{method.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Cash Tender Calculation */}
            {paymentMethod === 'cash' && (
              <div className="space-y-3 p-3 bg-surface-soft/60 rounded-xl border border-hairline">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-ink">จำนวนเงินที่รับมา:</span>
                  <input
                    type="number"
                    value={cashTendered}
                    onChange={(e) => setCashTendered(Number(e.target.value) || 0)}
                    className="w-32 text-right bg-white border border-hairline rounded-lg px-2 py-1 text-sm font-bold text-ink focus:outline-none"
                  />
                </div>

                {/* Quick denomination buttons */}
                <div className="flex items-center gap-1.5 justify-end">
                  {[100, 500, 1000].map(amt => (
                    <button
                      key={amt}
                      onClick={() => setCashTendered(amt)}
                      className="text-[11px] px-2.5 py-1 rounded bg-white border border-hairline hover:bg-surface-strong cursor-pointer font-medium"
                    >
                      +{amt}
                    </button>
                  ))}
                  <button
                    onClick={() => setCashTendered(grandTotal)}
                    className="text-[11px] px-2.5 py-1 rounded bg-white border border-hairline hover:bg-surface-strong cursor-pointer font-medium"
                  >
                    พอดี
                  </button>
                </div>

                <div className="flex justify-between items-center text-sm font-bold pt-2 border-t border-hairline">
                  <span className="text-muted-text">เงินทอน (Change):</span>
                  <span className={`text-base ${cashTendered >= grandTotal ? 'text-emerald-700' : 'text-red-600'}`}>
                    ฿{(Math.max(0, cashTendered - grandTotal)).toLocaleString()}
                  </span>
                </div>
              </div>
            )}

            {/* Credit Sale Info */}
            {paymentMethod === 'credit' && (
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-1">
                <div className="font-bold flex items-center gap-1">
                  <span>ขายเชื่อ / วางบิลลูกหนี้</span>
                </div>
                <div>วงเงินเครดิตคงเหลือ: ฿{((selectedCustomer.credit_limit || 0) - (selectedCustomer.current_balance || 0)).toLocaleString()}</div>
                <div>กำหนดชำระ: {selectedCustomer.credit_term_days || 30} วัน</div>
              </div>
            )}

            {checkoutError && (
              <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
                {checkoutError}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="btn-secondary text-xs py-2 px-4 cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleExecuteCheckout}
                disabled={isSubmitting || (paymentMethod === 'cash' && cashTendered < grandTotal)}
                className="btn-rausch text-xs py-2.5 px-6 cursor-pointer disabled:opacity-50 flex items-center gap-2"
              >
                {isSubmitting ? 'กำลังบันทึก...' : 'ยืนยันและพิมพ์ใบเสร็จ'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
