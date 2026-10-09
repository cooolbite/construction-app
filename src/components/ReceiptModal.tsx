'use client';

import React, { useState } from 'react';
import { Printer, X, FileText, CheckCircle2 } from 'lucide-react';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: any;
}

export function ReceiptModal({ isOpen, onClose, invoice }: ReceiptModalProps) {
  const [printFormat, setPrintFormat] = useState<'thermal' | 'a4'>('thermal');

  if (!isOpen || !invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  const storeInfo = {
    name: 'สมบูรณ์ ค้าวัสดุก่อสร้าง',
    branch: 'สำนักงานใหญ่ บางบัวทอง (สาขา 00000)',
    address: '88/9 หมู่ 4 ถ.บางกรวย-ไทรน้อย ต.บางบัวทอง จ.นนทบุรี 11110',
    taxId: '0105562098765',
    phone: '02-987-6543, 081-234-5678'
  };

  const items = invoice.items || [];
  const subtotal = invoice.subtotal || 0;
  const discount = invoice.discount_amount || 0;
  const vat = invoice.vat_amount || 0;
  const total = invoice.total_amount || 0;
  const tendered = invoice.cash_tendered || total;
  const change = invoice.change_amount || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-canvas border border-hairline rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header Actions (No print) */}
        <div className="p-4 border-b border-hairline flex items-center justify-between no-print bg-surface-soft">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 text-emerald-800 rounded-lg">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-ink text-sm">การขายสำเร็จ / พิมพ์เอกสาร</h3>
              <p className="text-xs text-muted-text">เลขที่เอกสาร: {invoice.doc_no}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Format toggle */}
            <div className="flex bg-white rounded-lg border border-hairline p-0.5 text-xs">
              <button
                onClick={() => setPrintFormat('thermal')}
                className={`px-3 py-1.5 rounded-md font-medium transition cursor-pointer ${
                  printFormat === 'thermal' ? 'bg-[#ff385c] text-white' : 'text-muted-text hover:text-ink'
                }`}
              >
                สลิป 80mm
              </button>
              <button
                onClick={() => setPrintFormat('a4')}
                className={`px-3 py-1.5 rounded-md font-medium transition cursor-pointer ${
                  printFormat === 'a4' ? 'bg-[#ff385c] text-white' : 'text-muted-text hover:text-ink'
                }`}
              >
                ใบกำกับ A4
              </button>
            </div>

            <button
              onClick={handlePrint}
              className="btn-rausch text-xs py-2 px-3 flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>พิมพ์</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-muted-text hover:text-ink rounded-lg hover:bg-surface-strong cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Paper Canvas */}
        <div className="flex-1 overflow-y-auto p-6 flex justify-center bg-[#f0f0f0]">
          
          {/* Thermal Slip View */}
          {printFormat === 'thermal' ? (
            <div className="print-container bg-white w-[320px] p-4 text-xs font-mono shadow-md border border-hairline rounded-sm text-black">
              <div className="text-center pb-2 border-b border-dashed border-gray-400">
                <div className="font-bold text-sm tracking-tight">{storeInfo.name}</div>
                <div className="text-[10px] text-gray-700">{storeInfo.branch}</div>
                <div className="text-[10px] text-gray-700">{storeInfo.address}</div>
                <div className="text-[10px] text-gray-700">โทร: {storeInfo.phone}</div>
                <div className="text-[10px] text-gray-700 font-medium">เลขประจำตัวผู้เสียภาษี: {storeInfo.taxId}</div>
              </div>

              <div className="py-2 border-b border-dashed border-gray-400 text-[11px]">
                <div className="font-bold text-center text-xs my-0.5">ใบเสร็จรับเงิน / ใบกำกับภาษีอย่างย่อ</div>
                <div className="flex justify-between">
                  <span>เลขที่: {invoice.doc_no}</span>
                  <span>{new Date().toLocaleDateString('th-TH')}</span>
                </div>
                <div className="flex justify-between text-[10px] text-gray-600">
                  <span>แคชเชียร์: {invoice.user_name || 'วิภา (แคชเชียร์)'}</span>
                  <span>{new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div>ลูกค้า: {invoice.customer_name || 'ลูกค้าทั่วไป (Walk-in)'}</div>
              </div>

              {/* Items */}
              <div className="py-2 border-b border-dashed border-gray-400">
                <div className="flex justify-between font-bold text-[10px] pb-1 border-b border-gray-300">
                  <span>รายการ</span>
                  <span>จำนวน x ราคา</span>
                  <span>รวม</span>
                </div>
                <div className="space-y-1.5 pt-1.5">
                  {items.map((it: any, idx: number) => (
                    <div key={idx}>
                      <div className="truncate font-semibold">{it.product_name || it.sku}</div>
                      <div className="flex justify-between text-[10px] text-gray-700">
                        <span>{it.quantity} {it.unit_name} x ฿{it.unit_price?.toLocaleString()}</span>
                        <span className="font-medium text-black">฿{it.total_price?.toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="py-2 border-b border-dashed border-gray-400 space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span>ยอดรวม (Subtotal):</span>
                  <span>฿{subtotal.toLocaleString()}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>ส่วนลด:</span>
                    <span>-฿{discount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-600 text-[10px]">
                  <span>ภาษีมูลค่าเพิ่ม 7%:</span>
                  <span>฿{vat.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold text-sm pt-1 border-t border-gray-300">
                  <span>ยอดสุทธิ (Total):</span>
                  <span>฿{total.toLocaleString()}</span>
                </div>
              </div>

              {/* Payment Details */}
              <div className="py-2 border-b border-dashed border-gray-400 text-[10px] space-y-0.5">
                <div className="flex justify-between">
                  <span>วิธีชำระเงิน:</span>
                  <span className="font-semibold uppercase">
                    {invoice.payment_method === 'cash' && 'เงินสด (Cash)'}
                    {invoice.payment_method === 'transfer' && 'เงินโอน (PromptPay)'}
                    {invoice.payment_method === 'credit_card' && 'บัตรเครดิต'}
                    {invoice.payment_method === 'credit' && 'ขายเชื่อ (Credit Sale)'}
                  </span>
                </div>
                {invoice.payment_method === 'cash' && (
                  <>
                    <div className="flex justify-between">
                      <span>รับเงินมา:</span>
                      <span>฿{tendered.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between font-bold">
                      <span>เงินทอน:</span>
                      <span>฿{change.toLocaleString()}</span>
                    </div>
                  </>
                )}
              </div>

              <div className="text-center pt-3 text-[10px] text-gray-600">
                <p>*** ขอบคุณที่ใช้บริการ ***</p>
                <p>สินค้ามีปัญหาติดต่อได้ภายใน 7 วัน พร้อมใบเสร็จ</p>
              </div>
            </div>
          ) : (
            /* A4 Full Tax Invoice View */
            <div className="print-container bg-white w-full max-w-xl p-8 text-xs shadow-md border border-hairline rounded-sm text-black">
              <div className="flex justify-between items-start pb-4 border-b border-gray-300">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{storeInfo.name}</h2>
                  <p className="text-[11px] text-gray-600">{storeInfo.branch}</p>
                  <p className="text-[11px] text-gray-600">{storeInfo.address}</p>
                  <p className="text-[11px] text-gray-600">โทร: {storeInfo.phone}</p>
                  <p className="text-[11px] font-semibold text-gray-800">เลขประจำตัวผู้เสียภาษี: {storeInfo.taxId}</p>
                </div>
                <div className="text-right">
                  <span className="inline-block bg-gray-100 px-3 py-1 font-bold text-sm border border-gray-300 mb-2">
                    {invoice.doc_type === 'INVOICE' ? 'ใบส่งของ / ใบแจ้งหนี้' : 'ใบเสร็จรับเงิน / ใบกำกับภาษี'}
                  </span>
                  <p className="text-xs font-semibold">เลขที่: {invoice.doc_no}</p>
                  <p className="text-[11px] text-gray-600">วันที่: {new Date().toLocaleDateString('th-TH')}</p>
                </div>
              </div>

              {/* Customer Box */}
              <div className="my-4 p-3 border border-gray-200 rounded bg-gray-50/50">
                <span className="font-bold text-gray-800">ข้อมูลลูกค้า:</span>
                <p className="font-semibold text-gray-900">{invoice.customer_name || 'ลูกค้าทั่วไป'}</p>
                <p className="text-gray-600">{invoice.customer_address || 'หน้าร้าน'}</p>
                <p className="text-gray-600">โทร: {invoice.customer_phone || '-'}</p>
              </div>

              {/* Table */}
              <table className="w-full text-left border-collapse border border-gray-300 my-4 text-xs">
                <thead>
                  <tr className="bg-gray-100 font-bold border-b border-gray-300">
                    <th className="p-2 border-r border-gray-300 w-10 text-center">ลำดับ</th>
                    <th className="p-2 border-r border-gray-300">รายการสินค้า</th>
                    <th className="p-2 border-r border-gray-300 text-right w-20">จำนวน</th>
                    <th className="p-2 border-r border-gray-300 text-center w-16">หน่วย</th>
                    <th className="p-2 border-r border-gray-300 text-right w-24">ราคา/หน่วย</th>
                    <th className="p-2 text-right w-24">จำนวนเงิน</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it: any, i: number) => (
                    <tr key={i} className="border-b border-gray-200">
                      <td className="p-2 border-r border-gray-300 text-center">{i + 1}</td>
                      <td className="p-2 border-r border-gray-300 font-medium">{it.product_name || it.sku}</td>
                      <td className="p-2 border-r border-gray-300 text-right">{it.quantity}</td>
                      <td className="p-2 border-r border-gray-300 text-center">{it.unit_name}</td>
                      <td className="p-2 border-r border-gray-300 text-right">฿{it.unit_price?.toLocaleString()}</td>
                      <td className="p-2 text-right font-medium">฿{it.total_price?.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Summary */}
              <div className="flex justify-end pt-2">
                <div className="w-64 space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-600">รวมเป็นเงิน:</span>
                    <span className="font-semibold">฿{subtotal.toLocaleString()}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-red-600">
                      <span>หักส่วนลด:</span>
                      <span>-฿{discount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-gray-600">
                    <span>ภาษีมูลค่าเพิ่ม 7%:</span>
                    <span>฿{vat.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold border-t border-gray-300 pt-1.5">
                    <span>จำนวนเงินทั้งสิ้น:</span>
                    <span>฿{total.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-2 gap-8 mt-12 pt-6 border-t border-gray-200 text-center text-xs">
                <div>
                  <div className="h-12"></div>
                  <div className="border-t border-gray-400 pt-1">
                    <p className="font-medium">ผู้รับสินค้า / ลูกค้า</p>
                    <p className="text-[10px] text-gray-500">วันที่ ...../...../..........</p>
                  </div>
                </div>
                <div>
                  <div className="h-12"></div>
                  <div className="border-t border-gray-400 pt-1">
                    <p className="font-medium">ผู้มีอำนาจลงนาม / ผู้ส่งสินค้า</p>
                    <p className="text-[10px] text-gray-500">วันที่ ...../...../..........</p>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-hairline bg-surface-soft flex justify-between items-center no-print">
          <span className="text-xs text-muted-text">กดปุ่ม "พิมพ์" เพื่อส่งออกเอกสารไปยังเครื่องพิมพ์หรือ PDF</span>
          <button
            onClick={onClose}
            className="btn-secondary text-xs py-2 px-4 cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>
        </div>

      </div>
    </div>
  );
}
