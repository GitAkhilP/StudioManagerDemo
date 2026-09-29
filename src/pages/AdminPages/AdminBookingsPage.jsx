import { useCallback, useEffect, useMemo, useState } from "react";
import AdminBookingCard from "../../components/AdminBookingCard";
import EmptyState from "../../components/EmptyState";
import PageShell from "../../components/PageShell";
import StatTile from "../../components/StatTile";
import {
  dbGetBookingsForAdmin,
  dbUpdateBooking,
} from "../../services/mockDbServices";
import { subscribeToCollections } from "../../services/collectionEvents";
import styles from "./AdminBookingsPage.module.css";

/**
 * Booking states admins can apply from filters, forms, and quick actions.
 */
const STATUS_OPTIONS = ["Requested", "Confirmed", "Completed", "Canceled"];

/**
 * Formats a stored YYYY-MM-DD booking date without timezone rollover.
 *
 * @param {string} dateValue - Stored booking date.
 * @returns {string} Display date or a pending/invalid fallback.
 */
function formatDate(dateValue) {
  if (!dateValue) return "Date pending";

  const date = new Date(`${dateValue}T12:00:00`);
  if (Number.isNaN(date.getTime())) return dateValue;

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Formats a stored HH:mm booking time for the current locale.
 *
 * @param {string} timeValue - Stored booking time.
 * @returns {string} Display time or a pending fallback.
 */
function formatTime(timeValue) {
  if (!timeValue) return "Time pending";

  const [hour, minute] = timeValue.split(":");
  const date = new Date();
  date.setHours(Number(hour), Number(minute), 0, 0);

  return date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

/**
 * Maps a booking status to the badge class used in the admin list.
 *
 * @param {string} status - Booking status value.
 * @returns {string} CSS class list for the status badge.
 */
function getStatusClass(status) {
  const normalizedStatus = String(status || "").toLowerCase();

  if (normalizedStatus === "confirmed") {
    return `${styles.statusBadge} ${styles.confirmed}`;
  }

  if (normalizedStatus === "completed") {
    return `${styles.statusBadge} ${styles.completed}`;
  }

  if (normalizedStatus === "canceled") {
    return `${styles.statusBadge} ${styles.canceled}`;
  }

  return `${styles.statusBadge} ${styles.requested}`;
}

/**
 * Creates editable draft state from a persisted booking.
 *
 * @param {object} booking - Stored booking record.
 * @returns {{ advisor: string, bay: string, date: string, dropoff: string, notes: string, status: string, time: string }}
 * Booking fields that admins can edit before saving.
 */
function createBookingDraft(booking) {
  return {
    advisor: booking.advisor || "",
    bay: booking.bay || "",
    date: booking.date || "",
    dropoff: booking.dropoff || "",
    notes: booking.notes || "",
    status: booking.status || "Requested",
    time: booking.time || "",
  };
}

/**
 * Lets admins review booking requests, edit schedule details, and update status.
 * The route-level AppLayout supplies authenticated chrome for this page.
 * AdminBookingsPage owns drafts and persistence while AdminBookingCard owns card markup.
 * Shared display primitives provide the page shell, summary stats, and empty-state surface.
 *
 * @returns {JSX.Element} The booking management page.
 */
function AdminBookingsPage() {
  // Stores the full admin booking list fetched from local storage.
  const [bookings, setBookings] = useState([]);
  // Store only locally edited fields so external updates can refresh untouched fields.
  const [drafts, setDrafts] = useState({});
  // Tracks which status tab/filter is active.
  const [statusFilter, setStatusFilter] = useState("All");
  // Shows successful save/status feedback.
  const [message, setMessage] = useState("");
  // Shows booking update failures separately from success feedback.
  const [error, setError] = useState("");

  /**
   * Reloads persisted bookings without replacing unsaved edits on existing records.
   */
  // Stabilize the storage sync callback for mount effects and update handlers.
  const refreshBookings = useCallback(() => {
    const nextBookings = dbGetBookingsForAdmin();
    setBookings(nextBookings);
    const existingIds = new Set(nextBookings.map((booking) => booking.id));
    setDrafts((currentDrafts) =>
      Object.fromEntries(
        Object.entries(currentDrafts).filter(([bookingId]) => existingIds.has(bookingId))
      )
    );
  }, []);

  // User changes refresh member labels; booking changes refresh schedule data.
  useEffect(() => {
    refreshBookings();
    return subscribeToCollections(
      ["studio_bookings", "studio_users"],
      refreshBookings
    );
  }, [refreshBookings]);

  // Summary counts are derived from the full list so filters never hide totals.
  const summary = useMemo(() => {
    const counts = {
      all: bookings.length,
      requested: 0,
      confirmed: 0,
      completed: 0,
      canceled: 0,
    };

    bookings.forEach((booking) => {
      const key = String(booking.status || "requested").toLowerCase();
      if (Object.prototype.hasOwnProperty.call(counts, key)) {
        counts[key] += 1;
      }
    });

    return counts;
  }, [bookings]);

  // Filter only the rendered cards; draft state still tracks every booking.
  const visibleBookings = useMemo(() => {
    if (statusFilter === "All") return bookings;

    return bookings.filter(
      (booking) =>
        String(booking.status || "").toLowerCase() ===
        statusFilter.toLowerCase()
    );
  }, [bookings, statusFilter]);

  /**
   * Updates an unsaved booking draft field and clears stale feedback.
   *
   * @param {string} bookingId - Booking id whose draft changed.
   * @param {string} field - Draft field name to update.
   * @param {string} value - New draft value.
   */
  function handleDraftChange(bookingId, field, value) {
    setError("");
    setMessage("");
    const booking = bookings.find((item) => item.id === bookingId);
    if (!booking) return;

    setDrafts((currentDrafts) => {
      const nextDraft = { ...currentDrafts[bookingId] };
      if (value === createBookingDraft(booking)[field]) {
        delete nextDraft[field];
      } else {
        nextDraft[field] = value;
      }
      return { ...currentDrafts, [bookingId]: nextDraft };
    });
  }

  /**
   * Clears submitted local edits, leaving other bookings and unsaved fields intact.
   * Quick status actions replace the status draft while preserving unrelated edits.
   */
  function reconcileSavedDraft(bookingId, updates, replaceStatus = false) {
    setDrafts((currentDrafts) => {
      const nextDraft = { ...currentDrafts[bookingId] };
      Object.keys(updates).forEach((field) => {
        if (nextDraft[field] === updates[field] || (replaceStatus && field === "status")) {
          delete nextDraft[field];
        }
      });
      return { ...currentDrafts, [bookingId]: nextDraft };
    });
  }

  /**
   * No-op writes emit no collection event, so use their returned record directly.
   */
  function reconcileUnchangedBooking(result) {
    if (result.changedFields.length > 0) return;
    setBookings((currentBookings) =>
      currentBookings.map((booking) =>
        booking.id === result.booking.id ? { ...booking, ...result.booking } : booking
      )
    );
  }

  /**
   * Applies a filter selected from the booking status button group.
   *
   * @param {React.MouseEvent<HTMLButtonElement>} event - Filter button click event.
   */
  function handleFilterClick(event) {
    setStatusFilter(event.currentTarget.dataset.filter);
  }

  /**
   * Updates a draft field from any editable booking form control.
   *
   * @param {React.ChangeEvent<HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement>} event - Draft field change event.
   */
  function handleDraftFieldChange(event) {
    const { bookingId, field } = event.currentTarget.dataset;
    handleDraftChange(bookingId, field, event.currentTarget.value);
  }

  /**
   * Persists one booking draft and reports whether any stored fields changed.
   *
   * @param {string} bookingId - Booking id to save.
   */
  function handleSave(bookingId) {
    const updates = drafts[bookingId] || {};
    const result = dbUpdateBooking(bookingId, updates);

    if (!result.success) {
      setError(result.message || "Booking could not be updated.");
      setMessage("");
      return;
    }

    reconcileSavedDraft(bookingId, updates);
    reconcileUnchangedBooking(result);
    setError("");
    setMessage(
      result.changedFields.length > 0
        ? "Booking updated and member notified."
        : "No booking changes to save."
    );
  }

  /**
   * Applies a common status transition without requiring every field to be edited.
   *
   * @param {object} booking - Booking receiving the status change.
   * @param {string} status - New status to apply.
   */
  function handleQuickStatus(booking, status) {
    // Quick actions fill operational defaults so status changes have enough context.
    const updates = {
      status,
      bay:
        status === "Canceled"
          ? "Canceled before assignment"
          : booking.bay || "Detail Bay 1",
      advisor: booking.advisor || "Studio desk",
    };
    const result = dbUpdateBooking(booking.id, updates);

    if (!result.success) {
      setError(result.message || "Booking could not be updated.");
      setMessage("");
      return;
    }

    reconcileSavedDraft(booking.id, updates, true);
    reconcileUnchangedBooking(result);
    setError("");
    setMessage(`${booking.memberName}'s booking marked ${status}.`);
  }

  /**
   * Applies a quick status change using booking/status metadata from the clicked button.
   *
   * @param {React.MouseEvent<HTMLButtonElement>} event - Quick-status button click event.
   */
  function handleQuickStatusClick(event) {
    const { bookingId, status } = event.currentTarget.dataset;
    const booking = bookings.find((item) => item.id === bookingId);
    if (booking) {
      handleQuickStatus(booking, status);
    }
  }

  /**
   * Saves the booking draft associated with the clicked save button.
   *
   * @param {React.MouseEvent<HTMLButtonElement>} event - Save button click event.
   */
  function handleSaveClick(event) {
    handleSave(event.currentTarget.dataset.bookingId);
  }

  return (
    <PageShell className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Admin schedule</p>
          <h1 className={styles.title}>Bookings Management</h1>
        </div>

        <div className={styles.summaryGrid} aria-label="Booking summary">
          <StatTile
            className={styles.summaryTile}
            label="Total"
            value={summary.all}
          />
          <StatTile
            className={styles.summaryTile}
            label="Requested"
            value={summary.requested}
          />
          <StatTile
            className={styles.summaryTile}
            label="Confirmed"
            value={summary.confirmed}
          />
        </div>
      </header>

      <section className={styles.filterBar} aria-label="Booking filters">
        {["All", ...STATUS_OPTIONS].map((filter) => (
          <button
            className={`${styles.filterButton} ${
              statusFilter === filter ? styles.activeFilter : ""
            }`}
            data-filter={filter}
            key={filter}
            onClick={handleFilterClick}
            type="button"
          >
            {filter}
          </button>
        ))}
      </section>

      {(message || error) && (
        <div className={styles.feedback} aria-live="polite">
          {message && <p className={styles.message}>{message}</p>}
          {error && <p className={styles.error}>{error}</p>}
        </div>
      )}

      <main className={styles.bookingList}>
        {visibleBookings.length === 0 ? (
          <EmptyState
            className={styles.emptyState}
            message="No bookings match this filter."
          />
        ) : (
          visibleBookings.map((booking) => {
            const draft = { ...createBookingDraft(booking), ...drafts[booking.id] };

            return (
              <AdminBookingCard
                booking={booking}
                draft={draft}
                formatDate={formatDate}
                formatTime={formatTime}
                getStatusClass={getStatusClass}
                key={booking.id}
                onDraftFieldChange={handleDraftFieldChange}
                onQuickStatusClick={handleQuickStatusClick}
                onSaveClick={handleSaveClick}
                statusOptions={STATUS_OPTIONS}
                styles={styles}
              />
            );
          })
        )}
      </main>
    </PageShell>
  );
}

export default AdminBookingsPage;
