import { confirm } from '@inquirer/prompts';
import { BaseCommand } from '../../baseCommand.js';
import ora from 'ora';
import { createApiClient } from '../../service/cmsRestClient.js';

export default class DangerDeleteAllContentTypes extends BaseCommand<
  typeof DangerDeleteAllContentTypes
> {
  static override args = {};
  static override description = 'Deletes all content types';
  static override examples = ['<%= config.bin %> <%= command.id %>'];
  static override flags = {};

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(DangerDeleteAllContentTypes);
    const client = await createApiClient(flags.host);

    const answer = await confirm({
      message: 'This will delete all your content types. Are you sure?',
    });

    if (!answer) {
      return;
    }

    const contentTypes = await client
      .GET('/contenttypes')
      .then((r) => r.data?.items);

    const deletedTypes = contentTypes?.filter(
      (t) => t.source !== 'system' && t.source !== 'serverModel'
    );

    if (!deletedTypes) {
      return;
    }

    if (deletedTypes.length === 0) {
      console.log('There are no content types in the CMS');
      return;
    }

    console.log();
    console.log('You will delete all these content types');
    for (const type of deletedTypes) {
      console.log(`- ${type.displayName} (${type.key})`);
    }

    const answer2 = await confirm({
      message: 'Are you sure?',
    });

    if (!answer2) {
      return;
    }

    for (const type of deletedTypes) {
      const spinner = ora(`Deleting ${type.key}...`);
      const r = await client.DELETE('/contenttypes/{key}', {
        params: { path: { key: type.key } },
      });

      if (!r.response.ok) {
        spinner.fail(`'${type.key}' cannot be deleted`);
      } else {
        spinner.succeed(`'${type.key}' deleted`);
      }
    }
  }
}
