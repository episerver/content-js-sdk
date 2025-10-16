// Use this script to view and delete webhooks in Optimizely Graph
// Read more: https://docs.developers.optimizely.com/platform-optimizely/reference/create-webhookhandler
import { select } from '@clack/prompts';
import {
  cancel,
  confirm,
  intro,
  isCancel,
  log,
  outro,
  password,
  spinner,
  text,
} from '@clack/prompts';
import 'dotenv/config';

function validate(str) {
  if (!str) return 'Value is required';
}

function exitIfCancelled(value) {
  if (isCancel(value)) {
    cancel('Operation cancelled');
    process.exit(0);
  }
  return value;
}

async function handleResponse(response) {
  if (!response.ok) {
    log.error(await response.text());
    cancel('Something wrong happened when listing the webhooks');
    process.exit();
  }

  return response.json();
}

intro('View and delete webhooks in Optimizely Graph');

log.step(
  'Go to your CMS > Settings > API Keys. You will need the keys under `Manage Graph`'
);

const appKey = await password({
  message: "Input the 'AppKey'",
  validate,
}).then(exitIfCancelled);

const secret = await password({
  message: "Input the 'Secret'",
  validate,
}).then(exitIfCancelled);

const prod = await confirm({
  message:
    'Do you use Optimizely Graph API prod (https://prod.cg.optimizely.com/api)?',
}).then(exitIfCancelled);

const graphApiUrl = prod
  ? 'https://prod.cg.optimizely.com/api'
  : await text({
      message: 'Input the Graph API URL',
      placeholder: 'https://prod.cg.optimizely.com/api',
    }).then(exitIfCancelled);

const endpoint = `${graphApiUrl}/webhooks`;
const auth = 'Basic ' + Buffer.from(`${appKey}:${secret}`).toString('base64');

while (true) {
  const webhooksList = await fetch(endpoint, {
    headers: { Authorization: auth },
  }).then(handleResponse);

  if (webhooksList.length === 0) {
    log.info("You don't have any webhooks");
    cancel('Operation cancelled');
    process.exit(0);
  }

  log.step("You can see now the webhooks and delete the ones you don't need");

  const selected = await select({
    message: 'Select a webhook to delete it',
    options: [
      { value: null, label: 'Do not delete any webhook' },
      ...webhooksList.map((w) => ({
        value: w.id,
        label: w.request.url,
      })),
    ],
  }).then(exitIfCancelled);

  if (!selected) {
    cancel('Operation cancelled');
    process.exit(0);
  }

  await fetch(`${endpoint}/${selected}`, {
    method: 'DELETE',
    headers: { Authorization: auth },
  }).then(async (r) => {
    if (!r.ok) {
      log.error(await r.text());
      cancel('Something wrong happened when deleting the webhook');
      process.exit();
    }
  });

  log.info('Webhook deleted');
}
