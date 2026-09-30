import { describe, expect, test } from 'vitest';
import {
  evaluateCondition,
  getJumpTarget,
  isElementVisible,
  isRuleSatisfied,
  isStepVisible,
  type DependencyRule,
} from '../forms/rules.js';

const condition = (operator: string, value: string) => ({
  DependsOnField: 'a',
  ComparisonOperator: operator,
  ComparisonValue: value,
});

const rule = (overrides: Partial<DependencyRule> = {}): DependencyRule => ({
  TargetElement: 'target',
  SatisfiedAction: 'Show',
  ConditionCombination: 'Any',
  Conditions: [condition('Equals', 'yes')],
  ...overrides,
});

describe('evaluateCondition', () => {
  const values = new Map<string, unknown>([['a', 'hello world']]);

  test.each([
    ['Equals', 'hello world', true],
    ['Equals', 'nope', false],
    ['NotEquals', 'nope', true],
    ['Contains', 'lo wo', true],
    ['NotContains', 'zzz', true],
    ['StartsWith', 'hello', true],
    ['EndsWith', 'world', true],
    ['MatchRegularExpression', '^hello', true],
    ['MatchRegularExpression', '^world', false],
  ])('%s %s -> %s', (operator, value, expected) => {
    expect(evaluateCondition(condition(operator, value), values)).toBe(expected);
  });

  test('an unparseable regex is not a match rather than a crash', () => {
    expect(evaluateCondition(condition('MatchRegularExpression', '['), values)).toBe(false);
  });

  test('an unknown operator never matches', () => {
    expect(evaluateCondition(condition('IsBlue', 'hello world'), values)).toBe(false);
  });

  test('an incomplete condition never matches', () => {
    const incomplete = { DependsOnField: null, ComparisonOperator: 'Equals', ComparisonValue: 'x' };
    expect(evaluateCondition(incomplete, values)).toBe(false);
  });
});

describe('isRuleSatisfied', () => {
  const values = new Map<string, unknown>([
    ['a', 'yes'],
    ['b', 'no'],
  ]);

  const two = [condition('Equals', 'yes'), { ...condition('Equals', 'yes'), DependsOnField: 'b' }];

  test('a rule with no conditions is satisfied', () => {
    expect(isRuleSatisfied(rule({ Conditions: [] }), values)).toBe(true);
    expect(isRuleSatisfied(rule({ Conditions: null }), values)).toBe(true);
  });

  test('malformed conditions count as none', () => {
    const malformed = rule({ Conditions: {} as unknown as DependencyRule['Conditions'] });

    expect(isRuleSatisfied(malformed, values)).toBe(true);
  });

  test('All requires every condition', () => {
    expect(isRuleSatisfied(rule({ ConditionCombination: 'All', Conditions: two }), values)).toBe(
      false,
    );
  });

  test('anything other than All requires only one', () => {
    expect(isRuleSatisfied(rule({ ConditionCombination: 'Any', Conditions: two }), values)).toBe(
      true,
    );
  });
});

describe('isElementVisible', () => {
  const satisfied = new Map<string, unknown>([['a', 'yes']]);
  const unsatisfied = new Map<string, unknown>([['a', 'no']]);

  test('an element no rule targets is visible', () => {
    expect(isElementVisible([rule()], satisfied, 'other')).toBe(true);
  });

  test('a satisfied Show shows, an unsatisfied Show hides', () => {
    expect(isElementVisible([rule()], satisfied, 'target')).toBe(true);
    expect(isElementVisible([rule()], unsatisfied, 'target')).toBe(false);
  });

  test('a satisfied Hide hides, an unsatisfied Hide leaves it alone', () => {
    const hide = [rule({ SatisfiedAction: 'Hide' })];
    expect(isElementVisible(hide, satisfied, 'target')).toBe(false);
    expect(isElementVisible(hide, unsatisfied, 'target')).toBe(true);
  });

  test('a satisfied Hide beats a satisfied Show', () => {
    const both = [rule(), rule({ SatisfiedAction: 'Hide' })];
    expect(isElementVisible(both, satisfied, 'target')).toBe(false);
  });

  test('any of several ids can match the rule', () => {
    expect(isElementVisible([rule()], unsatisfied, ['other', 'target'])).toBe(false);
  });
});

describe('isStepVisible', () => {
  const satisfied = new Map<string, unknown>([['a', 'yes']]);
  const unsatisfied = new Map<string, unknown>([['a', 'no']]);
  const stepRule = (action: string) =>
    rule({ TargetElement: null, TargetStep: 'step', SatisfiedAction: action });

  test('ShowStep and HideStep follow the same precedence as elements', () => {
    expect(isStepVisible([stepRule('ShowStep')], satisfied, 'step')).toBe(true);
    expect(isStepVisible([stepRule('ShowStep')], unsatisfied, 'step')).toBe(false);
    expect(isStepVisible([stepRule('HideStep')], satisfied, 'step')).toBe(false);
  });

  test('element rules do not affect steps', () => {
    expect(isStepVisible([rule({ TargetElement: 'step' })], unsatisfied, 'step')).toBe(true);
  });
});

describe('getJumpTarget', () => {
  const satisfied = new Map<string, unknown>([['a', 'yes']]);
  const jump = rule({ TargetElement: null, AfterStep: 'first', JumpToStep: 'third' });

  test('a satisfied rule after the step names the target', () => {
    expect(getJumpTarget([jump], satisfied, ['x', 'first'])).toBe('third');
  });

  test('no satisfied rule means no jump', () => {
    expect(getJumpTarget([jump], new Map([['a', 'no']]), 'first')).toBeNull();
    expect(getJumpTarget([jump], satisfied, 'second')).toBeNull();
  });
});
