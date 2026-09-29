import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import Card from "../../components/Card";
import {
  dbGetMemberQuickActions,
  dbGetShopProducts,
  dbGetUpcomingBookingsByUser,
  dbGetUserSummary,
} from "../../services/mockDbServices";
import { subscribeToCollections } from "../../services/collectionEvents";
import styles from "./MemberPage.module.css";

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

const shortDate = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

const shortDateTime = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

const monthOnly = new Intl.DateTimeFormat("en-US", {
  month: "short",
});

const timeOnly = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
});

/**
 * Formats a stored date value for account summary tiles.
 * @param {string | number | Date | null | undefined} value Date-like value.
 * @returns {string} Member-facing date text or a fallback.
 */
function formatDate(value) {
  if (!value) return "Not recorded";

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Not recorded" : shortDate.format(date);
}

/**
 * Formats a stored timestamp for recent member activity.
 * @param {string | number | Date | null | undefined} value Date-like value.
 * @returns {string} Member-facing date and time text or a fallback.
 */
function formatDateTime(value) {
  if (!value) return "No recent activity";

  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "No recent activity"
    : shortDateTime.format(date);
}

/**
 * Builds a local Date from separate booking date and time fields.
 * @param {{ date?: string, time?: string } | null | undefined} booking Booking record.
 * @returns {Date | null} Parsed booking date or null when incomplete.
 */
