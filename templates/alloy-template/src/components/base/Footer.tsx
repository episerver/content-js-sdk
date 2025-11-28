import { GraphClient } from '@optimizely/cms-sdk';

interface FooterLink {
  label: string;
  href: string;
}

interface FooterSection {
  title: string;
  links: FooterLink[];
}

interface FooterProps {
  client: GraphClient;
  currentPath: string;
  sections?: FooterSection[];
}

const defaultSections: FooterSection[] = [
  {
    title: 'PRODUCTS',
    links: [
      { label: 'Alloy Plan', href: '/en/alloy-plan' },
      { label: 'Alloy Track', href: '/en/alloy-track' },
      { label: 'Alloy Meet', href: '/en/alloy-meet' },
    ],
  },
  {
    title: 'THE COMPANY',
    links: [
      { label: 'History', href: '/en/history' },
      { label: 'News & Events', href: '/en/news' },
      { label: 'Management', href: '/en/management' },
      { label: 'Contact us', href: '/en/contact' },
      { label: 'Become a reseller', href: '/en/reseller' },
    ],
  },
  {
    title: 'NEWS & EVENTS',
    links: [
      { label: 'Events', href: '/en/events' },
      { label: 'Press Releases', href: '/en/press' },
    ],
  },
  {
    title: 'CUSTOMER ZONE',
    links: [
      { label: 'Reseller extranet', href: '/en/reseller-extranet' },
      { label: 'Log out', href: '/en/logout' },
    ],
  },
];

async function Footer({
  client,
  currentPath,
  sections = defaultSections,
}: FooterProps) {
  const allLinks = await Promise.all([
    client.getItems('/en/'),
    client.getItems('/en/about-us'),
  ]);

  // Flatten the array of arrays and map to FooterLink format
  const footerLinks = allLinks.flat().map((ancestor: any) => ({
    key: ancestor._metadata?.key,
    label: ancestor._metadata?.displayName,
    href: ancestor._metadata?.url?.hierarchical,
  }));

  console.info(
    'Footer footerLinks:',
    currentPath,
    JSON.stringify(footerLinks, null, 2)
  );

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
