import SidebarItem from "./SidebarItem";
import styles from './Sidebar.module.css';
import { useAuth } from "../contexts/AuthContext";


/**
 * Defines the navigation entries exposed for each authenticated role.
 *
 * @type {Record<string, Array<{label: string, path: string}>>}
 */
const SIDEBAR_ITEMS ={
    admin: [
        {label: "Home", path: "/admin"},
        {label: "Users", path: "/admin/users"},
        {label: "Sales", path: "/admin/sales"},
        {label: "Bookings", path: "/admin/bookings"},
        {label: "Inventory", path: "/admin/inventory"},
        
    ],
    member: [
        {label: "Dashboard", path: "/member"},
        {label: "My Bookings", path: "/member/bookings"},
        {label: "Shop", path: "/member/shop"},
        {label: "Support", path: "/member/support"},
        {label: "Account Settings", path: "/member/account"},
    ],
    employee: [
        {label: "Dashboard", path: "/employee"},
    ]
}

/**
 * Renders the role-aware application navigation sidebar.
 * The authenticated user's role determines which static nav list is shown.
 *
 * @returns {JSX.Element} The sidebar navigation.
 */
function Sidebar() {
    const { user } = useAuth();
    const role = user?.role;



    return (
        <aside className={styles.sidebar}>
           {SIDEBAR_ITEMS[role]?.map((item) => (
                <SidebarItem key={item.path} label={item.label} path={item.path} />
           ))}
        </aside >
    )
}

export default Sidebar
