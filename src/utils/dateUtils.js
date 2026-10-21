/**
 * Adds a specified number of days to a base date and returns a formatted date string.
 * @param {string|Date} baseDate - The "Day 0" anchor date (e.g. '2026-10-19')
 * @param {number} daysToAdd - Number of days to add (DAFI offset)
 * @returns {string} Formatted date (e.g. 'Oct 29, 2026')
 */
export function addDaysToDate(baseDate, daysToAdd) {
  if (!baseDate) return '';
  const date = new Date(baseDate);
  date.setDate(date.getDate() + daysToAdd);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * Generates a formatted date range string for a stage window.
 * @param {string|Date} baseDate - The Day 0 anchor date
 * @param {number} startDay - DAFI start offset
 * @param {number} endDay - DAFI end offset
 * @returns {string} Formatted range (e.g. 'Oct 29 - Nov 2, 2026')
 */
export function formatStageDateRange(baseDate, startDay, endDay) {
  if (!baseDate) return '';
  if (startDay === endDay) {
    return addDaysToDate(baseDate, startDay);
  }
  
  const startStr = addDaysToDate(baseDate, startDay);
  const endStr = addDaysToDate(baseDate, endDay);
  
  // Clean up duplicate years/months if desired, or keep standard range display
  return `${startStr} – ${endStr}`;
}