import { useCallback, useEffect, useState } from "react";
import AdminTableCard from "../../components/AdminTableCard";
import AdminFormCard from "../../components/AdminFormCard";
import Button from "../../components/Button";
import FormField from "../../components/FormField";
import PageShell from "../../components/PageShell";
import SaleRow from "../../components/SaleRow";
import SelectField from "../../components/SelectField";
import styles from "./SalesPage.module.css";
import {
  dbGetUsers,
  dbGetSales,
  dbAddSale,
} from "../../services/mockDbServices";

/**
 * Builds a fresh sale form state so resets do not reuse mutable arrays.
 *
 * @returns {{ userId: string, amount: string, items: string[], description: string }}
 * The blank sale form state.
 */
function createInitialSaleForm() {
  return {
    userId: "",
    amount: "",
    items: [],
    description: "",
  };
}

/**
 * Records a sale against an eligible member and refreshes the sales ledger.
 *
 * @param {{
 *   users: Array<object>,
 *   refreshUsers: (currentUsers?: Array<object>) => void,
 *   refreshSales: () => void
 * }} props - Sale form data and refresh callbacks.
 * @returns {JSX.Element} The sale entry form card.
 */
function SaleFormCard({ users, refreshUsers, refreshSales }) {
  // Tracks controlled sale form fields.
  const [form, setForm] = useState(createInitialSaleForm);
  // Keeps the editable comma-separated item text alongside parsed items.
  const [itemsInput, setItemsInput] = useState("");
  // Holds sale validation and persistence feedback.
  const [error, setError] = useState(null);

  /**
   * Converts the comma-separated item field into persisted sale item names.
   *
   * @param {string} itemsString - Raw item input text.
   * @returns {string[]} Trimmed item names.
   */
  function parseItems(itemsString) {
    return itemsString
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }

  /**
   * Updates a single sale form field by input name.
   *
   * @param {object} e - Field change event.
   */
  function handleChange(e) {
    const { name, value } = e.target;
    setForm((currentForm) => ({ ...currentForm, [name]: value }));
  }

  /**
   * Keeps the raw items text and parsed item array synchronized.
   *
   * @param {object} e - Items field change event.
   */
  function handleItemsChange(e) {
    const { value } = e.target;
    setItemsInput(value);
    setForm((currentForm) => ({
      ...currentForm,
      items: parseItems(value),
    }));
  }

  /**
   * Clears sale form input and validation feedback after save or manual reset.
   */
  function resetSaleForm() {
    setForm(createInitialSaleForm());
    setItemsInput("");
    setError(null);
  }

  /**
   * Validates the sale, rechecks member eligibility, and writes the sale record.
   *
   * @param {object} e - Form submit event.
   */
  function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (!form.userId || !form.amount || form.items.length === 0) {
      setError("Please fill in all required fields.");
      return;
    }

    const amount = Number(form.amount);
    if (isNaN(amount) || amount <= 0) {
      setError("Amount must be a positive number.");
      return;
    }

    // Re-read users at submit time so deleted or inactive members cannot receive new sales.
    const currentUsers = dbGetUsers();
    const selectedUser = currentUsers.find((user) => user.id === form.userId);
    if (!selectedUser) {
      refreshUsers(currentUsers);
      setError("Selected member no longer exists. Please choose another member.");
      return;
    }

    if (selectedUser.status && selectedUser.status !== "active") {
      refreshUsers(currentUsers);
      setError("Selected member is not active. Please choose an active member.");
      return;
    }

    const res = dbAddSale({
      userId: form.userId,
      amount,
      items: form.items,
      description: form.description,
    });
    console.log("Add Sale Result:", res);
    if (!res.success) {
      setError(res.message);
      return;
    }
    resetSaleForm();
    refreshSales();
  }

  return (
    <AdminFormCard
      styles={styles}
      title="Record Sale"
      collapsible
      defaultOpen
    >
      <form className={styles.form} onSubmit={handleSubmit}>
        <FormField
          className={styles.amountRow}
          controlClassName={styles.amountInput}
          id="amount"
          label="Amount"
          min="0"
          name="amount"
          onChange={handleChange}
          placeholder="e.g. 49.99"
          step="0.01"
          type="number"
          value={form.amount}
        />

        <SelectField
          className={styles.memberRow}
          id="userId"
          label="Member"
          name="userId"
          onChange={handleChange}
          options={users.map((user) => ({
            label: `${user.username} (${user.email})`,
            value: user.id,
          }))}
          placeholder="Select Member"
          value={form.userId}
        />

        <FormField
          className={styles.itemRow}
          id="items"
          label="Items Sold"
          name="items"
          onChange={handleItemsChange}
          placeholder="e.g. Item 1, Item 2"
          value={itemsInput}
        />

        <FormField
          as="textarea"
          className={styles.formRow}
          controlClassName={styles.descriptionInput}
          id="description"
          label="Description"
          name="description"
          onChange={handleChange}
          placeholder="e.g. Monthly membership"
          value={form.description}
        />

        {error && <p className={styles.error}>{error}</p>}

        <div className={styles.actions}>
          <Button
            type="submit"
            text="Add Sale"
            variant="primary"
            transform="pop"
            disabled={!form.userId || !form.amount}
          />
          <Button
            text="Clear"
            variant="secondary"
            onClick={resetSaleForm}
            transform="shift-right"
          />
        </div>
      </form>
    </AdminFormCard>
  );
}

