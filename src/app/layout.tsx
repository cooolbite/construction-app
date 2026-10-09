import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Construction Materials ERP | ระบบ ERP สำหรับร้านจำหน่ายวัสดุก่อสร้าง",
  description: "ระบบบริหารจัดการร้านค้าวัสดุก่อสร้างครบวงจร ครอบคลุม POS จุดขาย สินค้าหลายหน่วยนับ คลังสินค้า จัดซื้อ ลูกหนี้ เจ้าหนี้ และจัดส่งสินค้า",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className={inter.variable}>
      <body className="antialiased min-h-screen bg-white text-[#222222]">
        {children}
      </body>
    </html>
  );
}
