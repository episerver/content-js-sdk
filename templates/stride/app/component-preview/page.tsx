import { getContentType } from '@optimizely/cms-sdk';
import {
  OptimizelyComponent,
  getReactComponentRegistry,
  withAppContext,
} from '@optimizely/cms-sdk/react/server';
import { generateMockContent } from '../../lib/mock';

const previewLinks = [
  {
    label: 'Button (default)',
    contentType: 'ButtonElement',
    displayTemplate: 'ButtonStyles',
    settings: { variant: 'default' },
  },
  {
    label: 'Button (primary)',
    contentType: 'ButtonElement',
    displayTemplate: 'ButtonStyles',
    settings: { variant: 'primary' },
  },
  {
    label: 'Button (outline)',
    contentType: 'ButtonElement',
    displayTemplate: 'ButtonStyles',
    settings: { variant: 'outline' },
  },
  {
    label: 'Heading (h2)',
    contentType: 'HeadingElement',
    displayTemplate: 'HeadingStyles',
    settings: { level: 'h2' },
  },
  {
    label: 'Heading (h3 + globe)',
    contentType: 'HeadingElement',
    displayTemplate: 'HeadingStyles',
    settings: { level: 'h3', icon: 'globe' },
  },
  {
    label: 'Heading (h4 + sparkles)',
    contentType: 'HeadingElement',
    displayTemplate: 'HeadingStyles',
    settings: { level: 'h4', icon: 'sparkles' },
  },
  { label: 'Image Card', contentType: 'ImageCardElement' },
  { label: 'Rich Text', contentType: 'RichTextElement' },
  { label: 'Horizontal Ruler', contentType: 'HorizontalRulerElement' },
];

function buildPreviewUrl(link: (typeof previewLinks)[number]): string {
  const params = new URLSearchParams();
  params.set('contentType', link.contentType);
  if (link.displayTemplate) params.set('displayTemplate', link.displayTemplate);
  if (link.settings) {
    for (const [k, v] of Object.entries(link.settings)) {
      params.set(k, v);
    }
  }
  return `/component-preview?${params.toString()}`;
}

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

async function ComponentPreviewPage({ searchParams }: Props) {
  const params = await searchParams;
  const contentTypeKey =
    typeof params.contentType === 'string' ? params.contentType : undefined;
  const displayTemplateKey =
    typeof params.displayTemplate === 'string' ? params.displayTemplate : undefined;

  const reservedParams = new Set(['contentType', 'displayTemplate']);
  const displaySettings: Record<string, string> = {};

  for (const [key, value] of Object.entries(params)) {
    if (!reservedParams.has(key) && typeof value === 'string') {
      displaySettings[key] = value;
    }
  }

  const hasComponent =
    contentTypeKey ?
      getReactComponentRegistry().getComponent(contentTypeKey) !== undefined
    : false;
  const contentTypeDef =
    contentTypeKey && hasComponent ? getContentType(contentTypeKey) : undefined;

  return (
    <div
      style={{
        background: 'white',
        color: '#111',
        minHeight: '100vh',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <nav
        style={{
          padding: '1rem 1.5rem',
          borderBottom: '1px solid #e5e5e5',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.5rem',
          alignItems: 'center',
        }}
      >
        <span
          style={{
            fontWeight: 600,
            marginRight: '0.5rem',
            fontSize: '0.875rem',
            color: '#666',
          }}
        >
          Preview:
        </span>
        {previewLinks.map(link => {
          const isActive =
            contentTypeKey === link.contentType &&
            displayTemplateKey === (link.displayTemplate ?? undefined) &&
            Object.entries(link.settings ?? {}).every(([k, v]) => params[k] === v);

          return (
            <a
              key={link.label}
              href={buildPreviewUrl(link)}
              style={{
                padding: '0.375rem 0.75rem',
                borderRadius: '0.375rem',
                fontSize: '0.8125rem',
                textDecoration: 'none',
                border: '1px solid',
                borderColor: isActive ? '#111' : '#d4d4d4',
                backgroundColor: isActive ? '#111' : 'white',
                color: isActive ? 'white' : '#333',
              }}
            >
              {link.label}
            </a>
          );
        })}
      </nav>
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '4rem 2rem',
          minHeight: 'calc(100vh - 60px)',
        }}
      >
        {contentTypeDef && (
          <div style={{ maxWidth: 500, width: '100%' }}>
            <OptimizelyComponent
              content={generateMockContent(contentTypeDef, displayTemplateKey)}
              displaySettings={
                Object.keys(displaySettings).length > 0 ? displaySettings : undefined
              }
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default withAppContext(ComponentPreviewPage);

