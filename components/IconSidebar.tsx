'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FiHome, FiShield } from 'react-icons/fi';

export function IconSidebar() {
  const pathname = usePathname();
  const isActive = (path: string) => pathname === path;

  const icons = [
    { href: '/', icon: <FiHome size={22} />, label: 'Home' },
    { href: '/trustscore', icon: <FiShield size={22} />, label: 'Verified' },
  ];

  return (
    // UPDATED: Added bg-white for light mode, border colors, and text colors
    <aside className="fixed left-0 top-0 h-screen w-[70px] flex flex-col items-center py-6 z-50 bg-white/90 dark:bg-[#1e293b]/90 backdrop-blur-md border-r border-slate-200 dark:border-slate-700 hidden md:flex transition-colors duration-300">
      {/* Small Logo Icon at Top */}
      <div className="mb-10 text-green-600 dark:text-green-500 font-black text-xl tracking-tighter">
        NG
      </div>

      <nav className="flex flex-col gap-8 w-full items-center">
        {icons.map((item) => (
          <Link 
            key={item.href} 
            href={item.href}
            title={item.label}
            className={`
              p-3 rounded-xl transition-all duration-300 group relative
              ${isActive(item.href) 
                ? 'bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]' 
                : 'text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700/50'}
            `}
          >
            {item.icon}
            {/* Tooltip on Hover - UPDATED colors */}
            <span className="absolute left-14 bg-slate-900 dark:bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-lg">
              {item.label}
            </span>
          </Link>
        ))}
      </nav>
    </aside>
  );
}
