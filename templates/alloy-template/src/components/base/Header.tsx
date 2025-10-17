interface NavigationItem {
  label: string;
  href: string;
}

interface HeaderProps {
  navigationItems?: NavigationItem[];
  logoText?: string;
}

const defaultNavigationItems: NavigationItem[] = [
  { label: 'ALLOY PLAN', href: '/en/alloy-plan' },
  { label: 'ALLOY TRACK', href: '/en/alloy-track' },
  { label: 'ALLOY MEET', href: '/en/alloy-meet' },
  { label: 'ABOUT US', href: '/en/about-us' },
];

function Header({ navigationItems = defaultNavigationItems }: HeaderProps) {
  return (
    <header className="bg-gray-100 border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-28">
          {/* Navigation */}
          <nav className="hidden md:flex md:items-center md:space-x-8">
            <div className="flex-shrink-0">
              {/* Logo */}
              <img src="/logo.png" alt="Logo" className="h-14 w-14" />
            </div>
            <div className="flex items-center space-x-8">
              {navigationItems.map((item, index) => (
                <a
                  key={index}
                  href={item.href}
                  className="text-gray-700 hover:text-teal-600 transition-colors duration-200 text-lg font-extrabold uppercase tracking-wide"
                >
                  {item.label}
                </a>
              ))}
            </div>
          </nav>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              type="button"
              className="text-gray-700 hover:text-teal-600 focus:outline-none focus:text-teal-600"
              aria-label="Open menu"
            >
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
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
