/**
 * Parse a stored clock timestamp without treating missing dates as epoch time.
 *
 * @param {string|undefined} value Stored timestamp.
 * @returns {number|null} Epoch milliseconds, or null for missing/invalid dates.
 */
function parseTimestamp(value) {
  if (!value) return null;

  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : null;
}

/**
 * Summarize an employee's normalized, newest-first sessions without storage reads.
 * Calendar boundaries use local dates so overnight and DST shifts keep their
 * actual elapsed duration while contributing to the correct day and week.
 *
 * @param {Array<Object>} entries Normalized sessions belonging to one employee.
 * @param {number} [nowMs=Date.now()] Current epoch milliseconds for open sessions.
 * @returns {Object} Active/recent sessions and daily/weekly duration totals.
 */
export function summarizeTimeClockEntries(entries, nowMs = Date.now()) {
  const dayStart = new Date(nowMs);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);
  const weekStart = new Date(dayStart);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);
  const dayStartMs = dayStart.getTime();
  const dayEndMs = dayEnd.getTime();
  const weekStartMs = weekStart.getTime();
  const weekEndMs = weekEnd.getTime();

  const summary = {
    entries,
    activeEntry: null,
    currentShiftMs: 0,
    lastEntry: entries[0] || null,
    lastClosedEntry: null,
    todayEntries: [],
    totalMsToday: 0,
    totalMsWeek: 0,
  };

  for (const entry of entries) {
    if (!entry) continue;

    const isOpen = !entry.clockOutAt;
    if (isOpen && !summary.activeEntry) summary.activeEntry = entry;
    if (!isOpen && !summary.lastClosedEntry) summary.lastClosedEntry = entry;

    const startMs = parseTimestamp(entry.clockInAt);
    const endMs = isOpen ? nowMs : parseTimestamp(entry.clockOutAt);
    // A malformed closed session must not continue accumulating time as though
    // it were open. Invalid and reversed ranges contribute no duration.
    if (startMs === null || endMs === null || endMs <= startMs) continue;

    if (entry === summary.activeEntry) {
      summary.currentShiftMs = endMs - startMs;
    }

    const todayMs = Math.max(
      0,
      Math.min(endMs, dayEndMs) - Math.max(startMs, dayStartMs)
    );
    if (todayMs > 0) summary.todayEntries.push(entry);
    summary.totalMsToday += todayMs;
    summary.totalMsWeek += Math.max(
      0,
      Math.min(endMs, weekEndMs) - Math.max(startMs, weekStartMs)
    );
  }

  return summary;
}
