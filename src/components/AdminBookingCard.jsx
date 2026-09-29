import Card from "./Card";
import StatusBadge from "./StatusBadge";

/**
 * Renders a single editable booking card in the admin schedule.
 * StatusBadge provides the shared status-pill boundary while admin CSS supplies tone colors.
 *
 * @param {{
 *   booking: object,
 *   draft: object,
 *   formatDate: (dateValue: string) => string,
 *   formatTime: (timeValue: string) => string,
 *   getStatusClass: (status: string) => string,
 *   onDraftFieldChange: (event: React.ChangeEvent<HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement>) => void,
 *   onQuickStatusClick: (event: React.MouseEvent<HTMLButtonElement>) => void,
 *   onSaveClick: (event: React.MouseEvent<HTMLButtonElement>) => void,
 *   statusOptions: string[],
 *   styles: CSSModuleClasses,
 * }} props - Booking data, draft controls, callbacks, and styling.
 * @returns {JSX.Element} The admin booking card.
 */
function AdminBookingCard({
  booking,
  draft,
  formatDate,
  formatTime,
  getStatusClass,
  onDraftFieldChange,
  onQuickStatusClick,
  onSaveClick,
  statusOptions,
  styles,
}) {
  return (
    <Card as="article" className={styles.bookingCard} variant="custom">
      <div className={styles.bookingTop}>
        <div>
          <span className={styles.memberName}>{booking.memberName}</span>
          <h2>{booking.serviceName || "Detail service"}</h2>
          <p>
            {booking.memberEmail || booking.userId} -{" "}
            {booking.vehicle || "Vehicle pending"}
          </p>
        </div>

        <StatusBadge className={getStatusClass(booking.status)}>
          {booking.status || "Requested"}
        </StatusBadge>
      </div>

      <div className={styles.scheduleStrip}>
        <span>{formatDate(booking.date)}</span>
        <span>{formatTime(booking.time)}</span>
        <span>{booking.bay || "Pending bay assignment"}</span>
        <span>Advisor: {booking.advisor || "Studio desk"}</span>
        <span>Drop-off: {booking.dropoff || "Not specified"}</span>
      </div>

      <div className={styles.editGrid}>
        <label>
          Status
          <select
            data-booking-id={booking.id}
            data-field="status"
            onChange={onDraftFieldChange}
            value={draft.status}
          >
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>

        <label>
          Date
          <input
            data-booking-id={booking.id}
            data-field="date"
            onChange={onDraftFieldChange}
            type="date"
            value={draft.date}
          />
        </label>

        <label>
          Time
          <input
            data-booking-id={booking.id}
            data-field="time"
            onChange={onDraftFieldChange}
            type="time"
            value={draft.time}
          />
        </label>

        <label>
          Bay
          <input
            data-booking-id={booking.id}
            data-field="bay"
            onChange={onDraftFieldChange}
            placeholder="Detail Bay 2"
            value={draft.bay}
          />
        </label>

        <label>
          Advisor
          <input
            data-booking-id={booking.id}
            data-field="advisor"
            onChange={onDraftFieldChange}
            placeholder="Studio desk"
            value={draft.advisor}
          />
        </label>

        <label>
          Drop-off window
          <input
            data-booking-id={booking.id}
            data-field="dropoff"
            onChange={onDraftFieldChange}
            placeholder="Not specified"
            value={draft.dropoff}
          />
        </label>

        <label className={styles.notesField}>
          Notes
          <textarea
            data-booking-id={booking.id}
            data-field="notes"
            onChange={onDraftFieldChange}
            rows="2"
            value={draft.notes}
          />
        </label>
      </div>

      <div className={styles.actions}>
        <button
          data-booking-id={booking.id}
          data-status="Confirmed"
          onClick={onQuickStatusClick}
          type="button"
        >
          Confirm
        </button>
        <button
          data-booking-id={booking.id}
          data-status="Completed"
          onClick={onQuickStatusClick}
          type="button"
        >
          Complete
        </button>
        <button
          className={styles.dangerButton}
          data-booking-id={booking.id}
          data-status="Canceled"
          onClick={onQuickStatusClick}
          type="button"
        >
          Cancel
        </button>
        <button
          className={styles.saveButton}
          data-booking-id={booking.id}
          onClick={onSaveClick}
          type="button"
        >
          Save changes
        </button>
      </div>
    </Card>
  );
}

export default AdminBookingCard;
