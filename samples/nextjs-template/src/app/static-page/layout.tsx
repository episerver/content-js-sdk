import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Neumann University',
  description: 'The university of the future',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <nav className="dark">
        <a className="logo" href="/">
          Neumann
          <br />
          University
        </a>
        <a href="">Search</a>
        <button>Menu</button>
      </nav>
      {children}
    </>
  );
}
