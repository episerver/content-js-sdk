import { describe, it, expect, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import {
  initForms,
  initReactComponentRegistry,
  OptimizelyComponent,
} from '../server.js';
import {
  init as initContentTypeRegistry,
  getAllContentTypes,
  isContentTypeRegistered,
} from '../../model/contentTypeRegistry.js';
import { contentType } from '../../model/index.js';

const AppComponent = () => <div data-testid='app' />;
const FormContainer = () => <div data-testid='form' />;
const FormInput = () => null;

const AppContentType = contentType({
  key: 'AppPage',
  displayName: 'App Page',
  baseType: '_page',
  properties: {},
});

/** Renders through the real resolution path and reports which component won. */
async function renderContentType(typename: string) {
  const element = await OptimizelyComponent({ content: { __typename: typename } });
  const { queryByTestId } = render(element);

  return {
    app: queryByTestId('app') !== null,
    form: queryByTestId('form') !== null,
  };
}

beforeEach(() => {
  initContentTypeRegistry([AppContentType]);
});

describe('initForms alongside initReactComponentRegistry', () => {
  // Both used to write to one shared registry, so whichever call ran second
  // silently discarded the other's components.
  it('resolves both sets when initForms runs first', async () => {
    initForms({ container: FormContainer });
    initReactComponentRegistry({ resolver: { AppPage: AppComponent } });

    expect(await renderContentType('AppPage')).toMatchObject({ app: true });
    expect(await renderContentType('OptiFormsContainerData')).toMatchObject({
      form: true,
    });
  });

  it('resolves both sets when initForms runs second', async () => {
    initReactComponentRegistry({ resolver: { AppPage: AppComponent } });
    initForms({ container: FormContainer });

    expect(await renderContentType('AppPage')).toMatchObject({ app: true });
    expect(await renderContentType('OptiFormsContainerData')).toMatchObject({
      form: true,
    });
  });

  // The application's components were read back out of its resolver to merge the
  // form ones in, which is only possible when the resolver is a plain object. A
  // function resolver produced an empty map and every app component vanished.
  it('leaves a function resolver working', async () => {
    initReactComponentRegistry({
      resolver: key => (key === 'AppPage' ? AppComponent : undefined),
    });
    initForms({ container: FormContainer });

    expect(await renderContentType('AppPage')).toMatchObject({ app: true });
    expect(await renderContentType('OptiFormsContainerData')).toMatchObject({
      form: true,
    });
  });
});

describe('initForms content types', () => {
  it('registers the form content types', () => {
    initForms({ container: FormContainer });

    expect(isContentTypeRegistered('OptiFormsContainerData')).toBe(true);
    expect(isContentTypeRegistered('AppPage')).toBe(true);
  });

  // `init` used to replace the whole registry, dropping form types added before it.
  it('survives initContentTypeRegistry being called afterwards', () => {
    initForms({ container: FormContainer });
    initContentTypeRegistry([AppContentType]);

    expect(isContentTypeRegistered('OptiFormsContainerData')).toBe(true);
    expect(isContentTypeRegistered('AppPage')).toBe(true);
  });

  // Hot reload re-runs the entry point, and the registry used to grow each time.
  it('registers each type once however often initForms runs', () => {
    initForms({ container: FormContainer });
    initForms({ container: FormContainer, textbox: FormInput });
    initForms({ textbox: FormInput });

    const containers = getAllContentTypes().filter(
      type => type.key === 'OptiFormsContainerData',
    );

    expect(containers).toHaveLength(1);
  });
});
