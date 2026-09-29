import { useState, useEffect } from "react";
import styles from "./AdminPage.module.css";
import MetricCard from "../../components/MetricCard";
import { dbGetAdminSummary } from "../../services/mockDbServices";
import { subscribeToCollections } from "../../services/collectionEvents";

/**
 * Renders the admin landing dashboard from locally persisted studio metrics.
 * The route-level AppLayout supplies authenticated chrome for this page.
 *
 * @returns {JSX.Element} The admin dashboard page.
 */
function AdminPage() {
  // Stores the dashboard summary loaded from the mock local data layer.
  const [adminSummary, setAdminSummary] = useState(null);
  const [error, setError] = useState(null);

  // Keep metrics current after local writes and updates from other tabs.
  useEffect(() => {
    function refreshSummary() {
      try {
        setAdminSummary(dbGetAdminSummary());
        setError(null);
      } catch (error) {
        console.error("Error fetching admin summary:", error);
        setError("Unable to load admin summary.");
      }
    }

    refreshSummary();
    const unsubscribe = subscribeToCollections(
      ["studio_users", "studio_sales", "studio_checkins", "studio_inventory"],
      refreshSummary
    );
    window.addEventListener("focus", refreshSummary);
    return () => {
      unsubscribe();
      window.removeEventListener("focus", refreshSummary);
    };
  }, []);

  /**
   * Formats stored ISO timestamps while preserving invalid values for diagnosis.
   *
   * @param {string} iso - Stored timestamp value.
   * @returns {string} Localized date/time text or the original invalid value.
   */
  function formatDateTime(iso) {
    if (!iso) return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString();
  }

  // Destructure with a fallback so the card render path tolerates null data.
  const {
    totalUsers,
    activeUsers,
    totalRevenue,
    totalCheckInsToday,
    salesCount,
    checkInsCount,
    newUsers7,
    salesLast24h,
    avgSaleAmount,
    topSpender,
    mostActiveMember,
    lowInventoryCount,
    lastSale,
    lastCheckin,
  } = adminSummary || {};

  if (error) {
    return (
      <div className={styles.page}>
        <h1 className={styles.title}>Admin Dashboard</h1>
        <p className={styles.error}>{error}</p>
      </div>
    );
  }

  if (!adminSummary) {
    return (
      <div className={styles.page}>
        <h1 className={styles.title}>Admin Dashboard</h1>
        <p className={styles.loading}>Loading summary…</p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Admin Dashboard</h1>

      {/* Group summary cards by the order admins scan the dashboard. */}
      <div className={styles.cardsGrid}>
        <MetricCard
          className={styles.card}
          title="Users"
          titleClassName={styles.cardTitle}
        >
          <p className={styles.cardValue}>{totalUsers}</p>
          <p className={styles.cardSub}>Active: {activeUsers}</p>
        </MetricCard>

        <MetricCard
          className={styles.card}
          title="Revenue"
          titleClassName={styles.cardTitle}
        >
          <p className={styles.cardValue}>
            ${Number(totalRevenue || 0).toFixed(2)}
          </p>
          <p className={styles.cardSub}>Total sales: {salesCount}</p>
        </MetricCard>

        <MetricCard
          className={styles.card}
          title="Check-ins"
          titleClassName={styles.cardTitle}
        >
          <p className={styles.cardValue}>{checkInsCount}</p>
          <p className={styles.cardSub}>Today: {totalCheckInsToday}</p>
        </MetricCard>

        <MetricCard
          className={styles.card}
          title="New Users (7 days)"
          titleClassName={styles.cardTitle}
        >
          <p className={styles.cardValue}>{newUsers7}</p>
        </MetricCard>

        <MetricCard
          className={styles.card}
          title="Sales (24h)"
          titleClassName={styles.cardTitle}
        >
          <p className={styles.cardValue}>
            ${Number(salesLast24h || 0).toFixed(2)}
          </p>
        </MetricCard>

        <MetricCard
          className={styles.card}
          title="Avg Sale"
          titleClassName={styles.cardTitle}
        >
          <p className={styles.cardValue}>
            ${Number(avgSaleAmount || 0).toFixed(2)}
          </p>
        </MetricCard>

        <MetricCard
          className={styles.card}
          title="Top Spender"
          titleClassName={styles.cardTitle}
        >
          {topSpender ? (
            <>
              <p className={styles.cardValue}>{topSpender.username}</p>
              <p className={styles.cardSub}>
                ${topSpender.total.toFixed(2)} total
              </p>
            </>
          ) : (
            <p className={styles.cardSub}>No sales yet.</p>
          )}
        </MetricCard>

        <MetricCard
          className={styles.card}
          title="Most Active Member"
          titleClassName={styles.cardTitle}
        >
          {mostActiveMember ? (
            <>
              <p className={styles.cardValue}>
                {mostActiveMember.username}
              </p>
              <p className={styles.cardSub}>
                {mostActiveMember.checkIns} check-ins
              </p>
            </>
          ) : (
            <p className={styles.cardSub}>No check-ins yet.</p>
          )}
        </MetricCard>

        <MetricCard
          className={styles.card}
          title="Low Inventory Items"
          titleClassName={styles.cardTitle}
        >
          <p className={styles.cardValue}>{lowInventoryCount}</p>
          <p className={styles.cardSub}>Quantity ≤ 5</p>
        </MetricCard>

        <MetricCard
          className={styles.cardWide}
          title="Last Sale"
          titleClassName={styles.cardTitle}
        >
          {lastSale ? (
            <>
              <p className={styles.cardSub}>
                Amount: ${Number(lastSale.amount || 0).toFixed(2)}
              </p>
              <p className={styles.cardSub}>
                When: {formatDateTime(lastSale.createdAt)}
              </p>
            </>
          ) : (
            <p className={styles.cardSub}>No sales recorded.</p>
          )}
        </MetricCard>

        <MetricCard
          className={styles.cardWide}
          title="Last Check-in"
          titleClassName={styles.cardTitle}
        >
          {lastCheckin ? (
            <p className={styles.cardSub}>
              When: {formatDateTime(lastCheckin.createdAt)}
            </p>
          ) : (
            <p className={styles.cardSub}>No check-ins yet.</p>
          )}
        </MetricCard>
      </div>

      <div className={styles.footerNote}>
        <p>
          All data is stored locally for demo purposes. Use Users, Sales,
          Inventory, and Check-ins pages to update these stats.
        </p>
      </div>
    </div>
  );
}

export default AdminPage;
