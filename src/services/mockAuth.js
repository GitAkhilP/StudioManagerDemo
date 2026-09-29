import { publishCollectionChange } from "./collectionEvents.js";
import { normalizeLoginIdentifier, validateUserIdentity } from "./userIdentity.js";
import { getRoleHomePath } from "./roleRoutes.js";

const TOKEN_KEY = "studio_token";
const USER_KEY = "studio_user";
const USERS_KEY = "studio_users";

/**
 * Create a user ID, preferring the browser UUID API when it is available.
 *
 * @returns {string} Storage-safe unique identifier.
 */
function generateID() {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    try {
      return globalThis.crypto.randomUUID();
    } catch {
      // Fall through to a non-crypto fallback if UUID generation is blocked.
    }
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/**
 * Read auth users from localStorage.
 *
 * @returns {Array<Object>} Stored users, or an empty array for missing or invalid data.
 */
function readUsers() {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Persist the full auth user collection.
 *
 * @param {Array<Object>} users User records to serialize into localStorage.
 */
function writeUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  publishCollectionChange(USERS_KEY);
}

/**
 * Ensure the auth user store has a default admin account.
 *
 * Seeding is skipped once any user exists so registered accounts are preserved.
 */
function Seed() {
  const users = readUsers();
  if (users.length > 0) return;

  const seedDB = [
    {
      id: generateID(),
      username: "adminDude",
      email: "aDude@studio.local",
      password: "admin123!!",
      role: "admin",
      employeeType: "",
      status: "active",
    },
  ];

  writeUsers(seedDB);
}

/**
 * Remove credentials before returning a user object to app state.
 *
 * @param {Object} user User record that may include a password.
 * @returns {Object} User record without the password field.
 */
function sanitize(user) {
  const { password: _password, ...safe } = user;
  return safe;
}

/**
 * Return all auth users, seeding the default admin when storage is empty.
 *
 * @returns {Array<Object>} Stored auth users, including mock passwords used for login.
 */
export function getUsers() {
  Seed();
  return readUsers();
}

/**
 * Accept both legacy positional registration args and object-shaped form data.
 *
 * @param {string|Object} emailOrData Email string or registration object.
 * @param {string} [username] Username when using positional args.
 * @param {string} [password] Password when using positional args.
 * @param {string} [role] Role when using positional args.
 * @returns {Object} Registration fields normalized into one object shape.
 */
function normalizeRegistrationArgs(emailOrData, username, password, role) {
  if (emailOrData && typeof emailOrData === "object") {
    return {
      email: emailOrData.email,
      username: emailOrData.username,
      password: emailOrData.password,
      role: emailOrData.role ?? "member",
      employeeType: emailOrData.employeeType ?? "",
    };
  }

  return { email: emailOrData, username, password, role, employeeType: "" };
}

/**
 * Register a new localStorage-backed user after required-field and duplicate checks.
 *
 * @param {string|Object} emailOrData Email string or object with email, username, password, role, and employeeType.
 * @param {string} [username] Username when using positional args.
 * @param {string} [password] Password when using positional args.
 * @param {string} [role="member"] Account role.
 * @returns {Promise<Object>} Result with a sanitized user on success or message on failure.
 */
export async function registerNewUser(
  emailOrData,
  username,
  password,
  role = "member"
) {
  Seed();
  const registration = normalizeRegistrationArgs(
    emailOrData,
    username,
    password,
    role
  );
  const email = String(registration.email ?? "").trim();
  const normalizedUsername = String(registration.username ?? "").trim();
  const normalizedPassword = String(registration.password ?? "");
  const normalizedRole = registration.role || "member";
  const normalizedEmployeeType =
    normalizedRole === "employee"
      ? registration.employeeType || "basic"
      : "";

  if (!email || !normalizedUsername || !normalizedPassword) {
    return { success: false, message: "Email, username, and password are required" };
  }

  const users = readUsers();
  const validation = validateUserIdentity({ email, username: normalizedUsername }, users);
  if (!validation.success) return validation;

  const newUser = {
    id: generateID(),
    username: normalizedUsername,
    email,
    password: normalizedPassword,
    role: normalizedRole,
    employeeType: normalizedEmployeeType,
    status: "active",
    createdAt: new Date().toISOString(),
  };

  writeUsers([...users, newUser]);
  return { success: true, user: sanitize(newUser) };
}

/**
 * Delete a stored user while preserving the active session user and at least one account.
 *
 * @param {string} userId User ID to remove.
 * @returns {Promise<Object>} Result with sanitized deleted user data or an error message.
 */
export async function deleteUser(userId) {
  Seed();
  const users = readUsers();
  const currentUser = restoreSession();
  const userIndex = users.findIndex((u) => u.id === userId);

  // Guard against deleting the account that owns the active local session.
  if (currentUser?.id === userId) {
    return {
      success: false,
      message: "Cannot delete currently logged in user",
    };
  }

  if (users.length <= 1) {
    return { success: false, message: "At least one user must remain" };
  }

  if (userIndex === -1) {
    return { success: false, message: "User not found" };
  }

  const deleted = users.splice(userIndex, 1);
  writeUsers(users);
  return { success: true, deleted: sanitize(deleted[0]) };
}

/**
 * Authenticate a user by username or email and persist a mock session token.
 *
 * @param {string} usernameOrEmail Username or email address to match case-insensitively.
 * @param {string} password Plain text mock password.
 * @returns {Promise<Object>} Result with sanitized user and token, or an error message.
 */
export async function login(usernameOrEmail, password) {
  Seed();
  const users = readUsers();
  const identifier = normalizeLoginIdentifier(usernameOrEmail);
  if (!identifier) return { success: false, message: "Email or username is required" };
  const matches = users.filter(
    (u) =>
      u && typeof u === "object" &&
      (normalizeLoginIdentifier(u.email) === identifier ||
      normalizeLoginIdentifier(u.username) === identifier)
  );
  if (matches.length > 1) {
    return { success: false, message: "Multiple accounts use this login. Ask an administrator to update their usernames or emails." };
  }
  const user = matches[0];
  if (!user) return { success: false, message: "User not found" };
  if (user.password !== password)
    return { success: false, message: "Invalid password" };
  if (getRoleHomePath(user.role) === "/") {
    return { success: false, message: "Account role is not supported" };
  }

  const token = `fake.${generateID()}`;
  // Persist token and sanitized user separately to mirror the app auth context.
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(sanitize(user)));
  publishCollectionChange(USER_KEY);
  return { success: true, user: sanitize(user), token };
}

