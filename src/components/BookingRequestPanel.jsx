import { useEffect, useMemo, useState } from "react";
import Card from "./Card";
import {
  dbAddBooking,
} from "../services/mockDbServices";

/**
 * Returns a local YYYY-MM-DD date string for date inputs relative to today.
 *
 * @param {number} days - Day offset from the current local date.
 * @returns {string} A date-input compatible local date string.
 */
function getDateOffset(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Builds the initial booking request form with a default drop-off window.
 *
 * @param {string} [dropoff=""] - Initial drop-off preference.
 * @returns {object} Controlled booking form values.
 */
function createInitialForm(dropoff = "") {
  return {
    vehicle: "",
    date: getDateOffset(7),
    time: "09:00",
    dropoff,
    notes: "",
  };
}

/**
 * Lets a member compose a booking request, choose a service, and persist the request to the
 * local mock database. The parent owns the selected service id via `onServiceChange`, while this
 * panel owns the draft vehicle/date/time/drop-off/notes state and submit feedback. Service choices
 * render as buttons with `aria-pressed` to expose selection state.
 *
 * @param {object} props - Component props.
 * @param {string[]} [props.dropoffOptions=[]] - Available drop-off windows.
 * @param {Function} props.onServiceChange - Callback used to update the parent-owned service id.
 * @param {string} props.selectedServiceId - Currently selected service id.
 * @param {object[]} [props.serviceOptions=[]] - Services members can request.
 * @param {object} props.styles - CSS module classes supplied by the page.
 * @param {string} props.userId - Current member id required for persistence.
 * @returns {JSX.Element} The booking request form panel.
 */
function BookingRequestPanel({
  dropoffOptions = [],
  onServiceChange,
  selectedServiceId,
  serviceOptions = [],
  styles,
  userId,
}) {
  // Own the draft booking fields independently from the parent-owned service selection.
  const [form, setForm] = useState(() => createInitialForm());
  // Track successful submission feedback shown in the polite live region.
  const [message, setMessage] = useState("");
  // Track validation or persistence errors shown in the polite live region.
  const [error, setError] = useState("");

  // Memoize service lookup because the selected service drives multiple render branches.
  const selectedService = useMemo(
    () =>
      serviceOptions.find((service) => service.id === selectedServiceId) ||
      null,
    [selectedServiceId, serviceOptions]
  );

  // Synchronize late-arriving drop-off options without overwriting a member's existing choice.
  useEffect(() => {
    // Drop-off options may load after mount; keep a user's choice once one exists.
    setForm((currentForm) => ({
      ...currentForm,
      dropoff: currentForm.dropoff || dropoffOptions[0] || "",
    }));
  }, [dropoffOptions]);

  /**
   * Clears any success or error message after the member edits the form.
   *
   * @returns {void}
   */
  function clearFeedback() {
    setError("");
    setMessage("");
  }

  /**
   * Updates the matching booking form field from a text, date, time, or select control.
   *
   * @param {React.ChangeEvent<HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement>} event - Field change event.
   * @returns {void}
   */
  function handleChange(event) {
    const { name, value } = event.target;
    setForm((currentForm) => ({ ...currentForm, [name]: value }));
    clearFeedback();
  }

  /**
   * Sends service selection changes to the parent-owned selected service state.
   *
   * @param {string} serviceId - Service selected from the button grid.
   * @returns {void}
   */
  function handleServiceChange(serviceId) {
    onServiceChange?.(serviceId);
    clearFeedback();
  }

  /**
   * Toggles the service card selected from the service option grid.
   *
   * @param {React.MouseEvent<HTMLButtonElement>} event - Service button click event.
   * @returns {void}
   */
  function handleServiceButtonClick(event) {
    handleServiceChange(event.currentTarget.dataset.serviceId);
  }

  /**
   * Restores the form and clears the parent-owned service selection.
   *
   * @returns {void}
   */
  function handleReset() {
    setForm(createInitialForm(dropoffOptions[0] || ""));
    onServiceChange?.("");
    setMessage("");
    setError("");
  }

  /**
   * Validates required booking data and saves a new request to the local mock database.
   *
   * @param {React.FormEvent<HTMLFormElement>} event - Booking form submit event.
   * @returns {void}
   */
  function handleSubmit(event) {
    event.preventDefault();

    if (!userId) {
      setError("Sign in again before sending a booking request.");
      return;
    }

    if (!selectedService) {
      setError("Select an available service before sending the request.");
      return;
    }

    if (!form.vehicle.trim() || !form.date || !form.time) {
      setError("Add a vehicle, date, and time before sending the request.");
      return;
    }

    const result = dbAddBooking({
      userId,
      serviceId: selectedService.id,
      serviceName: selectedService.name,
      vehicle: form.vehicle.trim(),
      date: form.date,
      time: form.time,
      dropoff: form.dropoff,
      notes: form.notes.trim(),
    });

    if (!result.success) {
      setError(result.message || "Booking request could not be saved.");
      return;
    }

    setForm(createInitialForm(dropoffOptions[0] || ""));
    setError("");
    setMessage("Booking request sent. The studio desk will confirm the bay.");
  }

  return (
    <Card
      as="section"
      className={`${styles.panel} ${styles.requestPanel}`}
      variant="custom"
    >
      <div className={styles.panelHeader}>
        <div>
          <h2>Request a detail</h2>
          <p>
            {selectedService
              ? selectedService.description
              : "Service menu is loading."}
          </p>
        </div>
        <span className={styles.pricePill}>
          {selectedService
            ? `$${selectedService.price} / ${selectedService.duration}`
            : "Select service"}
        </span>
      </div>

      <form className={styles.form} onSubmit={handleSubmit}>
        <fieldset className={styles.serviceGrid}>
          <legend>Service options</legend>
          {serviceOptions.length === 0 ? (
            <Card as="div" className={styles.emptyState} variant="custom">
              <strong>No services available</strong>
              <p>The studio service menu has not been published yet.</p>
            </Card>
          ) : (
            serviceOptions.map((service) => (
              <Card
                aria-pressed={selectedServiceId === service.id}
                as="button"
                className={`${styles.serviceOption} ${
                  selectedServiceId === service.id ? styles.selectedService : ""
                }`}
                data-service-id={service.id}
                key={service.id}
                onClick={handleServiceButtonClick}
                type="button"
                variant="custom"
              >
                <span>{service.name}</span>
                <strong>${service.price}</strong>
                <small>{service.duration}</small>
              </Card>
            ))
          )}
        </fieldset>

        <div className={styles.formGrid}>
          <label>
            Vehicle
            <input
              name="vehicle"
              onChange={handleChange}
              placeholder="2023 Acura Integra"
              value={form.vehicle}
            />
          </label>

          <label>
            Preferred date
            <input
              min={getDateOffset(1)}
              name="date"
              onChange={handleChange}
              type="date"
              value={form.date}
            />
          </label>

          <label>
            Preferred time
            <input
              name="time"
              onChange={handleChange}
              type="time"
              value={form.time}
            />
          </label>

          <label>
            Drop-off window
            <select
              name="dropoff"
              onChange={handleChange}
              value={form.dropoff}
            >
              {dropoffOptions.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </label>
        </div>

        <label className={styles.notesField}>
          Notes
          <textarea
            name="notes"
            onChange={handleChange}
            placeholder="Stains, coatings, pickup needs, or access notes"
            rows="3"
            value={form.notes}
          />
        </label>

        <div className={styles.formFooter}>
          <div aria-live="polite">
            {error && <p className={styles.error}>{error}</p>}
            {message && <p className={styles.success}>{message}</p>}
          </div>
          <button
            className={styles.resetButton}
            onClick={handleReset}
            type="button"
          >
            Reset
          </button>
          <button
            className={styles.submitButton}
            disabled={!selectedService || !userId}
            type="submit"
          >
            Send request
          </button>
        </div>
      </form>
    </Card>
  );
}

export default BookingRequestPanel;
