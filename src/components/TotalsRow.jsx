import { cx } from "./displayPrimitiveUtils";
import styles from "./DisplayPrimitives.module.css";

/**
 * Renders a totals line with stable label/value markup for summary panels.
 *
 * @param {{
 *   className?: string,
 *   label: import("react").ReactNode,
 *   labelClassName?: string,
 *   value: import("react").ReactNode,
 *   valueClassName?: string,
 * }} props - Totals row props.
 * @returns {JSX.Element} The totals row.
 */
function TotalsRow({
  className = "",
  label,
  labelClassName = "",
  value,
  valueClassName = "",
}) {
  return (
    <div className={cx(styles.totalsRow, className)}>
      <span className={cx(styles.totalsLabel, labelClassName)}>{label}</span>
      <strong className={cx(styles.totalsValue, valueClassName)}>
        {value}
      </strong>
    </div>
  );
}

export default TotalsRow;
