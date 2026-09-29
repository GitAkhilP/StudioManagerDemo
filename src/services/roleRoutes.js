const ROLE_HOME_PATHS = {
  admin: "/admin",
  employee: "/employee",
  member: "/member",
};

/** Return the role's landing page, or the public login for an unknown role. */
export function getRoleHomePath(role) {
  return Object.prototype.hasOwnProperty.call(ROLE_HOME_PATHS, role) ? ROLE_HOME_PATHS[role] : "/";
}
