import { useCallback, useEffect, useState } from "react";
import BookingHistoryItem from "../../components/BookingHistoryItem";
import BookingList from "../../components/BookingList";
import BookingRequestPanel from "../../components/BookingRequestPanel";
import EmptyState from "../../components/EmptyState";
import KeyValueRow from "../../components/KeyValueRow";
import PageShell from "../../components/PageShell";
import SectionPanel from "../../components/SectionPanel";
import StatTile from "../../components/StatTile";
import { useAuth } from "../../contexts/AuthContext";
import {
  dbGetBookingDropoffWindows,
  dbGetBookingScheduleByUser,
  dbGetBookingServices,
} from "../../services/mockDbServices";
import { subscribeToCollections } from "../../services/collectionEvents";
import styles from "./BookingsPage.module.css";

/**
 * Formats booking date strings without shifting the displayed day across timezones.
 * @param {string | null | undefined} dateValue ISO-style date string.
 * @returns {string} Member-facing date text.
 */
function formatDate(dateValue) {
  if (!dateValue) return "Date pending";

  const date = new Date(`${dateValue}T12:00:00`);
  if (Number.isNaN(date.getTime())) return dateValue;
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Formats a 24-hour time string for appointment cards.
 * @param {string | null | undefined} timeValue HH:mm time string.
 * @returns {string} Member-facing time text.
 */
function formatTime(timeValue) {
  if (!timeValue) return "Time pending";

  const [hour, minute] = timeValue.split(":");
  const date = new Date();
  date.setHours(Number(hour), Number(minute), 0, 0);

  return date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

/**
 * Chooses the booking status badge style for known workflow states.
 * @param {string | null | undefined} status Booking status.
 * @returns {string} CSS class list for the status badge.
 */
function getStatusClass(status) {
  const normalizedStatus = String(status || "").toLowerCase();

  if (normalizedStatus === "confirmed")
    return `${styles.statusBadge} ${styles.confirmed}`;
  if (normalizedStatus === "requested")
    return `${styles.statusBadge} ${styles.requested}`;
  if (normalizedStatus === "completed")
    return `${styles.statusBadge} ${styles.completed}`;
  return `${styles.statusBadge} ${styles.canceled}`;
}

/**
 * Renders the member booking center and request workflow.
 * The route-level AppLayout supplies authenticated chrome for this page.
 * This page owns member booking data while BookingList and BookingHistoryItem own repeated cards.
 * Shared display primitives now cover the page shell, summary stats, panels, and detail rows.
 *
 * @returns {import("react").JSX.Element}
 */
function BookingsPage() {
  // Hook: active member identity scopes booking data reads and requests.
  const { user } = useAuth();
  const userId = user?.id;
  // State: selectable services shown in the booking request panel.
  const [serviceOptions, setServiceOptions] = useState([]);
  // State: drop-off windows available to the member booking workflow.
  const [dropoffOptions, setDropoffOptions] = useState([]);
  // State: active upcoming bookings for the signed-in member.
  const [bookings, setBookings] = useState([]);
  // State: completed or canceled visits shown in booking history.
  const [bookingHistory, setBookingHistory] = useState([]);
  // State: service preselection shared with the request panel.
  const [selectedServiceId, setSelectedServiceId] = useState("");

  /**
   * Reads both active appointments and past visits from one collection snapshot.
   * @returns {void}
   */
  const refreshBookings = useCallback(() => {
    const schedule = userId
      ? dbGetBookingScheduleByUser(userId)
      : { upcomingBookings: [], historyBookings: [] };
    setBookings(schedule.upcomingBookings);
    setBookingHistory(schedule.historyBookings);
  }, [userId]);

  // Booking options are loaded once; invalid saved selections are cleared.
  useEffect(() => {
    const services = dbGetBookingServices();
    const dropoffs = dbGetBookingDropoffWindows();
    setServiceOptions(services);
    setDropoffOptions(dropoffs);
    setSelectedServiceId((currentServiceId) =>
      services.some((service) => service.id === currentServiceId)
        ? currentServiceId
        : ""
    );
  }, []);

  // Keep requests and staff changes current in this tab and other open tabs.
  useEffect(() => {
    refreshBookings();
    return subscribeToCollections(["studio_bookings"], refreshBookings);
  }, [refreshBookings]);

  const selectedService =
    serviceOptions.find((service) => service.id === selectedServiceId) || null;
  const nextBooking = bookings[0];
  const requestedCount = bookings.filter(
    (booking) => String(booking.status).toLowerCase() === "requested"
  ).length;

  // Callback: stable service selector for panel button and form events.
  /**
   * Toggles the selected booking service from either a select event or an id.
   * @param {Event | string | null | undefined} nextServiceId Selected service event or id.
   * @returns {void}
   */
  const handleServiceChange = useCallback((nextServiceId) => {
    const serviceId = nextServiceId?.target?.value ?? nextServiceId ?? "";
    setSelectedServiceId((currentServiceId) =>
      currentServiceId === serviceId ? "" : serviceId
    );
  }, []);

  return (
    <PageShell className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Member bookings</p>
          <h1 className={styles.title}>My Bookings</h1>
        </div>

        <div className={styles.summaryGrid}>
          <StatTile
            className={styles.summaryTile}
            label="Upcoming"
            value={bookings.length}
          />
          <StatTile
            className={styles.summaryTile}
            label="Requested"
            value={requestedCount}
          />
          <StatTile
            className={styles.summaryTile}
            label="Selected"
            value={selectedService ? `$${selectedService.price}` : "--"}
          />
        </div>
      </header>

      <div className={styles.contentGrid}>
        <main className={styles.mainColumn}>
          <SectionPanel className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <h2>Upcoming bookings</h2>
                <p>
                  {nextBooking
                    ? `${formatDate(nextBooking.date)} at ${formatTime(
                        nextBooking.time
                      )}`
                    : "No active appointments"}
                </p>
              </div>
              <span className={styles.countPill}>{bookings.length} total</span>
            </div>

            <BookingList
              bookings={bookings}
              formatDate={formatDate}
              formatTime={formatTime}
              getStatusClass={getStatusClass}
              styles={styles}
            />
          </SectionPanel>

          <BookingRequestPanel
            userId={userId}
            serviceOptions={serviceOptions}
            dropoffOptions={dropoffOptions}
            selectedServiceId={selectedServiceId}
            onServiceChange={handleServiceChange}
            styles={styles}
          />
        </main>

        <aside className={styles.sideColumn}>
          <SectionPanel className={`${styles.panel} ${styles.statusPanel}`}>
            <div className={styles.panelHeader}>
              <div>
                <h2>Status board</h2>
                <p>Studio queue and member preferences</p>
              </div>
            </div>

            <div className={styles.statusList}>
              <KeyValueRow
                className={styles.statusItem}
                label="Next arrival"
                value={
                  nextBooking
                    ? `${formatDate(nextBooking.date)}, ${formatTime(
                        nextBooking.time
                      )}`
                    : "Open"
                }
              />
              <KeyValueRow
                className={styles.statusItem}
                label="Request queue"
                value={`${requestedCount} pending`}
              />
              <KeyValueRow
                className={styles.statusItem}
                label="Preferred vehicle"
                value={
                  nextBooking
                    ? nextBooking.vehicle || "Vehicle pending"
                    : "Not set"
                }
              />
              <KeyValueRow
                className={styles.statusItem}
                label="Member perk"
                value="10% refill credit"
              />
            </div>
          </SectionPanel>

          <SectionPanel className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <h2>History</h2>
                <p>Recent completed and canceled visits</p>
              </div>
            </div>

            <div className={styles.historyList}>
              {bookingHistory.length === 0 ? (
                <EmptyState
                  className={styles.emptyState}
                  message="Completed and canceled appointments will collect here."
                  title="No booking history"
                />
              ) : (
                bookingHistory.map((item) => (
                  <BookingHistoryItem
                    formatDate={formatDate}
                    getStatusClass={getStatusClass}
                    item={item}
                    key={item.id}
                    styles={styles}
                  />
                ))
              )}
            </div>
          </SectionPanel>
        </aside>
      </div>
    </PageShell>
  );
}

export default BookingsPage;
