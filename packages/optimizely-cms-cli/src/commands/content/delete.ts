import { Args } from '@oclif/core';
import { confirm } from '@inquirer/prompts';
import chalk from 'chalk';
import { BaseCommand } from '../../baseCommand.js';
import { createApiClient } from '../../service/cmsRestClient.js';
import { deleteItems } from '../../service/deleteService.js';
import { itemId } from '../../utils/normalizeManifest.js';

const confirmMessage = (keys: string[]) =>
  keys.length === 1 ?
    `Are you sure you want to delete the content type "${chalk.yellow(keys[0])}"? This action cannot be undone.`
  : `Are you sure you want to delete ${keys.length} content types (${keys.map(key => chalk.yellow(key)).join(', ')})? This action cannot be undone.`;

export default class ContentDelete extends BaseCommand<typeof ContentDelete> {
  // the remaining arguments are further keys
  static override strict = false;
  static override args = {
    key: Args.string({
      description: 'Keys of the content types to delete, separated by spaces',
      required: true,
    }),
  };
  static override description =
    'Delete one or more content type definitions from the CMS';
  static override examples = [
    '<%= config.bin %> <%= command.id %> Article',
    '<%= config.bin %> <%= command.id %> Article ProductPage',
  ];

  public async run(): Promise<void> {
    const { argv, flags } = await this.parse(ContentDelete);
    const keys = [...new Set(argv as string[])];

    if (!(await confirm({ message: confirmMessage(keys), default: false }))) {
      console.log(chalk.dim('Deletion cancelled.'));
      return;
    }

    const client = await createApiClient(flags.host);
    const outcomes = await deleteItems(
      client,
      keys.map(key => itemId('contentTypes', key)),
    );

    // a key that isn't in the CMS was named on purpose, so it counts as a failure
    if (Object.values(outcomes).some(outcome => outcome !== 'deleted')) process.exit(1);
  }
}
