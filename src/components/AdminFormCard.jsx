import { useState } from "react";
import cardStyles from "./AdminFormCard.module.css";

/**
 * Joins optional CSS module class names while dropping empty values.
 *
 * @param {...string} classNames - Candidate CSS class names.
 * @returns {string} A space-delimited class string.
 */
function cx(...classNames) {
  return classNames.filter(Boolean).join(" ");
}

/**
 * Wraps admin forms in a titled card shell and optionally owns the open/closed state for its body.
 * The toggle button exposes `aria-expanded` and a dynamic label so collapsed forms remain clear
 * to assistive technology.
 *
 * @param {object} props - Component props.
 * @param {React.ReactNode} props.children - Form content rendered inside the card body.
 * @param {boolean} [props.collapsible=false] - Whether to show the collapse toggle.
 * @param {boolean} [props.defaultOpen=true] - Initial open state for collapsible cards.
 * @param {object} [props.styles={}] - Page-provided CSS module hooks.
 * @param {string} props.title - Optional heading text.
 * @returns {JSX.Element} The admin form card.
 */
function AdminFormCard({
  children,
  collapsible = false,
  defaultOpen = true,
  styles = {},
  title,
}) {
  // Own the expanded/collapsed state when the card is configured as collapsible.
  const [isOpen, setIsOpen] = useState(defaultOpen);

  /**
   * Toggles the visibility of the collapsible card body.
   *
   * @returns {void}
   */
  function handleToggle() {
    setIsOpen((currentOpen) => !currentOpen);
  }

  return (
    <div className={styles.formCard}>
      {collapsible ? (
        <div className={cx(cardStyles.header, styles.formHeader)}>
          {title && (
            <h2 className={cx(cardStyles.title, styles.formTitle)}>{title}</h2>
          )}
          <button
            aria-expanded={isOpen}
            aria-label={isOpen ? "Collapse form" : "Expand form"}
            className={cardStyles.toggle}
            onClick={handleToggle}
            type="button"
          >
            {isOpen ? "-" : "+"}
          </button>
        </div>
      ) : (
        title && <h2 className={cx(cardStyles.title, styles.formTitle)}>{title}</h2>
      )}

      {(!collapsible || isOpen) && children}
    </div>
  );
}

export default AdminFormCard;
