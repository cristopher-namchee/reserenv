import { describe, expect, it } from 'vitest';
import { Environments } from '../const';
import { normalizeEnvironments, normalizeServices } from './params';

describe('normalizeEnvironments', () => {
  it('should return empty array for empty input', () => {
    expect(normalizeEnvironments([])).toEqual([]);
  });

  it('should keep valid environments', () => {
    expect(normalizeEnvironments(['dev', 'stag'])).toEqual(['dev', 'stag']);
  });

  it('should ignore cases', () => {
    expect(normalizeEnvironments(['DEV1'])).toEqual(['dev']);
  });

  it('should replace alias with actual environment name', () => {
    expect(normalizeEnvironments(['dev1'])).toEqual(['dev']);
  });

  it('should trim whitespace', () => {
    expect(normalizeEnvironments([' dev ', ' stag '])).toEqual(['dev', 'stag']);
  });

  it('should removes invalid environments', () => {
    expect(normalizeEnvironments(['dev', 'prod', 'foo'])).toEqual(['dev']);
  });

  it('should deduplicate environments', () => {
    expect(normalizeEnvironments(['dev', 'dev', 'dev1'])).toEqual(['dev']);
  });

  it('should sort environments alphabetically', () => {
    expect(normalizeEnvironments(['stag', 'dev3', 'dev'])).toEqual([
      'dev',
      'dev3',
      'stag',
    ]);
  });

  it('should ignore empty or whitespace-only values', () => {
    expect(normalizeEnvironments(['', '   ', 'dev'])).toEqual(['dev']);
  });

  it('should only return known environments', () => {
    const result = normalizeEnvironments(['dev', 'dev2', 'dev3', 'stag']);
    expect(result).toEqual([...Environments].sort());
  });
});

describe('normalizeServices', () => {
  it('should return empty array for empty input', () => {
    expect(normalizeServices([])).toEqual([]);
  });

  it('should keep valid services', () => {
    expect(normalizeServices(['fe', 'be'])).toEqual(['be', 'fe']);
  });

  it('should ignore cases', () => {
    expect(normalizeServices(['DPO'])).toEqual(['dpo']);
  });

  it('should replace alias with actual service name', () => {
    expect(normalizeServices(['front-end', 'backend'])).toEqual(['be', 'fe']);
  });

  it('should trim whitespace', () => {
    expect(normalizeServices([' fe ', ' be '])).toEqual(['be', 'fe']);
  });

  it('should removes invalid services', () => {
    expect(normalizeServices(['fe', 'prod', 'foo'])).toEqual(['fe']);
  });

  it('should deduplicate services', () => {
    expect(normalizeServices(['fe', 'fe', 'be'])).toEqual(['be', 'fe']);
  });

  it('should sort services alphabetically', () => {
    expect(normalizeServices(['fe', 'be'])).toEqual(['be', 'fe']);
  });

  it('should ignore empty or whitespace-only values', () => {
    expect(normalizeServices(['', '   ', 'dpo'])).toEqual(['dpo']);
  });
});
