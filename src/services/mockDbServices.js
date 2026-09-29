import { MOCK_DATA } from "./mockData.js";
import { publishCollectionChange as emitCollectionChange } from "./collectionEvents.js";
import { validateUserIdentity } from "./userIdentity.js";
import { summarizeTimeClockEntries } from "./timeClockSummary.js";

/**
 * Lightweight mock data services using browser `localStorage`.
 *
 * This file centralizes storage keys and small helpers used by the app
 * to persist collections (arrays) as JSON strings in `localStorage`.
 *
 * Design notes:
 * - Collections are always read/written as arrays. Callers should expect
 *   an array result (never `null` or non-array values).
 * - JSON parse errors and other storage issues are swallowed and result
 *   in an empty array to keep UI code simple and resilient.
 * - Use the constants below when reading/writing so key names stay consistent.
 */

// localStorage keys grouped by feature-owned collection.
const USERS_KEY = "studio_users";
const USER_PRUNE_MIGRATION_KEY = "studio_users_pruned_employee_seed";
const MEMBER_ACTIVITY_MIGRATION_KEY = "studio_member_seed_activity_migrated";
const EMPLOYEE_IDENTITY_MIGRATION_KEY = "studio_employee_seed_identity_v2";
const SALES_KEY = "studio_sales";
const CHECKINS_KEY = "studio_checkins";
const TIME_CLOCK_KEY = "studio_time_clock_entries";
const INVENTORY_KEY = "studio_inventory";
const BOOKINGS_KEY = "studio_bookings";
const BOOKING_SERVICES_KEY = "studio_booking_services";
const BOOKING_DROPOFF_WINDOWS_KEY = "studio_booking_dropoff_windows";
const SUPPORT_REQUESTS_KEY = "studio_support_requests";
const SUPPORT_CHANNELS_KEY = "studio_support_channels";
const SUPPORT_STATUS_KEY = "studio_support_status";
const SUPPORT_FAQS_KEY = "studio_support_faqs";
const SUPPORT_CATEGORIES_KEY = "studio_support_categories";
const SUPPORT_CONTACT_METHODS_KEY = "studio_support_contact_methods";
const SUPPORT_PRIORITIES_KEY = "studio_support_priorities";
const SHOP_PRODUCTS_KEY = "studio_shop_products";
const SHOP_SERVICE_PACKAGES_KEY = "studio_shop_service_packages";
const MEMBER_QUICK_ACTIONS_KEY = "studio_member_quick_actions";
const NOTIFICATIONS_KEY = "studio_notifications";
const MEMBER_ACTIVITY_KEYS = [SALES_KEY, CHECKINS_KEY, BOOKINGS_KEY, SUPPORT_REQUESTS_KEY];

/**
 * Read a JSON array collection from localStorage.
 *
 * @param {string} key One of the `*_KEY` storage constants.
 * @returns {Array<Object>} Stored collection, or an empty array for missing or invalid data.
 */
