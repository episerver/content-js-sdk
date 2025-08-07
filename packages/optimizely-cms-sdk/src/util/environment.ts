// A simple function to check for the development environment.
export function isDev(): boolean {
  return (
    typeof process !== 'undefined' && process.env?.NODE_ENV === 'development'
  );
}
