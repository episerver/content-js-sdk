'use client';

import { useState } from 'react';
import Link from 'next/link';

interface MobileMenuProps {
  navigations: Array<{
    key: string;
    label: string;
    href: string;
  }>;
}

export function MobileMenu({ navigations }: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Mobile menu button */}
      <div className="md:hidden">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="text-gray-700 hover:text-teal-600 focus:outline-none focus:text-teal-600"
          aria-label={isOpen ? 'Close menu' : 'Open menu'}
        >
          {isOpen ? (
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          ) : (
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile menu dropdown */}
      {isOpen && (
        <div className="md:hidden absolute top-28 left-0 right-0 bg-gray-100 border-b border-gray-200 shadow-lg z-50">
          <nav className="max-w-7xl mx-auto px-4 py-4 space-y-3">
            {navigations.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className="block text-gray-700 hover:text-teal-600 transition-colors duration-200 text-lg font-extrabold uppercase tracking-wide py-2"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </>
  );
}
