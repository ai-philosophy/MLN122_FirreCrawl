import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'Smart Price Tracker — So sánh giá thông minh',
  description: 'Theo dõi và so sánh giá sản phẩm điện tử tại các nền tảng lớn nhất Việt Nam: CellphoneS, FPT Shop, ShopDunk, PhuCanh, GearVN.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body>
        <Navbar />
        <main className="min-h-screen pt-16">
          {children}
        </main>
      </body>
    </html>
  );
}
