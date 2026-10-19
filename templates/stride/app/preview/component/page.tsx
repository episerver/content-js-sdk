import { createComponentPreviewPage } from '@optimizely/cms-sdk/react/server';
import { faker } from '@faker-js/faker';

export default createComponentPreviewPage({ defaultLocale: 'en', mockData: faker });
