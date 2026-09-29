import EmptyState from "./EmptyState";
import SectionPanel from "./SectionPanel";

/**
 * Wraps admin table markup with shared panel and empty-state primitives.
 *
 * @param {{
 *   children: import("react").ReactNode,
 *   emptyMessage?: string,
 *   headers: string[],
 *   isEmpty?: boolean,
 *   styles: CSSModuleClasses,
 *   title: string,
 * }} props - Table content and display configuration.
 * @returns {JSX.Element} The admin table card.
 */
function AdminTableCard({
  children,
  emptyMessage = "No records found.",
  headers,
  isEmpty = false,
  styles,
  title,
}) {
  return (
    <SectionPanel className={styles.tableCard}>
      <h2 className={styles.tableTitle}>{title}</h2>
      {isEmpty ? (
        <EmptyState as="p" className={styles.empty}>
          {emptyMessage}
        </EmptyState>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                {headers.map((header) => (
                  <th key={header}>{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>{children}</tbody>
          </table>
        </div>
      )}
    </SectionPanel>
  );
}

export default AdminTableCard;
