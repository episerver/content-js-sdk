import { Bodoni_Moda, Inter } from 'next/font/google';
import './globals.css';

const serifFont = Bodoni_Moda({
  variable: '--font-serif',
  subsets: ['latin'],
});

const sansFont = Inter({
  variable: '--font-sans',
  subsets: ['latin'],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={[serifFont.variable, sansFont.variable].join(' ')}
    >
      <body>{children}</body>
    </html>
  );
}
