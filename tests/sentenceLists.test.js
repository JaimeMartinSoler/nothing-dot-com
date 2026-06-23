import { describe, it, expect, beforeEach } from 'vitest';
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

const PATHS = ['./sentences/000000.yaml', './sentences/000001.yaml', './sentences/000002.yaml'];
const ALIASES = PATHS.map(listAlias);

describe('listAlias', () => {
  it('extracts the filename without extension as the alias', () => {
    expect(listAlias('./sentences/000001.yaml')).toBe('000001');
  });

  it('supports non-numeric aliases (any word)', () => {
    expect(listAlias('./sentences/monday-blues.yaml')).toBe('monday-blues');
  });

  it('falls back to the raw path when it does not match', () => {
    expect(listAlias('weird')).toBe('weird');
  });
});

describe('readShownLists', () => {
  it('returns [] when nothing is stored', () => {
    expect(readShownLists(fakeStorage())).toEqual([]);
  });

  it('returns [] for malformed JSON', () => {
    expect(readShownLists(fakeStorage({ [SHOWN_LISTS_KEY]: 'not json' }))).toEqual([]);
  });

  it('returns [] when the stored value is not an array', () => {
    expect(readShownLists(fakeStorage({ [SHOWN_LISTS_KEY]: '{"a":1}' }))).toEqual([]);
  });

  it('parses a stored array', () => {
    expect(readShownLists(fakeStorage({ [SHOWN_LISTS_KEY]: '["000000"]' }))).toEqual(['000000']);
  });
});

describe('markListShown', () => {
  it('appends the alias to the stored history', () => {
    const storage = fakeStorage();
    markListShown('000000', ALIASES, storage);
    expect(readShownLists(storage)).toEqual(['000000']);
    markListShown('000001', ALIASES, storage);
    expect(readShownLists(storage)).toEqual(['000000', '000001']);
  });

  it('resets history before recording once every list has been shown', () => {
    const storage = fakeStorage({ [SHOWN_LISTS_KEY]: JSON.stringify(ALIASES) });
    markListShown('000001', ALIASES, storage);
    expect(readShownLists(storage)).toEqual(['000001']);
  });

  it('does not throw when storage.setItem throws (private mode / quota)', () => {
    const storage = throwingStorage();
    expect(() => markListShown('000000', ALIASES, storage)).not.toThrow();
  });
});

describe('orderedCandidates', () => {
  const always = () => 0; // deterministic shuffle

  it('returns [] when there are no paths', () => {
    expect(orderedCandidates([], [], true, always)).toEqual([]);
  });

  it('starts a fresh cycle with the first (sorted) list when the flag is on', () => {
    const result = orderedCandidates(PATHS, [], true, always);
    expect(result[0]).toBe('./sentences/000000.yaml');
  });

  it('orders by the sorted-first list even if paths arrive unsorted', () => {
    const unsorted = [PATHS[2], PATHS[0], PATHS[1]];
    const result = orderedCandidates(unsorted, [], true, always);
    expect(result[0]).toBe('./sentences/000000.yaml');
  });

  it('does not force the first list when the flag is off', () => {
    // With random()===0 the Fisher-Yates shuffle moves index 0 away from the
    // front, so a fresh cycle no longer starts deterministically with 000000.
    const result = orderedCandidates(PATHS, [], false, always);
    expect(result[0]).not.toBe('./sentences/000000.yaml');
    expect(result).toHaveLength(PATHS.length);
  });

  it('excludes already-shown lists', () => {
    const result = orderedCandidates(PATHS, ['000000'], false, always);
    expect(result.map(listAlias)).not.toContain('000000');
    expect(result.map(listAlias).sort()).toEqual(['000001', '000002']);
  });

  it('only the unseen list remains when all but one are shown', () => {
    const result = orderedCandidates(PATHS, ['000000', '000002'], false, always);
    expect(result).toEqual(['./sentences/000001.yaml']);
  });

  it('resets to the full set once every list has been shown', () => {
    const result = orderedCandidates(PATHS, ALIASES, false, always);
    expect(result.map(listAlias).sort()).toEqual(['000000', '000001', '000002']);
  });

  it('starts a reset cycle with the first list when the flag is on', () => {
    const result = orderedCandidates(PATHS, ALIASES, true, always);
    expect(result[0]).toBe('./sentences/000000.yaml');
  });

  it('keeps every candidate so a failed load can retry another list', () => {
    const result = orderedCandidates(PATHS, [], true, always);
    expect(result.map(listAlias).sort()).toEqual(['000000', '000001', '000002']);
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
    expect([...seen].sort()).toEqual([...ALIASES].sort());

    // History is full; the next pick reuses an alias but resets the stored history.
    const [next] = orderedCandidates(PATHS, readShownLists(storage), false, () => 0);
    markListShown(listAlias(next), ALIASES, storage);
    expect(readShownLists(storage)).toEqual([listAlias(next)]);
  });
});
