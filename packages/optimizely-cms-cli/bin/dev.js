#!/usr/bin/env -S pnpm tsx
import { execute } from '@oclif/core';

await execute({ development: true, dir: import.meta.url });
