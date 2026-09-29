import { useEffect, useState } from "react";
import Card from "./Card";
import { dbAddSupportRequest } from "../services/mockDbServices";

/**
 * Creates a blank support-ticket form with optional default select values.
 *
 * @param {object} defaults - Default select values.
 * @param {string} [defaults.category=""] - Default ticket category.
 * @param {string} [defaults.contact=""] - Default contact method.
 * @param {string} [defaults.priority=""] - Default priority.
 * @returns {object} Controlled support-ticket form values.
 */
function createEmptyForm({
  category = "",
  contact = "",
  priority = "",
} = {}) {
  return {
    category,
    priority,
    vehicle: "",
    subject: "",
    contact,
    details: "",
  };
}

/**
 * Chooses the best available default values from current support form options.
 *
 * @param {object} options - Available form option lists and current values.
 * @param {string[]} [options.categories=[]] - Category choices.
 * @param {string} options.category - Existing category to preserve when present.
 * @param {string} options.contact - Existing contact method to preserve when present.
 * @param {string[]} [options.contactMethods=[]] - Contact method choices.
 * @param {string[]} [options.priorities=[]] - Priority choices.
 * @param {string} options.priority - Existing priority to preserve when present.
 * @returns {object} Form values with sensible defaults.
 */
function getDefaultForm({
  categories = [],
  category,
  contact,
  contactMethods = [],
  priorities = [],
  priority,
} = {}) {
  return createEmptyForm({
    category: category || categories[0] || "",
    contact: contact || contactMethods[0] || "",
    priority: priority || priorities[0] || "",
  });
}

/**
 * Lets members open a support ticket against the local support queue. The panel owns draft form
 * state and notice feedback, refreshes select defaults when option lists change, calls
 * `onRequestAdded` after a successful save, and uses `aria-pressed` on priority buttons plus
 * `role="status"` for submit feedback.
 *
 * @param {object} props - Component props.
 * @param {string[]} [props.categories=[]] - Ticket categories.
 * @param {string[]} [props.contactMethods=[]] - Preferred contact choices.
 * @param {Function} props.onRequestAdded - Callback fired after a ticket saves.
 * @param {string[]} [props.priorities=[]] - Priority choices.
 * @param {object} props.styles - CSS module classes supplied by the page.
 * @param {object} props.supportQueue - Queue summary shown in the panel header.
 * @param {string} props.userId - Current member id required for persistence.
 * @returns {JSX.Element} The support request panel.
 */
