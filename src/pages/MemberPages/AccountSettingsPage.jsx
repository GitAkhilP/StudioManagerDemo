import { useEffect, useMemo, useState } from "react";
import Card from "../../components/Card";
import SettingsSection from "../../components/SettingsSection";
import { useAuth } from "../../contexts/AuthContext";
import { dbGetUserSummary } from "../../services/mockDbServices";
import styles from "./AccountSettingsPage.module.css";

/**
 * Copies a user object without password data before placing it in page state.
 * @param {object | null | undefined} user Auth or summary user record.
 * @returns {object | null} User data safe for member UI state.
 */
function sanitizeUser(user) {
  if (!user) return null;
  const safeUser = { ...user };
  delete safeUser.password;
  return safeUser;
}

/**
 * Formats stored account dates for profile summary cards.
 * @param {string | number | Date | null | undefined} iso Date-like value.
 * @returns {string} Member-facing date text.
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
 * Formats member spending totals for account cards.
 * @param {number | string | null | undefined} amount Currency-like value.
 * @returns {string} Currency text.
 */
function formatCurrency(amount) {
  return Number(amount || 0).toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
  });
}

/**
 * Renders member account settings and profile summary metrics.
 * The route-level AppLayout supplies authenticated chrome for this page.
 *
 * @returns {import("react").JSX.Element}
 */
function AccountSettingsPage() {
  // Hook: active member identity seeds account settings state.
  const { user } = useAuth();
  // State: sanitized profile data currently shown and edited by settings.
  const [accountUser, setAccountUser] = useState(() => sanitizeUser(user));
  // State: account activity and spend rollup for summary cards.
  const [summary, setSummary] = useState(null);

  // Account state mirrors auth user data, then enriches it with persisted summary records.
  useEffect(() => {
    if (!user?.id) {
      setAccountUser(sanitizeUser(user));
      setSummary(null);
      return;
    }

    const currentSummary = dbGetUserSummary(user.id);
    const currentUser = sanitizeUser(currentSummary?.user || user);

    setAccountUser(currentUser);
    setSummary(currentSummary);
  }, [user]);

  // Memo: initials only need recomputing when the display identity changes.
  const initials = useMemo(() => {
    const name = accountUser?.username || accountUser?.email || "Member";
    return name
      .split(/[\s@._-]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("");
  }, [accountUser?.email, accountUser?.username]);

  /**
   * Refreshes account state after the settings form saves profile edits.
   * @param {object | null | undefined} savedUser Saved user record.
   * @returns {void}
   */
  function handleAccountSaved(savedUser) {
    const savedAccountUser = sanitizeUser(savedUser);
    const refreshedSummary = savedAccountUser?.id
      ? dbGetUserSummary(savedAccountUser.id)
      : null;
    const refreshedUser = sanitizeUser(
      refreshedSummary?.user || savedAccountUser
    );

    setAccountUser(refreshedUser);
    setSummary(refreshedSummary);
  }

  return (
    <div className={styles.page}>
      <div className={styles.headerRow}>
        <div>
          <p className={styles.eyebrow}>Member Settings</p>
          <h1 className={styles.title}>Account Settings</h1>
        </div>
        <div className={styles.memberBadge}>
          <span className={styles.avatar}>{initials || "M"}</span>
          <span>{accountUser?.username || "Member"}</span>
        </div>
      </div>

      <section className={styles.statusGrid}>
        <Card as="div" className={styles.statCard} variant="custom">
          <span className={styles.statLabel}>Status</span>
          <strong className={styles.statusValue}>
            {accountUser?.status || "active"}
          </strong>
          <span className={styles.statHint}>{accountUser?.role || "member"}</span>
        </Card>
        <Card as="div" className={styles.statCard} variant="custom">
          <span className={styles.statLabel}>Member Since</span>
          <strong className={styles.statValue}>
            {formatDate(accountUser?.createdAt)}
          </strong>
          <span className={styles.statHint}>Local studio profile</span>
        </Card>
        <Card as="div" className={styles.statCard} variant="custom">
          <span className={styles.statLabel}>Check-ins</span>
          <strong className={styles.statValue}>
            {summary?.checkInsCount || 0}
          </strong>
          <span className={styles.statHint}>
            Last: {formatDate(summary?.lastCheckIn?.createdAt)}
          </span>
        </Card>
        <Card as="div" className={styles.statCard} variant="custom">
          <span className={styles.statLabel}>Total Spend</span>
          <strong className={styles.statValue}>
            {formatCurrency(summary?.totalSpent)}
          </strong>
          <span className={styles.statHint}>
            {summary?.salesCount || 0} purchases
          </span>
        </Card>
      </section>

      <SettingsSection
        accountUser={accountUser}
        onAccountSaved={handleAccountSaved}
        styles={styles}
      />
    </div>
  );
}

export default AccountSettingsPage;
