import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import Card from "../../components/Card";
import EmployeeTimeClock from "../../components/EmployeeTimeClock";
import {
  dbGetBookingsForAdmin,
  dbGetInventory,
  dbGetSupportRequests,
} from "../../services/mockDbServices";
import { subscribeToCollections } from "../../services/collectionEvents";
import styles from "./EmployeeDashboard.module.css";

/**
 * Return today's date in the same YYYY-MM-DD format used by booking records.
 *
 * @returns {string} Local date key.
 */
function getTodayKey() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Renders the basic employee dashboard with only the employee time clock.
 *
 * @param {{ displayName: string, userId?: string }} props Dashboard props.
 * @returns {import("react").JSX.Element} Basic employee dashboard.
 */
function BasicEmployeeDashboard({ displayName, userId }) {
  return (
    <main className={styles.basicPage}>
      <section className={styles.basicHero}>
        <p className={styles.kicker}>Employee dashboard</p>
        <h1>Welcome back, {displayName}</h1>
      </section>

      <EmployeeTimeClock compact userId={userId} />
    </main>
  );
}

/**
 * Renders the supervisor employee dashboard with front-desk snapshots and time clock.
 *
 * @param {{ displayName: string, userId?: string }} props Dashboard props.
 * @returns {import("react").JSX.Element} Supervisor dashboard.
 */
function SupervisorDashboard({ displayName, userId }) {
  const [bookings, setBookings] = useState([]);
  const [supportRequests, setSupportRequests] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [todayKey, setTodayKey] = useState(getTodayKey);

  useEffect(() => {
    function refreshCollections(event) {
      const key = event?.detail?.key ?? event?.key;
      if (!key || key === "studio_bookings" || key === "studio_users") {
        setBookings(dbGetBookingsForAdmin());
      }
      if (!key || key === "studio_support_requests") {
        setSupportRequests(dbGetSupportRequests());
      }
      if (!key || key === "studio_inventory") setInventory(dbGetInventory());
    }

    refreshCollections();
    return subscribeToCollections(
      ["studio_bookings", "studio_users", "studio_support_requests", "studio_inventory"],
      refreshCollections
    );
  }, []);

  useEffect(() => {
    let timeoutId;
    function refreshDate() {
      window.clearTimeout(timeoutId);
      setTodayKey(getTodayKey());
      if (document.visibilityState === "hidden") return;

      const now = new Date();
      const nextMidnight = new Date(now);
      nextMidnight.setHours(24, 0, 0, 0);
      timeoutId = window.setTimeout(
        refreshDate,
        Math.max(1, nextMidnight.getTime() - now.getTime())
      );
    }

    refreshDate();
    window.addEventListener("focus", refreshDate);
    document.addEventListener("visibilitychange", refreshDate);
    return () => {
      window.clearTimeout(timeoutId);
      window.removeEventListener("focus", refreshDate);
      document.removeEventListener("visibilitychange", refreshDate);
    };
  }, []);

  const overview = useMemo(() => {
    const lowInventory = inventory.filter(
      (item) => Number(item.quantity || 0) <= 5
    );

    return {
      requestedBookings: bookings.filter(
        (booking) =>
          String(booking.status || "").toLowerCase() === "requested"
      ).length,
      todayBookings: bookings.filter((booking) => booking.date === todayKey),
      openSupport: supportRequests.filter(
        (request) =>
          !["solved", "closed"].includes(
            String(request.status || "").toLowerCase()
          )
      ).length,
      lowInventory,
    };
  }, [bookings, inventory, supportRequests, todayKey]);

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div>
          <p className={styles.kicker}>Supervisor employee</p>
          <h1>Front desk dashboard</h1>
          <p className={styles.subtitle}>
            {displayName}, clock your shift and scan the studio queue.
          </p>
        </div>
        <span className={styles.roleBadge}>Supervisor</span>
      </section>

      <div className={styles.dashboardGrid}>
        <EmployeeTimeClock userId={userId} />

        <section className={styles.statsGrid} aria-label="Front desk summary">
          <Card className={styles.statCard} variant="custom">
            <span className={styles.statLabel}>Requested bookings</span>
            <strong>{overview.requestedBookings}</strong>
          </Card>
          <Card className={styles.statCard} variant="custom">
            <span className={styles.statLabel}>Today schedule</span>
            <strong>{overview.todayBookings.length}</strong>
          </Card>
          <Card className={styles.statCard} variant="custom">
            <span className={styles.statLabel}>Open support</span>
            <strong>{overview.openSupport}</strong>
          </Card>
          <Card className={styles.statCard} variant="custom">
            <span className={styles.statLabel}>Low inventory</span>
            <strong>{overview.lowInventory.length}</strong>
          </Card>
        </section>
      </div>

      <div className={styles.listGrid}>
        <Card className={styles.panel} variant="custom">
          <div className={styles.panelHeader}>
            <p className={styles.kicker}>Today</p>
            <h2>Scheduled details</h2>
          </div>
          <div className={styles.list}>
            {overview.todayBookings.slice(0, 4).map((booking) => (
              <article className={styles.listItem} key={booking.id}>
                <div>
                  <strong>{booking.memberName}</strong>
                  <span>{booking.serviceName || "Detail service"}</span>
                </div>
                <span>{booking.time || "Time pending"}</span>
              </article>
            ))}
            {overview.todayBookings.length === 0 && (
              <p className={styles.empty}>No bookings scheduled today.</p>
            )}
          </div>
        </Card>

        <Card className={styles.panel} variant="custom">
          <div className={styles.panelHeader}>
            <p className={styles.kicker}>Inventory</p>
            <h2>Low stock watch</h2>
          </div>
          <div className={styles.list}>
            {overview.lowInventory.slice(0, 4).map((item) => (
              <article className={styles.listItem} key={item.id}>
                <div>
                  <strong>{item.name}</strong>
                  <span>{item.description || "Studio supply"}</span>
                </div>
                <span>{Number(item.quantity || 0)} left</span>
              </article>
            ))}
            {overview.lowInventory.length === 0 && (
              <p className={styles.empty}>No low inventory items.</p>
            )}
          </div>
        </Card>
      </div>
    </main>
  );
}

/**
 * Routes employee users to a supervisor or basic dashboard by employee subtype.
 *
 * @returns {import("react").JSX.Element} Employee dashboard.
 */
function EmployeeDashboard() {
  const { user } = useAuth();
  const displayName = user?.username || "Employee";
  const userId = user?.id;

  if (user?.employeeType === "supervisor") {
    return <SupervisorDashboard displayName={displayName} userId={userId} />;
  }

  return <BasicEmployeeDashboard displayName={displayName} userId={userId} />;
}

export default EmployeeDashboard;
