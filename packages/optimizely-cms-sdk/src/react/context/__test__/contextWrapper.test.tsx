import { afterEach, describe, expect, test, vi } from 'vitest';
import { render } from '@testing-library/react';
import { withAppContext } from '../contextWrapper.js';
import { configureAdapter } from '../../../context/config.js';
import type { ContextAdapter } from '../../../context/baseContext.js';
import { ReactContextAdapter } from '../reactContextAdapter.js';

const createAdapter = (): ContextAdapter => ({
  initializeContext: vi.fn(),
  getData: vi.fn(() => ({})),
  setData: vi.fn(),
  set: vi.fn(),
  get: vi.fn(),
});

describe('withAppContext', () => {
  afterEach(() => configureAdapter(new ReactContextAdapter()));

  test('renders the wrapped component with its props', async () => {
    type Props = { name: string; age: number };
    const Profile = ({ name, age }: Props) => <div>{`${name}-${age}`}</div>;
    const Wrapped = withAppContext(Profile);

    const { container } = render(await Wrapped({ name: 'John', age: 30 }));

    expect(container.textContent).toBe('John-30');
  });

  test('initialises the request context before the component renders', async () => {
    const adapter = createAdapter();
    const Probe = vi.fn(() => <span />);
    configureAdapter(adapter);

    const element = await withAppContext(Probe)({});

    expect(adapter.initializeContext).toHaveBeenCalledTimes(1);
    expect(Probe).not.toHaveBeenCalled();

    render(element);

    expect(Probe).toHaveBeenCalled();
  });
});

describe('contextWrapper module', () => {
  afterEach(() => vi.resetModules());

  test('configures a ReactContextAdapter when none is set', async () => {
    vi.resetModules();
    const config = await import('../../../context/config.js');
    await import('../contextWrapper.js');
    const { ReactContextAdapter: FreshAdapter } = await import('../reactContextAdapter.js');

    expect(config.getAdapter()).toBeInstanceOf(FreshAdapter);
  });

  test('keeps an adapter configured before import', async () => {
    vi.resetModules();
    const config = await import('../../../context/config.js');
    const adapter = createAdapter();
    config.configureAdapter(adapter);

    await import('../contextWrapper.js');

    expect(config.getAdapter()).toBe(adapter);
  });
});