function readCollections(key) {
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    // Guarantee we return an array type to make consumer code simpler.
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Read a collection and seed it only when its storage key has never been written.
 *
 * @param {string} key One of the `*_KEY` storage constants.
 * @param {Array<Object>} seedItems Default records for first-load persistence.
 * @returns {Array<Object>} Existing collection or the newly persisted seed records.
 */
function readSeededCollections(key, seedItems) {
  const items = readCollections(key);

  // Preserve intentionally emptied collections; seed only when the key is absent.
  if (items.length === 0 && !localStorage.getItem(key)) {
    writeToCollections(key, seedItems);
    return seedItems;
  }

  return items;
}

/**
 * Persist a full collection array and broadcast that it changed.
 *
 * @param {string} key One of the `*_KEY` storage constants.
 * @param {Array<Object>} info Collection records to serialize.
 */
function writeToCollections(key, info) {
  localStorage.setItem(key, JSON.stringify(info));
  emitCollectionChange(key);
}

/**
 * Return records sorted newest first without mutating the source array.
 *
 * @param {Array<Object>} items Records with optional `createdAt` timestamps.
 * @returns {Array<Object>} Copy sorted by descending creation time.
 */
function sortByCreatedAtDesc(items) {
  return items.slice().sort((a, b) => {
    const aTime = new Date(a?.createdAt || 0).getTime() || 0;
    const bTime = new Date(b?.createdAt || 0).getTime() || 0;
    return bTime - aTime;
  });
}

/**
 * Create a record ID, preferring the browser UUID API when it is available.
 *
 * @returns {string} Storage-safe unique identifier.
 */
function generateID() {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    try {
      return globalThis.crypto.randomUUID();
    } catch {
      // Fall through to a non-crypto fallback if the runtime blocks UUIDs.
    }
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/**
 * Get the current timestamp in the format used by persisted records.
 *
 * @returns {string} Current date/time in ISO format.
 */
function nowISO() {
  return new Date().toISOString();
}

/**
 * Read a check-in user ID across current and legacy field names.
 *
 * @param {Object} checkIn Check-in record.
 * @returns {string|undefined} User ID when present.
 */
function getCheckInUserId(checkIn) {
  return checkIn?.userId ?? checkIn?.userID;
}

/**
 * Read a check-in timestamp across current and legacy field names.
 *
 * @param {Object} checkIn Check-in record.
 * @returns {string|undefined} Creation timestamp when present.
 */
function getCheckInCreatedAt(checkIn) {
  return checkIn?.createdAt ?? checkIn?.timeStamp;
}

/**
 * Convert a check-in timestamp into comparable epoch milliseconds.
 *
 * @param {Object} checkIn Check-in record.
 * @returns {number|null} Epoch milliseconds, or null when the record is not dated.
 */
function getCheckInTime(checkIn) {
  const createdAt = getCheckInCreatedAt(checkIn);
  if (!createdAt) return null;

  const time = new Date(createdAt).getTime();
  return Number.isNaN(time) ? null : time;
}

/**
 * Convert legacy check-in keys to the current `userId` and `createdAt` shape.
 *
 * @param {Object} checkIn Check-in record to normalize.
 * @returns {Object} Normalized check-in record.
 */
function normalizeCheckIn(checkIn) {
  if (!checkIn || typeof checkIn !== "object") return checkIn;

  const userId = getCheckInUserId(checkIn);
  const createdAt = getCheckInCreatedAt(checkIn);
  const normalized = { ...checkIn };

  delete normalized.userID;
  delete normalized.timeStamp;

  if (userId != null) normalized.userId = userId;
  if (createdAt != null) normalized.createdAt = createdAt;

  return normalized;
}

/**
 * Find the newest valid check-in by timestamp.
 *
 * @param {Array<Object>} checkIns Check-in records to scan.
 * @returns {Object|null} Latest dated check-in, or null when none are dated.
 */
function getLatestCheckIn(checkIns) {
  return checkIns.reduce((latest, checkIn) => {
    const time = getCheckInTime(checkIn);
    if (time === null) return latest;

    const latestTime = getCheckInTime(latest);
    return latestTime === null || time > latestTime ? checkIn : latest;
  }, null);
}

/**
 * Read a time-clock session clock-in timestamp.
 *
 * @param {Object} entry Time-clock session.
 * @returns {string|undefined} Clock-in timestamp when present.
 */
function getTimeEntryClockInAt(entry) {
  return entry?.clockInAt ?? entry?.createdAt;
}

/**
 * Read a time-clock session clock-out timestamp.
 *
 * @param {Object} entry Time-clock session.
 * @returns {string|undefined} Clock-out timestamp when present.
 */
function getTimeEntryClockOutAt(entry) {
  return entry?.clockOutAt;
}

/**
 * Normalize a stored time-clock entry to the current field names.
 *
 * @param {Object} entry Time-clock session.
 * @returns {Object} Normalized time-clock session.
 */
function normalizeTimeEntry(entry) {
  if (!entry || typeof entry !== "object") return entry;

  const normalized = { ...entry };
  const clockInAt = getTimeEntryClockInAt(entry);

  delete normalized.createdAt;

  if (clockInAt != null) normalized.clockInAt = clockInAt;
  return normalized;
}

/**
 * Convert a time-clock timestamp into comparable epoch milliseconds.
 *
 * @param {string|undefined} value Timestamp to parse.
 * @returns {number|null} Epoch milliseconds, or null when invalid.
 */
function getTimeEntryTimestamp(value) {
  if (!value) return null;

  const time = new Date(value).getTime();
  return Number.isNaN(time) ? null : time;
}

/**
 * Return a session duration in milliseconds, using now for active sessions.
 *
 * @param {Object} entry Time-clock session.
 * @param {number} [nowMs=Date.now()] Current timestamp for open sessions.
 * @returns {number} Non-negative session duration.
 */
function getTimeEntryDurationMs(entry, nowMs = Date.now()) {
  const startMs = getTimeEntryTimestamp(getTimeEntryClockInAt(entry));
  const endMs =
    getTimeEntryTimestamp(getTimeEntryClockOutAt(entry)) ?? nowMs;

  if (startMs === null || endMs < startMs) return 0;
  return endMs - startMs;
}

/**
 * Sort time-clock sessions newest first by clock-in time.
 *
 * @param {Array<Object>} entries Time-clock entries.
 * @returns {Array<Object>} Sorted copy.
 */
function sortTimeEntriesByClockInDesc(entries) {
  return entries.slice().sort((a, b) => {
    const aTime = getTimeEntryTimestamp(getTimeEntryClockInAt(a)) ?? 0;
    const bTime = getTimeEntryTimestamp(getTimeEntryClockInAt(b)) ?? 0;
    return bTime - aTime;
  });
}

/**
 * Convert a booking date and optional time into comparable epoch milliseconds.
 *
 * @param {Object} booking Booking record.
 * @returns {number|null} Scheduled time, or null when the booking date is missing or invalid.
 */
function getBookingTime(booking) {
  if (!booking?.date) return null;

  const time = new Date(`${booking.date}T${booking.time || "00:00"}:00`);
  return Number.isNaN(time.getTime()) ? null : time.getTime();
}

/**
 * Determine whether a booking belongs in member history views.
 *
 * @param {Object} booking Booking record.
 * @returns {boolean} True when completed, canceled, or scheduled in the past.
 */
function isHistoryBooking(booking) {
  const status = String(booking?.status || "").toLowerCase();
  const bookingTime = getBookingTime(booking);

  return (
    status === "completed" ||
    status === "canceled" ||
    (bookingTime !== null && bookingTime < Date.now())
  );
}

/**
 * Sort bookings by scheduled date and time without mutating the source array.
 *
 * @param {Array<Object>} bookings Booking records to sort.
 * @param {"asc"|"desc"} [direction="asc"] Sort direction.
 * @returns {Array<Object>} Sorted booking copy.
 */
function sortBookingsBySchedule(bookings, direction = "asc") {
  const multiplier = direction === "desc" ? -1 : 1;

  return bookings.slice().sort((a, b) => {
    const aTime = getBookingTime(a) || 0;
    const bTime = getBookingTime(b) || 0;
    return (aTime - bTime) * multiplier;
  });
}

/**
 * Infer a shop category from inventory item text when no explicit category exists.
 *
 * @param {Object} item Inventory or shop item.
 * @returns {string} Shop category label.
 */
function getProductCategory(item) {
  const text = `${item?.name || ""} ${item?.description || ""}`.toLowerCase();

  if (
    text.includes("interior") ||
    text.includes("leather") ||
    text.includes("glass") ||
    text.includes("brush") ||
    text.includes("upholstery")
  ) {
    return "Interior";
  }

  if (
    text.includes("ceramic") ||
    text.includes("clay") ||
    text.includes("wax") ||
    text.includes("coating") ||
    text.includes("polish")
  ) {
    return "Protection";
  }

  if (text.includes("wheel") || text.includes("tire")) {
    return "Wheels";
  }

  return "Wash";
}

/**
 * Shape an inventory item for member shop display and checkout math.
 *
 * @param {Object} item Inventory or fallback shop product.
 * @param {number} index Source index used for a fallback ID.
 * @returns {Object} Shop-ready product with numeric quantity, price, and category.
 */
function normalizeShopProduct(item, index) {
  return {
    ...item,
    id: item.id || item.name || `shop_item_${index}`,
    name: item.name || "Detailing Item",
    description: item.description || "Member-ready detailing supply.",
    quantity: Number(item.quantity) || 0,
    price: Number(item.price) || 0,
    category: item.category || getProductCategory(item),
  };
}

/**
 * Allocate the next human-readable support request ID.
 *
 * @param {Array<Object>} requests Existing support requests.
 * @returns {string} ID in the `REQ-####` format.
 */
function getNextSupportRequestId(requests) {
  const highest = requests.reduce((max, request) => {
    const numeric = Number(String(request.id || "").replace(/\D/g, ""));
    return Number.isNaN(numeric) ? max : Math.max(max, numeric);
  }, 1000);

  return `REQ-${highest + 1}`;
}

/**
 * Merge stored user notification preferences over app defaults.
 *
 * @param {string} userId User ID whose preferences should be read.
 * @returns {Object} Effective member notification preferences.
 */
function getNotificationPreferences(userId) {
  const user = dbGetUserById(userId);

  return {
    ...MOCK_DATA.memberPreferences,
    ...(user?.preferences || {}),
  };
}

/**
 * Decide whether a notification should be persisted after applying preferences.
 *
 * @param {string} userId User ID receiving the notification.
 * @param {string} type Notification type.
 * @returns {boolean} True when the notification should be persisted.
 */
function shouldCreateNotification(userId, type) {
  const preferences = getNotificationPreferences(userId);

  if (type === "booking") {
    return preferences.serviceUpdates !== false;
  }

  return true;
}

/**
 * Persist a notification, optionally honoring member notification preferences.
 *
 * @param {Object} notificationData Notification details.
 * @param {string} notificationData.userId Recipient user ID.
 * @param {string} [notificationData.type="general"] Notification type.
 * @param {string} [notificationData.title] Display title.
 * @param {string} [notificationData.message] Display message.
 * @param {string} [notificationData.link=""] App route for the notification.
 * @param {string} [notificationData.entityId=""] Related booking, sale, or request ID.
 * @param {boolean} [notificationData.respectPreferences=false] Skip when user preferences disable the type.
 * @returns {Object} Result with notification data, skip marker, or error message.
 */
function createNotification({
  userId,
  type = "general",
  title,
  message,
  link = "",
  entityId = "",
  respectPreferences = false,
}) {
  if (!userId) {
    return { success: false, message: "Notification user is required" };
  }

  if (respectPreferences && !shouldCreateNotification(userId, type)) {
    return { success: true, notification: null, skipped: true };
  }

  const notifications = readCollections(NOTIFICATIONS_KEY);
  const newNotification = {
    id: generateID(),
    userId,
    type,
    title: title || "Studio update",
    message: message || "Your studio account has a new update.",
    link,
    entityId,
    read: false,
    createdAt: nowISO(),
  };

  notifications.unshift(newNotification);
  writeToCollections(NOTIFICATIONS_KEY, notifications);
  return { success: true, notification: newNotification };
}

/**
 * Normalize supported cart shapes into positive integer product quantities.
 *
 * @param {Array<Object>|Object} cartItems Array items or an id-to-quantity map.
 * @returns {Array<{id: string, quantity: number}>} Checkout-ready order items.
 */
function normalizeOrderItems(cartItems) {
  if (Array.isArray(cartItems)) {
    return cartItems
      .map((item) => ({
        id: item.id,
        quantity: Math.max(0, Math.floor(Number(item.quantity) || 0)),
      }))
      .filter((item) => item.id && item.quantity > 0);
  }

  if (cartItems && typeof cartItems === "object") {
    return Object.entries(cartItems)
      .map(([id, quantity]) => ({
        id,
        quantity: Math.max(0, Math.floor(Number(quantity) || 0)),
      }))
      .filter((item) => item.id && item.quantity > 0);
  }

  return [];
}

/**
 * Build a member-facing booking update message from changed fields.
 *
 * @param {Object} booking Updated booking record.
 * @param {Array<string>} changedFields Booking fields changed by the update.
 * @returns {string} Notification message.
 */
function getBookingUpdateMessage(booking, changedFields) {
  if (changedFields.includes("status")) {
    return `Your ${booking.serviceName || "detail"} booking is now ${
      booking.status || "updated"
    }.`;
  }

  if (changedFields.some((field) => ["date", "time"].includes(field))) {
    return `Your ${booking.serviceName || "detail"} booking schedule changed.`;
  }

  if (changedFields.includes("bay")) {
    return `Your ${booking.serviceName || "detail"} booking now has ${
      booking.bay || "a studio bay"
    }.`;
  }

  return `Your ${booking.serviceName || "detail"} booking details were updated.`;
}

/** Match a fixture's stored fields without discarding accounts with profile edits. */
function isUnchangedSeedUser(user, seed) {
  const seedFields = new Set([
    "id", "username", "email", "password", "role", "status", "createdAt", "employeeType",
  ]);
  return (
    Object.entries(seed).every(([field, value]) => user[field] === value) &&
    (user.employeeType || "") === (seed.employeeType || "") &&
    Object.keys(user).every((field) => seedFields.has(field))
  );
}

/** Identify only the obsolete fixtures shipped before employee roles existed. */
function isObsoleteSeedUser(user) {
  if (user.id === "user_002") {
    return isUnchangedSeedUser(user, {
      id: "user_002", username: "studioOwner", email: "owner@studio.local",
      password: "ownerPass!!", role: "admin", status: "active",
      createdAt: "2025-01-02T10:30:00.000Z",
    });
  }

  const number = Number(/^user_(\d{3})$/.exec(user.id)?.[1]);
  if (number < 5 || number > 35 || !Number.isInteger(number)) return false;

  // Generated fixture timestamps used local time and statuses were randomized.
  return isUnchangedSeedUser(user, {
    id: `user_${String(number).padStart(3, "0")}`,
    username: `user${number}`, email: `user${number}@example.com`,
    password: "pass123!", role: "member",
  });
}

/**
 * Upgrade legacy fixtures once, including profiles already touched by the old migration.
 * Unknown users/owners are preserved; mutable usernames never grant staff privileges.
 *
 * @param {Set<string>} seededActivityKeys Collections initialized during this startup.
 */
function migrateEmployeeSeedData(seededActivityKeys) {
  if (localStorage.getItem(EMPLOYEE_IDENTITY_MIGRATION_KEY)) return;

  const users = readCollections(USERS_KEY);
  const oldUsersMigrated = Boolean(localStorage.getItem(USER_PRUNE_MIGRATION_KEY));
  const oldActivityMigrated = Boolean(localStorage.getItem(MEMBER_ACTIVITY_MIGRATION_KEY));
  const obsoleteUsers = users.filter(isObsoleteSeedUser);
  const candidates = users.filter((user) => !obsoleteUsers.includes(user));
  const seedsById = new Map(MOCK_DATA.users.map((user) => [user.id, user]));
  const removedCopies = [];

  // The old migration reinserted default seeds after a rename. Keep the edited
  // record with that ID, removing only an identifiable, untouched default copy.
  let nextUsers = candidates.filter((user, index) => {
    const seed = seedsById.get(user.id);
    if (!seed || !isUnchangedSeedUser(user, seed)) return true;
    const duplicates = candidates.filter((other) => other.id === user.id);
    const hasEditedRecord = duplicates.some((other) =>
      other.createdAt === seed.createdAt && !isUnchangedSeedUser(other, seed)
    );
    const hasEarlierDefaultCopy = candidates.some((other, otherIndex) =>
      otherIndex < index && other.id === user.id && isUnchangedSeedUser(other, seed)
    );
    if (hasEditedRecord || hasEarlierDefaultCopy) {
      removedCopies.push(user);
      return false;
    }
    return true;
  });

  const memberSeed = seedsById.get("user_005");
  let member = nextUsers.find(
    (user) => user.id === memberSeed.id && user.createdAt === memberSeed.createdAt
  ) || nextUsers.find((user) => user.username === memberSeed.username);
  const previousMember = member;

  const memberIdCollision = member && nextUsers.some((user) => user !== member && user.id === member.id);
  if (memberIdCollision || (!member && !oldUsersMigrated && users.length > 0)) {
    const occupiedIds = new Set(nextUsers.map((user) => user.id));
    let memberId = memberSeed.id;
    let suffix = 1;
    while (occupiedIds.has(memberId)) memberId = `${memberSeed.id}_seed_${suffix++}`;
    member = { ...(member || memberSeed), id: memberId };
    if (previousMember) {
      nextUsers = nextUsers.map((user) => user === previousMember ? member : user);
    } else {
      nextUsers.push(member);
    }
  }

  // A deliberately deleted member must not be recreated by this repair. Keep
  // obsolete accounts too if there is no member to receive their fixture data.
  const retiredUsers = member ? obsoleteUsers : [];
  if (!member) nextUsers = users.filter((user) => !removedCopies.includes(user));

  const staffIds = new Set();
  nextUsers = nextUsers.map((user) => {
    const seed = seedsById.get(user.id);
    const isSeedStaff = seed?.role === "employee" && user.createdAt === seed.createdAt;
    if (isSeedStaff) staffIds.add(user.id);

    // Only untouched legacy staff need conversion. Later admin edits remain authoritative.
    if (!oldUsersMigrated && isSeedStaff && !Object.prototype.hasOwnProperty.call(user, "employeeType") &&
        isUnchangedSeedUser(user, { ...seed, role: "member", employeeType: undefined })) {
      return { ...user, role: seed.role, employeeType: seed.employeeType };
    }
    return user;
  });

  const movedOwnerIds = new Set(retiredUsers.map((user) => user.id));
  if (!oldActivityMigrated) staffIds.forEach((id) => movedOwnerIds.add(id));
  const validUserIds = new Set(nextUsers.map((user) => user.id));
  const entityOwners = new Map();

  // Normalize legacy aliases before classifying owners. Never assign arbitrary
  // missing/deleted customer IDs to Jordan just because the owner is unresolved.
  MEMBER_ACTIVITY_KEYS.forEach((key) => {
    const items = readCollections(key);
    const nextItems = items.map((item) => {
      let next = item;
      if (key === CHECKINS_KEY) {
        const recoverOwner = oldActivityMigrated && item.userId === memberSeed.id &&
          item.userID && validUserIds.has(item.userID) && !staffIds.has(item.userID);
        next = normalizeCheckIn(recoverOwner ? { ...item, userId: item.userID } : item);
      }

      const isNewSeedActivity = seededActivityKeys.has(key) && next.userId === memberSeed.id;
      const isUnownedMemberSeed = next.userId === memberSeed.id && !validUserIds.has(memberSeed.id);
      if (member && (movedOwnerIds.has(next.userId) || isNewSeedActivity || isUnownedMemberSeed)) {
        next = { ...next, userId: member.id };
      }
      entityOwners.set(next.id, next.userId);
      return next;
    });
    if (JSON.stringify(items) !== JSON.stringify(nextItems)) writeToCollections(key, nextItems);
  });

  const notifications = readCollections(NOTIFICATIONS_KEY);
  const nextNotifications = notifications.map((notification) => {
    const entityOwner = entityOwners.get(notification.entityId);
    if (member && (movedOwnerIds.has(notification.userId) ||
        (staffIds.has(notification.userId) && entityOwner === member.id))) {
      return { ...notification, userId: entityOwner || member.id };
    }
    return notification;
  });
  if (JSON.stringify(notifications) !== JSON.stringify(nextNotifications)) {
    writeToCollections(NOTIFICATIONS_KEY, nextNotifications);
  }

  // Invalidate a retired identity before its ID can be reused by the member seed.
  try {
    const session = JSON.parse(localStorage.getItem("studio_user"));
    if ([...retiredUsers, ...removedCopies].some((user) =>
      user.id === session?.id && user.username === session.username && user.email === session.email
    )) {
      localStorage.removeItem("studio_user");
      localStorage.removeItem("studio_token");
    } else if (memberIdCollision && session?.id === previousMember.id &&
        session.username === previousMember.username && session.email === previousMember.email) {
      localStorage.setItem("studio_user", JSON.stringify({ ...session, id: member.id }));
    }
  } catch {
    // Malformed sessions are handled by auth restoration.
  }

  // Persist normalized activity before retiring its old user records.
  if (JSON.stringify(users) !== JSON.stringify(nextUsers)) writeToCollections(USERS_KEY, nextUsers);
  localStorage.setItem(USER_PRUNE_MIGRATION_KEY, "true");
  localStorage.setItem(MEMBER_ACTIVITY_MIGRATION_KEY, "true");
  localStorage.setItem(EMPLOYEE_IDENTITY_MIGRATION_KEY, "true");
}

// ------------------------------- USERS (admin + members + employees) ----------------------//

/**
 * Retrieve all users from the shared user collection.
 *
 * @returns {Array<Object>} User records for admin, member, and employee accounts.
 */
export function dbGetUsers() {
  return readCollections(USERS_KEY);
}

/**
 * Merge updates into an existing user record.
 *
 * @param {string} userID User ID to update.
 * @param {Object} partial Fields to overwrite on the user record.
 * @returns {Object} Result with updated user data or an error message.
 */
export function dbUpdateUser(userID, partial) {
  const users = readCollections(USERS_KEY);
  const idx = users.findIndex((u) => u.id === userID);
  if (idx === -1) {
    return { success: false, message: "User not found" };
  }
  const candidate = { ...users[idx], ...partial, id: users[idx].id };
  candidate.username = String(candidate.username ?? "").trim();
  candidate.email = String(candidate.email ?? "").trim();
  const validation = validateUserIdentity(candidate, users, userID);
  if (!validation.success) return validation;

  users[idx] = candidate;
  writeToCollections(USERS_KEY, users);
  return { success: true, user: users[idx] };
}

/**
 * Find a user by ID.
 *
 * @param {string} userID User ID to find.
 * @returns {Object|null} Matching user or null.
 */
export function dbGetUserById(userID) {
  const users = readCollections(USERS_KEY);
  return users.find((u) => u.id === userID) || null;
}

// ------------------------------- NOTIFICATIONS ----------------------//

/**
 * Return a user's notifications newest first.
 *
 * @param {string} userID User ID whose notifications should be returned.
 * @returns {Array<Object>} Matching notifications sorted by `createdAt` descending.
 */
export function dbGetNotificationsByUser(userID) {
  if (!userID) return [];

  return sortByCreatedAtDesc(
    readCollections(NOTIFICATIONS_KEY).filter(
      (notification) => notification.userId === userID
    )
  );
}

/**
 * Count unread notifications for a user.
 *
 * @param {string} userID User ID whose unread notifications should be counted.
 * @returns {number} Number of unread notifications.
 */
export function dbGetUnreadNotificationCount(userID) {
  return dbGetNotificationsByUser(userID).filter(
    (notification) => !notification.read
  ).length;
}

/**
 * Create a notification through the shared notification helper.
 *
 * @param {Object} notificationData Notification payload accepted by `createNotification`.
 * @returns {Object} Result with created notification, skip marker, or error message.
 */
export function dbCreateNotification(notificationData) {
  return createNotification(notificationData);
}

/**
 * Mark one notification as read, optionally scoped to a user.
 *
 * @param {string} notificationID Notification ID to update.
 * @param {string} [userID] Optional owner check for member-scoped updates.
 * @returns {Object} Result with updated notification or an error message.
 */
export function dbMarkNotificationRead(notificationID, userID) {
  const notifications = readCollections(NOTIFICATIONS_KEY);
  const idx = notifications.findIndex(
    (notification) =>
      notification.id === notificationID &&
      (!userID || notification.userId === userID)
  );

  if (idx === -1) {
    return { success: false, message: "Notification not found" };
  }

  notifications[idx] = {
    ...notifications[idx],
    read: true,
    readAt: nowISO(),
  };
  writeToCollections(NOTIFICATIONS_KEY, notifications);
  return { success: true, notification: notifications[idx] };
}

/**
 * Mark every notification for a user as read.
 *
 * @param {string} userID User ID whose notifications should be updated.
 * @returns {Object} Success result or validation error.
 */
export function dbMarkAllNotificationsRead(userID) {
  if (!userID) {
    return { success: false, message: "Notification user is required" };
  }

  const notifications = readCollections(NOTIFICATIONS_KEY);
  const now = nowISO();
  // Keep the original read timestamp so bulk updates do not rewrite history.
  const nextNotifications = notifications.map((notification) =>
    notification.userId === userID
      ? { ...notification, read: true, readAt: notification.readAt || now }
      : notification
  );

  writeToCollections(NOTIFICATIONS_KEY, nextNotifications);
  return { success: true };
}

// ------------------------------- SALES ----------------------//
/**
 * Retrieve all sales records from storage.
 *
 * @returns {Array<Object>} Sale records with id, userId, amount, items, and timestamps.
 */
export function dbGetSales() {
  return readCollections(SALES_KEY);
}

/**
 * Add a sale record and optionally notify the purchasing member.
 *
 * @param {Object} saleData Sale information.
 * @param {string} saleData.userId User ID associated with the purchase.
 * @param {number} saleData.amount Total sale amount.
 * @param {Array<string>} saleData.items Purchased item labels.
 * @param {string} [saleData.description=""] Optional sale description.
 * @param {boolean} [saleData.notifyMember=true] Whether to create a member notification.
 * @returns {Object} Result with the created sale.
 */
export function dbAddSale({
  userId,
  amount,
  items,
  description = "",
  notifyMember = true,
}) {
  const sales = readCollections(SALES_KEY);
  const newSale = {
    id: generateID(),
    userId,
    amount: Number(amount) || 0,
    description,
    createdAt: nowISO(),
    items: Array.isArray(items) ? items : [],
  };
  sales.push(newSale);
  writeToCollections(SALES_KEY, sales);

  if (notifyMember && userId) {
    createNotification({
      userId,
      type: "sale",
      title: "Purchase recorded",
      message: `A ${new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(newSale.amount)} studio purchase was added to your account.`,
      link: "/member",
      entityId: newSale.id,
    });
  }

  return { success: true, sale: newSale };
}

/**
 * Get all sales records for a specific user.
 *
 * @param {string} userID User ID to match against sales.
 * @returns {Array<Object>} Sale records belonging to the user.
 */
export function dbGetSalesByUser(userID) {
  const sales = readCollections(SALES_KEY);
  return sales.filter((s) => s.userId === userID);
}

/**
 * Calculate total revenue from all sales.
 *
 * @returns {number} Sum of all sale amounts.
 */
export function dbGetTotalRevenue() {
  return readCollections(SALES_KEY).reduce(
    (total, sale) => total + sale.amount,
    0
  );
}

// ------------------------------- CHECK-INS ----------------------//
/**
 * Retrieve all check-in records, normalizing legacy field names.
 *
 * @returns {Array<Object>} Check-in records with current `userId` and `createdAt` keys.
 */
export function dbGetCheckIns() {
  return readCollections(CHECKINS_KEY).map(normalizeCheckIn);
}

/**
 * Get all check-in records for a specific user.
 *
 * @param {string} userID User ID to match against check-ins.
 * @returns {Array<Object>} Check-in records belonging to the user.
 */
export function dbGetCheckInsByUser(userID) {
  return dbGetCheckIns().filter((c) => getCheckInUserId(c) === userID);
}

/**
 * Record a new check-in for a user.
 *
 * @param {string} userID User ID checking in.
 * @returns {Object} Result with the created check-in record.
 */
export function dbAddCheckIn(userID) {
  const checkIns = readCollections(CHECKINS_KEY);
  const newCheckIn = {
    id: generateID(),
    userId: userID,
    createdAt: nowISO(),
  };

  checkIns.push(newCheckIn);
  writeToCollections(CHECKINS_KEY, checkIns);
  return { success: true, checkIn: newCheckIn };
}

/**
 * Get the total number of check-ins that occurred today.
 *
 * @param {Array<Object>} [checkIns] Existing snapshot, when already loaded by the caller.
 * @returns {number} Number of check-ins from today's date.
 */
export function dbGetTotalCheckInsToday(checkIns = dbGetCheckIns()) {
  const today = new Date();

  return checkIns.filter((c) => {
    const time = getCheckInTime(c);
    if (time === null) return false;

    return new Date(time).toDateString() === today.toDateString();
  }).length;
}

// ------------------------------- EMPLOYEE TIME CLOCK ----------------------//

/**
 * Retrieve all employee time-clock sessions, newest first.
 *
 * @returns {Array<Object>} Time-clock sessions with clock-in and optional clock-out timestamps.
 */
export function dbGetTimeClockEntries() {
  return sortTimeEntriesByClockInDesc(
    readCollections(TIME_CLOCK_KEY).map(normalizeTimeEntry)
  );
}

/**
 * Get all time-clock sessions for a specific employee.
 *
 * @param {string} userID Employee user ID.
 * @returns {Array<Object>} Time-clock sessions belonging to the employee.
 */
export function dbGetTimeClockEntriesByUser(userID) {
  if (!userID) return [];
  return sortTimeEntriesByClockInDesc(
    readCollections(TIME_CLOCK_KEY)
      .filter((entry) => entry.userId === userID)
      .map(normalizeTimeEntry)
  );
}

/**
 * Get the active open time-clock session for an employee.
 *
 * @param {string} userID Employee user ID.
 * @returns {Object|null} Active time-clock session, or null when clocked out.
 */
export function dbGetActiveTimeClockEntry(userID) {
  return dbGetTimeClockEntriesByUser(userID).find(
    (entry) => !entry.clockOutAt
  ) || null;
}

/**
 * Start a new employee time-clock session.
 *
 * @param {string} userID Employee user ID.
 * @returns {Object} Result with the created session or a validation message.
 */
export function dbClockInEmployee(userID) {
  if (!userID) {
    return { success: false, message: "Employee user is required." };
  }

  const user = dbGetUserById(userID);
  if (!user || user.role !== "employee") {
    return { success: false, message: "Only employees can use the time clock." };
  }

  const activeEntry = dbGetActiveTimeClockEntry(userID);
  if (activeEntry) {
    return {
      success: false,
      message: "You are already clocked in.",
      activeEntry,
    };
  }

  const entries = readCollections(TIME_CLOCK_KEY).map(normalizeTimeEntry);
  const clockInAt = nowISO();
  const entry = {
    id: generateID(),
    userId: userID,
    clockInAt,
    clockOutAt: "",
    durationMs: 0,
  };

  entries.push(entry);
  writeToCollections(TIME_CLOCK_KEY, entries);
  return { success: true, entry };
}

/**
 * Close an employee's active time-clock session.
 *
 * @param {string} userID Employee user ID.
 * @returns {Object} Result with the closed session or a validation message.
 */
export function dbClockOutEmployee(userID) {
  if (!userID) {
    return { success: false, message: "Employee user is required." };
  }

  const user = dbGetUserById(userID);
  if (!user || user.role !== "employee") {
    return { success: false, message: "Only employees can use the time clock." };
  }

  const entries = readCollections(TIME_CLOCK_KEY).map(normalizeTimeEntry);
  const activeIndex = entries.reduce((latestIndex, entry, index) => {
    if (entry.userId !== userID || entry.clockOutAt) return latestIndex;

    const entryTime =
      getTimeEntryTimestamp(getTimeEntryClockInAt(entry)) ?? 0;
    const latestTime =
      latestIndex === -1
        ? -1
        : getTimeEntryTimestamp(getTimeEntryClockInAt(entries[latestIndex])) ??
          0;

    return entryTime > latestTime ? index : latestIndex;
  }, -1);

  if (activeIndex === -1) {
    return { success: false, message: "You are not currently clocked in." };
  }

  const clockOutAt = nowISO();
  const closedEntry = {
    ...entries[activeIndex],
    clockOutAt,
    durationMs: getTimeEntryDurationMs({
      ...entries[activeIndex],
      clockOutAt,
    }),
    updatedAt: clockOutAt,
  };

  entries[activeIndex] = closedEntry;
  writeToCollections(TIME_CLOCK_KEY, entries);
  return { success: true, entry: closedEntry };
}

/**
 * Build an employee time summary for dashboard rendering.
 *
 * @param {string} userID Employee user ID.
 * @returns {Object} Active session, recent sessions, and daily/weekly total durations.
 */
export function dbGetEmployeeTimeSummary(userID) {
  return summarizeTimeClockEntries(dbGetTimeClockEntriesByUser(userID));
}

// ------------------------------- MEMBER BOOKINGS ----------------------//

/**
 * Retrieve bookable service definitions, seeding defaults on first read.
 *
 * @returns {Array<Object>} Booking service options for member forms.
 */
export function dbGetBookingServices() {
  return readSeededCollections(
    BOOKING_SERVICES_KEY,
    MOCK_DATA.bookingServices
  );
}

/**
 * Retrieve supported vehicle drop-off windows, seeding defaults on first read.
 *
 * @returns {Array<string>} Drop-off window labels.
 */
export function dbGetBookingDropoffWindows() {
  return readSeededCollections(
    BOOKING_DROPOFF_WINDOWS_KEY,
    MOCK_DATA.bookingDropoffWindows
  );
}

/**
 * Retrieve all bookings, seeding mock booking history on first read.
 *
 * @returns {Array<Object>} Booking records.
 */
export function dbGetBookings() {
  return readSeededCollections(BOOKINGS_KEY, MOCK_DATA.bookings);
}

/**
 * Return bookings enriched with member details for admin booking queues.
 *
 * @returns {Array<Object>} Scheduled bookings with member name, email, and status fields.
 */
export function dbGetBookingsForAdmin() {
  const users = dbGetUsers();
  const usersById = new Map(users.map((user) => [user.id, user]));

  // Join in-memory user data after sorting so admin tables can render member context.
  return sortBookingsBySchedule(dbGetBookings()).map((booking) => {
    const member = usersById.get(booking.userId);

    return {
      ...booking,
      memberName: member?.username || "Unknown member",
      memberEmail: member?.email || "",
      memberStatus: member?.status || "unknown",
    };
  });
}

/**
 * Get all bookings owned by a user.
 *
 * @param {string} userID User ID to match against bookings.
 * @returns {Array<Object>} Booking records for the user.
 */
export function dbGetBookingsByUser(userID) {
  return dbGetBookings().filter((booking) => booking.userId === userID);
}

/**
 * Get a user's non-history bookings sorted by soonest scheduled time.
 *
 * @param {string} userID User ID to match against bookings.
 * @returns {Array<Object>} Upcoming booking records.
 */
export function dbGetUpcomingBookingsByUser(userID) {
  return sortBookingsBySchedule(
    dbGetBookingsByUser(userID).filter((booking) => !isHistoryBooking(booking))
  );
}

/**
 * Get a user's completed, canceled, or past bookings newest first.
 *
 * @param {string} userID User ID to match against bookings.
 * @returns {Array<Object>} Historical booking records.
 */
export function dbGetBookingHistoryByUser(userID) {
  return sortBookingsBySchedule(
    dbGetBookingsByUser(userID).filter(isHistoryBooking),
    "desc"
  );
}

/** Read a member's bookings once and split them into ordered schedule views. */
export function dbGetBookingScheduleByUser(userID) {
  const upcomingBookings = [];
  const historyBookings = [];
  for (const booking of dbGetBookingsByUser(userID)) {
    (isHistoryBooking(booking) ? historyBookings : upcomingBookings).push(booking);
  }
  return {
    upcomingBookings: sortBookingsBySchedule(upcomingBookings),
    historyBookings: sortBookingsBySchedule(historyBookings, "desc"),
  };
}

/**
 * Create a member booking request and notify the member.
 *
 * @param {Object} bookingData Booking request data.
 * @param {string} bookingData.userId Member user ID.
 * @param {string} bookingData.serviceId Selected service ID.
 * @param {string} bookingData.serviceName Selected service name.
 * @param {string} bookingData.vehicle Vehicle label/details.
 * @param {string} bookingData.date Booking date in YYYY-MM-DD format.
 * @param {string} bookingData.time Booking time in HH:mm format.
 * @param {string} [bookingData.status="Requested"] Initial booking status.
 * @param {string} [bookingData.bay="Pending bay assignment"] Assigned bay label.
 * @param {string} [bookingData.advisor="Studio desk"] Assigned advisor label.
 * @param {string} [bookingData.dropoff=""] Selected vehicle drop-off window.
 * @param {string} [bookingData.notes=""] Member or staff notes.
 * @returns {Object} Result with the created booking.
 */
export function dbAddBooking({
  userId,
  serviceId,
  serviceName,
  vehicle,
  date,
  time,
  status = "Requested",
  bay = "Pending bay assignment",
  advisor = "Studio desk",
  dropoff = "",
  notes = "",
}) {
  const bookings = dbGetBookings();
  const newBooking = {
    id: generateID(),
    userId,
    serviceId,
    serviceName,
    vehicle,
    date,
    time,
    status,
    bay,
    advisor,
    dropoff: String(dropoff ?? "").trim(),
    notes,
    createdAt: nowISO(),
  };

  bookings.push(newBooking);
  writeToCollections(BOOKINGS_KEY, bookings);

  createNotification({
    userId,
    type: "booking",
    title: "Booking request sent",
    message: `Your ${serviceName || "detail"} request is waiting for studio confirmation.`,
    link: "/member/bookings",
    entityId: newBooking.id,
  });

  return { success: true, booking: newBooking };
}

/**
 * Update allowed booking fields and optionally notify the affected member.
 *
 * @param {string} bookingID Booking ID to update.
 * @param {Object} [partial={}] Candidate booking fields to update.
 * @param {Object} [options={}] Update options.
 * @param {boolean} [options.notifyMember=true] Whether to create an update notification.
 * @returns {Object} Result with updated booking, changed field names, and optional notification.
 */
export function dbUpdateBooking(bookingID, partial = {}, options = {}) {
  const bookings = dbGetBookings();
  const idx = bookings.findIndex((booking) => booking.id === bookingID);

  if (idx === -1) {
    return { success: false, message: "Booking not found" };
  }

  const allowedFields = [
    "serviceId",
    "serviceName",
    "vehicle",
    "date",
    "time",
    "status",
    "bay",
    "advisor",
    "dropoff",
    "notes",
  ];
  const updates = {};

  // Whitelist persisted fields so admin edits cannot overwrite ownership or IDs.
  allowedFields.forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(partial, field)) {
      updates[field] =
        typeof partial[field] === "string" ? partial[field].trim() : partial[field];
    }
  });

  const previousBooking = bookings[idx];
  const changedFields = allowedFields.filter((field) => {
    if (!Object.prototype.hasOwnProperty.call(updates, field)) return false;
    return String(previousBooking[field] ?? "") !== String(updates[field] ?? "");
  });

  if (changedFields.length === 0) {
    return { success: true, booking: previousBooking, changedFields: [] };
  }

  const nextBooking = {
    ...previousBooking,
    ...updates,
    updatedAt: nowISO(),
  };

  bookings[idx] = nextBooking;
  writeToCollections(BOOKINGS_KEY, bookings);

  // Member notifications are preference-aware for booking updates.
  const notification =
    options.notifyMember === false
      ? null
      : createNotification({
          userId: nextBooking.userId,
          type: "booking",
          title: "Booking updated",
          message: getBookingUpdateMessage(nextBooking, changedFields),
          link: "/member/bookings",
          entityId: nextBooking.id,
          respectPreferences: true,
        }).notification;

  return { success: true, booking: nextBooking, changedFields, notification };
}