function getBookingDate(booking) {
  const [year, month, day] = String(booking?.date || "")
    .split("-")
    .map(Number);
  const [hour = 0, minute = 0] = String(booking?.time || "00:00")
    .split(":")
    .map(Number);

  if (!year || !month || !day) return null;

  const date = new Date(year, month - 1, day, hour || 0, minute || 0);
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * Returns a concise appointment time label for dashboard cards.
 * @param {{ date?: string, time?: string } | null | undefined} booking Booking record.
 * @returns {string} Formatted time or pending-state copy.
 */
function getBookingTimeLabel(booking) {
  const date = getBookingDate(booking);
  return date ? timeOnly.format(date) : "Time pending";
}

/**
 * Renders the member dashboard overview with account, booking, activity, and shop snapshots.
 * The route-level AppLayout supplies authenticated chrome for this page.
 *
 * @returns {import("react").JSX.Element}
 */
function MemberPage() {
  // Hook: active member identity scopes dashboard data reads.
  const { user } = useAuth();
  const userId = user?.id;
  const [shopHighlights, setShopHighlights] = useState([]);
  const [quickActions, setQuickActions] = useState([]);
  const [accountSnapshot, setAccountSnapshot] = useState({ userId: null, summary: null });
  const [bookingSnapshot, setBookingSnapshot] = useState({ userId: null, bookings: [] });

  const refreshAccount = useCallback(() => {
    setAccountSnapshot({
      userId,
      summary: userId ? dbGetUserSummary(userId) : null,
    });
  }, [userId]);

  const refreshBookings = useCallback(() => {
    setBookingSnapshot({
      userId,
      bookings: userId ? dbGetUpcomingBookingsByUser(userId) : [],
    });
  }, [userId]);

  useEffect(() => {
    refreshAccount();
    return subscribeToCollections(
      ["studio_users", "studio_sales", "studio_checkins"],
      refreshAccount
    );
  }, [refreshAccount]);

  useEffect(() => {
    refreshBookings();
    const unsubscribe = subscribeToCollections(["studio_bookings"], refreshBookings);
    // Reapply the upcoming/history boundary when returning to the dashboard.
    window.addEventListener("focus", refreshBookings);
    return () => {
      unsubscribe();
      window.removeEventListener("focus", refreshBookings);
    };
  }, [refreshBookings]);

  // Callback: stable loader used by mount and inventory-change listeners.
  /**
   * Loads the first in-stock shop items shown on the dashboard.
   * @returns {void}
   */
  const refreshShopHighlights = useCallback(() => {
    setShopHighlights(
      dbGetShopProducts()
        .filter((item) => Number(item.quantity) > 0)
        .slice(0, 3)
    );
  }, []);

  // Subscribe each snapshot only to its source collections.
  useEffect(() => {
    refreshShopHighlights();
    return subscribeToCollections(["studio_inventory"], refreshShopHighlights);
  }, [refreshShopHighlights]);

  useEffect(() => {
    function refreshQuickActions() {
      setQuickActions(dbGetMemberQuickActions());
    }
    refreshQuickActions();
    return subscribeToCollections(["studio_member_quick_actions"], refreshQuickActions);
  }, []);

  const summary = accountSnapshot.userId === userId ? accountSnapshot.summary : null;
  const upcomingBookings = bookingSnapshot.userId === userId ? bookingSnapshot.bookings : [];

  const account = summary?.user || user || {};
  const displayName = account.username || "Member";
  const memberSince = formatDate(account.createdAt);
  const totalSpent = summary?.totalSpent || 0;
  const serviceVisits = summary?.checkInsCount || 0;
  const purchases = summary?.salesCount || 0;
  const lastCheckIn = formatDateTime(summary?.lastCheckIn?.createdAt);
  const lastPurchase = summary?.lastPurchase;
  const averagePurchase = purchases > 0 ? totalSpent / purchases : 0;

  return (
    <div className={styles.page}>
        <section className={styles.hero}>
          <div>
            <p className={styles.kicker}>Member Dashboard</p>
            <h1 className={styles.title}>Welcome back, {displayName}</h1>
            <p className={styles.subtitle}>
              Your next detail, recent visits, and studio account activity are
              ready at a glance.
            </p>
          </div>

          <div className={styles.profileBadge} aria-label="Account summary">
            <span className={styles.avatar}>{displayName.charAt(0)}</span>
            <div>
              <span className={styles.badgeLabel}>Account</span>
              <strong>{account.status || "active"}</strong>
            </div>
          </div>
        </section>

        <section className={styles.snapshotGrid} aria-label="Account snapshot">
          <Card as="article" className={styles.card} variant="custom">
            <span className={styles.cardLabel}>Member since</span>
            <strong className={styles.cardValue}>{memberSince}</strong>
            <span className={styles.cardMeta}>{account.email}</span>
          </Card>

          <Card as="article" className={styles.card} variant="custom">
            <span className={styles.cardLabel}>Lifetime spend</span>
            <strong className={styles.cardValue}>
              {currency.format(totalSpent)}
            </strong>
            <span className={styles.cardMeta}>{purchases} purchases</span>
          </Card>

          <Card as="article" className={styles.card} variant="custom">
            <span className={styles.cardLabel}>Studio visits</span>
            <strong className={styles.cardValue}>{serviceVisits}</strong>
            <span className={styles.cardMeta}>Last check-in: {lastCheckIn}</span>
          </Card>
        </section>

        <div className={styles.contentGrid}>
          <Card className={styles.panel} variant="custom">
            <div className={styles.sectionHeader}>
              <div>
                <p className={styles.kicker}>Schedule</p>
                <h2>Upcoming bookings</h2>
              </div>
              <Link className={styles.textLink} to="/member/bookings">
                View all
              </Link>
            </div>

            <div className={styles.bookingList}>
              {upcomingBookings.length > 0 ? (
                upcomingBookings.map((booking) => {
                  const bookingDate = getBookingDate(booking);
                  return (
                    <article className={styles.bookingCard} key={booking.id}>
                      <div className={styles.dateTile}>
                        <span>
                          {bookingDate ? monthOnly.format(bookingDate) : "TBD"}
                        </span>
                        <strong>
                          {bookingDate ? bookingDate.getDate() : "--"}
                        </strong>
                      </div>

                      <div className={styles.bookingInfo}>
                        <h3>{booking.serviceName || "Detail service"}</h3>
                        <p>
                          {getBookingTimeLabel(booking)} -{" "}
                          {booking.bay || "Bay pending"}
                        </p>
                        {booking.vehicle && <p>{booking.vehicle}</p>}
                      </div>

                      <span className={styles.statusPill}>
                        {booking.status || "Requested"}
                      </span>
                    </article>
                  );
                })
              ) : (
                <div className={styles.emptyState}>
                  <strong>No upcoming bookings</strong>
                  <span>Reserve a detail slot when your car is ready.</span>
                </div>
              )}
            </div>
          </Card>

          <Card className={styles.panel} variant="custom">
            <div className={styles.sectionHeader}>
              <div>
                <p className={styles.kicker}>Activity</p>
                <h2>Recent totals</h2>
              </div>
            </div>

            <div className={styles.metricList}>
              <div className={styles.metricRow}>
                <span>Last purchase</span>
                <strong>
                  {lastPurchase
                    ? currency.format(lastPurchase.amount)
                    : "No purchases"}
                </strong>
              </div>
              <div className={styles.metricRow}>
                <span>Average ticket</span>
                <strong>{currency.format(averagePurchase)}</strong>
              </div>
              <div className={styles.metricRow}>
                <span>Last activity</span>
                <strong>{formatDateTime(lastPurchase?.createdAt)}</strong>
              </div>
            </div>
          </Card>
        </div>

        <div className={styles.lowerGrid}>
          <Card className={styles.panel} variant="custom">
            <div className={styles.sectionHeader}>
              <div>
                <p className={styles.kicker}>Quick actions</p>
                <h2>Keep your car dialed in</h2>
              </div>
            </div>

            <div className={styles.actionsGrid}>
              {quickActions.map((action) => (
                <Link className={styles.actionButton} key={action.to} to={action.to}>
                  <span className={styles.actionGlyph}>{action.glyph}</span>
                  <span>{action.label}</span>
                </Link>
              ))}
            </div>
          </Card>

          <Card className={styles.panel} variant="custom">
            <div className={styles.sectionHeader}>
              <div>
                <p className={styles.kicker}>Shop</p>
                <h2>Popular supplies</h2>
              </div>
              <Link className={styles.textLink} to="/member/shop">
                Browse
              </Link>
            </div>

            <div className={styles.shopList}>
              {shopHighlights.length > 0 ? (
                shopHighlights.map((item) => (
                  <div className={styles.shopItem} key={item.id}>
                    <span>{item.name}</span>
                    <strong>{currency.format(item.price || 0)}</strong>
                  </div>
                ))
              ) : (
                <div className={styles.emptyState}>
                  <strong>No products available</strong>
                  <span>Check back after the studio restocks member items.</span>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
  );
}

export default MemberPage;