function SupportRequestPanel({
  categories = [],
  contactMethods = [],
  onRequestAdded,
  priorities = [],
  styles,
  supportQueue,
  userId,
}) {
  // Own the ticket draft while seeding select fields from the latest option lists.
  const [form, setForm] = useState(() =>
    getDefaultForm({ categories, contactMethods, priorities })
  );
  // Own success/error feedback produced by validation and save attempts.
  const [notice, setNotice] = useState(null);

  // Resynchronize default select values if categories, contact methods, or priorities refresh.
  useEffect(() => {
    // Option lists can arrive asynchronously; keep current selections while refreshing defaults.
    setForm((currentForm) =>
      getDefaultForm({
        categories,
        contactMethods,
        priorities,
        category: currentForm.category,
        contact: currentForm.contact,
        priority: currentForm.priority,
      })
    );
  }, [categories, contactMethods, priorities]);

  /**
   * Updates a controlled support form field and clears stale feedback.
   *
   * @param {React.ChangeEvent<HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement>} event - Field change event.
   * @returns {void}
   */
  function updateField(event) {
    const { name, value } = event.target;
    setNotice(null);
    setForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
  }

  /**
   * Toggles priority buttons so members can clear an accidental priority choice.
   *
   * @param {string} priority - Priority label selected from the button group.
   * @returns {void}
   */
  function updatePriority(priority) {
    setNotice(null);
    setForm((currentForm) => ({
      ...currentForm,
      priority: currentForm.priority === priority ? "" : priority,
    }));
  }

  /**
   * Toggles the priority identified by the clicked priority button.
   *
   * @param {React.MouseEvent<HTMLButtonElement>} event - Priority button click event.
   * @returns {void}
   */
  function handlePriorityClick(event) {
    updatePriority(event.currentTarget.dataset.priority);
  }

  /**
   * Restores the support form to current defaults and clears feedback.
   *
   * @returns {void}
   */
  function handleReset() {
    setForm(getDefaultForm({ categories, contactMethods, priorities }));
    setNotice(null);
  }

  /**
   * Validates required ticket details and saves the request to the local mock DB.
   *
   * @param {React.FormEvent<HTMLFormElement>} event - Support form submit event.
   * @returns {void}
   */
  function handleSubmit(event) {
    event.preventDefault();

    if (!userId) {
      setNotice({
        type: "error",
        text: "Your member session is still loading. Try again in a moment.",
      });
      return;
    }

    if (!form.subject.trim() || form.details.trim().length < 12) {
      setNotice({
        type: "error",
        text: "Add a subject and a few more details before submitting.",
      });
      return;
    }

    try {
      const result = dbAddSupportRequest({
        userId,
        title: form.subject.trim(),
        category: form.category,
        priority: form.priority,
        vehicle: form.vehicle.trim(),
        contact: form.contact,
        details: form.details.trim(),
      });
      const requestId = result.request?.id || "Request";

      onRequestAdded?.();
      setForm(
        getDefaultForm({
          categories,
          contactMethods,
          priorities,
          category: form.category,
          contact: form.contact,
        })
      );
      setNotice({
        type: "success",
        text: `${requestId} opened. The studio desk will follow up by ${form.contact.toLowerCase()}.`,
      });
    } catch {
      setNotice({
        type: "error",
        text: "Unable to save the request right now. Please try again.",
      });
    }
  }

  return (
    <Card className={styles.ticketPanel} variant="custom">
      <div className={styles.panelHeader}>
        <div>
          <p className={styles.panelKicker}>New ticket</p>
          <h2>Request support</h2>
        </div>
        <span className={styles.responseBadge}>
          {supportQueue?.detail || "Queue status loading"}
        </span>
      </div>

      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.formGrid}>
          <label className={styles.field}>
            <span>Category</span>
            <select
              name="category"
              onChange={updateField}
              value={form.category}
            >
              {categories.map((category) => (
                <option key={category}>{category}</option>
              ))}
            </select>
          </label>

          <label className={styles.field}>
            <span>Preferred contact</span>
            <select
              name="contact"
              onChange={updateField}
              value={form.contact}
            >
              {contactMethods.map((method) => (
                <option key={method}>{method}</option>
              ))}
            </select>
          </label>

          <label className={styles.field}>
            <span>Vehicle</span>
            <input
              name="vehicle"
              onChange={updateField}
              placeholder="2022 Audi Q5"
              value={form.vehicle}
            />
          </label>

          <label className={styles.field}>
            <span>Subject</span>
            <input
              name="subject"
              onChange={updateField}
              placeholder="What should the team review?"
              required
              value={form.subject}
            />
          </label>
        </div>

        <fieldset className={styles.priorityField}>
          <legend>Priority</legend>
          <div className={styles.priorityGroup}>
            {priorities.map((priority) => (
              <button
                aria-pressed={form.priority === priority}
                className={
                  form.priority === priority
                    ? `${styles.priorityButton} ${styles.priorityActive}`
                    : styles.priorityButton
                }
                key={priority}
                data-priority={priority}
                onClick={handlePriorityClick}
                type="button"
              >
                {priority}
              </button>
            ))}
          </div>
        </fieldset>

        <label className={styles.field}>
          <span>Details</span>
          <textarea
            name="details"
            onChange={updateField}
            placeholder="Add booking dates, vehicle notes, products, or membership details."
            required
            rows="5"
            value={form.details}
          />
        </label>

        <div className={styles.actions}>
          <button className={styles.submitButton} type="submit">
            Submit request
          </button>
          <button
            className={styles.resetButton}
            onClick={handleReset}
            type="button"
          >
            Reset
          </button>
          {notice ? (
            <p
              className={
                notice.type === "error"
                  ? `${styles.notice} ${styles.noticeError}`
                  : `${styles.notice} ${styles.noticeSuccess}`
              }
              role="status"
            >
              {notice.text}
            </p>
          ) : null}
        </div>
      </form>
    </Card>
  );
}

export default SupportRequestPanel;
