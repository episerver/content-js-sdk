/** Super-class for all errors related to Optimizely React rendering */
export class OptimizelyReactError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OptimizelyReactError';
  }
}
