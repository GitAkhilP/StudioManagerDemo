import { createElement } from "react";

/**
 * Renders a labeled form row that can swap the underlying control element or accept custom
 * children. It resolves ids from `id` or `name` so the label remains associated with the control.
 *
 * @param {object} props - Component props.
 * @param {React.ElementType} [props.as="input"] - Control element to create when children are absent.
 * @param {React.ReactNode} props.children - Optional fully custom control content.
 * @param {string} props.id - Explicit control id.
 * @param {string} props.label - Optional visible label text.
 * @param {string} props.name - Control name and fallback id.
 * @param {object} [props.styles={}] - CSS module fallback classes.
 * @returns {JSX.Element} A label-wrapped control.
 */
function FormField({
  as: Component = "input",
  children,
  className,
  controlClassName,
  id,
  label,
  labelClassName,
  name,
  styles = {},
  ...props
}) {
  const fieldId = id || name;
  const resolvedClassName = className || styles.formRow;
  const resolvedControlClassName = controlClassName || styles.input;
  const resolvedLabelClassName = labelClassName || styles.label;

  return (
    <label className={resolvedClassName} htmlFor={fieldId}>
      {label && <span className={resolvedLabelClassName}>{label}</span>}
      {children ||
        createElement(Component, {
          className: resolvedControlClassName,
          id: fieldId,
          name,
          ...props,
        })}
    </label>
  );
}

export default FormField;
