import DecoGrid from './DecoGrid';
import { Footer } from './Footer';
import { Header } from './Header';

export default function FullWidthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className='min-h-screen bg-background2'>
      <Header />
      <main className='overflow-hidden'>
        <DecoGrid>{children}</DecoGrid>
      </main>
      <Footer />
    </div>
  );
}
