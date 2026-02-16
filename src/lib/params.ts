import {
  EnvironmentAlias,
  Environments,
  ServiceAlias,
  Services,
} from '../const';

/**
 * Normalize possible environments parameters by applying alias and removing
 * unidentifiable environments.
 *
 * @param {string[]} params List of Possible environments, picked up from parameters
 * @returns {string[]} List of normalized environments
 */
export function normalizeEnvironments(
  params: string[],
): (typeof Environments)[number][] {
  return [
    ...new Set(
      params
        .map((val) => val.toLowerCase())
        .map((val) => (val in EnvironmentAlias ? EnvironmentAlias[val] : val))
        .map((val) => val.trim())
        .filter(Boolean)
        .filter((val) => Environments.includes(val)),
    ),
  ].sort();
}

/**
 * Normalize possible services by applying alias and removing
 * unidentifiable services.
 *
 * @param {string[]} params List of possible services, picked up from parameters
 * @returns {string[]} List of normalized services
 */
export function normalizeServices(params: string[]): string[] {
  return [
    ...new Set(
      params
        .map((val) => val.toLowerCase())
        .map((val) => (val in ServiceAlias ? ServiceAlias[val] : val))
        .map((val) => val.trim())
        .filter(Boolean)
        .filter((val) => Services.includes(val)),
    ),
  ].sort();
}
