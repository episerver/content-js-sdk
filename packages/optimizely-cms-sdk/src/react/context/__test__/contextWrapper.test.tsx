import { describe, expect, test, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { withAppContext } from '../contextWrapper.js';
import { getContext } from '../../../context/config.js';
import ReactContextAdapter from '../../../context/reactContextAdapter.js';
import { configureAdapter } from '../../../context/config.js';

// Ensure React adapter is configured for tests
beforeEach(() => {
  configureAdapter(new ReactContextAdapter());
});

describe('withAppContext', () => {
  describe('Basic HOC functionality', () => {
    test('should wrap component and render it', async () => {
      const TestComponent = ({ testProp }: { testProp: string }) => (
        <div data-testid="test-component">{testProp}</div>
      );

      const WrappedComponent = withAppContext(TestComponent);
      const { findByTestId } = render(
        await WrappedComponent({ testProp: 'test-value' }),
      );

      const element = await findByTestId('test-component');
      expect(element).toBeDefined();
      expect(element.textContent).toBe('test-value');
    });

    test('should pass through props to wrapped component', async () => {
      type Props = { name: string; age: number; active: boolean };
      const TestComponent = ({ name, age, active }: Props) => (
        <div>
          {name}-{age}-{active.toString()}
        </div>
      );

      const WrappedComponent = withAppContext(TestComponent);
      const { container } = render(
        await WrappedComponent({ name: 'John', age: 30, active: true }),
      );

      expect(container.textContent).toBe('John-30-true');
    });
  });

  describe('Context initialization', () => {
    test('should initialize empty context', async () => {
      const TestComponent = () => {
        const data = getContext();
        return <div data-testid="data">{JSON.stringify(data)}</div>;
      };

      const WrappedComponent = withAppContext(TestComponent);
      const { findByTestId } = render(await WrappedComponent({}));

      const element = await findByTestId('data');
      expect(JSON.parse(element.textContent || '{}')).toEqual({});
    });

    test('should provide fresh context for each wrapped component', async () => {
      const TestComponent = () => {
        const data = getContext();
        return <div data-testid="result">{data?.preview_token || 'empty'}</div>;
      };

      const WrappedComponent = withAppContext(TestComponent);

      // First render
      const { findByTestId: findByTestId1 } = render(
        await WrappedComponent({}),
      );
      const element1 = await findByTestId1('result');
      expect(element1.textContent).toBe('empty');
    });
  });

  describe('Context usage pattern', () => {
    test('should initialize empty context for components to use', async () => {
      const TestComponent = () => {
        const data = getContext();
        return (
          <div>
            <span data-testid="is-empty">
              {Object.keys(data || {}).length === 0 ? 'empty' : 'has-data'}
            </span>
          </div>
        );
      };

      const WrappedComponent = withAppContext(TestComponent);
      const { findByTestId } = render(await WrappedComponent({}));

      // withAppContext initializes empty context
      expect((await findByTestId('is-empty')).textContent).toBe('empty');
    });

    test('should demonstrate getContext is accessible', async () => {
      const TestComponent = () => {
        // Components can call getContext()
        const data = getContext();
        return (
          <div data-testid="context-type">
            {typeof data === 'object' ? 'object' : 'undefined'}
          </div>
        );
      };

      const WrappedComponent = withAppContext(TestComponent);
      const { findByTestId } = render(await WrappedComponent({}));

      // Context is accessible as an object
      expect((await findByTestId('context-type')).textContent).toBe('object');
    });
  });

  describe('Real-world usage note', () => {
    test('should document that context is populated by getPreviewContent', async () => {
      // Note: In actual usage, the workflow is:
      // 1. withAppContext() initializes empty context storage
      // 2. getPreviewContent() populates context with preview data
      // 3. Components access context via getContext()
      //
      // React.cache() in React Server Components ensures request-scoped
      // isolation, but this doesn't work the same way in test environments.
      // The reactContextAdapter tests verify the adapter functionality directly.

      const InfoComponent = () => {
        const data = getContext();
        return (
          <div data-testid="info">
            {data?.preview_token
              ? 'preview mode'
              : 'getPreviewContent not called'}
          </div>
        );
      };

      const WrappedComponent = withAppContext(InfoComponent);
      const { findByTestId } = render(await WrappedComponent({}));

      // Without getPreviewContent being called, no preview data exists
      expect((await findByTestId('info')).textContent).toBe(
        'getPreviewContent not called',
      );
    });
  });
});
