import Card from "./Card";
import { cx } from "./displayPrimitiveUtils";
import styles from "./DisplayPrimitives.module.css";

/**
 * Wraps a section-level surface with the shared Card shell and optional title metadata.
 *
 * @param {object} props - Section panel props.
 * @param {React.ElementType} [props.as="section"] - Outer element.
 * @param {import("react").ReactNode} props.children - Panel body.
 * @param {string} [props.className=""] - Page-specific panel class.
 * @param {string} [props.variant="custom"] - Card variant key.
 * @returns {JSX.Element} The section panel.
 */
function SectionPanel({
  as = "section",
  children,
  className = "",
  variant = "custom",
  ...props
}) {
  return (
    <Card
      as={as}
      className={cx(styles.sectionPanel, className)}
      variant={variant}
      {...props}
    >
      {children}
    </Card>
  );
}

export default SectionPanel;
