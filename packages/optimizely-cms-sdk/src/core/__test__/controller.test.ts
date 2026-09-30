import { beforeEach, describe, expect, test, vi } from 'vitest';
import {
  createFormController,
  createSubmissionStore,
  type FormController,
} from '../forms/controller.js';

const effects = () => ({
  scrollToElementId: vi.fn<(elementId: string) => void>(),
  revealField: vi.fn<(element: HTMLElement) => void>(),
});

/** Registers a field whose validity the test controls. */
const addField = (
  controller: FormController,
  name: string,
  valid: boolean,
  stepIndex?: number,
) => controller.registerField(name, null, () => valid, stepIndex);

describe('validation', () => {
  test('validateAllFields reports the failures in page order', () => {
    const controller = createFormController({ submission: createSubmissionStore() });

    addField(controller, 'first', false);
    addField(controller, 'second', true);
    addField(controller, 'third', false);

    expect(controller.validateAllFields()).toEqual(['first', 'third']);
  });

  test('re-registering a field does not move it in page order', () => {
    const controller = createFormController({ submission: createSubmissionStore() });

    addField(controller, 'first', false);
    addField(controller, 'second', false);

    // What a field does on every validity flip: unregister, then register again.
    controller.unregisterField('first');
    addField(controller, 'first', false);

    expect(controller.validateAllFields()).toEqual(['first', 'second']);
  });

  test('a stepIndex restricts validation to that step', () => {
    const controller = createFormController({ submission: createSubmissionStore() });

    addField(controller, 'onFirst', false, 0);
    addField(controller, 'onSecond', false, 1);

    expect(controller.validateAllFields({ stepIndex: 0 })).toEqual(['onFirst']);
    expect(controller.validateAllFields()).toEqual(['onFirst', 'onSecond']);
  });

  test('hasAnyErrors follows the fields reporting errors', () => {
    const controller = createFormController({ submission: createSubmissionStore() });

    controller.setFieldError('email', true);
    expect(controller.getSnapshot().hasAnyErrors).toBe(true);

    controller.setFieldError('email', false);
    expect(controller.getSnapshot().hasAnyErrors).toBe(false);
  });

  test('unregistering a failing field clears its error', () => {
    const controller = createFormController({ submission: createSubmissionStore() });

    controller.setFieldError('hidden', true);
    controller.unregisterField('hidden');

    expect(controller.getSnapshot().hasAnyErrors).toBe(false);
  });
});

describe('steps', () => {
  test('nextStep validates only the current step', () => {
    const controller = createFormController({
      submission: createSubmissionStore(),
      stepIds: [[], []],
      effects: effects(),
    });

    addField(controller, 'onFirst', true, 0);
    addField(controller, 'onSecond', false, 1);

    controller.nextStep();

    expect(controller.getSnapshot().currentStepIndex).toBe(1);
    expect(controller.getSnapshot().attemptedSubmit).toBe(false);
  });

  test('an invalid current step blocks the move and queues a reveal', () => {
    const controller = createFormController({
      submission: createSubmissionStore(),
      stepIds: [[], []],
      effects: effects(),
    });

    addField(controller, 'onFirst', false, 0);
    controller.nextStep();

    expect(controller.getSnapshot().currentStepIndex).toBe(0);
    expect(controller.getSnapshot().attemptedSubmit).toBe(true);
    expect(controller.getSnapshot().fieldToReveal).toBe('onFirst');
  });

  test('the steps clamp at both ends', () => {
    const controller = createFormController({
      submission: createSubmissionStore(),
      stepIds: [[], []],
      effects: effects(),
    });

    controller.nextStep();
    controller.nextStep();
    expect(controller.getSnapshot().currentStepIndex).toBe(1);

    controller.prevStep();
    controller.prevStep();
    expect(controller.getSnapshot().currentStepIndex).toBe(0);
  });

  test('nextStep follows a jump target, and prevStep retraces it', () => {
    const controller = createFormController({
      submission: createSubmissionStore(),
      stepIds: [['a'], ['b'], ['c']],
      stepRules: {
        getJumpTarget: ids => (ids.includes('a') ? 'c' : null),
        isStepVisible: () => true,
      },
      effects: effects(),
    });

    controller.nextStep();
    expect(controller.getSnapshot().currentStepIndex).toBe(2);

    controller.prevStep();
    expect(controller.getSnapshot().currentStepIndex).toBe(0);
  });

  test('a jump target naming no step falls back to the next step', () => {
    const controller = createFormController({
      submission: createSubmissionStore(),
      stepIds: [['a'], ['b'], ['c']],
      stepRules: { getJumpTarget: () => 'missing', isStepVisible: () => true },
      effects: effects(),
    });

    controller.nextStep();
    expect(controller.getSnapshot().currentStepIndex).toBe(1);
  });

  test('nextStep skips hidden steps but never the last one', () => {
    const controller = createFormController({
      submission: createSubmissionStore(),
      stepIds: [['a'], ['b'], ['c']],
      stepRules: { getJumpTarget: () => null, isStepVisible: () => false },
      effects: effects(),
    });

    controller.nextStep();
    expect(controller.getSnapshot().currentStepIndex).toBe(2);
  });

  test('revealPendingField reveals once and then clears', () => {
    const formEffects = effects();
    const controller = createFormController({
      submission: createSubmissionStore(),
      stepIds: [[]],
      effects: formEffects,
    });

    const element = {} as HTMLElement;
    controller.registerField('email', element, () => false, 0);
    controller.nextStep();

    controller.revealPendingField();
    expect(formEffects.revealField).toHaveBeenCalledWith(element);
    expect(controller.getSnapshot().fieldToReveal).toBeNull();

    controller.revealPendingField();
    expect(formEffects.revealField).toHaveBeenCalledTimes(1);
  });
});

