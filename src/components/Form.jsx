import styles from "./Form.module.css";
import Button from "./Button";

/**
 * Renders a label-driven form for simple CRUD screens backed by indexed field keys.
 * Parent pages own form state and submit behavior; this primitive only maps configured labels
 * to stable `name-{index}` controls and forwards change/submit events.
 *
 * @param {object} props - Component props.
 * @param {Function} props.handleSubmit - Form submit handler.
 * @param {Function} props.handleChange - Input change handler.
 * @param {string} props.error - Optional validation message.
 * @param {object} props.form - Current form values keyed by `name-{index}`.
 * @param {string} [props.submitText="Submit"] - Submit button label.
 * @param {string[]} [props.inputFields] - Field labels to render in order.
 * @returns {JSX.Element} The generated CRUD form.
 */
function Form({
  handleSubmit,
  handleChange,
  error,
  form,
  submitText = "Submit",
  inputFields = ["Name", "Description", "Quantity", "Price"],
}) {
  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      {inputFields.map((field, index) => (
        <div key={index} className={styles.formRow}>
          <label htmlFor={`name-${index}`}>{field}</label>
          <input
            // Existing callers encode numeric intent in the field labels.
            type={
              field.includes("Quantity") || field.includes("Price")
                ? "number"
                : "text"
            }
            id={`name-${index}`}
            name={`name-${index}`}
            value={form[`name-${index}`]}
            onChange={handleChange}
            placeholder={`Item ${field}`}
            min={field.includes("Number") ? "0" : undefined}
            step={field.includes("Price") ? "0.01" : undefined}
          />
        </div>
      ))}
      {error && <p className={styles.error}>{error}</p>}

      <Button
        type="submit"
        text={submitText}
        variant="primary"
        transform="shift-right"
      />
    </form>
  );
}

export default Form;
