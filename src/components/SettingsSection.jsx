import { useEffect, useMemo, useRef, useState } from "react";
import Card from "./Card";
import FormField from "./FormField";
import PasswordField from "./PasswordField";
import SelectField from "./SelectField";
import ToggleRow from "./ToggleRow";
import {
  dbGetDefaultMemberPreferences,
  dbUpdateUser,
} from "../services/mockDbServices";

/**
 * Removes private credentials before returning the saved user to the parent page.
 *
 * @param {object|null} user - User record returned from the mock DB.
 * @returns {object|null} A shallow user copy without a password field.
 */
function sanitizeUser(user) {
  if (!user) return null;
  const safeUser = { ...user };
  delete safeUser.password;
  return safeUser;
}

/**
 * Normalizes optional account fields into controlled profile form values.
 *
 * @param {object|null} user - Current account user.
 * @returns {object} Controlled profile form values.
 */
function getProfileFromUser(user) {
  return {
    username: user?.username || "",
    email: user?.email || "",
    phone: user?.phone || "",
    vehicle: user?.vehicle || "",
    preferredContact: user?.preferredContact || "email",
    serviceNotes: user?.serviceNotes || "",
  };
}

/**
 * Merges stored member preferences with the current default preference set.
 *
 * @param {object|null} user - Current account user.
 * @returns {object} Controlled preference toggles with defaults filled in.
 */
function getPreferencesFromUser(user) {
  return {
    ...dbGetDefaultMemberPreferences(),
    ...(user?.preferences || {}),
  };
}

/**
 * Formats stored ISO timestamps for the account metadata panel.
 *
 * @param {string} iso - Stored ISO timestamp.
 * @returns {string} Display text for the last-updated field.
 */