// ------------------------------- MEMBER SUPPORT ----------------------//

/**
 * Retrieve support contact channels, seeding defaults on first read.
 *
 * @returns {Array<Object>} Support channel cards.
 */
export function dbGetSupportChannels() {
  return readSeededCollections(
    SUPPORT_CHANNELS_KEY,
    MOCK_DATA.supportChannels
  );
}

/**
 * Retrieve support status summary cards.
 *
 * @returns {Array<Object>} Current support status entries.
 */
export function dbGetSupportStatus() {
  return readSeededCollections(SUPPORT_STATUS_KEY, MOCK_DATA.supportStatus);
}

/**
 * Retrieve support FAQ entries.
 *
 * @returns {Array<Object>} FAQ records.
 */
export function dbGetSupportFaqs() {
  return readSeededCollections(SUPPORT_FAQS_KEY, MOCK_DATA.supportFaqs);
}

/**
 * Retrieve support request category labels.
 *
 * @returns {Array<string>} Category labels.
 */
export function dbGetSupportCategories() {
  return readSeededCollections(
    SUPPORT_CATEGORIES_KEY,
    MOCK_DATA.supportCategories
  );
}

/**
 * Retrieve allowed contact methods for support requests.
 *
 * @returns {Array<string>} Contact method labels.
 */
