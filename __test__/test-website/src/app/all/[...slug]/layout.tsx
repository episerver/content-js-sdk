import {
  BlankSection,
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
} from '@/components/with-display-templates';
import {
  initContentTypeRegistry,
  initDisplayTemplateRegistry,
} from '@episerver/cms-sdk';
import { initReactComponentRegistry } from '@episerver/cms-sdk/react/server';

initContentTypeRegistry([ct1, ct2, ct3]);
initDisplayTemplateRegistry([dt1, dt2, dt3]);
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
