import Card from "./Card";
import StatusBadge from "./StatusBadge";

/**
 * Renders one shop product with stock state, the shared status badge, and add-to-cart controls.
 *
 * @param {{
 *   availability: { className: string, disabled: boolean, label: string },
 *   formatCurrency: (value: number|string) => string,
 *   onAddClick: (event: React.MouseEvent<HTMLButtonElement>) => void,
 *   product: object,
 *   reachedLimit: boolean,
 *   selectedQuantity: number,
 *   styles: CSSModuleClasses,
 * }} props - Product display data, callbacks, and style classes.
 * @returns {JSX.Element} The product card.
 */
function ProductCard({
  availability,
  formatCurrency,
  onAddClick,
  product,
  reachedLimit,
  selectedQuantity,
  styles,
}) {
  return (
    <Card as="article" className={styles.productCard} variant="custom">
      <div className={styles.productTopRow}>
        <span className={styles.categoryPill}>{product.category}</span>
        <StatusBadge className={`${styles.stockPill} ${availability.className}`}>
          {availability.label}
        </StatusBadge>
      </div>

      <div>
        <h3>{product.name}</h3>
        <p>{product.description}</p>
      </div>

      <div className={styles.productFooter}>
        <strong>{formatCurrency(product.price)}</strong>
        <button
          type="button"
          data-product-id={product.id}
          onClick={onAddClick}
          disabled={availability.disabled || reachedLimit}
        >
          {selectedQuantity > 0 ? `Add (${selectedQuantity})` : "Add to Cart"}
        </button>
      </div>
    </Card>
  );
}

export default ProductCard;