export function dbGetSupportContactMethods() {
  return readSeededCollections(
    SUPPORT_CONTACT_METHODS_KEY,
    MOCK_DATA.supportContactMethods
  );
}

/**
 * Retrieve allowed priority labels for support requests.
 *
 * @returns {Array<string>} Priority labels.
 */
export function dbGetSupportPriorities() {
  return readSeededCollections(
    SUPPORT_PRIORITIES_KEY,
    MOCK_DATA.supportPriorities
  );
}

/**
 * Retrieve all support requests, seeding mock requests on first read.
 *
 * @returns {Array<Object>} Support request records.
 */
export function dbGetSupportRequests() {
  return readSeededCollections(
    SUPPORT_REQUESTS_KEY,
    MOCK_DATA.supportRequests
  );
}

/**
 * Get support requests opened by a user.
 *
 * @param {string} userID User ID to match against support requests.
 * @returns {Array<Object>} Support requests for the user.
 */
export function dbGetSupportRequestsByUser(userID) {
  return dbGetSupportRequests().filter((request) => request.userId === userID);
}

/**
 * Create a support request and notify the requesting member.
 *
 * @param {Object} requestData Support request form data.
 * @param {string} requestData.userId Member user ID.
 * @param {string} requestData.title Request title.
 * @param {string} requestData.category Support category.
 * @param {string} requestData.priority Priority label.
 * @param {string} [requestData.vehicle=""] Related vehicle label/details.
 * @param {string} requestData.contact Preferred contact method.
 * @param {string} requestData.details Request details.
 * @returns {Object} Result with the created support request.
 */
