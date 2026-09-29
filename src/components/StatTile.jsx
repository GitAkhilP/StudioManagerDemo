import { createElement } from "react";
import Card from "./Card";
import { cx } from "./displayPrimitiveUtils";
import styles from "./DisplayPrimitives.module.css";

/**
 * Renders a compact label/value metric tile with overridable markup.
 *
 * @param {{
 *   as?: React.ElementType,
 *   className?: string,
 *   label: import("react").ReactNode,
 *   labelAs?: React.ElementType,
 *   labelClassName?: string,
 *   value: import("react").ReactNode,
 *   valueAs?: React.ElementType,
 *   valueClassName?: string,
 *   variant?: string,
 * }} props - Metric tile props.
 * @returns {JSX.Element} The stat tile.
 */
function StatTile({
  as = "div",
  className = "",
  label,
  labelAs = "small",
  labelClassName = "",
  value,
  valueAs = "span",
  valueClassName = "",
  variant = "custom",
  ...props
}) {
  return (
    <Card
      as={as}
      className={cx(styles.statTile, className)}
      variant={variant}
      {...props}
    >
      {createElement(
        valueAs,
        { className: cx(styles.statValue, valueClassName) },
        value
      )}
      {createElement(
        labelAs,
        { className: cx(styles.statLabel, labelClassName) },
        label
      )}
    </Card>
  );
}

export default StatTile;
