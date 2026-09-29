# Codex Handoff

## TL;DR

On **2026-09-16**, completed the three follow-up priorities below: synchronized authentication and identity validation, corrected booking drop-off/draft persistence, and reduced time-clock/storage work. Shared collection subscriptions also keep dashboards, inventory, shop, and notifications current. The earlier PR #11 seed migration repairs remain included. Work is uncommitted on `codex/fix-seed-migrations`; the pre-existing `package-lock.json` modification remains unrelated. At the user's request, the temporary Node test suite and `npm test` script were removed; the user will implement a Selenium/Cypress suite.

## 2026-09-16 - Auth, Booking Synchronization, and Time-Clock Efficiency

### Completed Priorities

1. **Auth synchronization and identity consistency**
   - Added shared, trimmed, case-insensitive username/email validation for registration and profile/admin updates. Cross-field collisions are rejected because either identifier can be used to log in.
   - Login rejects ambiguous legacy identifiers. Session restore resolves the canonical user, strips credentials, and clears corrupt, partial, deleted, duplicate-ID, or unsupported-role sessions.
   - AuthProvider responds to same-tab account/session writes and cross-tab storage events, including clear. Role/subtype/profile changes refresh consumers without a reload.
   - Centralized role home paths for login and protected-route fallback. Restored sessions and cross-tab logins now redirect from the login screen.
2. **Booking contracts and state synchronization**
   - Persist and display `dropoff` independently from `notes`; admins can edit both. Existing notes remain untouched because older combined text cannot be split reliably.
   - Admin drafts contain only edited fields. Saving one booking preserves other drafts, incoming updates refresh untouched fields, and quick status changes preserve unsaved notes/schedule edits.
   - Added a shared subscription helper for same-tab writes, cross-tab updates, clear events, and listener cleanup. Migrated the touched booking, inventory, shop, notification, auth, time-clock, and dashboard consumers.
   - Member upcoming/history views read bookings once. Shop categories reuse the loaded product snapshot; admin metrics reuse the loaded check-ins. Removed duplicate refreshes after successful writes.
   - Supervisor, member, and admin dashboards refresh relevant collection snapshots. Supervisor schedules advance at local midnight without rereading storage.
3. **Time-clock boundaries and efficiency**
   - Extracted a pure time summary that uses local calendar day/Sunday week boundaries and actual elapsed milliseconds across DST.
   - Filter employee history before normalization/sorting. The component loads history on identity/collection changes and recalculates from cached entries on ticks.
   - Active shifts update every 30 seconds; off-shift totals update at the next local midnight. Hidden tabs pause timers and refresh elapsed time when visible/focused.
   - Preserved newest-open-session clock-out behavior and employee-only/duplicate-clock-in guards. Malformed closed timestamps do not accumulate time as open sessions.

### Verification

- `npm.cmd run lint`: passed.
- Vite production build with `write: false`: passed, transforming 130 modules without writing build artifacts.
- Seven transient integration check groups passed using in-memory storage: migration reruns, identity collisions/immutable IDs, auth events, subscription filtering/cleanup, booking fields/ownership/single-read schedule, shared snapshots, and scoped clock history/actions.
- Isolated component checks passed for booking draft preservation, no-op saves, quick actions, dashboard same/cross-tab updates, user switches, midnight rollover, and cleanup. Fixed-time clock checks covered overnight/Sunday boundaries, 23/25-hour DST days, invalid timestamps, and newest sessions.
- `git diff --check`: passed with line-ending warnings only.
- Browser smoke could not run: the in-app browser runtime rejected initialization because its trusted native pipe bridge was unavailable. The isolated checks above are not browser verification; no real browser profile was changed.

### Test Ownership and Next Priorities

- Removed `tests/seedMigrations.test.js` and the temporary `npm test` command at the user's request. No replacement test framework or dependencies were added. Earlier entries below describe historical checks; they do not imply that suite remains installed.
- For the user's Selenium/Cypress suite, retain coverage for role/session restoration, cross-tab logout and role changes, duplicate identities, migration preservation, independent booking drafts/drop-off/notes, and clock day/week/DST boundaries.

