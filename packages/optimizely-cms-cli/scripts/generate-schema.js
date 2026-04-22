#!/usr/bin/env node

/**
 * Script to fetch OpenAPI schema and generate TypeScript types
 * This script is NOT included in the build
 *
 * Prerequisites: Run `pnpm build` first to compile TypeScript modules
 */

import { input } from '@inquirer/prompts';
import { writeFile, mkdir } from 'fs/promises';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import openapiTS, { astToString } from 'openapi-typescript';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function main() {
  try {
    // Import compiled modules
    const { getToken } = await import('../dist/service/cmsRestClient.js');

    // Prompt for credentials
    const clientId = await input({
      message: 'Enter OPTIMIZELY_CMS_CLIENT_ID:',
      validate: (value) => {
        if (!value || value.trim() === '') {
          return 'Client ID is required';
        }
        return true;
      },
    });

    const clientSecret = await input({
      message: 'Enter OPTIMIZELY_CMS_CLIENT_SECRET:',
      validate: (value) => {
        if (!value || value.trim() === '') {
          return 'Client Secret is required';
        }
        return true;
      },
    });

    // Authenticate with CMS
    console.log('\nAuthenticating with CMS...');
    const token = await getToken(clientId.trim(), clientSecret.trim());
    console.log('✓ Authentication successful');

    // Prompt user for version
    const version = await input({
      message: 'Enter the API version (e.g., v1):',
      default: 'v1',
      validate: (value) => {
        if (!value || value.trim() === '') {
          return 'Version is required';
        }
        return true;
      },
    });

    const apiUrl = `https://api.cms.optimizely.com/${version.trim()}/docs/content-openapi.json`;

    console.log(`\nFetching OpenAPI schema from: ${apiUrl}`);

    // Fetch the OpenAPI schema with authentication
    const response = await fetch(apiUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(
        `Failed to fetch OpenAPI schema: ${response.status} ${response.statusText}`,
      );
    }

    const schemaJson = await response.json();
    console.log('✓ OpenAPI schema fetched successfully');
    console.log(
      `Schema version: ${schemaJson.openapi || schemaJson.swagger || 'unknown'}`,
    );

    // Validate the schema format
    if (!schemaJson.openapi || !schemaJson.openapi.startsWith('3.')) {
      throw new Error(
        `Unsupported schema format. Expected OpenAPI 3.x but got: ${schemaJson.openapi || schemaJson.swagger || 'unknown'}`,
      );
    }

    // Generate TypeScript types from the schema object
    console.log('Generating TypeScript types...');
    const ast = await openapiTS(schemaJson);
    const types = astToString(ast);
    console.log(
      `Generated ${types.length} characters of TypeScript definitions`,
    );

    // Write to file
    const outputPath = resolve(
      __dirname,
      '../src/service/apiSchema/openapi-schema-types.ts',
    );

    // Ensure directory exists
    await mkdir(dirname(outputPath), { recursive: true });

    await writeFile(outputPath, types, 'utf-8');

    console.log(`✓ TypeScript types generated successfully at:`);
    console.log(`  ${outputPath}`);
  } catch (error) {
    console.error('\n✗ Error:', error.message);
    process.exit(1);
  }
}

main();
