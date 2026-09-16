import { loadEnvIntegration } from '../utils/loadEnvIntegration.js';

loadEnvIntegration();

const missingCreds: string[] = [];
if (!process.env.OPTIMIZELY_CMS_CLIENT_ID) missingCreds.push('OPTIMIZELY_CMS_CLIENT_ID');
if (!process.env.OPTIMIZELY_CMS_CLIENT_SECRET) missingCreds.push('OPTIMIZELY_CMS_CLIENT_SECRET');

if (missingCreds.length > 0) {
  console.error(
    `❌ Missing credentials in .env.integration: ${missingCreds.join(', ')}\n` +
    '   REST API integration tests will be skipped.\n'
  );
}
