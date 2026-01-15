import {
  BlankSectionContentType,
  contentType,
  displayTemplate,
  ContentProps,
} from '@optimizely/cms-sdk';
import {
  OptimizelyComposition,
  OptimizelyGridSection,
  StructureContainerProps,
} from '@optimizely/cms-sdk/react/server';

export const ct1 = contentType({
  key: 'test_c1',
  baseType: '_component',
  properties: {
    p1: { type: 'string' },
  },
  compositionBehaviors: ['elementEnabled', 'sectionEnabled'],
});

export const ct2 = contentType({
  key: 'test_c2',
  baseType: '_component',
  properties: {
    p2: { type: 'float' },
  },
  compositionBehaviors: ['elementEnabled', 'sectionEnabled'],
});

export const ct3 = contentType({
  key: 'test_c3',
  baseType: '_experience',
});

export const ct6 = contentType({
  key: 'test_c6',
  baseType: '_component',
  compositionBehaviors: ['elementEnabled', 'sectionEnabled'],
});

export const ct7 = contentType({
  key: 'test_c7',
  baseType: '_component',
  compositionBehaviors: ['elementEnabled', 'sectionEnabled'],
});

export const dt1 = displayTemplate({
  key: 'test_dt1',
  baseType: '_component',
  displayName: 'test dt1',
  isDefault: false,
  settings: {},
  tag: 'tagA',
});

export const dt2 = displayTemplate({
  key: 'test_dt2',
  baseType: '_component',
  displayName: 'test dt2',
  isDefault: false,
  settings: {},
  tag: 'tagB',
});

export const dt3 = displayTemplate({
  key: 'test_dt3',
  baseType: '_experience',
  displayName: 'test dt3',
  isDefault: false,
  settings: {},
  tag: 'tagC',
});

export const dt4 = displayTemplate({
  key: 'test_dt4',
  baseType: '_section',
  displayName: 'test dt4',
  isDefault: false,
  settings: {},
  tag: 'tagA',
});

export const dt5 = displayTemplate({
  key: 'test_dt5',
  nodeType: 'row',
  displayName: 'test dt5',
  isDefault: false,
  settings: {},
  tag: 'tagA',
});

export const dt6 = displayTemplate({
  key: 'test_dt6',
  nodeType: 'column',
  displayName: 'test dt6',
  isDefault: false,
  settings: {},
  tag: 'tagA',
});

type Props1 = { content: ContentProps<typeof ct1> };
type Props2 = { content: ContentProps<typeof ct2> };
type Props3 = { content: ContentProps<typeof ct3> };
type Props6 = { content: ContentProps<typeof ct6> };
type Props7 = { content: ContentProps<typeof ct7> };

type BlankSectionProps = {
  content: ContentProps<typeof BlankSectionContentType>;
};

export function Component1({ content }: Props1) {
  return <div>This is Component1. p1: {content.p1}</div>;
}

export function Component1A({ content }: Props1) {
  return <div>This is Component1A. p1: {content.p1}</div>;
}

export function Component1B({ content }: Props1) {
  return <div>This is Component1B. p1: {content.p1}</div>;
}

export function Component2({ content }: Props2) {
  return <div>This is Component2. p2: {content.p2}</div>;
}

export function Component2A({ content }: Props2) {
  return <div>This is Component2A. p2: {content.p2}</div>;
}

export function Component3({ content }: Props3) {
  return (
    <div>
      <h1>This is an experience (Component3)</h1>
      <OptimizelyComposition nodes={content.composition.nodes ?? []} />
    </div>
  );
}

export function Component6({}: Props6) {
  return <div>This is Component6</div>;
}

export function Component7({}: Props7) {
  return <div>This is Component7</div>;
}
export function Component3C({ content }: Props3) {
  return (
    <div>
      <h1>This is an experience (Component3C)</h1>
      <OptimizelyComposition nodes={content.composition.nodes ?? []} />
    </div>
  );
}

export function Row({ children, node }: StructureContainerProps) {
  return (
    <>
      <h3>This is row (Row) {node.key}</h3>
      {children}
    </>
  );
}

export function Column({ children, node }: StructureContainerProps) {
  return (
    <>
      <h4>This is column (Column) {node.key}</h4>
      {children}
    </>
  );
}

export function Row2({ children, node }: StructureContainerProps) {
  return (
    <>
      <h3>This is row (Row2) {node.key}</h3>
      {children}
    </>
  );
}

export function Column2({ children, node }: StructureContainerProps) {
  return (
    <>
      <h4>This is column (Column2) {node.key}</h4>
      {children}
    </>
  );
}

export function RowA({ children, node }: StructureContainerProps) {
  return (
    <>
      <h3>This is row (RowA) {node.key}</h3>
      {children}
    </>
  );
}

export function ColumnA({ children, node }: StructureContainerProps) {
  return (
    <>
      <h4>This is column (ColumnA) {node.key}</h4>
      {children}
    </>
  );
}

export function BlankSection({ content }: BlankSectionProps) {
  return (
    <>
      <h2>This is BlankSection {content.key}</h2>
      <OptimizelyGridSection nodes={content.nodes} />
    </>
  );
}

export function BlankSection2({ content }: BlankSectionProps) {
  return (
    <>
      <h2>This is BlankSection2 {content.key}</h2>
      <OptimizelyGridSection
        nodes={content.nodes}
        row={Row2}
        column={Column2}
      />
    </>
  );
}
