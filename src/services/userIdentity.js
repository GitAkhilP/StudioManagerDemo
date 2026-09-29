/** Normalize either login identifier without changing its stored display case. */
export function normalizeLoginIdentifier(value) {
  return String(value ?? "").trim().toLowerCase();
}

/**
 * Keep usernames and email addresses unambiguous across the shared login field.
 * Pass the complete candidate record and its existing ID when editing an account.
 */
export function validateUserIdentity(candidate, users, ignoreUserId) {
  const username = normalizeLoginIdentifier(candidate?.username);
  const email = normalizeLoginIdentifier(candidate?.email);

  if (!username || !email) {
    return { success: false, message: "Email and username are required" };
  }

  const identifiers = new Set([username, email]);
  const duplicate = users.some((user) => {
    if (!user || (ignoreUserId != null && user.id === ignoreUserId)) return false;
    return identifiers.has(normalizeLoginIdentifier(user.username)) ||
      identifiers.has(normalizeLoginIdentifier(user.email));
  });

  return duplicate
    ? { success: false, message: "Username or email is already used by another account" }
    : { success: true };
}
