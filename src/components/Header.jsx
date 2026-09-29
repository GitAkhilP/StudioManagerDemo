import Button from "./Button";
import { subscribeToCollections } from "../services/collectionEvents.js";
import NotificationMenu from "./NotificationMenu";
import { useAuth } from "../contexts/AuthContext";
import styles from "./Header.module.css";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  dbGetNotificationsByUser,
  dbMarkAllNotificationsRead,
  dbMarkNotificationRead,
} from "../services/mockDbServices";

/**
 * Renders the app header with logout and member notification controls.
 * Header owns notification state and storage subscriptions, while NotificationMenu owns the
 * dropdown markup and delegates read/toggle actions back through named callbacks.
 *
 * @returns {JSX.Element} The application header.
 */
function Header() {
  const { logout, user } = useAuth();
  // Cache the member notification list for badge counts and menu contents.
  const [notifications, setNotifications] = useState([]);
  // Own the dropdown visibility for the header notification menu.
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const showNotifications = user?.role === "member";

  // Keep refresh identity stable so effects can subscribe without repeatedly re-registering.
  /**
   * Reloads member notifications from the mock DB or clears them for non-member users.
   *
   * @returns {void}
   */
  const refreshNotifications = useCallback(() => {
    if (!showNotifications || !user?.id) {
      setNotifications([]);
      return;
    }

    setNotifications(dbGetNotificationsByUser(user.id));
  }, [showNotifications, user?.id]);

  // Refresh when the authenticated member changes.
  useEffect(() => {
    refreshNotifications();
  }, [refreshNotifications]);

  useEffect(() => subscribeToCollections(
    ["studio_notifications"], refreshNotifications
  ), [refreshNotifications]);

  // Memoize unread counting because it is derived from the cached notification list.
  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.read).length,
    [notifications]
  );
  const latestNotifications = notifications.slice(0, 5);

  /**
   * Opens or closes the member notification menu.
   *
   * @returns {void}
   */
  function handleNotificationToggle() {
    setIsNotificationsOpen((currentValue) => !currentValue);
  }

  /**
   * Marks a clicked notification read before navigating away through its link.
   *
   * @param {string} notificationId - Notification id to mark read.
   * @returns {void}
   */
  function handleNotificationClick(notificationId) {
    dbMarkNotificationRead(notificationId, user?.id);
    setIsNotificationsOpen(false);
  }

  /**
   * Marks the notification represented by a clicked menu link as read.
   *
   * @param {React.MouseEvent<HTMLAnchorElement>} event - Notification link click event.
   * @returns {void}
   */
  function handleNotificationLinkClick(event) {
    handleNotificationClick(event.currentTarget.dataset.notificationId);
  }

  /**
   * Marks all current member notifications as read and refreshes the badge count.
   *
   * @returns {void}
   */
  function handleMarkAllRead() {
    dbMarkAllNotificationsRead(user?.id);
  }

  return (
    <>
      <div className={styles.container}>
        {showNotifications && (
          <NotificationMenu
            isOpen={isNotificationsOpen}
            latestNotifications={latestNotifications}
            onLinkClick={handleNotificationLinkClick}
            onMarkAllRead={handleMarkAllRead}
            onToggle={handleNotificationToggle}
            styles={styles}
            unreadCount={unreadCount}
          />
        )}
        <div className={styles.button}>
          <Button
            text="Logout"
            variant="primary"
            onClick={logout}
            transform="shift-left"
          />
        </div>
      </div>
    </>
  );
}

export default Header;
