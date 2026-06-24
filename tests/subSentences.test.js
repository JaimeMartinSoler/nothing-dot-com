import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  subSentenceParts,
  hasNextSubSentence,
  clampSubIndex,
} from '../src/subSentences.js';

describe('subSentenceParts', () => {
  it('wraps a plain string as a single-part array', () => {
    assert.deepEqual(subSentenceParts('Just close the tab'), ['Just close the tab']);
  });

  it('returns an array of parts unchanged', () => {
    assert.deepEqual(subSentenceParts(['Or keep clicking.', " It's your time"]), [
      'Or keep clicking.',
      " It's your time",
    ]);
  });
});

describe('hasNextSubSentence', () => {
  it('is false for a plain string (no parts to reveal)', () => {
    assert.equal(hasNextSubSentence('This is nothing...', 0), false);
  });

  it('is true while parts remain to reveal', () => {
    const data = ['Or keep clicking.', " It's your time"];
    assert.equal(hasNextSubSentence(data, 0), true);
  });

  it('is false once the last part is reached', () => {
    const data = ['Or keep clicking.', " It's your time"];
    assert.equal(hasNextSubSentence(data, 1), false);
  });

  it('is false past the end (so the sentence advances)', () => {
    const data = ['Or keep clicking.', " It's your time"];
    assert.equal(hasNextSubSentence(data, 5), false);
  });
});

describe('clampSubIndex', () => {
  it('keeps an in-range index untouched', () => {
    const data = ['Go outside.', ' The sun is real'];
    assert.equal(clampSubIndex(data, 1), 1);
  });

  it('clamps to the last part when the new language has fewer parts', () => {
    // Switched from a 3-part sentence (subIndex 2) to a 2-part translation.
    const data = ['Go outside.', ' The sun is real'];
    assert.equal(clampSubIndex(data, 2), 1);
  });

  it('clamps to 0 for a plain string', () => {
    assert.equal(clampSubIndex('But sure, one more click', 2), 0);
  });

  it('never returns a negative index for an empty array', () => {
    assert.equal(clampSubIndex([], 3), 0);
  });
});
