import styles from "./SidebarItem.module.css";
import { useNavigate } from "react-router-dom";

/**
 * Renders a clickable sidebar entry that navigates through React Router.
 *
 * @param {object} props - Component props.
 * @param {string} props.label - Visible navigation label.
 * @param {string} props.path - Route pushed when the item is clicked.
 * @returns {JSX.Element} A sidebar navigation item.
 */
function SidebarItem({ label, path }) {
  const navigate = useNavigate();

  /**
   * Pushes the configured route through React Router.
   *
   * @returns {void}
   */
  function handleClick() {
    navigate(path);
  }

  return (
    <div className={styles.sidebarItem} onClick={handleClick}>
      <span>{label}</span>
    </div>
  );
}

export default SidebarItem;
