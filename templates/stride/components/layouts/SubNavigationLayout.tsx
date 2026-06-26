import { Breadcrumbs } from './shared/Breadcrumbs';
import DecoGrid from './shared/DecoGrid';
import { Footer } from './shared/Footer';
import { Header } from './shared/Header';
import { SubNavigation } from './shared/SubNavigation';

export default function SubNavigationLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className='min-h-screen flex flex-col'>
      <Header />
      <main className='grow pt-32 pb-20'>
        <DecoGrid>
          <div className='container mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6'>
            <aside className='hidden lg:block lg:col-span-3'>
              <SubNavigation />
            </aside>

            <div className='lg:col-span-8 lg:col-start-5'>
              <Breadcrumbs />
              {children}
            </div>
          </div>
        </DecoGrid>
      </main>
      <Footer />
    </div>
  );
}
