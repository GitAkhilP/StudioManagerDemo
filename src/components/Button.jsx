import styles from "./Button.module.css";

/**
 * Renders the shared styled button with variant and hover-transform styling hooks.
 *
 * @param {object} props - Component props and native button attributes.
 * @param {string} props.text - Visible button label.
 * @param {Function} props.onClick - Click handler passed to the native button.
 * @param {string} [props.type="button"] - Native button type.
 * @param {boolean} [props.disabled=false] - Whether the button is disabled.
 * @param {string} props.variant - CSS module variant key.
 * @param {string} [props.transform="shift-left"] - CSS module transform key.
 * Additional props are forwarded to the native button for row/action metadata.
 * @returns {JSX.Element} A styled native button.
 */
function Button({
  text,
  onClick,
  type = "button",
  disabled = false,
  variant,
  transform = "shift-left",
  ...rest
}) {
  const className = [styles.base, styles[variant], styles[`transform_${transform}`]].join(" ");

  return (
    <button
      {...rest}
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={className}
    >
      {text}
    </button>
  );
}

export default Button;
