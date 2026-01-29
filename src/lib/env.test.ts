import { describe, expect, it } from 'vitest';
import { Environments } from '../const';
import { normalizeEnvironments } from './env';

describe('normalizeEnvironments', () => {
  it('returns empty array for empty input', () => {
    expect(normalizeEnvironments([])).toEqual([]);
  });

  it('keeps valid environments', () => {
    expect(normalizeEnvironments(['dev', 'stag'])).toEqual(['dev', 'stag']);
  });

  it('applies environment aliases', () => {
    expect(normalizeEnvironments(['dev1'])).toEqual(['dev']);
  });

  it('trims whitespace', () => {
    expect(normalizeEnvironments([' dev ', ' stag '])).toEqual(['dev', 'stag']);
  });

  it('removes invalid environments', () => {
    expect(normalizeEnvironments(['dev', 'prod', 'foo'])).toEqual(['dev']);
  });

  it('deduplicates environments', () => {
    expect(normalizeEnvironments(['dev', 'dev', 'dev1'])).toEqual(['dev']);
  });

  it('sorts environments alphabetically', () => {
    expect(normalizeEnvironments(['stag', 'dev3', 'dev'])).toEqual([
      'dev',
      'dev3',
      'stag',
    ]);
  });

  it('ignores empty or whitespace-only values', () => {
    expect(normalizeEnvironments(['', '   ', 'dev'])).toEqual(['dev']);
  });

  it('only returns known environments', () => {
    const result = normalizeEnvironments(['dev', 'dev2', 'dev3', 'stag']);
    expect(result).toEqual([...Environments].sort());
  });
});
