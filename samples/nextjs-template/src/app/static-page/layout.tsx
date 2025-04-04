import type { Metadata } from 'next';

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
