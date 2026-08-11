import type { Metadata } from 'next';
import { Footer } from '../../components/layouts/shared/Footer';
import { Header } from '../../components/layouts/shared/Header';
import { StoreBar } from '../../components/store/StoreBar';

export const metadata: Metadata = {
  title: 'Stride — Store',
  description: 'Bikes and gear, matched to how you ride.',
};

export default function StoreLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className='min-h-screen bg-background2'>
      <Header />
      <div className='pt-20'>
        <StoreBar />
        <main className='container min-h-[60vh] py-10'>{children}</main>
      </div>
      <Footer />
    </div>
  );
}
