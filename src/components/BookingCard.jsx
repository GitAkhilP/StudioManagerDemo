import Card from "./Card";
import StatusBadge from "./StatusBadge";

/**
 * Renders one upcoming member booking card with a shared status badge.
 *
 * @param {{
 *   booking: object,
 *   formatDate: (dateValue: string) => string,
 *   formatTime: (timeValue: string) => string,
 *   getStatusClass: (status: string) => string,
 *   styles: CSSModuleClasses,
 * }} props - Booking data, formatting helpers, and style classes.
 * @returns {JSX.Element} The booking card.
 */
function BookingCard({ booking, formatDate, formatTime, getStatusClass, styles }) {
  return (
    <Card as="article" className={styles.bookingCard} variant="custom">
      <div className={styles.bookingTop}>
        <div>
          <h3>{booking.serviceName || "Detail service"}</h3>
          <p>{booking.vehicle || "Vehicle pending"}</p>
        </div>
        <StatusBadge className={getStatusClass(booking.status)}>
          {booking.status || "Requested"}
        </StatusBadge>
      </div>

      <div className={styles.bookingMeta}>
        <span>{formatDate(booking.date)}</span>
        <span>{formatTime(booking.time)}</span>
        <span>{booking.bay || "Pending bay assignment"}</span>
        <span>Drop-off: {booking.dropoff || "Not specified"}</span>
      </div>

      <div className={styles.bookingFooter}>
        <span>Advisor: {booking.advisor || "Studio desk"}</span>
        <span>{booking.notes || "No special notes yet."}</span>
      </div>
    </Card>
  );
}

export default BookingCard;