/**
 * Shows sales entry controls and the recent sale history for admins.
 * The route-level AppLayout supplies authenticated chrome for this page.
 * Page state stays here while AdminTableCard and SaleRow own the table display boundary.
 * PageShell provides the shared outer page primitive.
 *
 * @returns {JSX.Element} The sales management page.
 */
function SalesPage() {
  // Stores member options used by the sale form and table labels.
  const [users, setUsers] = useState([]);
  // Stores the sale records displayed in the recent-sales table.
  const [sales, setSales] = useState([]);

  /**
   * Stores current member options, optionally reusing a caller-supplied snapshot.
   *
   * @param {Array<object>} currentUsers - Current member records.
   */
  // Stabilize the refresh callback for the initial load effect and child form.
  const refreshUsers = useCallback((currentUsers = dbGetUsers()) => {
    setUsers(currentUsers);
  }, []);

  /**
   * Reloads persisted sales after the form records a new transaction.
   */
  // Stabilize the sales reload callback for effects and post-submit refreshes.
  const refreshSales = useCallback(() => {
    setSales(dbGetSales());
  }, []);

  // Load members and sales together when the page mounts.
  useEffect(() => {
    refreshUsers();
    refreshSales();
  }, [refreshUsers, refreshSales]);

  /**
   * Formats persisted sale timestamps for the admin table.
   *
   * @param {string} iso - Stored sale timestamp.
   * @returns {string} Local date and time, or blank text for invalid values.
   */
  function formatDate(iso) {
    if (!iso) return "";
    const date = new Date(iso);
    if (isNaN(date.getTime())) return "";
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  }

  return (
    <PageShell className={styles.page}>
      <div className={styles.headerRow}>
        <h1 className={styles.title}>Sales Management</h1>
      </div>

      <section className={styles.section}>
        <SaleFormCard
          users={users}
          refreshUsers={refreshUsers}
          refreshSales={refreshSales}
        />
      </section>

      <section className={styles.salesSection}>
        <div className={styles.headerRow}>
          <h2 className={styles.sectionTitle}>Sales Records</h2>
        </div>
        <AdminTableCard
          emptyMessage="No sales recorded yet."
          headers={["Member", "Amount", "Description", "Date"]}
          isEmpty={sales.length === 0}
          styles={styles}
          title="Recent Sales"
        >
          {sales
            .slice()
            .reverse()
            .map((sale) => (
              <SaleRow
                formatDate={formatDate}
                key={sale.id}
                sale={sale}
                user={users.find((user) => user.id === sale.userId)}
              />
            ))}
        </AdminTableCard>
      </section>
    </PageShell>
  );
}

export default SalesPage;