export function dbAddSupportRequest({
  userId,
  title,
  category,
  priority,
  vehicle = "",
  contact,
  details,
}) {
  const requests = dbGetSupportRequests();
  const newRequest = {
    id: getNextSupportRequestId(requests),
    userId,
    title,
    category,
    priority,
    vehicle,
    contact,
    details,
    status: "New",
    updated: "Just now",
    createdAt: nowISO(),
  };

  requests.unshift(newRequest);
  writeToCollections(SUPPORT_REQUESTS_KEY, requests);

  createNotification({
    userId,
    type: "support",
    title: "Support request opened",
    message: `${newRequest.id} is now in the studio support queue.`,
    link: "/member/support",
    entityId: newRequest.id,
  });

  return { success: true, request: newRequest };
}

// ------------------------------- MEMBER SHOP ----------------------//

/**
 * Return inventory items normalized for member shop browsing.
 *
 * @returns {Array<Object>} Shop-ready products sourced from inventory.
 */
export function dbGetShopProducts() {
  return dbGetInventory().map(normalizeShopProduct);
}

/**
 * Return unique shop category filters with an "All" option first.
 *
 * @returns {Array<string>} Category filter labels.
 */
export function dbGetShopCategories(products = dbGetShopProducts()) {
  const categories = products.map((product) => product.category);
  return ["All", ...Array.from(new Set(categories))];
}

