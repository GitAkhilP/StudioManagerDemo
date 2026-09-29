import { cx } from "./displayPrimitiveUtils";
import styles from "./DisplayPrimitives.module.css";

/**
 * Renders a status pill while letting feature modules provide tone-specific classes.
 *
 * @param {{
 *   children: import("react").ReactNode,
 *   className?: string,
 * }} props - Status badge props.
 * @returns {JSX.Element} The status badge.
 */
function StatusBadge({ children, className = "", ...props }) {
  return (
    <span className={cx(styles.statusBadge, className)} {...props}>
      {children}
    </span>
  );
}

export default StatusBadge;
