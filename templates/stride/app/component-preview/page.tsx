import { getContentType } from '@optimizely/cms-sdk';
import {
  OptimizelyComponent,
  getReactComponentRegistry,
  withAppContext,
} from '@optimizely/cms-sdk/react/server';
import { generateMockContent } from '../../lib/mock';
import styles from './page.module.css';
import { PreviewHeightReporter } from './PreviewHeightReporter';

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
      className={styles.preview}
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minWidth: '100%',
        minHeight: '100%',
        boxSizing: 'border-box',
      }}
    >
      <PreviewHeightReporter />
      {contentTypeDef && (
        <OptimizelyComponent
          content={generateMockContent(contentTypeDef, displayTemplateKey)}
          displaySettings={
            Object.keys(displaySettings).length > 0 ? displaySettings : undefined
          }
        />
      )}
    </div>
  );
}

export default withAppContext(ComponentPreviewPage);
