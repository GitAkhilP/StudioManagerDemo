import BookingCard from "./BookingCard";
import EmptyState from "./EmptyState";

/**
 * Renders the member upcoming-bookings list with its shared empty-state primitive.
 *
 * @param {{
 *   bookings: Array<object>,
 *   formatDate: (dateValue: string) => string,
 *   formatTime: (timeValue: string) => string,
 *   getStatusClass: (status: string) => string,
 *   styles: CSSModuleClasses,
 * }} props - Booking list data and render helpers.
 * @returns {JSX.Element} The upcoming booking list.
 */
function BookingList({
  bookings,
  formatDate,
  formatTime,
  getStatusClass,
  styles,
}) {
  return (
    <div className={styles.bookingList}>
      {bookings.length === 0 ? (
        <EmptyState
          className={styles.emptyState}
          message="Send a detail request and confirmed appointments will show here."
          title="No upcoming bookings"
        />
      ) : (
        bookings.map((booking) => (
          <BookingCard
            booking={booking}
            formatDate={formatDate}
            formatTime={formatTime}
            getStatusClass={getStatusClass}
            key={booking.id}
            styles={styles}
          />
        ))
      )}
    </div>
  );
}

export default BookingList;
