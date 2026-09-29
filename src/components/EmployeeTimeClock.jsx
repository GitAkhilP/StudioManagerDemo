import { useCallback, useEffect, useState } from "react";
import {
  dbClockInEmployee,
  dbClockOutEmployee,
  dbGetTimeClockEntriesByUser,
} from "../services/mockDbServices";
import { subscribeToCollections } from "../services/collectionEvents.js";
import { summarizeTimeClockEntries } from "../services/timeClockSummary.js";
import styles from "./EmployeeTimeClock.module.css";

const dateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

const EMPTY_ENTRIES = [];

/**
 * Format a millisecond duration for dashboard summary text.
 *
 * @param {number} value Millisecond duration.
 * @returns {string} Human-readable hours and minutes.
 */
function formatDuration(value) {
  const totalMinutes = Math.max(0, Math.floor((Number(value) || 0) / 60000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) return `${minutes}m`;
  return `${hours}h ${minutes}m`;
}

/**
 * Format a persisted timestamp for employee clock cards.
 *
 * @param {string} value Timestamp to format.
 * @returns {string} Display timestamp or fallback text.
 */
function formatDateTime(value) {
  if (!value) return "Not recorded";

  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Not recorded"
    : dateTimeFormatter.format(date);
}

/**
 * Renders the employee clock-in and clock-out control backed by persisted time sessions.
 *
 * @param {{ className?: string, compact?: boolean, userId?: string }} props Component props.
 * @returns {import("react").JSX.Element} Employee time-clock card.
 */
function EmployeeTimeClock({ className = "", compact = false, userId }) {
  const [snapshot, setSnapshot] = useState({ userId: null, entries: EMPTY_ENTRIES });
  const [nowMs, setNowMs] = useState(Date.now);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");

  const refreshEntries = useCallback(() => {
    setSnapshot({
      userId,
      entries: userId ? dbGetTimeClockEntriesByUser(userId) : EMPTY_ENTRIES,
    });
    setNowMs(Date.now());
  }, [userId]);

  useEffect(() => {
    setFeedback("");
    setError("");
    const unsubscribe = subscribeToCollections(
      ["studio_time_clock_entries"],
      refreshEntries
    );
    refreshEntries();
    return unsubscribe;
  }, [refreshEntries]);

  // Never show the previous employee's snapshot while a user change is loading.
  const entries = snapshot.userId === userId ? snapshot.entries : EMPTY_ENTRIES;
  const summary = summarizeTimeClockEntries(entries, nowMs);
  const isClockedIn = Boolean(summary.activeEntry);

  useEffect(() => {
    if (!userId) return undefined;

    let timeoutId;

    function updateClock() {
      window.clearTimeout(timeoutId);
      const currentMs = Date.now();
      setNowMs(currentMs);
      if (document.visibilityState === "hidden") return;

      const nextMidnight = new Date(currentMs);
      nextMidnight.setHours(24, 0, 0, 0);
      const untilMidnightMs = Math.max(1, nextMidnight.getTime() - currentMs);
      // Off-shift totals still need to roll over at local midnight/Sunday.
      // Timers only recalculate the cached employee snapshot, never storage.
      timeoutId = window.setTimeout(
        updateClock,
        isClockedIn ? Math.min(30000, untilMidnightMs) : untilMidnightMs
      );
    }

    updateClock();
    window.addEventListener("focus", updateClock);
    document.addEventListener("visibilitychange", updateClock);
    return () => {
      window.clearTimeout(timeoutId);
      window.removeEventListener("focus", updateClock);
      document.removeEventListener("visibilitychange", updateClock);
    };
  }, [isClockedIn, userId]);

  /**
   * Starts or closes the active employee shift.
   *
   * @returns {void}
   */
  function handleClockAction() {
    const result = summary.activeEntry
      ? dbClockOutEmployee(userId)
      : dbClockInEmployee(userId);

    if (!result.success) {
      // A concurrent write may have made the displayed action stale. Successful
      // writes already refresh through the collection subscription.
      refreshEntries();
      setFeedback("");
      setError(result.message || "Unable to update the time clock.");
      return;
    }

    setError("");
    setFeedback(summary.activeEntry ? "Clocked out." : "Clocked in.");
  }

  const lastClosedEntry = summary.lastClosedEntry;
  const cardClassName = [
    styles.clockCard,
    compact ? styles.compact : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <section className={cardClassName} aria-label="Employee time clock">
      <div className={styles.header}>
        <div>
          <p className={styles.kicker}>Time clock</p>
          <h2>{isClockedIn ? "You are clocked in" : "Ready to clock in"}</h2>
        </div>
        <span
          className={`${styles.statusPill} ${
            isClockedIn ? styles.statusOn : styles.statusOff
          }`}
        >
          {isClockedIn ? "On shift" : "Off shift"}
        </span>
      </div>

      <button
        className={`${styles.clockButton} ${
          isClockedIn ? styles.clockOut : styles.clockIn
        }`}
        disabled={!userId}
        onClick={handleClockAction}
        type="button"
      >
        {isClockedIn ? "Clock out" : "Clock in"}
      </button>

      {(feedback || error) && (
        <p
          className={error ? styles.error : styles.feedback}
          role="status"
        >
          {error || feedback}
        </p>
      )}

      <dl className={styles.statsGrid}>
        <div>
          <dt>Current shift</dt>
          <dd>{formatDuration(summary.currentShiftMs)}</dd>
        </div>
        <div>
          <dt>Today</dt>
          <dd>{formatDuration(summary.totalMsToday)}</dd>
        </div>
        {!compact && (
          <div>
            <dt>This week</dt>
            <dd>{formatDuration(summary.totalMsWeek)}</dd>
          </div>
        )}
        {!compact && (
          <div>
            <dt>Last clock-out</dt>
            <dd>{formatDateTime(lastClosedEntry?.clockOutAt)}</dd>
          </div>
        )}
      </dl>

      {isClockedIn && (
        <p className={styles.shiftMeta}>
          Started {formatDateTime(summary.activeEntry.clockInAt)}
        </p>
      )}
    </section>
  );
}

export default EmployeeTimeClock;
