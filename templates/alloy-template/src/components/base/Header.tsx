import Link from 'next/link';
import { GraphClient } from '@optimizely/cms-sdk';
import { MobileMenu } from './MobileMenu';

interface HeaderProps {
  client: GraphClient;
  currentPath: string;
  logoText?: string;
}

async function Header({ client, currentPath }: HeaderProps) {
  const ancestors = (await client.getPath(currentPath)) || [];
  const navLinks = (await client.getItems('/en/')) ?? [];

  // Filter out the start page (first item) and create breadcrumbs
  const breadcrumbs = ancestors.slice(1).map((ancestor: any) => ({
    key: ancestor._metadata.key,
    label: ancestor._metadata.displayName,
    href: ancestor._metadata.url.hierarchical,
  }));

  // Create navigation from navLinks of the /en/ page
  const navigations = navLinks
    .map((ancestor: any) => ({
      key: ancestor._metadata.key,
      label: ancestor._metadata.displayName,
      href: ancestor._metadata.url.hierarchical,
    }))
    .sort((a, b) => {
      // Move "About Us" to the end
      if (a.label === 'About Us') return 1;
      if (b.label === 'About Us') return -1;
      return 0;
    });

  return (
    <>
      <header className="bg-gray-100 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-28">
            {/* Navigation */}
            <nav className="flex items-center space-x-8">
              {/* Logo */}
              <Link href="/en" className="shrink-0">
                <img src="/logo.png" alt="Logo" className="h-14 w-auto" />
              </Link>

              {/* Desktop Navigation */}
              <div className="hidden md:flex md:items-center md:space-x-8">
                {navigations.map((item) => (
                  <a
                    key={item.key}
                    href={item.href}
                    className="text-gray-700 hover:text-teal-600 transition-colors duration-200 text-lg font-extrabold uppercase tracking-wide"
                  >
                    {item.label}
                  </a>
                ))}
              </div>
            </nav>

            {/* Mobile menu */}
            <MobileMenu navigations={navigations} />
          </div>
        </div>
      </header>

      {/* Breadcrumbs */}
      {breadcrumbs.length > 0 && (
        <nav
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4"
          aria-label="Breadcrumb"
        >
          <ol className="flex items-center space-x-1">
            <li>
              <Link
                href={ancestors[0]?._metadata?.url?.hierarchical || '/'}
                className="text-[#1cb898] hover:text-gray-700"
              >
                Home
              </Link>
            </li>
            {breadcrumbs.map(
              (crumb: { label: string; href: string }, index: number) => (
                <li key={index} className="flex items-center">
                  <span className="text-gray-400 mx-1">/</span>
                  {index === breadcrumbs.length - 1 ? (
                    <span className="text-gray-700 font-medium">
                      {crumb.label}
                    </span>
                  ) : (
                    <Link
                      href={crumb.href}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      {crumb.label}
                    </Link>
                  )}
                </li>
              ),
            )}
          </ol>
        </nav>
      )}
    </>
  );
}

export default Header;
