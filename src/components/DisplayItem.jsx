import styles from "./DisplayItem.module.css";
import Button from "./Button";

/**
 * Displays a removable inventory or user-list row with either quantity or role metadata.
 *
 * @param {object} props - Component props.
 * @param {number|string} props.index - Optional row index badge.
 * @param {string} props.name - Primary item name.
 * @param {string} props.description - Secondary item text.
 * @param {number} [props.quantity=0] - Quantity shown when no role is supplied.
 * @param {Function} props.onRemove - Remove-button click handler.
 * @param {object} [props.removeButtonProps={}] - Native attributes forwarded to the remove button.
 * @param {string} props.role - Optional role label for user rows.
 * @returns {JSX.Element} A list item with remove action.
 */
function DisplayItem({
  index,
  name,
  description,
  quantity = 0,
  onRemove,
  removeButtonProps = {},
  role,
}) {
  return (
    <li className={styles.displayItem}>
      {index != null && <span className={styles.itemIndex}>{index}</span>}
      <div className={styles.main}>
        <h3 className={styles.itemName}>{name}</h3>
        <p className={styles.itemDescription}>{description}</p>
      </div>

      <div className={styles.right}>
        <span className={styles.itemQuantity}>{role ? `Role: ${role}` : `Quantity: ${quantity}`}</span>
        <Button
          {...removeButtonProps}
          text="X"
          variant="danger"
          onClick={onRemove}
          transform="shift-right"
        />
      </div>
    </li>
  );
}

export default DisplayItem;
