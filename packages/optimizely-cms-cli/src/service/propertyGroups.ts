import { readFile } from 'node:fs/promises';
import { PropertyGroupType } from '@optimizely/cms-sdk';

/**
 * Adds property groups to an optimizely.config.mjs file.
 * Parses the file content and adds new property groups to the propertyGroups array.
 * @param configPath - Path to the config file
 * @param newGroups - Array of property groups to add
 * @returns Updated config file content
 */
export async function addPropertyGroupToConfig(
  configPath: string,
  newGroups: Array<{
    key: string;
    displayName: string;
    sortOrder?: number;
  }>
): Promise<string> {
  const content = await readFile(configPath, 'utf-8');

  // Check if propertyGroups already exists
  const hasPropertyGroups = /propertyGroups:\s*\[/.test(content);

  if (hasPropertyGroups) {
    // Add to existing propertyGroups array
    return content.replace(
      /(propertyGroups:\s*\[)([\s\S]*?)(\s*\])/,
      (match, start, middle, end) => {
        const existingGroups = middle.trim();
        const newGroupsCode = newGroups
          .map((group) => {
            const sortOrderPart =
              group.sortOrder !== undefined
                ? `\n      sortOrder: ${group.sortOrder},`
                : '';
            return `    {
      key: '${group.key}',
      displayName: '${group.displayName}',${sortOrderPart}
    }`;
          })
          .join(',\n');

        const separator = existingGroups ? ',\n' : '\n';
        return `${start}${existingGroups}${separator}${newGroupsCode}${end}`;
      }
    );
  } else {
    // Add propertyGroups field to buildConfig
    const newGroupsCode = newGroups
      .map((group) => {
        const sortOrderPart =
          group.sortOrder !== undefined
            ? `\n      sortOrder: ${group.sortOrder},`
            : '';
        return `    {
      key: '${group.key}',
      displayName: '${group.displayName}',${sortOrderPart}
    }`;
      })
      .join(',\n');

    // Insert propertyGroups after components
    return content.replace(
      /(components:\s*\[.*?\],?)(\s*)/s,
      `$1$2  propertyGroups: [\n${newGroupsCode}\n  ],\n`
    );
  }
}

/**
 * Generates TypeScript declaration file content for property groups.
 * This creates module augmentation for type-safe property group keys.
 * @param propertyGroups - The property groups from config
 * @returns The content of the .d.ts file
 */
export function generatePropertyGroupTypes(
  propertyGroups: PropertyGroupType[]
): string {
  if (!propertyGroups || propertyGroups.length === 0) {
    return `/// <reference types="@optimizely/cms-sdk" />

import '@optimizely/cms-sdk';

declare module '@optimizely/cms-sdk' {
  interface PropertyGroupRegistry {
    // No custom property groups defined
  }
}
`;
  }

  const keys = propertyGroups
    .map((group) => `    ${group.key}: true;`)
    .join('\n');

  return `/// <reference types="@optimizely/cms-sdk" />

import '@optimizely/cms-sdk';

declare module '@optimizely/cms-sdk' {
  interface PropertyGroupRegistry {
${keys}
  }
}
`;
}
