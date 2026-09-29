import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import AppLayout from "./layouts/AppLayout";
import Login from "./pages/Login";
import PageNotFound from "./pages/PageNotFound";
import ProtectedRoute from "./pages/ProtectedRoute";
import AdminPage from "./pages/AdminPages/AdminPage";
import MemberPage from "./pages/MemberPages/MemberPage";
import SupportPage from "./pages/MemberPages/SupportPage";
import AccountSettingsPage from "./pages/MemberPages/AccountSettingsPage";
import BookingsPage from "./pages/MemberPages/BookingsPage";
import ShopPage from "./pages/MemberPages/ShopPage";
import InventoryPage from "./pages/AdminPages/InventoryPage";
import UsersPage from "./pages/AdminPages/UsersPage";
import SalesPage from "./pages/AdminPages/SalesPage";
import AdminBookingsPage from "./pages/AdminPages/AdminBookingsPage";
import EmployeeDashboard from "./pages/EmployeePages/EmployeeDashboard";

/**
 * Defines the public login route plus role-gated route groups.
 * AppLayout is mounted as a parent route so authenticated chrome stays stable across page renders.
 *
 * @returns {import("react").ReactElement} Root application router.
 */
function App() {
  return (
    <>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route index element={<Login />} />

            {/* ProtectedRoute renders nested routes only after auth restoration and role checks finish. */}
            <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
              <Route element={<AppLayout />}>
                <Route path="/admin" element={<AdminPage />} />
                <Route path="/admin/inventory" element={<InventoryPage />} />
                <Route path="/admin/users" element={<UsersPage />} />
                <Route path="/admin/sales" element={<SalesPage />} />
                <Route path="/admin/bookings" element={<AdminBookingsPage />} />
              </Route>
            </Route>

            {/* Keep member-only pages under a separate guard so cross-role redirects stay predictable. */}
            <Route element={<ProtectedRoute allowedRoles={["member"]} />}>
              <Route element={<AppLayout />}>
                <Route path="/member" element={<MemberPage />} />
                <Route path="/member/support" element={<SupportPage />} />
                <Route
                  path="/member/account"
                  element={<AccountSettingsPage />}
                />
                <Route path="/member/bookings" element={<BookingsPage />} />
                <Route path="/member/shop" element={<ShopPage />} />
              </Route>
            </Route>

            <Route element={<ProtectedRoute allowedRoles={["employee"]} />}>
              <Route element={<AppLayout />}>
                <Route path="/employee" element={<EmployeeDashboard />} />
              </Route>
            </Route>

            <Route path="*" element={<PageNotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </>
  );
}

export default App;
