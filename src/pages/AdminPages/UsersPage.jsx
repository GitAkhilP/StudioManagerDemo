import styles from "./UsersPage.module.css";
import { useState, useEffect } from "react";
import AdminTableCard from "../../components/AdminTableCard";
import Button from "../../components/Button";
import AdminFormCard from "../../components/AdminFormCard";
import FormField from "../../components/FormField";
import PageShell from "../../components/PageShell";
import SelectField from "../../components/SelectField";
import ToggleRow from "../../components/ToggleRow";
import PasswordField from "../../components/PasswordField";
import UserRow from "../../components/UserRow";
import { dbGetUsers, dbUpdateUser } from "../../services/mockDbServices";
import { registerNewUser, deleteUser } from "../../services/mockAuth";

/**
 * Blank state for the add/edit user form.
 */
const EMPTY_FORM = {
  username: "",
  email: "",
  password: "",
  repeatPassword: "",
  role: "member",
  employeeType: "",
};

const ROLE_OPTIONS = [
  { value: "member", label: "Member" },
  { value: "employee", label: "Employee" },
  { value: "admin", label: "Admin" },
];

const EMPLOYEE_TYPE_OPTIONS = [
  { value: "basic", label: "Basic employee" },
  { value: "supervisor", label: "Supervisor" },
];

/**
 * Converts a stored user record into editable form state.
 *
 * @param {object|null} user - User selected for editing.
 * @returns {{ username: string, email: string, password: string, repeatPassword: string, role: string, employeeType: string }}
 * Form values for the selected user or a blank form.
 */
function getFormFromUser(user) {
  if (!user) {
    return EMPTY_FORM;
  }

  return {
    username: user.username,
    email: user.email,
    password: user.password,
    repeatPassword: user.password,
    role: user.role,
    employeeType: user.role === "employee" ? user.employeeType || "basic" : "",
  };
}

/**
 * Renders the create/update user form and switches behavior by editing state.
 *
 * @param {{
 *   editingUser: object|null,
 *   onSaved: () => void,
 *   onCancelEdit: () => void
 * }} props - User form mode and callbacks.
 * @returns {JSX.Element} The user form card.
 */
