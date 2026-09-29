import EmptyState from "./EmptyState";
import { Link } from "react-router-dom";

/**
 * Formats notification timestamps for compact display in the header menu.
 *
 * @param {string} iso - ISO timestamp from a notification record.
 * @returns {string} Locale-formatted date/time text, or an empty string for missing dates.
 */
function formatNotificationTime(iso) {
  if (!iso) return "";

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/**
 * Renders the member notification dropdown and delegates all state changes.
 * EmptyState keeps the no-notifications branch aligned with other display surfaces.
 *
 * @param {{
 *   isOpen: boolean,
 *   latestNotifications: Array<object>,
 *   onLinkClick: (event: React.MouseEvent<HTMLAnchorElement>) => void,
 *   onMarkAllRead: () => void,
 *   onToggle: () => void,
 *   styles: CSSModuleClasses,
 *   unreadCount: number,
 * }} props - Notification menu state, data, callbacks, and style classes.
 * @returns {JSX.Element} The notification menu.
 */
function NotificationMenu({
  isOpen,
  latestNotifications,
  onLinkClick,
  onMarkAllRead,
  onToggle,
  styles,
  unreadCount,
}) {
  return (
    <div className={styles.notificationMenu}>
      <button
        aria-expanded={isOpen}
        className={styles.notificationButton}
        onClick={onToggle}
        type="button"
      >
        Notifications
        {unreadCount > 0 && (
          <span className={styles.notificationBadge}>{unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <div className={styles.notificationPanel}>
          <div className={styles.notificationHeader}>
            <strong>Member updates</strong>
            <button
              disabled={unreadCount === 0}
              onClick={onMarkAllRead}
              type="button"
            >
              Mark read
            </button>
          </div>

          <div className={styles.notificationList}>
            {latestNotifications.length === 0 ? (
              <EmptyState as="p" className={styles.emptyNotifications}>
                No notifications yet.
              </EmptyState>
            ) : (
              latestNotifications.map((notification) => (
                <Link
                  className={`${styles.notificationItem} ${
                    notification.read ? styles.notificationRead : ""
                  }`}
                  data-notification-id={notification.id}
                  key={notification.id}
                  onClick={onLinkClick}
                  to={notification.link || "/member"}
                >
                  <span>{notification.title}</span>
                  <p>{notification.message}</p>
                  <small>
                    {formatNotificationTime(notification.createdAt)}
                  </small>
                </Link>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationMenu;
