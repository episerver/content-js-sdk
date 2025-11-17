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
  Component6,
  Component7,
  ct1,
  ct2,
  ct3,
  ct6,
  ct7,
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
  ctArray,
  ctBoolean,
  ctContentReference,
  ctInteger,
  ctLink,
  ctRich,
  ctString,
  ctWithCollision,
} from '@/components/with-repeated-properties';
import {
  initContentTypeRegistry,
  initDisplayTemplateRegistry,
} from '@optimizely/cms-sdk';
import { initReactComponentRegistry } from '@optimizely/cms-sdk/react/server';

initContentTypeRegistry([
  ct1,
  ct2,
  ct3,
  ct6,
  ct7,
  ctString,
  ctBoolean,
  ctInteger,
  ctRich,
  ctContentReference,
  ctArray,
  ctWithCollision,
  ctLink,
]);
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

    // Content type "test_ct6" only has a component with tag
    'test_c6:tagA': Component6,
    test_c7: {
      // default: Component7,
      tags: {
        tagA: Component7,
      },
    },
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