describe('reset', () => {
  test('resetFields only bumps the token', () => {
    const controller = createFormController({ submission: createSubmissionStore() });

    expect(controller.getSnapshot().resetToken).toBe(0);

    controller.setAttemptedSubmit(true);
    controller.resetFields();

    expect(controller.getSnapshot().resetToken).toBe(1);
    expect(controller.getSnapshot().attemptedSubmit).toBe(true);
  });

  test('reset also returns to the first step and forgets the attempt', () => {
    const controller = createFormController({
      submission: createSubmissionStore(),
      stepIds: [[], []],
      effects: effects(),
    });

    controller.nextStep();
    controller.setAttemptedSubmit(true);
    controller.reset();

    const state = controller.getSnapshot();
    expect(state).toMatchObject({
      resetToken: 1,
      attemptedSubmit: false,
      currentStepIndex: 0,
    });
  });
});

describe('submit', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  test('an invalid form is not sent, and the offending step is shown', async () => {
    const submission = createSubmissionStore();
    const controller = createFormController({
      submission,
      stepIds: [[], []],
      effects: effects(),
    });

    addField(controller, 'onSecond', false, 1);
    await controller.submit(new FormData());

    expect(fetchMock).not.toHaveBeenCalled();
    expect(submission.getSnapshot().status).toBe('idle');
    expect(controller.getSnapshot().currentStepIndex).toBe(1);
    expect(controller.getSnapshot().fieldToReveal).toBe('onSecond');
  });

  test('a successful POST resets the form and the DOM element', async () => {
    fetchMock.mockResolvedValue({ ok: true });

    const submission = createSubmissionStore();
    const controller = createFormController({
      submission,
      action: 'https://example.com/submit',
      effects: effects(),
    });

    const form = { reset: vi.fn() };
    await controller.submit(new FormData(), form);

    expect(fetchMock).toHaveBeenCalledWith('https://example.com/submit', {
      method: 'POST',
      body: expect.any(FormData),
    });
    expect(form.reset).toHaveBeenCalled();
    expect(submission.getSnapshot().formSuccess).toBe(true);
    expect(controller.getSnapshot().resetToken).toBe(1);
  });

  test('a failed built-in POST reports no message', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 500 });

    const submission = createSubmissionStore();
    const controller = createFormController({ submission, effects: effects() });

    await controller.submit(new FormData());

    expect(submission.getSnapshot().formError).toBe(true);
    expect(submission.getSnapshot().errorMessage).toBeUndefined();
  });

  test("a handler's own error reaches errorMessage", async () => {
    const submission = createSubmissionStore();
    const controller = createFormController({
      submission,
      submitHandler: async () => {
        throw new Error('The service is down');
      },
      effects: effects(),
    });

    await controller.submit(new FormData());

    expect(fetchMock).not.toHaveBeenCalled();
    expect(submission.getSnapshot().errorMessage).toBe('The service is down');
  });

  test('a thrown non-Error fails the submit without a message', async () => {
    const submission = createSubmissionStore();
    const controller = createFormController({
      submission,
      submitHandler: async () => {
        throw 'The service is down';
      },
      effects: effects(),
    });

    await controller.submit(new FormData());

    expect(submission.getSnapshot()).toMatchObject({
      status: 'error',
      error: 'The service is down',
      errorMessage: undefined,
    });
  });

  test('a submit while one is in flight is ignored', async () => {
    let finish = () => {};
    const submitHandler = vi.fn(() => new Promise<void>(resolve => (finish = resolve)));
    const submission = createSubmissionStore();
    const controller = createFormController({ submission, submitHandler, effects: effects() });

    const first = controller.submit(new FormData());
    expect(submission.getSnapshot().isSubmitting).toBe(true);

    await controller.submit(new FormData());
    finish();
    await first;

    expect(submitHandler).toHaveBeenCalledTimes(1);
    expect(submission.getSnapshot().formSuccess).toBe(true);
  });

  test('blanks shadowing an answer are dropped before sending', async () => {
    const submitHandler = vi.fn().mockResolvedValue(undefined);
    const controller = createFormController({
      submission: createSubmissionStore(),
      submitHandler,
      effects: effects(),
    });

    const data = new FormData();
    data.append('email', '');
    data.append('email', 'someone@example.com');

    await controller.submit(data);

    expect(submitHandler.mock.calls[0][0].getAll('email')).toEqual([
      'someone@example.com',
    ]);
  });

  test('update swaps the handler an already-mounted form submits through', async () => {
    const first = vi.fn().mockResolvedValue(undefined);
    const second = vi.fn().mockResolvedValue(undefined);

    const controller = createFormController({
      submission: createSubmissionStore(),
      submitHandler: first,
      effects: effects(),
    });

    controller.update({ submitHandler: second });
    await controller.submit(new FormData());

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalled();
  });

  test('update keeps the settings it is not given', async () => {
    fetchMock.mockResolvedValue({ ok: true });

    const controller = createFormController({
      submission: createSubmissionStore(),
      action: 'https://example.com/submit',
      effects: effects(),
    });

    controller.update({ scrollToOnError: 'form-top' });
    await controller.submit(new FormData());

    expect(fetchMock).toHaveBeenCalledWith('https://example.com/submit', expect.anything());
  });

  test('scrollToOnSuccess defaults to the alert, and errors scroll where asked', async () => {
    fetchMock.mockResolvedValue({ ok: true });

    const formEffects = effects();
    const controller = createFormController({
      submission: createSubmissionStore(),
      scrollToOnError: 'form-top',
      effects: formEffects,
    });

    await controller.submit(new FormData());
    expect(formEffects.scrollToElementId).toHaveBeenCalledWith('form-alert');

    addField(controller, 'email', false);
    await controller.submit(new FormData());
    expect(formEffects.scrollToElementId).toHaveBeenCalledWith('form-top');
  });
});

describe('createSubmissionStore', () => {
  test('a new status clears the previous error', () => {
    const store = createSubmissionStore();

    store.setStatus('error', new Error('nope'));
    expect(store.getSnapshot().errorMessage).toBe('nope');

    store.setStatus('submitting');
    expect(store.getSnapshot()).toMatchObject({
      isSubmitting: true,
      error: undefined,
      errorMessage: undefined,
    });
  });

  test('an error on any other status is discarded', () => {
    const store = createSubmissionStore();

    store.setStatus('success', new Error('nope'));

    expect(store.getSnapshot().error).toBeUndefined();
  });

  test('subscribers are notified and the snapshot is stable between changes', () => {
    const store = createSubmissionStore();
    const listener = vi.fn();

    store.subscribe(listener);
    const before = store.getSnapshot();
    expect(store.getSnapshot()).toBe(before);

    store.setStatus('submitting');
    expect(listener).toHaveBeenCalledTimes(1);
    expect(store.getSnapshot()).not.toBe(before);
  });
});
