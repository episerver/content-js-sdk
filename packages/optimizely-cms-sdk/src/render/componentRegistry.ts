export type ComponentResolver<C> =
  | Record<string, C>
  | ((contentType: string) => C);

/** A registry mapping content type names and components */
export class ComponentRegistry<T> {
  resolver: ComponentResolver<T>;

  constructor(resolver: ComponentResolver<T>) {
    this.resolver = resolver;
  }

  /** Returns the component given its content type name. Returns `undefined` if not found */
  getComponent(contentType: string): T {
    if (typeof this.resolver === 'object') {
      return this.resolver[contentType];
    } else {
      return this.resolver(contentType);
    }
  }
}