/**
 * Clear the current mock auth session from localStorage.
 *
 * @returns {void}
 */
export function logout() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  publishCollectionChange(USER_KEY);
}

/**
 * Restore the persisted mock auth user when both token and user JSON are valid.
 *
 * @returns {Object|null} Sanitized user from storage, or null when no session can be restored.
 */
export function restoreSession() {
  const token = localStorage.getItem(TOKEN_KEY);
  const user = localStorage.getItem(USER_KEY);
  // Reads must not publish another collection event while an auth subscriber is restoring.
  // Removing both fields also prevents a later write from reviving a partial session.
  function clearInvalidSession() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    return null;
  }
  if (!token || !user) return clearInvalidSession();
  try {
    const parsedUser = JSON.parse(user);
    if (!parsedUser?.id) return clearInvalidSession();
    const matches = readUsers().filter((item) => item && typeof item === "object" && item.id === parsedUser.id);
    const storedUser = matches[0];

    if (matches.length !== 1 || getRoleHomePath(storedUser.role) === "/") {
      return clearInvalidSession();
    }

    const sanitizedUser = sanitize(storedUser);
    const serializedUser = JSON.stringify(sanitizedUser);
    // Native storage events reach other tabs. Avoid writing unchanged data back and forth.
    if (user !== serializedUser) localStorage.setItem(USER_KEY, serializedUser);
    return sanitizedUser;
  } catch {
    // Corrupt session JSON should behave like a missing session.
    return clearInvalidSession();
  }
}
