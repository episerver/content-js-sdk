import { cloneElement, Fragment, isValidElement, type Key, type ReactNode } from 'react';
import { render, type RenderResult } from '@testing-library/react';

type ServerComponent = (props: object) => ReactNode | Promise<ReactNode>;

const withKey = (key: Key | null, node: ReactNode) => (key == null ? node : <Fragment key={key}>{node}</Fragment>);

/** Calls every function component, as a server render does, so hook-using components must not appear in the tree. */
async function resolveServerTree(node: ReactNode | Promise<ReactNode>): Promise<ReactNode> {
  const awaited = await node;

  if (Array.isArray(awaited)) return Promise.all(awaited.map(resolveServerTree));
  if (!isValidElement<{ children?: ReactNode }>(awaited)) return awaited;
  if (typeof awaited.type === 'function')
    return withKey(awaited.key, await resolveServerTree((awaited.type as ServerComponent)(awaited.props)));

  const { children } = awaited.props;
  if (children === undefined) return awaited;
  if (Array.isArray(children)) return cloneElement(awaited, undefined, ...(await Promise.all(children.map(resolveServerTree))));
  return cloneElement(awaited, undefined, await resolveServerTree(children));
}

/** Renders a tree containing async server components by resolving them first. */
export async function renderServer(node: ReactNode | Promise<ReactNode>): Promise<RenderResult> {
  return render(<>{await resolveServerTree(node)}</>);
}
