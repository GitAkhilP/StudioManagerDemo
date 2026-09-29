import { useCallback, useEffect, useMemo, useState } from "react";
import { subscribeToCollections } from "../../services/collectionEvents.js";
import CartSummary from "../../components/CartSummary";
import EmptyState from "../../components/EmptyState";
import PageShell from "../../components/PageShell";
import ProductCard from "../../components/ProductCard";
import SectionPanel from "../../components/SectionPanel";
import StatTile from "../../components/StatTile";
import { useAuth } from "../../contexts/AuthContext";
import {
  dbCheckoutShopOrder,
  dbGetShopCategories,
  dbGetShopProducts,
  dbGetShopServicePackages,
} from "../../services/mockDbServices";
import styles from "./ShopPage.module.css";

/**
 * Formats shop prices and totals for the member store.
 * @param {number | string | null | undefined} value Price-like value.
 * @returns {string} Currency text.
 */
function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(value) || 0);
}

/**
 * Converts stock quantity into the label and disabled state used by product cards.
 * @param {number | string | null | undefined} quantity Current inventory count.
 * @returns {{ label: string, className: string, disabled: boolean }}
 */
function getAvailability(quantity) {
  const count = Number(quantity) || 0;

  if (count <= 0) {
    return {
      label: "Sold out",
      className: styles.soldOut,
      disabled: true,
    };
  }

  if (count <= 4) {
    return {
      label: `${count} left`,
      className: styles.lowStock,
      disabled: false,
    };
  }

  return {
    label: "In stock",
    className: styles.inStock,
    disabled: false,
  };
}

/**
 * Normalizes inventory records before they enter member-facing catalog state.
 * @param {Array<object>} items Raw product records.
 * @returns {Array<object>} Products with stable ids and display fallbacks.
 */
function normalizeProducts(items) {
  if (!Array.isArray(items)) return [];

  return items.map((item, index) => ({
    ...item,
    id: item.id || item.name || `shop_item_${index}`,
    name: item.name || "Detailing Item",
    description: item.description || "Member-ready detailing supply.",
    quantity: Number(item.quantity) || 0,
    price: Number(item.price) || 0,
    category: item.category || "Uncategorized",
  }));
}

/**
 * Normalizes service package records before member selection.
 * @param {Array<object>} items Raw service package records.
 * @returns {Array<object>} Services with stable ids and display fallbacks.
 */
function normalizeServices(items) {
  if (!Array.isArray(items)) return [];

  return items.map((item, index) => ({
    ...item,
    id: item.id || item.name || `shop_service_${index}`,
    name: item.name || "Detailing Service",
    duration: item.duration || "Custom timing",
    description: item.description || "Member detailing service.",
    price: Number(item.price) || 0,
  }));
}

/**
 * Renders the member shop, including product cart and service add-on requests.
 * The route-level AppLayout supplies authenticated chrome for this page.
 * ShopPage owns catalog/cart state while ProductCard and CartSummary own repeated display markup.
 * Display primitives cover the page shell, quick stats, panel shells, and empty states.
 *
 * @returns {import("react").JSX.Element}
 */
