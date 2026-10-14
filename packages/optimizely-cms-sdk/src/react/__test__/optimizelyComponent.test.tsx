import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';

import { initReactComponentRegistry, OptimizelyComponent } from '../server.js';
import { OptimizelyReactError } from '../error.js';
import { resetComponentRegistry } from '../../core/render/registry.js';
import { renderServer } from './renderServer.js';

type CardProps = { content: { title: string }; displaySettings?: object; variant?: string };

function Card({ content, displaySettings, variant }: CardProps) {
  return (
    <p data-testid='card' data-settings={JSON.stringify(displaySettings ?? null)} data-variant={variant}>
      {content.title}
    </p>
  );
}

const card = { __typename: 'Card', title: 'Hello' };

beforeEach(() => initReactComponentRegistry({ resolver: { Card } }));
afterEach(() => vi.unstubAllEnvs());

describe('OptimizelyComponent', () => {
  test('throws when content is missing', async () => {
    await expect(OptimizelyComponent({ content: null as never })).rejects.toThrow(OptimizelyReactError);
  });

  test('throws when no registry has been initialised', async () => {
    resetComponentRegistry();

    await expect(OptimizelyComponent({ content: card })).rejects.toThrow(/initReactComponentRegistry/);
  });

  test('renders the registered component with its content', async () => {
    const { getByTestId } = await renderServer(<OptimizelyComponent content={card} />);

    expect(getByTestId('card')).toHaveTextContent('Hello');
  });

  test('passes display settings to the component', async () => {
    const { getByTestId } = await renderServer(
      <OptimizelyComponent content={card} displaySettings={{ theme: 'dark', wide: true }} />,
    );

    expect(getByTestId('card')).toHaveAttribute('data-settings', '{"theme":"dark","wide":true}');
  });

  test('passes extra caller props to the component', async () => {
    const extraProps: Record<string, unknown> = { variant: 'compact' };

    const { getByTestId } = await renderServer(<OptimizelyComponent content={card} {...extraProps} />);

    expect(getByTestId('card')).toHaveAttribute('data-variant', 'compact');
  });

  test('shows a fallback naming the content type in development when no component matches', async () => {
    vi.stubEnv('NODE_ENV', 'development');

    const { container } = await renderServer(<OptimizelyComponent content={{ __typename: 'Missing' }} />);

    expect(container).toHaveTextContent('No component found for content type Missing');
    expect(container.querySelector('b')).toHaveTextContent('Missing');
  });

  test('renders nothing outside development when no component matches', async () => {
    vi.stubEnv('NODE_ENV', 'production');

    const { container } = await renderServer(<OptimizelyComponent content={{ __typename: 'Missing' }} />);

    expect(container).toBeEmptyDOMElement();
  });
});
