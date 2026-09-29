import { createElement } from "react";
import Card from "./Card";

/**
 * Wraps Card for dashboard metrics and derives an accessible label from text titles.
 *
 * @param {object} props - Component props.
 * @param {React.ElementType} [props.as="article"] - Element used for the outer card.
 * @param {React.ReactNode} props.children - Metric value and supporting content.
 * @param {string|React.ReactNode} props.title - Optional metric heading.
 * @param {React.ElementType} [props.titleAs="h2"] - Heading element used for string titles.
 * @param {string} [props.variant="custom"] - Card variant key.
 * @returns {JSX.Element} A metric-focused card.
 */
function MetricCard({
  as = "article",
  children,
  className = "",
  title,
  titleAs = "h2",
  titleClassName = "",
  variant = "custom",
  ...props
}) {
  const cardProps = { ...props };

  // A text title doubles as a concise accessible name for icon-light metric cards.
  if (!cardProps["aria-label"] && typeof title === "string") {
    cardProps["aria-label"] = title;
  }

  return (
    <Card as={as} className={className} variant={variant} {...cardProps}>
      {title &&
        createElement(titleAs, { className: titleClassName }, title)}
      {children}
    </Card>
  );
}

export default MetricCard;
