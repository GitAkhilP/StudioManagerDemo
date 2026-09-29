import { createElement } from "react";
import styles from "./Card.module.css";

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
 * Looks up a variant-style CSS module class by prefix and option name.
 *
 * @param {string} prefix - CSS module key prefix.
 * @param {string|null} value - Option suffix to resolve.
 * @returns {string} A CSS module class name, or an empty string when unset.
 */
function getOptionalClass(prefix, value) {
  return value ? styles[`${prefix}_${value}`] : "";
}

/**
 * Provides the shared polymorphic card shell with optional generated header, footer, and action
 * slots. When `interactive` is true on a non-native element, the card supplies button semantics
 * and keyboard activation unless callers provide their own role or key handler.
 *
 * @param {object} props - Component props.
 * @param {React.ElementType} [props.as="section"] - Element or component used as the outer shell.
 * @param {React.ReactNode} props.children - Card body content.
 * @param {React.ReactNode} props.header - Custom header that overrides generated title metadata.
 * @param {React.ReactNode} props.footer - Optional footer content.
 * @param {boolean} [props.interactive=false] - Whether to add interactive card affordances.
 * @param {Function} props.onClick - Optional click handler forwarded to the shell.
 * @param {string} [props.variant="custom"] - CSS module variant key.
 * @returns {React.ReactElement} The configured card element.
 */
function Card({
  actions,
  as = "section",
  bodyClassName = "",
  children,
  className = "",
  eyebrow,
  eyebrowClassName = "",
  footer,
  footerClassName = "",
  header,
  headerClassName = "",
  hover = false,
  interactive = false,
  meta,
  padding = null,
  subtitle,
  subtitleClassName = "",
  title,
  titleAs = "h2",
  titleClassName = "",
  variant = "custom",
  ...props
}) {
  const hasGeneratedHeader =
    eyebrow || title || subtitle || meta || actions;
  const shouldWrapBody = hasGeneratedHeader || bodyClassName;
  const tabIndex =
    interactive && props.onClick && props.tabIndex === undefined
      ? 0
      : props.tabIndex;
  const isNativeInteractive =
    typeof as === "string" &&
    ["button", "a", "input", "textarea", "select", "option"].includes(as);

  // Non-native interactive cards need keyboard activation to match button behavior.
  if (interactive && props.onClick && !isNativeInteractive) {
    if (props.role === undefined) {
      props.role = "button";
    }

    if (props.onKeyDown === undefined) {
      /**
       * Mirrors native button activation for cards rendered as non-interactive elements.
       *
       * @param {React.KeyboardEvent} event - Keydown event from the card shell.
       * @returns {void}
       */
      function handleCardKeyDown(event) {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          props.onClick(event);
        }
      }

      props.onKeyDown = handleCardKeyDown;
    }
  }

  // Generate a standard heading area only when callers provide header metadata.
  const generatedHeader = hasGeneratedHeader && (
    <div className={cx(styles.header, headerClassName)}>
      <div className={styles.headingGroup}>
        {eyebrow && (
          <p className={cx(styles.eyebrow, eyebrowClassName)}>
            {eyebrow}
          </p>
        )}
        {title &&
          createElement(
            titleAs,
            { className: cx(styles.title, titleClassName) },
            title
          )}
        {subtitle && (
          <p className={cx(styles.subtitle, subtitleClassName)}>
            {subtitle}
          </p>
        )}
      </div>

      {meta && <div className={styles.meta}>{meta}</div>}
      {actions && <div className={styles.actions}>{actions}</div>}
    </div>
  );

  return createElement(
    as,
    {
      ...props,
      tabIndex,
      className: cx(
        styles.card,
        getOptionalClass("variant", variant),
        getOptionalClass("padding", padding),
        hover && styles.hover,
        interactive && styles.interactive,
        className
      ),
    },
    header || generatedHeader,
    shouldWrapBody ? (
      <div className={cx(styles.body, bodyClassName)}>{children}</div>
    ) : (
      children
    ),
    footer && (
      <div className={cx(styles.footer, footerClassName)}>{footer}</div>
    )
  );
}

export default Card;
