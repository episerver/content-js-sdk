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
}

const mapToLinks = (items: any[] | null) =>
  items?.map((item: any) => ({
    label: item._metadata?.displayName,
    href: item._metadata?.url?.hierarchical,
  })) ?? [];

async function Footer({ client }: FooterProps) {
  const [products, company, newsEvents] = await Promise.all([
    client.getItems('/en/'),
    client.getItems('/en/about-us'),
    client.getItems('/en/about-us/news-events'),
  ]);

  const sections: FooterSection[] = [
    { title: 'PRODUCTS', links: mapToLinks(products) },
    { title: 'THE COMPANY', links: mapToLinks(company) },
    { title: 'NEWS & EVENTS', links: mapToLinks(newsEvents) },
  ];

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
