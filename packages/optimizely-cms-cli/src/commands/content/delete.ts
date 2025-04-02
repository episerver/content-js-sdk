import { Args } from '@oclif/core';
import { BaseCommand } from '../../baseCommand.js';
import { createApiClient } from '../../service/cmsRestClient.js';

export default class ContentDelete extends BaseCommand<typeof ContentDelete> {
  static override args = {
    key: Args.string({ description: 'Content key', required: true }),
  };
  static override description = 'describe the command here';
  static override examples = ['<%= config.bin %> <%= command.id %>'];
  static override flags = {};

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(ContentDelete);

    const client = await createApiClient(flags.host);
    const r = await client.DELETE('/content/{key}', {
      params: {
        path: {
          key: args.key,
        },
      },
    });

    if (r.response.ok) {
      console.log('Success!');
    } else {
      console.log(r.error);
    }
  }
}
