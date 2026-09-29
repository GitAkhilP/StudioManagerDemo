import Card from "./Card";
import StatusBadge from "./StatusBadge";

/**
 * Renders one recent member support request row with the shared status badge.
 *
 * @param {{
 *   getStatusClassName: (status: string) => string,
 *   request: object,
 *   styles: CSSModuleClasses,
 * }} props - Support request data and style helpers.
 * @returns {JSX.Element} The support request row.
 */
function SupportRequestRow({ getStatusClassName, request, styles }) {
  return (
    <Card as="div" className={styles.requestRow} variant="custom">
      <span className={styles.requestId}>{request.id}</span>
      <div className={styles.requestSummary}>
        <strong>{request.title}</strong>
        <span>{request.category}</span>
      </div>
      <StatusBadge
        className={`${styles.statusPill} ${getStatusClassName(
          request.status
        )}`}
      >
        {request.status}
      </StatusBadge>
      <span className={styles.updatedAt}>{request.updated}</span>
    </Card>
  );
}

export default SupportRequestRow;
