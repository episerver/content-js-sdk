import { createContext, type Component } from 'svelte';
import type { ComponentRegistry } from '@optimizely/cms-sdk/core';

export type SvelteComponentRegistry = ComponentRegistry<Component<any>>;

// Passed through context rather than imported, since the registry imports the components that read it.
export const [getRegistry, setRegistry] = createContext<SvelteComponentRegistry>();
