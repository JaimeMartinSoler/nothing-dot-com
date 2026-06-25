import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  resolveSubtitleText,
  shouldShowSubtitle,
  resolveExtraDelayMs,
} from '../src/subtitle.js';

const fullSubtitle = {
  sentence: { en: '(tap to continue)', es: '(toca para continuar)' },
  extra_delay_ms: 2000,
  show_only_first_time: true,
};

describe('resolveSubtitleText', () => {
  it('returns the text for the active language', () => {
    assert.equal(resolveSubtitleText(fullSubtitle, 'en'), '(tap to continue)');
    assert.equal(resolveSubtitleText(fullSubtitle, 'es'), '(toca para continuar)');
  });

  it('returns null when the subtitle block is absent', () => {
    assert.equal(resolveSubtitleText(undefined, 'en'), null);
    assert.equal(resolveSubtitleText(null, 'en'), null);
  });

  it('returns null when `sentence` is missing', () => {
    assert.equal(resolveSubtitleText({ show_only_first_time: true }, 'en'), null);
  });

  it('returns null when the active language has no entry', () => {
    assert.equal(resolveSubtitleText({ sentence: { en: 'hi' } }, 'es'), null);
  });

  it('returns null for a non-string entry', () => {
    assert.equal(resolveSubtitleText({ sentence: { en: 123 } }, 'en'), null);
  });
});

describe('shouldShowSubtitle', () => {
  it('is false when the subtitle block is absent', () => {
    assert.equal(shouldShowSubtitle(undefined, 0, []), false);
  });

  it('is false for any sentence other than the first', () => {
    assert.equal(shouldShowSubtitle(fullSubtitle, 1, []), false);
  });

  it('shows on the first cycle when `show_only_first_time` is set', () => {
    assert.equal(shouldShowSubtitle(fullSubtitle, 0, []), true);
    assert.equal(shouldShowSubtitle(fullSubtitle, 0, ['000']), true);
  });

  it('hides on later cycles when `show_only_first_time` is set', () => {
    assert.equal(shouldShowSubtitle(fullSubtitle, 0, ['000', '001']), false);
  });

  it('always shows when `show_only_first_time` is false', () => {
    const sub = { ...fullSubtitle, show_only_first_time: false };
    assert.equal(shouldShowSubtitle(sub, 0, ['000', '001', '002']), true);
  });

  it('treats a non-array history as empty (first time)', () => {
    assert.equal(shouldShowSubtitle(fullSubtitle, 0, undefined), true);
  });
});

describe('resolveExtraDelayMs', () => {
  it('returns the configured delay', () => {
    assert.equal(resolveExtraDelayMs(fullSubtitle), 2000);
  });

  it('accepts an explicit 0 instead of falling back', () => {
    assert.equal(resolveExtraDelayMs({ extra_delay_ms: 0 }), 0);
  });

  it('defaults to 0 when unset', () => {
    assert.equal(resolveExtraDelayMs({}), 0);
    assert.equal(resolveExtraDelayMs(undefined), 0);
  });
});