function formatDate(iso) {
  if (!iso) return "Not recorded";

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Not recorded";

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Lets a member edit profile, notification, and local-login settings together. This component owns
 * the draft profile, preference, security, and feedback state while syncing incoming account changes
 * from the parent. Successful saves update the local mock DB, which refreshes auth through its
 * collection event, and notify the parent through `onAccountSaved`.
 *
 * @param {object} props - Component props.
 * @param {object} props.accountUser - Current member account loaded by the page.
 * @param {Function} props.onAccountSaved - Callback fired with the sanitized saved user.
 * @param {object} props.styles - CSS module classes supplied by the page.
 * @returns {JSX.Element} The account settings form.
 */
function SettingsSection({ accountUser, onAccountSaved, styles }) {
  // Own controlled profile fields derived from the current account.
  const [profile, setProfile] = useState(() => getProfileFromUser(accountUser));
  // Own notification preferences while filling in any new defaults.
  const [preferences, setPreferences] = useState(() =>
    getPreferencesFromUser(accountUser)
  );
  // Own transient password-change fields separately from persisted account data.
  const [security, setSecurity] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  // Track success feedback for the sticky action area.
  const [message, setMessage] = useState("");
  // Track validation and persistence errors for the sticky action area.
  const [error, setError] = useState("");
  // Remember the prior account id so refreshes do not wipe same-account feedback.
  const previousAccountId = useRef();

  // Resynchronize controlled form state whenever the parent supplies a different account.
  useEffect(() => {
    const nextAccountId = accountUser?.id || "";
    const accountChanged = previousAccountId.current !== nextAccountId;
    previousAccountId.current = nextAccountId;

    setProfile(getProfileFromUser(accountUser));
    setPreferences(getPreferencesFromUser(accountUser));
    setSecurity({ newPassword: "", confirmPassword: "" });

    // Account data can refresh after a save; keep feedback unless the identity changes.
    if (accountChanged) {
      setMessage("");
      setError("");
    }
  }, [accountUser]);

  const passwordStarted =
    security.newPassword.length > 0 || security.confirmPassword.length > 0;
  const passwordMismatch =
    passwordStarted && security.newPassword !== security.confirmPassword;
  const passwordTooShort =
    security.newPassword.length > 0 && security.newPassword.length < 6;
  // Memoize save eligibility because it derives from multiple controlled fields.
  const saveDisabled = useMemo(
    () =>
      !profile.username.trim() ||
      !profile.email.trim() ||
      passwordMismatch ||
      passwordTooShort,
    [passwordMismatch, passwordTooShort, profile.email, profile.username]
  );

  /**
   * Clears visible save feedback when a member edits any settings field.
   *
   * @returns {void}
   */
  function clearFeedback() {
    setMessage("");
    setError("");
  }

  /**
   * Updates a controlled profile field from its matching input/select name.
   *
   * @param {React.ChangeEvent<HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement>} event - Profile field event.
   * @returns {void}
   */
  function handleProfileChange(event) {
    const { name, value } = event.target;
    clearFeedback();
    setProfile((currentProfile) => ({
      ...currentProfile,
      [name]: value,
    }));
  }

  /**
   * Updates a controlled notification preference toggle.
   *
   * @param {React.ChangeEvent<HTMLInputElement>} event - Preference checkbox event.
   * @returns {void}
   */
  function handlePreferenceChange(event) {
    const { checked, name } = event.target;
    clearFeedback();
    setPreferences((currentPreferences) => ({
      ...currentPreferences,
      [name]: checked,
    }));
  }

  /**
   * Updates the transient password-change fields.
   *
   * @param {React.ChangeEvent<HTMLInputElement>} event - Password field event.
   * @returns {void}
   */
  function handleSecurityChange(event) {
    const { name, value } = event.target;
    clearFeedback();
    setSecurity((currentSecurity) => ({
      ...currentSecurity,
      [name]: value,
    }));
  }

  /**
   * Restores the form to the current account values and clears password/feedback state.
   *
   * @returns {void}
   */
  function handleReset() {
    setProfile(getProfileFromUser(accountUser));
    setPreferences(getPreferencesFromUser(accountUser));
    setSecurity({ newPassword: "", confirmPassword: "" });
    setMessage("");
    setError("");
  }

  /**
   * Validates the settings form, writes changes to the mock DB, and updates session state.
   *
   * @param {React.FormEvent<HTMLFormElement>} event - Settings form submit event.
   * @returns {void}
   */
  function handleSubmit(event) {
    event.preventDefault();
    setMessage("");
    setError("");

    if (!accountUser?.id) {
      setError("Unable to find the current member account.");
      return;
    }

    if (passwordMismatch) {
      setError("Passwords must match before saving.");
      return;
    }

    if (passwordTooShort) {
      setError("New password must be at least 6 characters.");
      return;
    }

    const updates = {
      username: profile.username.trim(),
      email: profile.email.trim(),
      phone: profile.phone.trim(),
      vehicle: profile.vehicle.trim(),
      preferredContact: profile.preferredContact,
      serviceNotes: profile.serviceNotes.trim(),
      preferences,
      updatedAt: new Date().toISOString(),
    };

    if (security.newPassword) {
      updates.password = security.newPassword;
    }

    const result = dbUpdateUser(accountUser.id, updates);
    if (!result.success) {
      setError(result.message || "Unable to save account settings.");
      return;
    }

    const savedUser = sanitizeUser(result.user);
    onAccountSaved?.(savedUser);
    setProfile(getProfileFromUser(savedUser));
    setPreferences(getPreferencesFromUser(savedUser));
    setSecurity({ newPassword: "", confirmPassword: "" });
    setMessage("Account settings saved locally.");
  }

  return (
    <form className={styles.contentGrid} onSubmit={handleSubmit}>
      <Card className={styles.card} variant="custom">
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}>Profile</h2>
          <p className={styles.cardHint}>Basic account information</p>
        </div>

        <div className={styles.formGrid}>
          <FormField
            className={styles.formRow}
            id="username"
            label="Username"
            name="username"
            onChange={handleProfileChange}
            placeholder="Your display name"
            value={profile.username}
          />

          <FormField
            className={styles.formRow}
            id="email"
            label="Email"
            name="email"
            onChange={handleProfileChange}
            placeholder="you@example.com"
            type="email"
            value={profile.email}
          />

          <FormField
            className={styles.formRow}
            id="phone"
            label="Phone"
            name="phone"
            onChange={handleProfileChange}
            placeholder="Optional"
            type="tel"
            value={profile.phone}
          />

          <FormField
            className={styles.formRow}
            id="vehicle"
            label="Vehicle"
            name="vehicle"
            onChange={handleProfileChange}
            placeholder="Year, make, model"
            value={profile.vehicle}
          />

          <SelectField
            className={styles.formRow}
            id="preferredContact"
            label="Preferred Contact"
            name="preferredContact"
            onChange={handleProfileChange}
            value={profile.preferredContact}
          >
            <option value="email">Email</option>
            <option value="sms">Text message</option>
            <option value="phone">Phone call</option>
          </SelectField>

          <FormField
            as="textarea"
            className={`${styles.formRow} ${styles.fullWidth}`}
            id="serviceNotes"
            label="Service Notes"
            name="serviceNotes"
            onChange={handleProfileChange}
            placeholder="Preferred products, parking notes, or detail requests"
            rows="3"
            value={profile.serviceNotes}
          />
        </div>
      </Card>

      <Card className={styles.card} variant="custom">
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}>Notifications</h2>
          <p className={styles.cardHint}>Choose how the studio reaches you</p>
        </div>

        <div className={styles.toggleList}>
          <ToggleRow
            checked={preferences.emailReminders}
            className={styles.toggleRow}
            description="Booking confirmations and appointment nudges"
            id="emailReminders"
            name="emailReminders"
            onChange={handlePreferenceChange}
            title="Email reminders"
          />

          <ToggleRow
            checked={preferences.smsReminders}
            className={styles.toggleRow}
            description="Short text alerts for upcoming services"
            id="smsReminders"
            name="smsReminders"
            onChange={handlePreferenceChange}
            title="SMS reminders"
          />

          <ToggleRow
            checked={preferences.serviceUpdates}
            className={styles.toggleRow}
            description="Progress notes while your vehicle is in the studio"
            id="serviceUpdates"
            name="serviceUpdates"
            onChange={handlePreferenceChange}
            title="Service updates"
          />

          <ToggleRow
            checked={preferences.promotions}
            className={styles.toggleRow}
            description="Occasional offers and seasonal care tips"
            id="promotions"
            name="promotions"
            onChange={handlePreferenceChange}
            title="Promotions"
          />
        </div>
      </Card>

      <Card className={styles.card} variant="custom">
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}>Security</h2>
          <p className={styles.cardHint}>Update local login details</p>
        </div>

        <div className={styles.securityGrid}>
          <div className={styles.accountMeta}>
            <span>Account ID</span>
            <strong>{accountUser?.id || "Unavailable"}</strong>
          </div>
          <div className={styles.accountMeta}>
            <span>Last Updated</span>
            <strong>{formatDate(accountUser?.updatedAt)}</strong>
          </div>
        </div>

        <div className={styles.formGrid}>
          <PasswordField
            className={styles.formRow}
            id="newPassword"
            label="New Password"
            name="newPassword"
            onChange={handleSecurityChange}
            placeholder="Leave blank to keep current"
            value={security.newPassword}
          />

          <PasswordField
            className={styles.formRow}
            id="confirmPassword"
            label="Confirm Password"
            name="confirmPassword"
            onChange={handleSecurityChange}
            placeholder="Repeat new password"
            value={security.confirmPassword}
          />
        </div>

        {passwordMismatch && (
          <p className={styles.error}>Passwords do not match.</p>
        )}
        {passwordTooShort && (
          <p className={styles.error}>
            New password must be at least 6 characters.
          </p>
        )}
      </Card>

      <div className={styles.actionBar}>
        <div className={styles.feedback}>
          {message && <p className={styles.message}>{message}</p>}
          {error && <p className={styles.error}>{error}</p>}
        </div>
        <div className={styles.actions}>
          <button
            className={styles.secondaryButton}
            onClick={handleReset}
            type="button"
          >
            Reset
          </button>
          <button
            className={styles.primaryButton}
            disabled={saveDisabled}
            type="submit"
          >
            Save Settings
          </button>
        </div>
      </div>
    </form>
  );
}

export default SettingsSection;
