import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import styles from "./AppLayout.module.css";
import Header from "../components/Header";

/**
 * Provides authenticated route chrome once per role route group.
 * Nested pages render through Outlet so page state changes do not recreate the header/sidebar.
 *
 * @returns {import("react").ReactElement} Application layout.
 */
function AppLayout() {
  return (
    <div className={styles.shell}>
      <Header />
      <div className={styles.layout}>
        <Sidebar />
        <main className={styles.main}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AppLayout;
