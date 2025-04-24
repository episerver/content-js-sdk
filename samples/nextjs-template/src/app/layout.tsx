import React from 'react';
import fs from 'node:fs/promises';
import path from 'node:path';
import { init } from 'optimizely-cms-sdk/dist/next';

import { Bodoni_Moda, Inter } from 'next/font/google';
import './globals.css';

const filenames = await fs.readdir(path.join(process.cwd(), 'src/components'));

init({
  contentTypes: await Promise.all(
    filenames
      .filter((f) => f.endsWith('.tsx'))
      .map((f) => f.slice(0, -4))
      .map((f) => import(`../components/${f}.tsx`).then((m) => m.ContentType))
  ),
  componentResolver: function (contentTypeName: string) {
    return React.lazy(() => import(`@/components/${contentTypeName}.tsx`));
  },
});

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