1. Define supervisor permission boundaries and consolidate role/subtype labels and navigation around them. Route fallback paths are now shared, but forms/navigation still repeat role strings.
2. Add an admin/supervisor timekeeping review view, followed by corrections with audit metadata. These are required before shifts become operational records.
3. Introduce a backend-ready persistence boundary with server-side authorization and clock integrity. Current storage remains a local mock; cross-tab subscriptions do not make concurrent writes transactional.

Route splitting and pagination remain lower priority than these correctness and workflow gaps until bundle size or collection volume warrants them.

## 2026-09-16 - Seed Migration Identity and Ownership Fixes

### Completed

- Added `studio_employee_seed_identity_v2` so the repair runs once on both legacy and previously migrated profiles.
- Recognize obsolete seed fixtures by their known stored fields, preserving custom accounts and edited fixture accounts.
- Repair the legacy `user5` / Jordan ID collision and identifiable default seed copies recreated after renames. If a distinct edited account occupies Jordan's ID, retain that account and allocate a free ID to Jordan.
- Convert only untouched legacy staff records on their first upgrade. Usernames no longer grant employee privileges, and subsequent startups preserve intentional role/subtype changes, renames, and seed deletions.
- Prevent `dbUpdateUser()` from changing a user's primary key.
- Normalize check-in `userID` / `timeStamp` aliases before ownership migration, and recover original ownership where the previous migration left that information in `userID`.
- Resolve the recipient from the actual Jordan record, keep unknown customer references unchanged, and migrate related notifications with their activity.
- Log out retired seed identities before their IDs can resolve to another account; preserve Jordan's session when repairing its ID.
- Added `npm test` using Node's built-in test runner and isolated in-memory storage. No dependency installation or browser-data reset is needed.
- Retained Copilot's newest-open-session clock-out implementation and added regression coverage for it.

### Verification

- The initial suite reproduced 12 failures before the implementation changes.
- `npm.cmd test`: 19 regression tests passed using isolated in-memory storage.
- `npm.cmd run lint`: passed.
- Vite production build with `write: false`: passed, transforming 126 modules without writing build artifacts.
- `git diff --check`: passed with line-ending warnings only.

### Caveats

- Data already deleted by the earlier migration cannot be recovered without a backup. Roles already overwritten cannot be distinguished from intentional admin edits; review affected accounts manually.
- Where two distinct accounts already shared an ID, historical activity does not contain enough information to split ownership reliably. The repair preserves existing references on the original account instead of guessing; review historical attribution in such profiles.
- This is still localStorage-backed mock persistence. No actual browser profile was modified during implementation or testing.

### Next Priorities

1. Auth synchronization, consistent username/email uniqueness, and role-routing/session-restore coverage.
2. Booking data contracts and state synchronization: persist drop-off separately, preserve other unsaved booking drafts, and share collection subscriptions.
3. Broader time-clock boundary tests, followed by reducing history polling and redundant storage reads.

## <span style="color: lightgreen;"><u><strong>2026-07-02</strong></u></span> - Employee Roles, Time Clock, and Curated Seed Users

### Completed

- Added an `employee` auth role alongside existing `admin` and `member` roles.
- Added employee subtypes through `employeeType`:
  - `frontDeskAmy` is seeded as `employeeType: "supervisor"`.
  - `detailTechMax` is seeded as `employeeType: "basic"`.
- Added `/employee` route protection and login redirects:
  - `ProtectedRoute` now falls employee users back to `/employee`.
  - `Login.jsx` routes successful employee logins to `/employee`.
  - `Sidebar.jsx` exposes an employee dashboard nav item.
- Added `EmployeeDashboard`:
  - Basic employees see a minimal dashboard centered on clock in/clock out.
  - Supervisor employees see the same time clock plus front-desk snapshots for requested bookings, today's schedule, open support, and low inventory.
- Added reusable `EmployeeTimeClock`:
  - Uses persisted `studio_time_clock_entries`.
  - Prevents double clock-ins.
  - Requires an employee role for clock-in and clock-out writes.
  - Records `clockInAt`, `clockOutAt`, `durationMs`, daily totals, weekly totals, and active-shift elapsed time.
