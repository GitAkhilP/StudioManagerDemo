import Button from "./Button";

/**
 * Format role and employee subtype for the admin user table.
 *
 * @param {object} user User record.
 * @returns {string} Display role label.
 */
function getUserRoleLabel(user) {
  if (user.role !== "employee") return user.role;

  const employeeType = user.employeeType || "basic";
  return `employee (${employeeType})`;
}

/**
 * Renders one user-management table row and delegates edit/delete actions.
 *
 * @param {{
 *   onDeleteClick: (event: React.MouseEvent<HTMLButtonElement>) => void,
 *   onEditClick: (event: React.MouseEvent<HTMLButtonElement>) => void,
 *   user: object,
 * }} props - User record and table action callbacks.
 * @returns {JSX.Element} The user table row.
 */
function UserRow({ onDeleteClick, onEditClick, user }) {
  return (
    <tr>
      <td>{user.email}</td>
      <td>{user.username}</td>
      <td>{getUserRoleLabel(user)}</td>
      <td>
        <Button
          data-user-id={user.id}
          text="Edit"
          variant="secondary"
          onClick={onEditClick}
        />
        <Button
          data-user-id={user.id}
          text="Delete"
          variant="danger"
          transform="shift-right"
          onClick={onDeleteClick}
        />
      </td>
    </tr>
  );
}

export default UserRow;
