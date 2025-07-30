/** Definition of one ContentType to Component mapping */
type ComponentFullDefinition<C> = {
  default: C;
  tags: Record<string, C>;
};

/** Optional arguments to resolve a component */
type ResolverOptions = {
  tag: string;
};

/** Function that returns a component given a content type name and options */
type ComponentResolver<C> = (
  contentType: string,
  options?: ResolverOptions
) => C;

/** Maps a content type name to a component */
type ComponentMap<C> = Record<string, C | ComponentFullDefinition<C>>;

export type ComponentResolverOrObject<C> =
  | ComponentResolver<C>
  | ComponentMap<C>;

/** A registry mapping content type names and components */
export class ComponentRegistry<T> {
  resolver: ComponentResolverOrObject<T>;

  /**
   * Initializes the component registry
   *
   */
  constructor(resolverOrObject: ComponentResolverOrObject<T>) {
    this.resolver = resolverOrObject;
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