/**
 * Retrieve service add-on packages available during shop checkout.
 *
 * @returns {Array<Object>} Service package records.
 */
export function dbGetShopServicePackages() {
  return readSeededCollections(
    SHOP_SERVICE_PACKAGES_KEY,
    MOCK_DATA.shopServicePackages
  );
}

/**
 * Validate a shop cart, decrement inventory, record the sale, and notify the member.
 *
 * @param {Object} orderData Checkout request data.
 * @param {string} orderData.userId Member user ID.
 * @param {Array<Object>|Object} [orderData.cartItems=[]] Cart items or id-to-quantity map.
 * @param {string} [orderData.servicePackageId=""] Optional service package ID.
 * @returns {Object} Result with sale, notification, updated inventory, and normalized products.
 */
export function dbCheckoutShopOrder({
  userId,
  cartItems = [],
  servicePackageId = "",
}) {
  if (!userId) {
    return { success: false, message: "Sign in before requesting an order." };
  }

  const orderItems = normalizeOrderItems(cartItems);
  const rawInventory = dbGetInventory();
  const inventory = rawInventory.map(normalizeShopProduct);
  const servicePackage =
    dbGetShopServicePackages().find(
      (service) => service.id === servicePackageId
    ) || null;

  // Reject empty checkouts before touching inventory or creating sale records.
  if (orderItems.length === 0 && !servicePackage) {
    return {
      success: false,
      message: "Add a product or choose a service to start an order.",
    };
  }

  const nextInventory = inventory.map((item) => ({ ...item }));
  const nextRawInventory = rawInventory.map((item) => ({ ...item }));
  const purchasedItems = [];

  // Validate the full cart against a cloned inventory before writing stock changes.
  for (const orderItem of orderItems) {
    const itemIndex = nextInventory.findIndex(
      (item) => item.id === orderItem.id
    );

    if (itemIndex === -1) {
      return {
        success: false,
        message: "One cart item is no longer available.",
      };
    }

    const item = nextInventory[itemIndex];
    const availableQuantity = Number(item.quantity) || 0;

    if (orderItem.quantity > availableQuantity) {
      return {
        success: false,
        message: `${item.name} only has ${availableQuantity} available.`,
      };
    }

    const purchasedItem = {
      id: item.id,
      name: item.name,
      quantity: orderItem.quantity,
      price: Number(item.price) || 0,
      subtotal: (Number(item.price) || 0) * orderItem.quantity,
    };

    purchasedItems.push(purchasedItem);
    nextInventory[itemIndex] = {
      ...item,
      quantity: availableQuantity - orderItem.quantity,
      updatedAt: nowISO(),
    };
    nextRawInventory[itemIndex] = {
      ...nextRawInventory[itemIndex],
      quantity: availableQuantity - orderItem.quantity,
      updatedAt: nowISO(),
    };
  }

  const productsSubtotal = purchasedItems.reduce(
    (total, item) => total + item.subtotal,
    0
  );
  const serviceDeposit = servicePackage ? Number(servicePackage.price) || 0 : 0;
  const amount = productsSubtotal + serviceDeposit;
  const saleItems = purchasedItems.map(
    (item) => `${item.quantity} x ${item.name}`
  );

  if (servicePackage) {
    saleItems.push(`Service add-on: ${servicePackage.name}`);
  }

  // Commit inventory first, then create a single sale record for the checkout.
  writeToCollections(INVENTORY_KEY, nextRawInventory);
  const saleResult = dbAddSale({
    userId,
    amount,
    items: saleItems,
    description: "Member shop order",
    notifyMember: false,
  });

  const notificationResult = createNotification({
    userId,
    type: "order",
    title: "Order request sent",
    message: `Your shop order for ${new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)} was sent to the studio desk.`,
    link: "/member/shop",
    entityId: saleResult.sale.id,
  });

  return {
    success: true,
    sale: saleResult.sale,
    notification: notificationResult.notification,
    inventory: nextRawInventory,
    products: nextRawInventory.map(normalizeShopProduct),
  };
}