- Extended admin user management:
  - Admins can create/edit `Employee` users.
  - Employee subtype selection appears only when role is `employee`.
  - User table displays employee subtype labels like `employee (supervisor)`.
- Pruned seeded users:
  - Kept `adminDude` as admin.
  - Kept `frontDeskAmy` as supervisor employee.
  - Kept `detailTechMax` as basic employee.
  - Added `memberJordan` as the single seeded customer member for purchase/service flows.
- Reworked seeded customer activity:
  - Seed sales now include goods and service purchases for `memberJordan`.
  - Seed check-ins now belong to `memberJordan`.
  - Seed bookings and support requests now belong to `memberJordan` instead of employee accounts.
- Added localStorage migrations:
  - Existing seeded/generated users are pruned to the curated seed set once.
  - Existing storage gets `memberJordan` added if missing.
  - Legacy customer records tied to Amy/Max or removed generated users are migrated to `memberJordan` once.
  - Restored auth sessions now refresh from the stored user record and log out if the session user was pruned.
- Spawned worker `Lorentz` to own the seed-user pruning in `src/services/mockData.js`; parent integrated route, dashboard, time-clock, and migration work.

### Verification

- `npm.cmd run lint`: passed.
- `npm.cmd run build`: passed.
- `git diff --check`: passed with Git line-ending warnings only.
- Vite served HTTP 200 at `http://127.0.0.1:5173` while the launch command remained alive, but this shell environment reaped detached child processes after command exit.

### Caveats


- `package-lock.json` was already modified before this session and remains unrelated to this work.
- Time-clock persistence is still localStorage-backed mock data; a backend migration will need server-side clock session integrity, device/user audit fields, and admin correction workflows.
- Existing localStorage data is migration-driven. A fresh browser profile will show the curated seed state immediately; an existing profile will update at app startup through `seedDB()`.

### Next 10 Highest Priority Updates/Fixes

1. Add automated coverage for role routing and auth restore: admin, supervisor employee, basic employee, member, wrong-role redirects, and pruned-session logout.
2. Add service-level tests for the time clock: clock-in, duplicate clock-in rejection, clock-out, non-employee rejection, duration math, daily totals, weekly totals, and active sessions crossing midnight.
3. Add migration tests for curated users and member activity reassignment so localStorage upgrades do not accidentally delete future admin-created accounts.
4. Centralize role and employee subtype constants, route fallback helpers, and display labels so `admin`/`member`/`employee` strings are not repeated across auth, routes, forms, and UI.
5. Add an admin/supervisor timekeeping view for reviewing employee shifts, open sessions, daily totals, and weekly totals.
6. Add a time-clock correction workflow with audit metadata before any production backend migration.
7. Add explicit supervisor permission boundaries: decide which admin-like pages, if any, supervisor employees can access beyond the front-desk dashboard.
8. Replace localStorage-only mock persistence with a backend-ready data boundary for users, time-clock entries, sales, bookings, notifications, and inventory.
9. Rework seeded sales/check-in/dashboard metrics so admin summaries remain coherent with the smaller curated user set and no longer depend on generated users.
10. Split `Sidebar` into `SidebarNav` plus semantic `NavItem`, then move nav definitions behind role/subtype-aware helpers.

## <span style="color: lightgreen;"><u><strong>2026-05-29</strong></u></span> - Render Boundaries, Display Primitives, Parent Layout, and Auth Memoization

### Completed

- Extracted repeated display/render boundaries into focused components:
  - `NotificationMenu`, `AdminTableCard`, `SaleRow`, `UserRow`, and `AdminBookingCard`.
  - `BookingList`, `BookingCard`, `BookingHistoryItem`, `SupportRequestList`, and `SupportRequestRow`.
  - `ProductCard`, `CartSummary`, and `CartItem`.
  - Page components still own state, persistence calls, and event handlers; extracted components mostly render data and delegate named callbacks.
- Added shared display primitives:
  - `PageShell`, `SectionPanel`, `StatTile`, `EmptyState`, `StatusBadge`, `KeyValueRow`, and `TotalsRow`.
  - Added `DisplayPrimitives.module.css` plus `displayPrimitiveUtils.js` for tiny shared class composition.
  - Migrated the new extracted components and the touched admin/member pages onto these primitives while preserving existing CSS module styling hooks.
