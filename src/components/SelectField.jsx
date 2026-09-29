/**
 * Resolves a stable option value from string or object-backed option data.
 *
 * @param {string|object} option - Option value or object from a caller.
 * @returns {string} Value used for the option key and value attribute.
 */
function getOptionValue(option) {
  if (typeof option === "string") return option;
  return option.value ?? option.id ?? option.label ?? option.name ?? "";
}

/**
 * Resolves the visible option label from string or object-backed option data.
 *
 * @param {string|object} option - Option value or object from a caller.
 * @returns {string} Human-readable option label.
 */
function getOptionLabel(option) {
  if (typeof option === "string") return option;
  return option.label ?? option.name ?? option.value ?? option.id ?? "";
}

/**
 * Renders a labeled select that can use explicit children or an options array. It keeps the label
 * associated with the select by resolving an id from `id` or `name`.
 *
 * @param {object} props - Component props.
 * @param {React.ReactNode} props.children - Explicit option nodes, which take priority over options.
 * @param {string} props.id - Explicit select id.
 * @param {string} props.label - Optional visible label text.
 * @param {string} props.name - Select name and fallback id.
 * @param {Array<string|object>} [props.options=[]] - Option data used when children are absent.
 * @param {string} props.placeholder - Optional empty option label.
 * @param {object} [props.styles={}] - CSS module fallback classes.
 * @returns {JSX.Element} A label-wrapped select.
 */
function SelectField({
  children,
  className,
  id,
  label,
  labelClassName,
  name,
  options = [],
  placeholder,
  selectClassName,
  styles = {},
  ...props
}) {
  const fieldId = id || name;
  const resolvedClassName = className || styles.formRow;
  const resolvedLabelClassName = labelClassName || styles.label;
  const resolvedSelectClassName = selectClassName || styles.select;

  return (
    <label className={resolvedClassName} htmlFor={fieldId}>
      {label && <span className={resolvedLabelClassName}>{label}</span>}
      <select
        className={resolvedSelectClassName}
        id={fieldId}
        name={name}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {children ||
          options.map((option) => {
            // Use one resolved value for both React keys and native option values.
            const value = getOptionValue(option);
            return (
              <option key={value} value={value}>
                {getOptionLabel(option)}
              </option>
            );
          })}
      </select>
    </label>
  );
}

export default SelectField;