function UserFormCard({ editingUser, onSaved, onCancelEdit }) {
  // Tracks the controlled fields for either create or edit mode.
  const [form, setForm] = useState(() => getFormFromUser(editingUser));
  // Stores validation and service errors scoped to the form.
  const [formError, setFormError] = useState("");
  // Toggles both password inputs between masked and visible text.
  const [showPassword, setShowPassword] = useState(false);
  // Forces AdminFormCard to remount when edit mode should reopen the card.
  const [cardKey, setCardKey] = useState(0);
  // Controls whether the collapsible form opens automatically for edits.
  const [openOnMount, setOpenOnMount] = useState(false);

  const isEditing = Boolean(editingUser);
  const passwordMismatch = Boolean(
    form.password && form.repeatPassword && form.password !== form.repeatPassword
  );
  const isFormComplete = Boolean(
    form.email && form.username && form.password && form.repeatPassword
  );
  const isSubmitDisabled =
    !isFormComplete || Boolean(formError) || passwordMismatch;

  // Rebuild the form any time the selected table row changes.
  useEffect(() => {
    setForm(getFormFromUser(editingUser));
    setFormError("");
    setShowPassword(false);

    if (editingUser) {
      // Force the collapsible card to re-read defaultOpen when edit mode begins.
      setOpenOnMount(true);
      setCardKey((key) => key + 1);
    }
  }, [editingUser]);

  /**
   * Clears form state back to create-user defaults.
   */
  function resetForm() {
    setForm(EMPTY_FORM);
    setFormError("");
    setShowPassword(false);
  }

  /**
   * Updates a form field and removes stale validation feedback.
   *
   * @param {object} e - Field change event.
   */
  function handleChange(e) {
    const { name, value } = e.target;
    setFormError("");
    setForm((prevForm) => {
      if (name === "role") {
        return {
          ...prevForm,
          role: value,
          employeeType:
            value === "employee" ? prevForm.employeeType || "basic" : "",
        };
      }

      return { ...prevForm, [name]: value };
    });
  }

  /**
   * Supports both ToggleRow's boolean callback and native checkbox events.
   *
   * @param {boolean|object} eventOrChecked - Toggle value or change event.
   */
  function handleShowPasswordChange(eventOrChecked) {
    const checked =
      typeof eventOrChecked === "boolean"
        ? eventOrChecked
        : eventOrChecked?.target?.checked ?? !showPassword;
    setShowPassword(checked);
  }

  /**
   * Saves an edited user or registers a new user after shared form validation.
   *
   * @param {object} e - Form submit event.
   */
  async function handleSubmit(e) {
    e.preventDefault();
    setFormError("");

    if (!isFormComplete || passwordMismatch) {
      return;
    }

    if (isEditing) {
      // Updates can stay synchronous because the mock DB owns existing users.
      const res = dbUpdateUser(editingUser.id, {
        username: form.username.trim(),
        email: form.email.trim(),
        password: form.password.trim(),
        role: form.role,
        employeeType:
          form.role === "employee" ? form.employeeType || "basic" : "",
      });

      if (!res.success) {
        setFormError(res.message);
        return;
      }

      resetForm();
      onSaved();
      return;
    }

    try {
      // New users go through auth registration so uniqueness rules stay centralized.
      const res = await registerNewUser({
        email: form.email.trim(),
        username: form.username.trim(),
        password: form.password.trim(),
        role: form.role,
        employeeType:
          form.role === "employee" ? form.employeeType || "basic" : "",
      });

      if (!res.success) {
        setFormError(res.message);
        return;
      }

      resetForm();
      onSaved();
    } catch (error) {
      setFormError(error.message);
    }
  }

  /**
   * Leaves edit mode and restores the create-user form.
   */
  function handleCancel() {
    resetForm();
    onCancelEdit();
  }

  return (
    <AdminFormCard
      key={cardKey}
      styles={styles}
      title={isEditing ? "Update User" : "Add User"}
      collapsible
      defaultOpen={openOnMount}
    >
      <form onSubmit={handleSubmit}>
        <FormField
          styles={styles}
          label="Email"
          type="email"
          id="email"
          name="email"
          value={form.email}
          onChange={handleChange}
          required
          placeholder="User Email"
        />

        <FormField
          styles={styles}
          label="Username"
          type="text"
          id="username"
          name="username"
          value={form.username}
          onChange={handleChange}
          required
          placeholder="Username"
        />

        <PasswordField
          styles={styles}
          label="Password"
          id="password"
          name="password"
          value={form.password}
          onChange={handleChange}
          showPassword={showPassword}
          type={showPassword ? "text" : "password"}
          required
          placeholder="Password"
        />

        <PasswordField
          styles={styles}
          label="Repeat Password"
          id="repeatPassword"
          name="repeatPassword"
          value={form.repeatPassword}
          onChange={handleChange}
          showPassword={showPassword}
          type={showPassword ? "text" : "password"}
          required
          placeholder="Repeat Password"
        />

        <ToggleRow
          styles={styles}
          label="Show Password"
          id="showPassword"
          checked={showPassword}
          onChange={handleShowPasswordChange}
        />

        {passwordMismatch && (
          <p className={styles.error}>Passwords do not match</p>
        )}

        <SelectField
          styles={styles}
          label="Role"
          id="role"
          name="role"
          value={form.role}
          onChange={handleChange}
          required
          options={ROLE_OPTIONS}
        />

        {form.role === "employee" && (
          <SelectField
            styles={styles}
            label="Employee Type"
            id="employeeType"
            name="employeeType"
            value={form.employeeType || "basic"}
            onChange={handleChange}
            required
            options={EMPLOYEE_TYPE_OPTIONS}
          />
        )}

        {formError && <p className={styles.error}>{formError}</p>}

        {isEditing ? (
          <>
            <Button
              text="Update User"
              type="submit"
              variant="primary"
              transform="shift-left"
              disabled={isSubmitDisabled}
            />
            <Button
              text="Cancel"
              variant="secondary"
              onClick={handleCancel}
              transform="shift-right"
            />
          </>
        ) : (
          <>
            <Button
              text="Add User"
              type="submit"
              variant="primary"
              transform="shift-down"
              disabled={isSubmitDisabled}
            />
            <Button
              text="Clear"
              variant="secondary"
              onClick={resetForm}
              transform="shift-right"
            />
          </>
        )}
      </form>
    </AdminFormCard>
  );
}

