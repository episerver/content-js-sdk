import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: {
    cli: 'src/cli.ts',
    dev: 'src/dev.ts',
    generator: 'src/generator.ts',
  },
  format: 'esm',
  platform: 'node',
  clean: true,
  dts: false,
  external: [/^\.\/generator\.js$/],
});
