/**
 * Joins optional class names while dropping empty values.
 *
 * @param {...string} classNames - Candidate class names.
 * @returns {string} Space-delimited class names.
 */
export function cx(...classNames) {
  return classNames.filter(Boolean).join(" ");
}
