import { withAppContext } from '@optimizely/cms-sdk/react/server';
import {
  DesignSystem,
  isDesignSystemEnabled,
} from '@optimizely/cms-sdk/react/designSystem';
import { notFound } from 'next/navigation';

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

/** Reserved params — everything else is treated as a flat prop override. */
const RESERVED = new Set(['key', 'props', 'displaySettings', 'individual']);

/** Parse a URL-encoded JSON search param, ignoring malformed input. */
function parseJson(value: string | string[] | undefined): Record<string, any> | undefined {
  if (typeof value !== 'string') return undefined;
  try {
    return JSON.parse(value);
  } catch {
    return undefined;
  }
}

async function Page({ searchParams }: Props) {
  if (!isDesignSystemEnabled()) {
    notFound();
  }

  const params = await searchParams;
  const key = typeof params.key === 'string' ? params.key : undefined;

  // Flat prop params (e.g. ?label=Hi&link=…) merged over JSON `props`.
  const flat: Record<string, string> = {};
  for (const [k, v] of Object.entries(params)) {
    if (!RESERVED.has(k) && typeof v === 'string') flat[k] = v;
  }
  const props = { ...parseJson(params.props), ...flat };

  return (
    <DesignSystem
      contentTypeKey={key}
      props={props}
      displaySettings={parseJson(params.displaySettings)}
      individual={params.individual !== undefined}
    />
  );
}

export default withAppContext(Page);
