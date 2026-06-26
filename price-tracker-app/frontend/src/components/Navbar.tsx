'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { TrendingUp, Home, BarChart2, ArrowLeftRight } from 'lucide-react';

const links = [
  { href: '/', label: 'Trang chủ', icon: Home },
  { href: '/compare', label: 'So sánh giá', icon: ArrowLeftRight },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <header style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(16px)',
      borderBottom: '1px solid rgba(124,58,237,0.12)',
      boxShadow: '0 2px 20px rgba(124,58,237,0.06)',
      height: 64,
      display: 'flex', alignItems: 'center',
    }}>
      <div style={{
        maxWidth: 1280, margin: '0 auto', padding: '0 24px',
        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        {/* Logo */}
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 12,
            background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(124,58,237,0.3)',
          }}>
            <TrendingUp size={18} color="white" strokeWidth={2.5} />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#1e1b4b', letterSpacing: '-0.3px' }}>
              Smart Price Tracker
            </div>
            <div style={{ fontSize: 9, fontWeight: 700, color: '#7c3aed', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              So sánh giá thông minh
            </div>
          </div>
        </Link>

        {/* Nav links */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {links.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== '/' && pathname.startsWith(href));
            return (
              <Link 
                key={href} 
                href={href} 
                className="nav-link"
                style={{
                  textDecoration: 'none',
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '8px 16px', borderRadius: 12,
                  fontSize: 13, fontWeight: 700,
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  color: active ? '#7c3aed' : '#475569',
                  background: active ? 'rgba(124, 58, 237, 0.08)' : 'transparent',
                  border: `1.5px solid ${active ? 'rgba(124, 58, 237, 0.15)' : 'transparent'}`,
                }}
              >
                <Icon size={14} style={{ transition: 'transform 0.2s ease' }} />
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
