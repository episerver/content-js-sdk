'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, Menu } from 'lucide-react';
import { MobileMenu } from './MobileMenu';
import { Logo } from './Logo';
import { SearchModal } from './SearchModal';
import type { NavigationItem } from '../../lib/navigation';

export const HeaderClient = ({
  navigationItems,
}: {
  navigationItems: NavigationItem[];
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 50;
      setScrolled(prev => (prev !== isScrolled ? isScrolled : prev));
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const headerBg = scrolled ? 'bg-white/90 backdrop-blur' : 'bg-transparent';

  return (
    <>
      <header
        className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${headerBg}`}
      >
        <div className='container mx-auto flex items-center justify-between md:py-5 py-6'>
          <Link href='/'>
            <Logo className='h-5' />
          </Link>
          <div className='flex gap-6'>
            <nav className='hidden lg:flex gap-6 translate-y-0.5'>
              {navigationItems.map(item => {
                return (
                  <Link
                    key={item.key}
                    href={item.url}
                    className={`text-sm font-semibold transition-colors ${
                      item.isActive ? 'opacity-100' : 'opacity-80 hover:opacity-100'
                    }`}
                  >
                    {item.displayName}
                  </Link>
                );
              })}
            </nav>
            <div className='flex items-center gap-4'>
              <button
                onClick={() => setSearchModalOpen(true)}
                className='p-1 hover:bg-gray-100 rounded-lg transition-colors'
                title='Search'
              >
                <Search size='16' />
              </button>
              <button
                className='md:hidden p-1'
                onClick={() => setMobileMenuOpen(true)}
                title='Menu'
              >
                <Menu size='16' />
              </button>
            </div>
          </div>
        </div>
      </header>

      <MobileMenu isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

      <SearchModal isOpen={searchModalOpen} onClose={() => setSearchModalOpen(false)} />
    </>
  );
};