/**
 * Provides admin user management for creating, editing, and deleting accounts.
 * The route-level AppLayout supplies authenticated chrome for this page.
 * The page owns persistence and edit state; UserRow owns repeated table-row markup.
 * PageShell provides the shared outer page primitive.
 *
 * @returns {JSX.Element} The user management page.
 */
function UsersPage() {
  // Stores the user table rows loaded from the mock auth/database layer.
  const [users, setUsers] = useState([]);
  // Holds delete-specific feedback outside the create/edit form.
  const [deleteError, setDeleteError] = useState("");
  // Tracks the selected user id that drives edit mode.
  const [editingUserId, setEditingUserId] = useState(null);

  // Prime the user table from storage on page load.
  useEffect(() => {
    setUsers(dbGetUsers());
  }, []);

  /**
   * Reloads users from storage after create, update, or delete operations.
   */
  function refreshUsers() {
    setUsers(dbGetUsers());
  }

  /**
   * Attempts to delete a user and clears edit state for that selected row.
   *
   * @param {string} userId - User id to delete.
   */
  async function handleDelete(userId) {
    try {
      setDeleteError("");
      const res = await deleteUser(userId);
      // Refresh before showing failures so the table mirrors the latest storage snapshot.
      refreshUsers();
      if (editingUserId === userId) {
        setEditingUserId(null);
      }
      if (!res.success) {
        setDeleteError(res.message);
        if (window.confirm(res.message)) {
          setDeleteError("");
        }
      }
    } catch (error) {
      setDeleteError(error.message);
      console.log(error + " caught in handleDelete");
    }
  }

  /**
   * Selects a user for editing and clears stale delete feedback.
   *
   * @param {string} userId - User id selected from the table.
   */
  function handleEdit(userId) {
    setDeleteError("");
    setEditingUserId(userId);
  }

  /**
   * Selects the table row whose edit button was clicked.
   *
   * @param {React.MouseEvent<HTMLButtonElement>} event - Edit button click event.
   */
  function handleEditClick(event) {
    handleEdit(event.currentTarget.dataset.userId);
  }

  /**
   * Deletes the table row whose delete button was clicked.
   *
   * @param {React.MouseEvent<HTMLButtonElement>} event - Delete button click event.
   */
  function handleDeleteClick(event) {
    handleDelete(event.currentTarget.dataset.userId);
  }

  /**
   * Reconciles the table and exits edit mode after a successful save.
   */
  function handleUserSaved() {
    refreshUsers();
    setDeleteError("");
    setEditingUserId(null);
  }

  /**
   * Exits edit mode without changing the stored user list.
   */
  function handleCancelEdit() {
    setDeleteError("");
    setEditingUserId(null);
  }

  const editingUser = users.find((user) => user.id === editingUserId) || null;

  return (
    <PageShell className={styles.page}>
      <div className={styles.headerRow}>
        <h1 className={styles.title}>User Management</h1>
      </div>

      <section className={styles.section}>
        <UserFormCard
          editingUser={editingUser}
          onSaved={handleUserSaved}
          onCancelEdit={handleCancelEdit}
        />
      </section>

      {deleteError && <p className={styles.error}>{deleteError}</p>}

      <section className={styles.section}>
        <AdminTableCard
          emptyMessage="No users found."
          headers={["Email", "Username", "Role", "Actions"]}
          isEmpty={users.length === 0}
          styles={styles}
          title="User List"
        >
          {users.map((user) => (
            <UserRow
              key={user.id}
              onDeleteClick={handleDeleteClick}
              onEditClick={handleEditClick}
              user={user}
            />
          ))}
        </AdminTableCard>
      </section>
    </PageShell>
  );
}

export default UsersPage;
