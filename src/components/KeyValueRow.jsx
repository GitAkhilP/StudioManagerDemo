import { cx } from "./displayPrimitiveUtils";
import styles from "./DisplayPrimitives.module.css";

/**
 * Displays one compact label/value row for detail panels and summaries.
 *
 * @param {{
 *   className?: string,
 *   label: import("react").ReactNode,
 *   labelClassName?: string,
 *   value: import("react").ReactNode,
 *   valueClassName?: string,
 * }} props - Key-value row props.
 * @returns {JSX.Element} The key-value row.
 */
function KeyValueRow({
  className = "",
  label,
  labelClassName = "",
  value,
  valueClassName = "",
}) {
  return (
    <div className={cx(styles.keyValueRow, className)}>
      <span className={cx(styles.keyValueLabel, labelClassName)}>{label}</span>
      <strong className={cx(styles.keyValueValue, valueClassName)}>
        {value}
      </strong>
    </div>
  );
}

export default KeyValueRow;