function ShopPage() {
  // Hook: active member identity attaches checkout requests to the right user.
  const { user } = useAuth();
  // State: normalized product catalog shown to members.
  const [products, setProducts] = useState([]);
  // State: available category filters from inventory data.
  const [categories, setCategories] = useState([]);
  // State: optional service packages members can add to a request.
  const [servicePackages, setServicePackages] = useState([]);
  // State: currently selected product category filter.
  const [activeFilter, setActiveFilter] = useState("All");
  // State: product search input used by catalog filtering.
  const [searchTerm, setSearchTerm] = useState("");
  // State: cart quantities keyed by product id.
  const [cart, setCart] = useState({});
  // State: optional service package selected alongside product cart items.
  const [selectedServiceId, setSelectedServiceId] = useState("");
  // State: checkout and cart feedback shown near the summary panel.
  const [notice, setNotice] = useState("");

  // Callback: stable catalog sync used by setup, checkout, and inventory events.
  /**
   * Reloads catalog inventory and clamps cart quantities to available stock.
   * @returns {void}
   */
  const refreshProductCatalog = useCallback(() => {
    const nextProducts = normalizeProducts(dbGetShopProducts());
    const nextCategories = dbGetShopCategories(nextProducts);
    const productsById = new Map(
      nextProducts.map((product) => [product.id, product])
    );

    setProducts(nextProducts);
    setCategories(Array.isArray(nextCategories) ? nextCategories : []);
    setActiveFilter((currentFilter) =>
      nextCategories.includes(currentFilter) ? currentFilter : "All"
    );
    setCart((currentCart) =>
      Object.entries(currentCart).reduce((nextCart, [productId, quantity]) => {
        const product = productsById.get(productId);
        const availableQuantity = Number(product?.quantity) || 0;
        const selectedQuantity = Math.min(
          Math.max(0, Number(quantity) || 0),
          availableQuantity
        );

        if (selectedQuantity > 0) {
          nextCart[productId] = selectedQuantity;
        }

        return nextCart;
      }, {})
    );
  }, []);

  // Shop setup keeps products and service packages separate because inventory changes more often.
  useEffect(() => {
    const nextServices = normalizeServices(dbGetShopServicePackages());

    refreshProductCatalog();
    setServicePackages(nextServices);
    setSelectedServiceId((currentServiceId) =>
      nextServices.some((service) => service.id === currentServiceId)
        ? currentServiceId
        : ""
    );
  }, [refreshProductCatalog]);

  // Collection events refresh checkout results and edits from other tabs once.
  useEffect(() => subscribeToCollections(
    ["studio_inventory"], refreshProductCatalog
  ), [refreshProductCatalog]);

  // Memo: visible catalog products depend on active category and search text.
  const visibleProducts = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return products.filter((product) => {
      const matchesFilter =
        activeFilter === "All" || product.category === activeFilter;
      const matchesSearch =
        !normalizedSearch ||
        product.name.toLowerCase().includes(normalizedSearch) ||
        product.description.toLowerCase().includes(normalizedSearch);

      return matchesFilter && matchesSearch;
    });
  }, [activeFilter, products, searchTerm]);

  const selectedService = servicePackages.find(
    (service) => service.id === selectedServiceId
  );

  const cartItems = products
    .map((product) => ({
      ...product,
      selectedQuantity: cart[product.id] || 0,
    }))
    .filter((product) => product.selectedQuantity > 0);

  const cartSubtotal = cartItems.reduce(
    (total, item) => total + item.price * item.selectedQuantity,
    0
  );
  const itemCount = cartItems.reduce(
    (total, item) => total + item.selectedQuantity,
    0
  );
  const serviceDeposit = selectedService ? selectedService.price : 0;
  const estimatedTotal = cartSubtotal + serviceDeposit;

  /**
   * Updates product search text from the catalog search field.
   * @param {React.ChangeEvent<HTMLInputElement>} event Search input event.
   * @returns {void}
   */
  function handleSearchChange(event) {
    setSearchTerm(event.target.value);
  }

  /**
   * Toggles a product category filter, returning to all products when repeated.
   * @param {string} filter Category name.
   * @returns {void}
   */
  function handleFilterToggle(filter) {
    setActiveFilter((currentFilter) =>
      currentFilter === filter ? "All" : filter
    );
  }

  /**
   * Clears product category and search filters.
   * @returns {void}
   */
  function handleClearFilters() {
    setActiveFilter("All");
    setSearchTerm("");
  }

  /**
   * Reads the category from a filter button and toggles that catalog filter.
   * @param {React.MouseEvent<HTMLButtonElement>} event Category button event.
   * @returns {void}
   */
  function handleFilterButtonClick(event) {
    handleFilterToggle(event.currentTarget.dataset.filter || "");
  }

  /**
   * Reads the product id from an add button and adds the matching catalog item.
   * @param {React.MouseEvent<HTMLButtonElement>} event Product button event.
   * @returns {void}
   */
  function handleProductAddClick(event) {
    const productId = event.currentTarget.dataset.productId || "";
    const product = products.find((item) => String(item.id) === productId);

    if (product) {
      handleAddToCart(product);
    }
  }

  /**
   * Reads the service id from a service option button and toggles selection.
   * @param {React.MouseEvent<HTMLButtonElement>} event Service button event.
   * @returns {void}
   */
  function handleServiceButtonClick(event) {
    handleServiceToggle(event.currentTarget.dataset.serviceId || "");
  }

  /**
   * Removes one unit for the product id stored on a cart quantity button.
   * @param {React.MouseEvent<HTMLButtonElement>} event Cart quantity button event.
   * @returns {void}
   */
  function handleCartQuantityClick(event) {
    handleRemoveFromCart(event.currentTarget.dataset.productId || "");
  }

  /**
   * Removes the full cart line for the product id stored on a cart button.
   * @param {React.MouseEvent<HTMLButtonElement>} event Cart remove button event.
   * @returns {void}
   */
  function handleCartItemRemoveClick(event) {
    handleRemoveItem(event.currentTarget.dataset.productId || "");
  }

  /**
   * Adds one unit of a product while respecting current inventory.
   * @param {{ id: string, name: string, quantity: number }} product Product record.
   * @returns {void}
   */
  function handleAddToCart(product) {
    setCart((currentCart) => {
      const currentQuantity = currentCart[product.id] || 0;
      const availableQuantity = Number(product.quantity) || 0;

      if (currentQuantity >= availableQuantity) {
        return currentCart;
      }

      return {
        ...currentCart,
        [product.id]: currentQuantity + 1,
      };
    });
    setNotice(`${product.name} added to cart.`);
  }

  /**
   * Removes a single unit from the cart and drops the line at zero.
   * @param {string} productId Product id.
   * @returns {void}
   */
  function handleRemoveFromCart(productId) {
    setCart((currentCart) => {
      const currentQuantity = currentCart[productId] || 0;

      if (currentQuantity <= 1) {
        const nextCart = { ...currentCart };
        delete nextCart[productId];
        return nextCart;
      }

      return {
        ...currentCart,
        [productId]: currentQuantity - 1,
      };
    });
  }

  /**
   * Removes every selected unit for a product line.
   * @param {string} productId Product id.
   * @returns {void}
   */
  function handleRemoveItem(productId) {
    setCart((currentCart) => {
      const nextCart = { ...currentCart };
      delete nextCart[productId];
      return nextCart;
    });
    setNotice("");
  }

  /**
   * Clears all pending product and service selections.
   * @returns {void}
   */
  function handleClearCart() {
    setCart({});
    setSelectedServiceId("");
    setNotice("Cart cleared.");
  }

  /**
   * Selects or clears the optional service add-on.
   * @param {string} serviceId Service package id.
   * @returns {void}
   */
  function handleServiceToggle(serviceId) {
    setSelectedServiceId((currentServiceId) =>
      currentServiceId === serviceId ? "" : serviceId
    );
    setNotice("");
  }

  /**
   * Persists the shop request and refreshes product inventory after checkout.
   * @returns {void}
   */
  function handleCheckout() {
    const result = dbCheckoutShopOrder({
      userId: user?.id,
      cartItems: cart,
      servicePackageId: selectedServiceId,
    });

    if (!result.success) {
      refreshProductCatalog();
      setNotice(result.message || "Order request could not be saved.");
      return;
    }

    const serviceText = selectedService ? ` plus ${selectedService.name}` : "";

    setCart({});
    setSelectedServiceId("");
    setNotice(
      `Order request sent: ${itemCount} item${
        itemCount === 1 ? "" : "s"
      }${serviceText}. Inventory has been updated.`
    );
  }

  return (
    <PageShell className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.kicker}>Member Store</p>
          <h1 className={styles.title}>Detailing Shop</h1>
          <p className={styles.subtitle}>
            Stock up on studio-approved supplies or reserve a detailing service.
          </p>
        </div>

        <div className={styles.quickStats} aria-label="Shop summary">
          <StatTile label="Products" labelAs="p" value={products.length} />
          <StatTile label="In cart" labelAs="p" value={itemCount} />
          <StatTile
            label="Estimate"
            labelAs="p"
            value={formatCurrency(estimatedTotal)}
          />
        </div>
      </header>

      <section className={styles.controls} aria-label="Shop filters">
        <label className={styles.searchLabel} htmlFor="shop-search">
          Search
          <input
            id="shop-search"
            type="search"
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="Soap, ceramic, wheel cleaner..."
          />
        </label>

        <div className={styles.filterGroup} aria-label="Product categories">
          {categories.map((filter) => (
            <button
              className={`${styles.filterButton} ${
                activeFilter === filter ? styles.activeFilter : ""
              }`}
              data-filter={filter}
              key={filter}
              type="button"
              onClick={handleFilterButtonClick}
            >
              {filter}
            </button>
          ))}
          {(activeFilter !== "All" || searchTerm) && (
            <button
              className={styles.clearButton}
              onClick={handleClearFilters}
              type="button"
            >
              Clear
            </button>
          )}
        </div>
      </section>

      <div className={styles.contentGrid}>
        <SectionPanel as="main" className={styles.productsPanel}>
          <div className={styles.sectionHeader}>
            <div>
              <h2>Products</h2>
              <p>
                {products.length > 0
                  ? "Live catalog from the studio stockroom"
                  : "No shop products are available right now"}
              </p>
            </div>
            <span>{visibleProducts.length} shown</span>
          </div>

          <div className={styles.productGrid}>
            {visibleProducts.map((product) => {
              const availability = getAvailability(product.quantity);
              const selectedQuantity = cart[product.id] || 0;
              const reachedLimit = selectedQuantity >= product.quantity;

              return (
                <ProductCard
                  availability={availability}
                  formatCurrency={formatCurrency}
                  key={product.id}
                  onAddClick={handleProductAddClick}
                  product={product}
                  reachedLimit={reachedLimit}
                  selectedQuantity={selectedQuantity}
                  styles={styles}
                />
              );
            })}
          </div>

          {visibleProducts.length === 0 && (
            <EmptyState
              className={styles.emptyState}
              message={
                products.length === 0
                  ? "No shop products are available yet."
                  : "No products match that search."
              }
            />
          )}
        </SectionPanel>

        <aside className={styles.sidebar}>
          <SectionPanel className={styles.serviceCard}>
            <div className={styles.sectionHeader}>
              <div>
                <h2>Service Add-On</h2>
                <p>Choose one for your request</p>
              </div>
            </div>

            <div className={styles.serviceList}>
              {servicePackages.length === 0 ? (
                <EmptyState as="p" className={styles.emptyCart}>
                  No service packages are available right now.
                </EmptyState>
              ) : (
                servicePackages.map((service) => (
                  <button
                    aria-pressed={selectedServiceId === service.id}
                    className={`${styles.serviceOption} ${
                      selectedServiceId === service.id
                        ? styles.serviceSelected
                        : ""
                    }`}
                    data-service-id={service.id}
                    key={service.id}
                    onClick={handleServiceButtonClick}
                    type="button"
                  >
                    <span>
                      <strong>{service.name}</strong>
                      <small>{service.duration}</small>
                      <p>{service.description}</p>
                    </span>
                    <b>{formatCurrency(service.price)}</b>
                  </button>
                ))
              )}
            </div>
          </SectionPanel>

          <CartSummary
            cartItems={cartItems}
            cartSubtotal={cartSubtotal}
            estimatedTotal={estimatedTotal}
            formatCurrency={formatCurrency}
            notice={notice}
            onCheckout={handleCheckout}
            onClearCart={handleClearCart}
            onItemRemoveClick={handleCartItemRemoveClick}
            onQuantityClick={handleCartQuantityClick}
            selectedService={selectedService}
            serviceDeposit={serviceDeposit}
            styles={styles}
          />
        </aside>
      </div>
    </PageShell>
  );
}

export default ShopPage;
