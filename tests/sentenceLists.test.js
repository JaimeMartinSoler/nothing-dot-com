import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  SHOWN_LISTS_KEY,
  listAlias,
  readShownLists,
  markListShown,
  orderedCandidates,
} from '../src/sentenceLists.js';

// Minimal in-memory localStorage stand-in.
function fakeStorage(initial = {}) {
  const store = { ...initial };
  return {
    getItem: (k) => (k in store ? store[k] : null),
    setItem: (k, v) => {
      store[k] = String(v);
    },
    removeItem: (k) => {
      delete store[k];
    },
    _store: store,
  };
}

// Storage whose setItem always throws, e.g. private mode / quota exceeded.
function throwingStorage(initial = {}) {
  const base = fakeStorage(initial);
  return {
    ...base,
    setItem: () => {
      throw new Error('QuotaExceededError');
    },
  };
}

const PATHS = ['./sentences/000.yaml', './sentences/001.yaml', './sentences/002.yaml'];
const ALIASES = PATHS.map(listAlias);

describe('listAlias', () => {
  it('extracts the filename without extension as the alias', () => {
    assert.equal(listAlias('./sentences/001.yaml'), '001');
  });

  it('supports non-numeric aliases (any word)', () => {
    assert.equal(listAlias('./sentences/monday-blues.yaml'), 'monday-blues');
  });

  it('falls back to the raw path when it does not match', () => {
    assert.equal(listAlias('weird'), 'weird');
  });
});

describe('readShownLists', () => {
  it('returns [] when nothing is stored', () => {
    assert.deepEqual(readShownLists(fakeStorage()), []);
  });

  it('returns [] for malformed JSON', () => {
    assert.deepEqual(readShownLists(fakeStorage({ [SHOWN_LISTS_KEY]: 'not json' })), []);
  });

  it('returns [] when the stored value is not an array', () => {
    assert.deepEqual(readShownLists(fakeStorage({ [SHOWN_LISTS_KEY]: '{"a":1}' })), []);
  });

  it('parses a stored array', () => {
    assert.deepEqual(readShownLists(fakeStorage({ [SHOWN_LISTS_KEY]: '["000"]' })), ['000']);
  });
});

describe('markListShown', () => {
  it('appends the alias to the stored history', () => {
    const storage = fakeStorage();
    markListShown('000', ALIASES, storage);
    assert.deepEqual(readShownLists(storage), ['000']);
    markListShown('001', ALIASES, storage);
    assert.deepEqual(readShownLists(storage), ['000', '001']);
  });

  it('resets history before recording once every list has been shown', () => {
    const storage = fakeStorage({ [SHOWN_LISTS_KEY]: JSON.stringify(ALIASES) });
    markListShown('001', ALIASES, storage);
    assert.deepEqual(readShownLists(storage), ['001']);
  });

  it('does not throw when storage.setItem throws (private mode / quota)', () => {
    const storage = throwingStorage();
    assert.doesNotThrow(() => markListShown('000', ALIASES, storage));
  });
});

describe('orderedCandidates', () => {
  const always = () => 0; // deterministic shuffle

  it('returns [] when there are no paths', () => {
    assert.deepEqual(orderedCandidates([], [], true, always), []);
  });

  it('starts a fresh cycle with the first (sorted) list when the flag is on', () => {
    const result = orderedCandidates(PATHS, [], true, always);
    assert.equal(result[0], './sentences/000.yaml');
  });

  it('orders by the sorted-first list even if paths arrive unsorted', () => {
    const unsorted = [PATHS[2], PATHS[0], PATHS[1]];
    const result = orderedCandidates(unsorted, [], true, always);
    assert.equal(result[0], './sentences/000.yaml');
  });

  it('does not force the first list when the flag is off', () => {
    // With random()===0 the Fisher-Yates shuffle moves index 0 away from the
    // front, so a fresh cycle no longer starts deterministically with 000.
    const result = orderedCandidates(PATHS, [], false, always);
    assert.notEqual(result[0], './sentences/000.yaml');
    assert.equal(result.length, PATHS.length);
  });

  it('excludes already-shown lists', () => {
    const result = orderedCandidates(PATHS, ['000'], false, always);
    assert.ok(!result.map(listAlias).includes('000'));
    assert.deepEqual(result.map(listAlias).sort(), ['001', '002']);
  });

  it('only the unseen list remains when all but one are shown', () => {
    const result = orderedCandidates(PATHS, ['000', '002'], false, always);
    assert.deepEqual(result, ['./sentences/001.yaml']);
  });

  it('resets to the full set once every list has been shown', () => {
    const result = orderedCandidates(PATHS, ALIASES, false, always);
    assert.deepEqual(result.map(listAlias).sort(), ['000', '001', '002']);
  });

  it('starts a reset cycle with the first list when the flag is on', () => {
    const result = orderedCandidates(PATHS, ALIASES, true, always);
    assert.equal(result[0], './sentences/000.yaml');
  });

  it('keeps every candidate so a failed load can retry another list', () => {
    const result = orderedCandidates(PATHS, [], true, always);
    assert.deepEqual(result.map(listAlias).sort(), ['000', '001', '002']);
  });
});

describe('no-repeat selection over a full cycle', () => {
  it('shows every list exactly once before repeating, then resets', () => {
    const storage = fakeStorage();
    const seen = [];
    for (let i = 0; i < ALIASES.length; i++) {
      const [path] = orderedCandidates(PATHS, readShownLists(storage), false, () => 0);
      seen.push(listAlias(path));
      markListShown(listAlias(path), ALIASES, storage);
    }
    assert.deepEqual([...seen].sort(), [...ALIASES].sort());

    // History is full; the next pick reuses an alias but resets the stored history.
    const [next] = orderedCandidates(PATHS, readShownLists(storage), false, () => 0);
    markListShown(listAlias(next), ALIASES, storage);
    assert.deepEqual(readShownLists(storage), [listAlias(next)]);
  });
});
