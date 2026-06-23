'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { X, ChevronRight, ChevronLeft } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Logo } from './Logo';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const mainNavItems = [
  { label: 'Features', href: '/features' },
  { label: 'Challenges', href: '/challenges' },
  { label: 'Subscriptions', href: '/subscriptions' },
  {
    label: 'About Us',
    href: '/about',
    children: [
      { label: 'Overview', href: '/about' },
      {
        label: 'News & Events',
        href: '/about/news-events',
        children: [
          { label: 'Overview', href: '/about/news-events' },
          { label: 'Events', href: '/about/news-events/events' },
          { label: 'News', href: '/about/news-events/news' },
        ],
      },
      { label: 'Management', href: '/about/management' },
      { label: 'Contact us', href: '/about/contact' },
      { label: 'Become a Coach', href: '/about/coaches' },
      { label: 'Reseller', href: '/about/reseller' },
    ],
  },
];

interface MenuItem {
  label: string;
  href: string;
  children?: MenuItem[];
}

interface MenuLevel {
  items: MenuItem[];
  title?: string;
  parentHref?: string;
}

export const MobileMenu: React.FC<MobileMenuProps> = ({ isOpen, onClose }) => {
  const pathname = usePathname();
  const [menuStack, setMenuStack] = React.useState<MenuLevel[]>([
    { items: mainNavItems },
  ]);
  const currentDepth = menuStack.length - 1;

  const handleItemClick = (item: MenuItem) => {
    if (item.children && item.children.length > 0) {
      setMenuStack(prev => [
        ...prev,
        {
          items: item.children!,
          title: item.label,
          parentHref: item.href,
        },
      ]);
    } else {
      onClose();
    }
  };

  const handleBack = () => {
    if (menuStack.length > 1) {
      setMenuStack(prev => prev.slice(0, -1));
    }
  };

  const handleClose = () => {
    setMenuStack([{ items: mainNavItems }]);
    onClose();
  };

  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      setMenuStack([{ items: mainNavItems }]);
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 z-50 lg:hidden'>
      {/* Backdrop */}
      <div
        className='absolute inset-0 bg-black/50 backdrop-blur-sm'
        onClick={handleClose}
      />

      {/* Menu Panel */}
      <div className='absolute top-0 left-0 w-full h-full bg-white shadow-xl'>
        {/* Header */}
        <div className='flex items-center justify-between p-6 border-b border-gray-200'>
          <div className='flex items-center gap-3'>
            {menuStack.length > 1 ?
              <button
                onClick={handleBack}
                className='flex items-center gap-2 -ml-1 rounded-lg hover:bg-gray-100 transition-colors'
              >
                <ChevronLeft size={16} />
                <h2 className='text-base font-bold'>{menuStack[currentDepth].title}</h2>
              </button>
            : <Logo className='h-5' />}
          </div>
          <button
            onClick={handleClose}
            className='p-1 rounded-lg hover:bg-gray-100 transition-colors'
          >
            <X size={16} />
          </button>
        </div>

        {/* Menu Content - Horizontal Sliding Container */}
        <div className='relative overflow-hidden h-[calc(100%-73px)]'>
          <div
            className='flex h-full transition-transform duration-300 ease-in-out'
            style={{
              transform: `translateX(-${currentDepth * 100}%)`,
            }}
          >
            {menuStack.map((level, levelIndex) => (
              <div
                key={levelIndex}
                className='w-full shrink-0 overflow-y-auto'
                style={{ minWidth: '100%' }}
              >
                <div className='p-3 h-full'>
                  <nav className='space-y-2'>
                    {level.items.map((item, index) => {
                      const isActive =
                        pathname === item.href ||
                        (item.href !== '/' && pathname.startsWith(item.href));
                      const hasChildren = item.children && item.children.length > 0;

                      return (
                        <div
                          key={item.href + index}
                          className='menu-item-fade'
                          style={{ animationDelay: `${index * 0.05}s` }}
                        >
                          {hasChildren ?
                            <button
                              onClick={() => handleItemClick(item)}
                              className={cn(
                                'w-full flex items-center justify-between p-3 rounded-lg text-left font-medium transition-colors',
                                isActive ? 'bg-key1/5 text-key1' : 'hover:bg-gray-50',
                              )}
                            >
                              <span>{item.label}</span>
                              <ChevronRight size={16} />
                            </button>
                          : <Link
                              href={item.href}
                              onClick={handleClose}
                              className={cn(
                                'flex items-center justify-between p-3 rounded-lg font-medium transition-colors',
                                isActive ? 'bg-key1/5 text-key1' : 'hover:bg-gray-50',
                              )}
                            >
                              <span>{item.label}</span>
                            </Link>
                          }
                        </div>
                      );
                    })}
                  </nav>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
