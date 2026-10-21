import { createComponentPreviewPage } from '@optimizely/cms-sdk/react/server';
import { faker } from '@faker-js/faker';

export default createComponentPreviewPage({
  defaultLocale: 'en',
  mockData: faker,
  // Who may read a preview's size. Comma-separated, so one site can be
  // embedded by more than one environment. Unset means previews stay silent.
  parentOrigin: process.env.PREVIEW_PARENT_ORIGIN?.split(',').map(o => o.trim()),
});
