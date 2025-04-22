import { contentType, displayTemplate, Infer } from 'optimizely-cms-sdk';

export const ContentType = contentType({
  key: 'LandingSection',
  baseType: 'component',
  displayName: 'Landing Section',
  properties: {
    heading: {
      type: 'string',
    },
    subtitle: {
      type: 'string',
    },
  },
});

export const DisplayTemplate = displayTemplate({
  key: 'LandingSectionDisplayTemplate',
  isDefault: true,
  displayName: 'LandingSectionDisplayTemplate',
  baseType: 'component',
  settings: {
    background: {
      editor: 'select',
      displayName: 'Background',
      sortOrder: 0,
      choices: {
        red: {
          displayName: 'Red',
          sortOrder: 0,
        },
        blue: {
          displayName: 'Blue',
          sortOrder: 1,
        },
      },
    },
  },
});

type Props = {
  opti: Infer<typeof ContentType>;
};

export default function LandingSection({ opti }: Props) {
  return (
    <section>
      <h2>{opti.heading}</h2>
      <p>{opti.subtitle}</p>
    </section>
  );
}
