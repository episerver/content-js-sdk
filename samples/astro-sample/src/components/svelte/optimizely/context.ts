import { createContext, type Component } from 'svelte';
import type { ComponentRegistry } from '@optimizely/cms-sdk/core';

// Passed through context rather than imported, since the registry imports the components that read it.
// `Component<never>` admits any Svelte component, whatever props it declares.
export const [getRegistry, setRegistry] = createContext<ComponentRegistry<Component<never>>>();
