import EmptyState from "./EmptyState";
import SupportRequestRow from "./SupportRequestRow";

/**
 * Renders recent member support requests with the shared empty-state primitive.
 *
 * @param {{
 *   getStatusClassName: (status: string) => string,
 *   requests: Array<object>,
 *   styles: CSSModuleClasses,
 * }} props - Request list data and status styling helper.
 * @returns {JSX.Element} The support request list.
 */
function SupportRequestList({ getStatusClassName, requests, styles }) {
  return (
    <div className={styles.requestList}>
      {requests.length > 0 ? (
        requests.map((request) => (
          <SupportRequestRow
            getStatusClassName={getStatusClassName}
            key={request.id}
            request={request}
            styles={styles}
          />
        ))
      ) : (
        <EmptyState as="p" className={styles.emptyState}>
          No support requests yet.
        </EmptyState>
      )}
    </div>
  );
}

export default SupportRequestList;
