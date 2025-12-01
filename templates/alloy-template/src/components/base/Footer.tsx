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
}

async function Footer({ client, currentPath }: FooterProps) {
  const allLinks = await Promise.all([
    client.getItems('/en/'),
    client.getItems('/en/about-us'),
    client.getItems('/en/about-us/news-events'),
  ]);

  // Flatten the array of arrays and map to FooterLink format
  const footerLinks = allLinks.flat().map((ancestor: any) => ({
    key: ancestor._metadata?.key,
    label: ancestor._metadata?.displayName,
    href: ancestor._metadata?.url?.hierarchical,
  }));

  // Group links by category based on URL patterns
  const categorizedLinks = footerLinks.reduce<{
    products: FooterLink[];
    company: FooterLink[];
    news: FooterLink[];
  }>(
    (acc, link) => {
      if (link.href?.match(/\/about-us\/news-events\/.+/)) {
        acc.news.push({ label: link.label, href: link.href });
      } else if (link.href?.includes('/about-us')) {
        acc.company.push({ label: link.label, href: link.href });
      } else if (link.href) {
        acc.products.push({ label: link.label, href: link.href });
      }
      return acc;
    },
    { products: [], company: [], news: [] }
  );

  const formattedFooterLink: FooterSection[] = [
    { title: 'PRODUCTS', links: categorizedLinks.products },
    { title: 'THE COMPANY', links: categorizedLinks.company },
    { title: 'NEWS & EVENTS', links: categorizedLinks.news },
  ];

  return (
    <footer className="bg-gray-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {formattedFooterLink.map((section, index) => (
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
