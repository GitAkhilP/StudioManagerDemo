import styles from "./InventoryPage.module.css";
import { subscribeToCollections } from "../../services/collectionEvents.js";
import DisplayItem from "../../components/DisplayItem";
import Button from "../../components/Button";
import { useState, useEffect } from "react";
import AdminFormCard from "../../components/AdminFormCard";
import FormField from "../../components/FormField";
import {
  dbGetInventory,
  dbAddInventoryItem,
  dbRemoveInventoryItem,
} from "../../services/mockDbServices";

/**
 * Default add-item form values. Clone before use so resets do not share state.
 */
const emptyInventoryForm = {
  name: "",
  description: "",
  quantity: 0,
  price: 0,
};

/**
 * Collects inventory item details and persists successful additions.
 *
 * @returns {JSX.Element} The add-inventory form card.
 */
function InventoryFormCard() {
  // Tracks unsaved add-item field values.
  const [form, setForm] = useState({ ...emptyInventoryForm });
  // Holds validation or write errors for the add-item workflow.
  const [error, setError] = useState(null);

  /**
   * Validates and writes an item; the collection event refreshes the parent list.
   *
   * @param {object} e - Form submit event.
   */
  function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (!form.name.trim()) {
      setError("Item name is required.");
      return;
    }

    const result = dbAddInventoryItem({
      name: form.name,
      description: form.description,
      quantity: Number(form.quantity),
      price: Number(form.price),
    });
    if (!result.success) {
      setError(result.message || "Unable to add item.");
      return;
    }

    setForm({ ...emptyInventoryForm });
  }

  /**
   * Keeps form state in sync using each input's name attribute.
   *
   * @param {object} e - Field change event.
   */
  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prevForm) => ({ ...prevForm, [name]: value }));
  }

  /**
   * Restores the blank inventory form and clears validation feedback.
   */
  function handleClear() {
    setForm({ ...emptyInventoryForm });
    setError(null);
  }

  return (
    <AdminFormCard
      styles={styles}
      title="Add Item"
      collapsible={false}
      defaultOpen
    >
      <form className={styles.form} onSubmit={handleSubmit}>
        <FormField
          className={styles.formRow}
          label="Name"
          id="name"
          name="name"
          type="text"
          value={form.name}
          onChange={handleChange}
          placeholder="Item To Add"
        />

        <FormField
          className={styles.formRow}
          label="Description"
          id="description"
          name="description"
          type="text"
          value={form.description}
          onChange={handleChange}
          placeholder="Item Description"
        />

        <div className={styles.formRowInline}>
          <FormField
            className={styles.formRow}
            label="Quantity"
            id="quantity"
            name="quantity"
            type="number"
            value={form.quantity}
            onChange={handleChange}
            placeholder="Item Quantity"
            min="0"
          />

          <FormField
            className={styles.formRow}
            label="Price"
            id="price"
            name="price"
            type="number"
            value={form.price}
            onChange={handleChange}
            placeholder="Item Price"
            min="0"
            step="0.01"
          />
        </div>

        {error && <p className={styles.error}>{error}</p>}

        <Button
          type="submit"
          text="Add Item"
          variant="primary"
          transform="shift-right"
        />
        <Button
          text="Clear"
          variant="secondary"
          onClick={handleClear}
          transform="shift-left"
        />
      </form>
    </AdminFormCard>
  );
}

/**
 * Shows the admin inventory page and keeps it synced with local inventory writes.
 * The route-level AppLayout supplies authenticated chrome for this page.
 *
 * @returns {JSX.Element} The inventory management page.
 */
function InventoryPage() {
  // Stores the inventory rows currently rendered in the admin list.
  const [inventoryItems, setInventoryItems] = useState([]);

  const inventorySize = inventoryItems.length;

  // Prime the list from local storage on initial page load.
  useEffect(() => {
    setInventoryItems(dbGetInventory());
  }, []);

  useEffect(() => subscribeToCollections(["studio_inventory"], () => {
    setInventoryItems(dbGetInventory());
  }), []);

  /**
   * Removes an item from storage and reconciles the list, including the last-item case.
   *
   * @param {string} itemId - Inventory item id to remove.
   */
  function handleRemove(itemId) {
    dbRemoveInventoryItem(itemId);
  }

  /**
   * Removes the inventory row identified by DisplayItem's data attribute.
   *
   * @param {React.MouseEvent<HTMLButtonElement>} event - Remove button click event.
   */
  function handleRemoveClick(event) {
    handleRemove(event.currentTarget.dataset.itemId);
  }

  return (
    <div className={styles.page}>
      <div className={styles.topRow}>
        <h1 className={styles.inventoryTitle}>Inventory Management</h1>
      </div>

      <section className={styles.section}>
        <InventoryFormCard />
      </section>

      <section className={styles.section}>
        <h2 className={styles.inventoryTitle}>
          Current Inventory: {inventorySize} items
        </h2>
        <div className={styles.container}>
          {inventoryItems.length === 0 ? (
            <p>No items in inventory</p>
          ) : (
            <ul className={styles.inventoryList}>
              {inventoryItems.map((item, i) => (
                <DisplayItem
                  key={item.id}
                  index={i + 1}
                  name={item.name}
                  description={item.description}
                  quantity={item.quantity}
                  onRemove={handleRemoveClick}
                  removeButtonProps={{ "data-item-id": item.id }}
                />
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}

export default InventoryPage;
