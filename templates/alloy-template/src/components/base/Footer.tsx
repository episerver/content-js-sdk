interface FooterLink {
  label: string;
  href: string;
}

interface FooterSection {
  title: string;
  links: FooterLink[];
}

interface FooterProps {
  sections?: FooterSection[];
}

const defaultSections: FooterSection[] = [
  {
    title: 'PRODUCTS',
    links: [
      { label: 'Alloy Plan', href: '/alloy-plan' },
      { label: 'Alloy Track', href: '/alloy-track' },
      { label: 'Alloy Meet', href: '/alloy-meet' },
    ],
  },
  {
    title: 'THE COMPANY',
    links: [
      { label: 'History', href: '/history' },
      { label: 'News & Events', href: '/news' },
      { label: 'Management', href: '/management' },
      { label: 'Contact us', href: '/contact' },
      { label: 'Become a reseller', href: '/reseller' },
    ],
  },
  {
    title: 'NEWS & EVENTS',
    links: [
      { label: 'Events', href: '/events' },
      { label: 'Press Releases', href: '/press' },
    ],
  },
  {
    title: 'CUSTOMER ZONE',
    links: [
      { label: 'Reseller extranet', href: '/reseller-extranet' },
      { label: 'Log out', href: '/logout' },
    ],
  },
];

function Footer({ sections = defaultSections }: FooterProps) {
  return (
    <footer className="bg-gray-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {sections.map((section, index) => (
            <div key={index} className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                {section.title}
              </h3>
              <ul className="space-y-2">
                {section.links.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    <a
                      href={link.href}
                      className="text-teal-400 hover:text-teal-300 transition-colors duration-200 text-sm"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </footer>
  );
}

export default Footer;
