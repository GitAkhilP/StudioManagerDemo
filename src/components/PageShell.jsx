import { cx } from "./displayPrimitiveUtils";
import styles from "./DisplayPrimitives.module.css";

/**
 * Provides a small shared page wrapper while preserving page-specific CSS modules.
 *
 * @param {{
 *   children: import("react").ReactNode,
 *   className?: string,
 * }} props - Page shell props.
 * @returns {JSX.Element} The page shell.
 */
function PageShell({ children, className = "" }) {
  return <div className={cx(styles.pageShell, className)}>{children}</div>;
}

export default PageShell;