- Moved authenticated chrome to React Router parent routes:
  - `AppLayout` now renders an `<Outlet />`.
  - `App.jsx` nests admin and member pages under role-gated `ProtectedRoute` groups and a single `AppLayout` parent per role area.
  - Removed page-level `AppLayout` imports and wrappers from admin and member pages so page state changes do not recreate header/sidebar chrome.
- Memoized auth context:
  - `login`, `register`, and `logout` now use `useCallback`.
  - `AuthContext.Provider` now receives a `useMemo`-stable value object.
  - Comments were updated to describe stable helper/context-value ownership.
- Branch housekeeping:
  - Verified `codex/handoff-3-display-primitives`, `codex/handoff-4-router-layout`, and `codex/handoff-5-auth-context-memo` had no unique commits.
  - Deleted those base-only branches and continued all work on `codex/handoff-2-render-boundaries`.
  - Work remains unstaged and uncommitted.

### Verification

- `npm run lint`: passed after each subtask.
- `npm run build`: passed after each subtask.
- `git diff --check`: passed.
- Browser smoke passed for:
  - Admin users, sales, bookings, inventory, and dashboard routes.
  - Member dashboard, bookings, support, shop, and account routes.
  - Wrong-role redirects from `/member` as admin and `/admin` as member.
  - Shop add-to-cart behavior after display primitive migration.
  - Member notification menu render/open path.
  - Auth login, session restore after reload, and logout.
  - Browser console errors: `0`.

### Caveats

- Automated tests are still intentionally deferred. The next test pass can target service helpers once Cypress/Playwright/Selenium and CI/CD choices are settled.
- Browser text fill/type APIs still sometimes hit the in-app virtual clipboard issue noted previously; route/auth smoke worked around this with per-key presses.
- The app still persists dev data in browser localStorage. Clean first-load verification should clear `studio_*` keys or use a fresh browser profile.

### Next Best Work

1. Add focused automated tests for `dbCheckoutShopOrder()`, `dbUpdateBooking()`, notification read helpers, and inventory-derived shop products.
2. Split Sidebar into `SidebarNav` plus semantic `NavItem` once navigation behavior settles.
3. Consider migrating remaining dashboard-only card/detail rows to the new display primitives where it improves consistency without fighting page-specific layouts.

## <span style="color: lightgreen;"><u><strong>2026-05-27</strong></u></span> - Persistent Member/Admin State and Comment Coverage

- Added localStorage-backed persistence plumbing so inventory, checkout, sales, bookings, notifications, and admin/member views stay synchronized.
- Reworked member shop checkout to source from `studio_inventory`, validate cart quantities, decrement shared stock, record sales, notify members, and clear stale selections.
- Added member notifications and admin booking management, including booking drafts, status filters, quick actions, member update notifications, and read-state controls.
- Fixed clear/toggle/reset behavior across booking, shop, support, settings, admin inventory, admin sales, and admin users flows while preserving backend-migration-friendly service helpers.
- Verification passed lint/build/diff checks, JSDoc and inline-handler scans, service-level inventory sync smoke, and browser smoke for checkout, notifications, admin booking actions, and admin-visible inventory updates.

## Previous Context - Consolidated

### <span style="color: lightgreen;"><u><strong>2026-05-25</strong></u></span> and Earlier

