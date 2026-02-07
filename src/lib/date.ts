/**
 * Formats a given date to DD MM YYYY format.
 *
 * Will return an empty string if the provided 'date' object isn't parseable.
 *
 * @param {Date} date Date-like object to format
 * @param {Intl.DateTimeFormatOptions} options Overridable options
 * @returns A string of properly formatted date.
 */
export function formatDate(
  date: string | number | Date,
  options?: Intl.DateTimeFormatOptions,
): string {
  const actualDate = new Date(date);

  if (Number.isNaN(actualDate.getTime())) {
    return '';
  }

  return new Date(date).toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options,
  });
}
