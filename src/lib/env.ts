import { Environments } from '../const';

const EnvironmentAlias: Record<string, (typeof Environments)[number]> = {
  dev1: 'dev',
};

/**
 * Normalize possible parameters by applying alias and removing
 * unidentifiable environments.
 *
 * @param {string[]} params Command parameters
 * @returns {string[]} List of normalized environments
 */
export function normalizeEnvironments(params: string[]): string[] {
  return [
    ...new Set(
      params
        .map((val) => (val in EnvironmentAlias ? EnvironmentAlias[val] : val))
        .map((val) => val.trim())
        .filter(Boolean)
        .filter((val) => Environments.includes(val)),
    ),
  ].sort();
}