- On <span style="color: lightgreen;"><u><strong>2026-05-25</strong></u></span>, completed the first render-boundary refactor: form state now lives inside extracted form/panel components instead of the six page components.
- Added shared form primitives: `src/components/AdminFormCard.jsx`, `src/components/AdminFormCard.module.css`, `src/components/FormField.jsx`, `src/components/SelectField.jsx`, `src/components/ToggleRow.jsx`, and `src/components/PasswordField.jsx`.
- Added stateful member/admin form panels: `src/components/BookingRequestPanel.jsx`, `src/components/SupportRequestPanel.jsx`, and `src/components/SettingsSection.jsx`.
- Refactored page-local form state out of `src/pages/AdminPages/UsersPage.jsx`, `src/pages/AdminPages/SalesPage.jsx`, `src/pages/AdminPages/InventoryPage.jsx`, `src/pages/MemberPages/BookingsPage.jsx`, `src/pages/MemberPages/SupportPage.jsx`, and `src/pages/MemberPages/AccountSettingsPage.jsx`.
- Spawned one worker per page. Each worker owned a disjoint page slice; shared components were integrated by the parent pass. Page CSS modules stayed in use via `styles` props where practical, with styling changes allowed when they improved consistency.
- Render-boundary results:
  - `UserFormCard` owns add/update form state, password mismatch state, show-password state, and form errors, while `UsersPage` owns users, delete errors, and edit selection only.
  - `SaleFormCard` owns sale form state, `itemsInput`, validation, parsing, and submit logic, while `SalesPage` owns users and sales only.
  - `InventoryFormCard` owns add-item form state and validation, while `InventoryPage` owns inventory data and remove handling.
  - `BookingRequestPanel` owns vehicle/date/time/dropoff/notes/message/error state, while `BookingsPage` owns booking lists and selected service ID for the summary tile.
  - `SupportRequestPanel` owns ticket form state, notice, priority selection, validation, and submit logic, while `SupportPage` owns reference data, request stats, and recent requests.
  - `SettingsSection` owns profile/preferences/security/message/error state, while `AccountSettingsPage` owns `accountUser`, summary cards, and header initials.
- Styling polish:
  - `AdminFormCard` collapse/expand controls now use `-` and `+` instead of chevrons.
  - The toggle button sits directly beside the form title for Add User and Record Sale.
  - Expanded/collapse state keeps the current pink treatment; collapsed/expand-available state uses a blue accent.
  - The button is smaller, rounded, and shared through `AdminFormCard.module.css`.
  - Stale Users form-title margin that misaligned the Add User toggle was removed.
- Verification at that time passed `npm run lint` with 0 errors and 6 known warnings, `npm run build`, and `git diff --check`.
- Browser sanity tested all six extracted panels and submit/save flows for admin Users, Sales, Inventory and member Bookings, Support, Account Settings; browser console errors were clean.
- Browser verification created a few `Codex`-labeled records in localStorage-backed dev data.
- Known warnings at that time were `Header.jsx` unused `headerToggle` and `setHeaderToggle`, `AdminPage.jsx` unused `setError`, `Login.jsx` unused `isAuthenticated`, `mockAuth.js` unused `password` from sanitization destructuring, and `mockDbServices.js` unused caught `err`.
- Next best work from that entry was to extract list/table/row render boundaries including `AdminTableCard`, `SaleRow`, `UserRow`, `BookingList`, `BookingCard`, `BookingHistoryItem`, `SupportRequestList`, `SupportRequestRow`, `ProductCard`, `CartSummary`, and `CartItem`; add shared display primitives including `PageShell`, `Panel` or `SectionPanel`, `StatTile`, `EmptyState`, `StatusBadge`, `KeyValueRow`, and `TotalsRow`; move `AppLayout` to React Router parent routes; memoize the `AuthContext` value; broaden `Button` props/classes; and split Sidebar into `SidebarNav` plus semantic `NavItem`.
- On <span style="color: lightgreen;"><u><strong>2026-05-22</strong></u></span>, added `Card`, `Card.module.css`, and `MetricCard`, then migrated dashboard/member card surfaces with `variant="custom"` for visual parity.
- Also on <span style="color: lightgreen;"><u><strong>2026-05-22</strong></u></span>, completed the read-only component extraction audit, identifying form state as the biggest immediate render win and row/list extraction as the next target.
- Also on <span style="color: lightgreen;"><u><strong>2026-05-22</strong></u></span>, fixed high-priority stability issues around ID generation, auth registration, route fallback behavior, textarea caret visibility, and stale sales-user validation.
- On <span style="color: lightgreen;"><u><strong>2026-05-21</strong></u></span>, added member dashboard, bookings, shop, support, and account pages with seeded scoped data and verified route rendering/scroll behavior.
- Earlier work stabilized admin inventory/check-ins/summary metrics/layout scrolling, normalized mock DB check-in fields, and ran `npm audit fix` to 0 vulnerabilities.
