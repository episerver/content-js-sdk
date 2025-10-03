// Use this script to create a webhook in Optimizely Graph
// Read more: https://docs.developers.optimizely.com/platform-optimizely/reference/create-webhookhandler
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

intro('Create a webhook in Optimizely Graph');

const url = await text({
  message: 'Input the URL where this project is deployed',
  placeholder: 'https://example.com',
  validate,
}).then(exitIfCancelled);

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

const requestBody = {
  disabled: false,
  request: {
    url: `${url}/webhook`,
    method: 'post',
  },
  topic: ['*.*'],
  filters: {
    status: { eq: 'Published' },
  },
};

log.step(
  `You are going to make a POST request to the endpoint "${endpoint}"\n` +
    `with the following body\n\n` +
    JSON.stringify(requestBody, null, 2)
);

const confirmCreatioin = await confirm({ message: 'Confirm?' }).then(
  exitIfCancelled
);

if (!confirmCreatioin) {
  cancel('Operation cancelled');
  process.exit(0);
}

const s = spinner();
s.start('Creating webhook');

const auth = 'Basic ' + Buffer.from(`${appKey}:${secret}`).toString('base64');
const response = await fetch(endpoint, {
  method: 'POST',
  body: JSON.stringify(requestBody),
  headers: {
    Authorization: auth,
  },
});

if (!response.ok) {
  s.stop('Error');
  log.error(await response.text());
  cancel('Something wrong happened when creating the webhook');
  process.exit();
}

s.stop('Webhook created');
outro('Done! The webhook has been created');
