import FormField from "./FormField";

/**
 * Specializes FormField for password inputs with an optional reveal mode.
 *
 * @param {object} props - Component props forwarded to FormField.
 * @param {boolean} [props.showPassword=false] - Whether to render plain text instead of password masking.
 * @returns {JSX.Element} A password-aware FormField.
 */
function PasswordField({ showPassword = false, ...props }) {
  return (
    <FormField
      {...props}
      type={showPassword ? "text" : "password"}
    />
  );
}

export default PasswordField;
