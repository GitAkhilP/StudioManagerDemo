/**
 * Renders a labeled checkbox row with optional descriptive text or custom label content.
 * Parent components own checked state and receive native change events through `onChange`.
 *
 * @param {object} props - Component props.
 * @param {boolean} props.checked - Controlled checkbox value.
 * @param {React.ReactNode} props.children - Optional custom label content.
 * @param {string} props.description - Optional helper text below the title.
 * @param {string} props.id - Explicit checkbox id.
 * @param {string} props.label - Fallback title when `title` is absent.
 * @param {string} props.name - Checkbox name and fallback id.
 * @param {Function} props.onChange - Native checkbox change handler.
 * @param {object} [props.styles={}] - CSS module fallback classes.
 * @param {string} props.title - Primary label text.
 * @returns {JSX.Element} A label-wrapped checkbox row.
 */
function ToggleRow({
  checked,
  children,
  className,
  description,
  id,
  label,
  name,
  onChange,
  styles = {},
  title,
  ...props
}) {
  const fieldId = id || name;
  const resolvedClassName = className || styles.checkboxRow || styles.toggleRow;
  const resolvedTitle = title || label;

  return (
    <label className={resolvedClassName} htmlFor={fieldId}>
      <span>
        {children || (
          <>
            <strong>{resolvedTitle}</strong>
            {description && <small>{description}</small>}
          </>
        )}
      </span>
      <input
        checked={checked}
        id={fieldId}
        name={name}
        onChange={onChange}
        type="checkbox"
        {...props}
      />
    </label>
  );
}

export default ToggleRow;
