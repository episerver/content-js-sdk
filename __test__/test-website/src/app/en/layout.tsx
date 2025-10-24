import {
  BlankSection,
  BlankSection2,
  Column,
  ColumnA,
  Component1,
  Component1A,
  Component1B,
  Component2,
  Component2A,
  Component3,
  Component3C,
  ct1,
  ct2,
  ct3,
  dt1,
  dt2,
  dt3,
  dt4,
  dt5,
  dt6,
  Row,
  RowA,
} from '@/components/with-display-templates';
import {
  initContentTypeRegistry,
  initDisplayTemplateRegistry,
} from '@optimizely/cms-sdk';
import { initReactComponentRegistry } from '@optimizely/cms-sdk/react/server';

initContentTypeRegistry([ct1, ct2, ct3]);
initDisplayTemplateRegistry([dt1, dt2, dt3, dt4, dt5, dt6]);
initReactComponentRegistry({
  resolver: {
    test_c1: {
      default: Component1,
      tags: {
        tagA: Component1A,
        tagB: Component1B,
      },
    },
    test_c2: Component2,
    'test_c2:tagA': Component2A,
    test_c3: {
      default: Component3,
      tags: {
        tagC: Component3C,
      },
    },
    BlankSection: BlankSection,
    'BlankSection:tagA': BlankSection2,
    _Row: {
      default: Row,
      tags: {
        tagA: RowA,
      },
    },
    _Column: Column,
    '_Column:tagA': ColumnA,
  },
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
