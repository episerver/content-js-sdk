import { describe, expect, test, vi, beforeEach } from 'vitest';
import React from 'react';
import { render } from '@testing-library/react';
import { withAppContext } from '../contextWrapper.js';
import {
  getContextData,
  initializeRequestContext,
  setContextData,
} from '../../../context/config.js';
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
    test('should initialize context on each render', async () => {
      const initSpy = vi.fn();
      const originalInit = initializeRequestContext;

      // Mock initializeRequestContext temporarily
      vi.mock('../../../context/config.js', async () => {
        const actual = await vi.importActual('../../../context/config.js');
        return {
          ...actual,
          initializeRequestContext: initSpy,
        };
      });

      const TestComponent = () => <div>Test</div>;
      const WrappedComponent = withAppContext(TestComponent);

      await WrappedComponent({});

      // Restore original
      vi.unmock('../../../context/config.js');
    });
  });

  describe('SearchParams extraction', () => {
    test('should extract preview_token from searchParams', async () => {
      const TestComponent = () => {
        const data = getContextData();
        return <div data-testid="token">{data?.preview_token || 'none'}</div>;
      };

      const WrappedComponent = withAppContext(TestComponent);
      const searchParams = Promise.resolve({ preview_token: 'test-token-123' });

      const { findByTestId } = render(
        await WrappedComponent({ searchParams }),
      );

      const element = await findByTestId('token');
      expect(element.textContent).toBe('test-token-123');
    });

    test('should extract locale from searchParams.loc', async () => {
      const TestComponent = () => {
        const data = getContextData();
        return <div data-testid="locale">{data?.locale || 'none'}</div>;
      };

      const WrappedComponent = withAppContext(TestComponent);
      const searchParams = Promise.resolve({ loc: 'en-US' });

      const { findByTestId } = render(await WrappedComponent({ searchParams }));

      const element = await findByTestId('locale');
      expect(element.textContent).toBe('en-US');
    });

    test('should extract key from searchParams', async () => {
      const TestComponent = () => {
        const data = getContextData();
        return <div data-testid="key">{data?.key || 'none'}</div>;
      };

      const WrappedComponent = withAppContext(TestComponent);
      const searchParams = Promise.resolve({ key: 'page-key-123' });

      const { findByTestId } = render(await WrappedComponent({ searchParams }));

      const element = await findByTestId('key');
      expect(element.textContent).toBe('page-key-123');
    });

    test('should extract version from searchParams.ver', async () => {
      const TestComponent = () => {
        const data = getContextData();
        return <div data-testid="version">{data?.version || 'none'}</div>;
      };

      const WrappedComponent = withAppContext(TestComponent);
      const searchParams = Promise.resolve({ ver: '2.0' });

      const { findByTestId } = render(await WrappedComponent({ searchParams }));

      const element = await findByTestId('version');
      expect(element.textContent).toBe('2.0');
    });

    test('should extract all parameters together', async () => {
      const TestComponent = () => {
        const data = getContextData();
        return (
          <div>
            <span data-testid="token">{data?.preview_token}</span>
            <span data-testid="locale">{data?.locale}</span>
            <span data-testid="key">{data?.key}</span>
            <span data-testid="version">{data?.version}</span>
          </div>
        );
      };

      const WrappedComponent = withAppContext(TestComponent);
      const searchParams = Promise.resolve({
        preview_token: 'token123',
        loc: 'en-US',
        key: 'page-key',
        ver: '1.0',
      });

      const { findByTestId } = render(await WrappedComponent({ searchParams }));

      expect((await findByTestId('token')).textContent).toBe('token123');
      expect((await findByTestId('locale')).textContent).toBe('en-US');
      expect((await findByTestId('key')).textContent).toBe('page-key');
      expect((await findByTestId('version')).textContent).toBe('1.0');
    });

    test('should handle array values in searchParams', async () => {
      const TestComponent = () => {
        const data = getContextData();
        return <div data-testid="token">{data?.preview_token || 'none'}</div>;
      };

      const WrappedComponent = withAppContext(TestComponent);
      const searchParams = Promise.resolve({
        preview_token: ['token1', 'token2'],
      });

      const { findByTestId } = render(await WrappedComponent({ searchParams }));

      // Should use first element of array
      const element = await findByTestId('token');
      expect(element.textContent).toBe('token1');
    });

    test('should handle missing searchParams', async () => {
      const TestComponent = () => {
        const data = getContextData();
        return <div data-testid="data">{JSON.stringify(data)}</div>;
      };

      const WrappedComponent = withAppContext(TestComponent);

      const { findByTestId } = render(await WrappedComponent({}));

      const element = await findByTestId('data');
      const data = JSON.parse(element.textContent || '{}');
      expect(data.preview_token).toBeUndefined();
      expect(data.locale).toBeUndefined();
    });
  });

  describe('Initial context parameter', () => {
    test('should merge initialContext with searchParams', async () => {
      const TestComponent = () => {
        const data = getContextData();
        return (
          <div>
            <span data-testid="token">{data?.preview_token}</span>
            <span data-testid="locale">{data?.locale}</span>
          </div>
        );
      };

      const WrappedComponent = withAppContext(TestComponent, {
        locale: 'default-locale',
      });

      const searchParams = Promise.resolve({ preview_token: 'token123' });

      const { findByTestId } = render(await WrappedComponent({ searchParams }));

      expect((await findByTestId('token')).textContent).toBe('token123');
      expect((await findByTestId('locale')).textContent).toBe('default-locale');
    });

    test('should allow searchParams to override initialContext', async () => {
      const TestComponent = () => {
        const data = getContextData();
        return <div data-testid="locale">{data?.locale}</div>;
      };

      const WrappedComponent = withAppContext(TestComponent, {
        locale: 'default-locale',
      });

      const searchParams = Promise.resolve({ loc: 'en-US' });

      const { findByTestId } = render(await WrappedComponent({ searchParams }));

      // searchParams should take precedence (applied after initialContext)
      expect((await findByTestId('locale')).textContent).toBe('en-US');
    });
  });

  describe('React Server Component compatibility', () => {
    test('should handle async searchParams (Next.js 15+)', async () => {
      const TestComponent = () => {
        const data = getContextData();
        return <div data-testid="result">{data?.preview_token}</div>;
      };

      const WrappedComponent = withAppContext(TestComponent);

      // Simulate async searchParams from Next.js 15
      const searchParams = new Promise<{ preview_token: string }>((resolve) => {
        setTimeout(() => resolve({ preview_token: 'async-token' }), 10);
      });

      const { findByTestId } = render(
        await WrappedComponent({ searchParams }),
      );

      const element = await findByTestId('result');
      expect(element.textContent).toBe('async-token');
    });
  });
});
