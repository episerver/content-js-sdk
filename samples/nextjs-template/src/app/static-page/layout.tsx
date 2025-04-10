import type { Metadata } from 'next';
import Link from 'next/link';

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
        <Link className="logo" href="/">
          Neumann
          <br />
          University
        </Link>
        <a href="">Search</a>
        <button>Menu</button>
      </nav>
      {children}
    </>
  );
}