/**
 * Retrieve member dashboard quick-action links.
 *
 * @returns {Array<Object>} Quick-action link records.
 */
export function dbGetMemberQuickActions() {
  return readSeededCollections(
    MEMBER_QUICK_ACTIONS_KEY,
    MOCK_DATA.memberQuickActions
  );
}

/**
 * Return a copy of default member preference values.
 *
 * @returns {Object} Default preference flags.
 */
export function dbGetDefaultMemberPreferences() {
  return { ...MOCK_DATA.memberPreferences };
}
// ------------------------------- INVENTORY ----------------------//

/**
 * Retrieve all inventory items from storage.
 * If no inventory exists, initializes with default car detailing supplies.
 *
 * @returns {Array<Object>} Inventory item records.
 */
export function dbGetInventory() {
  return readSeededCollections(INVENTORY_KEY, MOCK_DATA.inventory);
}

/**
 * Replace the inventory collection with the default mock inventory.
 *
 * @returns {void}
 */
export function dbSeedInventory() {
  writeToCollections(INVENTORY_KEY, MOCK_DATA.inventory);
}

/**
 * Add a new item to the inventory.
 *
 * @param {Object} itemData Inventory item information.
 * @param {string} itemData.name Inventory item name.
 * @param {number} [itemData.quantity=0] Current stock quantity.
 * @param {number} [itemData.price=0] Item price.
 * @param {string} [itemData.description=""] Optional item description.
 * @returns {Object} Result with the created item.
 */
export function dbAddInventoryItem({
  name,
  quantity = 0,
  price = 0,
  description = "",
}) {
  const inventory = readCollections(INVENTORY_KEY);
  const newItem = {
    id: generateID(),
    name,
    quantity,
    price,
    description,
    createdAt: nowISO(),
  };
  inventory.push(newItem);
  writeToCollections(INVENTORY_KEY, inventory);
  return { success: true, item: newItem };
}

/**
 * Merge updates into an existing inventory item.
 *
 * @param {string} itemID Inventory item ID to update.
 * @param {Object} partial Fields to overwrite on the inventory item.
 * @returns {Object} Result with updated item or an error message.
 */
export function dbUpdateInventoryItem(itemID, partial) {
  const inventory = readCollections(INVENTORY_KEY);
  const idx = inventory.findIndex((item) => item.id === itemID);
  if (idx === -1) {
    return { success: false, message: "Item not found" };
  }
  inventory[idx] = { ...inventory[idx], ...partial };
  writeToCollections(INVENTORY_KEY, inventory);
  return { success: true, item: inventory[idx] };
}

/**
 * Remove an inventory item by ID.
 *
 * @param {string} itemID Inventory item ID to remove.
 * @returns {Object} Success result or not-found error.
 */
export function dbRemoveInventoryItem(itemID) {
  const inventory = readCollections(INVENTORY_KEY);
  const idx = inventory.findIndex((item) => item.id === itemID);
  if (idx === -1) {
    return { success: false, message: "Item not found" };
  }
  inventory.splice(idx, 1);
  writeToCollections(INVENTORY_KEY, inventory);
  return { success: true };
}

//------------------- DASHBOARD HELPERS ------------------//

/**
 * Generate aggregate metrics for the admin dashboard.
 *
 * @returns {Object} Summary with user counts, revenue, activity, and highlight records.
 */
