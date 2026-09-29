import Card from "./Card";
import { cx } from "./displayPrimitiveUtils";
import styles from "./DisplayPrimitives.module.css";

/**
 * Renders a reusable empty-state block with optional title and body copy.
 *
 * @param {{
 *   as?: React.ElementType,
 *   children?: import("react").ReactNode,
 *   className?: string,
 *   message?: import("react").ReactNode,
 *   title?: import("react").ReactNode,
 *   variant?: string,
 * }} props - Empty-state props.
 * @returns {JSX.Element} The empty state.
 */
function EmptyState({
  as = "div",
  children,
  className = "",
  message,
  title,
  variant = "custom",
}) {
  return (
    <Card
      as={as}
      className={cx(styles.emptyState, className)}
      variant={variant}
    >
      {title && <strong className={styles.emptyTitle}>{title}</strong>}
      {message && <p className={styles.emptyBody}>{message}</p>}
      {children}
    </Card>
  );
}

export default EmptyState;
