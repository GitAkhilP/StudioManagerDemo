import Card from "./Card";
import StatusBadge from "./StatusBadge";

/**
 * Renders one completed or canceled booking history entry with the shared badge primitive.
 *
 * @param {{
 *   formatDate: (dateValue: string) => string,
 *   getStatusClass: (status: string) => string,
 *   item: object,
 *   styles: CSSModuleClasses,
 * }} props - History record and render helpers.
 * @returns {JSX.Element} The booking history item.
 */
function BookingHistoryItem({ formatDate, getStatusClass, item, styles }) {
  return (
    <Card as="article" className={styles.historyItem} variant="custom">
      <div>
        <h3>{item.serviceName || "Detail service"}</h3>
        <p>{item.vehicle || "Vehicle pending"}</p>
      </div>
      <div className={styles.historyMeta}>
        <span>{formatDate(item.date)}</span>
        <StatusBadge className={getStatusClass(item.status)}>
          {item.status || "Completed"}
        </StatusBadge>
      </div>
      <p>Drop-off: {item.dropoff || "Not specified"}</p>
      <p>{item.notes || "Visit notes not recorded."}</p>
    </Card>
  );
}

export default BookingHistoryItem;