export function dbGetAdminSummary() {
  const users = dbGetUsers();
  const sales = dbGetSales();
  const checkIns = dbGetCheckIns();
  const inventory = dbGetInventory();

  const now = new Date();
  const DAY_MS = 24 * 60 * 60 * 1000;
  const SEVEN_DAYS_MS = 7 * DAY_MS;

  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u.status === "active").length;
  const totalRevenue = sales.reduce((Sum, sale) => Sum + sale.amount, 0);
  const totalCheckInsToday = dbGetTotalCheckInsToday(checkIns);
  const salesCount = sales.length;
  const checkInsCount = checkIns.length;

  const newUsers7 = users.filter((u) => {
    if (!u.createdAt) return false;
    const d = new Date(u.createdAt);
    const ageMs = now - d;
    return !Number.isNaN(d.getTime()) && ageMs >= 0 && ageMs <= SEVEN_DAYS_MS;
  }).length;

  const salesLast24h = sales
    .filter((s) => {
      if (!s.createdAt) return false;
      const d = new Date(s.createdAt);
      return !Number.isNaN(d.getTime()) && now - d <= DAY_MS;
    })
    .reduce((sum, s) => sum + (Number(s.amount) || 0), 0);

  const avgSaleAmount = salesCount ? totalRevenue / salesCount : 0;

  // Aggregate sales by user so the dashboard can show the highest-value member.
  let topSpender = null;
  if (sales.length && users.length) {
    const totalsByUser = new Map();
    for (const s of sales) {
      const amt = Number(s.amount) || 0;
      if (!s.userId) continue;
      totalsByUser.set(s.userId, (totalsByUser.get(s.userId) || 0) + amt);
    }

    let bestUserId = null;
    let bestAmount = 0;
    for (const [userId, amt] of totalsByUser.entries()) {
      if (amt > bestAmount) {
        bestAmount = amt;
        bestUserId = userId;
      }
    }

    const u = users.find((u) => u.id === bestUserId);
    if (u) {
      topSpender = {
        id: u.id,
        username: u.username,
        total: bestAmount,
      };
    }
  }

  // Count normalized check-ins by user to find the most frequent visitor.
  let mostActiveMember = null;
  if (checkIns.length && users.length) {
    const counts = new Map();
    for (const c of checkIns) {
      const userId = getCheckInUserId(c);
      if (!userId) continue;
      counts.set(userId, (counts.get(userId) || 0) + 1);
    }

    let bestUserId = null;
    let bestCount = 0;
    for (const [userId, count] of counts.entries()) {
      if (count > bestCount) {
        bestCount = count;
        bestUserId = userId;
      }
    }

    const u = users.find((u) => u.id === bestUserId);
    if (u) {
      mostActiveMember = {
        id: u.id,
        username: u.username,
        checkIns: bestCount,
      };
    }
  }

  const lowInventoryCount = inventory.filter(
    (item) => Number(item.quantity || 0) <= 5
  ).length;

  // Derive latest activity from timestamps instead of trusting storage order.
  const lastSale =
    sales.length > 0
      ? sales.reduce((latest, s) => {
          if (!s.createdAt) return latest;
          if (!latest || new Date(s.createdAt) > new Date(latest.createdAt)) {
            return s;
          }
          return latest;
        }, null)
      : null;

  const lastCheckin =
    checkIns.length > 0 ? getLatestCheckIn(checkIns) : null;

  return {
    totalUsers,
    activeUsers,
    totalRevenue,
    salesCount,
    checkInsCount,
    totalCheckInsToday,
    newUsers7,
    salesLast24h,
    avgSaleAmount,
    topSpender,
    mostActiveMember,
    lowInventoryCount,
    lastSale,
    lastCheckin,
  };
}

/**
 * Generate purchase and activity metrics for a specific user.
 *
 * @param {string} userID User ID to summarize.
 * @returns {Object|null} User summary object, or null when the user does not exist.
 */
export function dbGetUserSummary(userID) {
  const user = dbGetUserById(userID);
  if (!user) {
    return null;
  }

  const userSales = dbGetSalesByUser(userID);
  const userCheckIns = dbGetCheckInsByUser(userID);
  const totalSpent = userSales.reduce((sum, sale) => sum + sale.amount, 0);

  return {
    user,
    totalSpent,
    salesCount: userSales.length,
    checkInsCount: userCheckIns.length,
    lastCheckIn: getLatestCheckIn(userCheckIns),
    lastPurchase: userSales[userSales.length - 1] || null,
  };
}

// --------------------- MOCK DATA FOR INITIALIZATION / TESTING ------------------//
/**
 * Seed every mock collection that does not already exist in localStorage.
 *
 * Existing keys are left untouched so user-created or intentionally cleared data survives.
 *
 * @returns {void}
 */
export function seedDB() {
  const seededActivityKeys = new Set(
    MEMBER_ACTIVITY_KEYS.filter((key) => !localStorage.getItem(key))
  );
  // Each key is seeded independently so partial localStorage resets recover cleanly.
  if(!localStorage.getItem(USERS_KEY)) {
    writeToCollections(USERS_KEY, MOCK_DATA["users"]);
  }
  if(!localStorage.getItem(SALES_KEY)) {
    writeToCollections(SALES_KEY, MOCK_DATA["sales"]);
  }
  if(!localStorage.getItem(CHECKINS_KEY)) {
    writeToCollections(CHECKINS_KEY, MOCK_DATA["checkins"]);
  }
  if(!localStorage.getItem(TIME_CLOCK_KEY)) {
    writeToCollections(TIME_CLOCK_KEY, []);
  }
  if(!localStorage.getItem(INVENTORY_KEY)) {
    writeToCollections(INVENTORY_KEY, MOCK_DATA["inventory"]);
  }
  if(!localStorage.getItem(BOOKING_SERVICES_KEY)) {
    writeToCollections(BOOKING_SERVICES_KEY, MOCK_DATA["bookingServices"]);
  }
  if(!localStorage.getItem(BOOKING_DROPOFF_WINDOWS_KEY)) {
    writeToCollections(
      BOOKING_DROPOFF_WINDOWS_KEY,
      MOCK_DATA["bookingDropoffWindows"]
    );
  }
  if(!localStorage.getItem(BOOKINGS_KEY)) {
    writeToCollections(BOOKINGS_KEY, MOCK_DATA["bookings"]);
  }
  if(!localStorage.getItem(SUPPORT_CHANNELS_KEY)) {
    writeToCollections(SUPPORT_CHANNELS_KEY, MOCK_DATA["supportChannels"]);
  }
  if(!localStorage.getItem(SUPPORT_STATUS_KEY)) {
    writeToCollections(SUPPORT_STATUS_KEY, MOCK_DATA["supportStatus"]);
  }
  if(!localStorage.getItem(SUPPORT_FAQS_KEY)) {
    writeToCollections(SUPPORT_FAQS_KEY, MOCK_DATA["supportFaqs"]);
  }
  if(!localStorage.getItem(SUPPORT_CATEGORIES_KEY)) {
    writeToCollections(SUPPORT_CATEGORIES_KEY, MOCK_DATA["supportCategories"]);
  }
  if(!localStorage.getItem(SUPPORT_CONTACT_METHODS_KEY)) {
    writeToCollections(
      SUPPORT_CONTACT_METHODS_KEY,
      MOCK_DATA["supportContactMethods"]
    );
  }
  if(!localStorage.getItem(SUPPORT_PRIORITIES_KEY)) {
    writeToCollections(SUPPORT_PRIORITIES_KEY, MOCK_DATA["supportPriorities"]);
  }
  if(!localStorage.getItem(SUPPORT_REQUESTS_KEY)) {
    writeToCollections(SUPPORT_REQUESTS_KEY, MOCK_DATA["supportRequests"]);
  }
  if(!localStorage.getItem(SHOP_PRODUCTS_KEY)) {
    writeToCollections(SHOP_PRODUCTS_KEY, MOCK_DATA["shopProducts"]);
  }
  if(!localStorage.getItem(SHOP_SERVICE_PACKAGES_KEY)) {
    writeToCollections(
      SHOP_SERVICE_PACKAGES_KEY,
      MOCK_DATA["shopServicePackages"]
    );
  }
  if(!localStorage.getItem(MEMBER_QUICK_ACTIONS_KEY)) {
    writeToCollections(
      MEMBER_QUICK_ACTIONS_KEY,
      MOCK_DATA["memberQuickActions"]
    );
  }
  if(!localStorage.getItem(NOTIFICATIONS_KEY)) {
    writeToCollections(NOTIFICATIONS_KEY, []);
  }
  migrateEmployeeSeedData(seededActivityKeys);
}
