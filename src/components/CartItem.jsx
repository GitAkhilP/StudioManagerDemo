/**
 * Renders one selected product line in the shop cart.
 *
 * @param {{
 *   formatCurrency: (value: number|string) => string,
 *   item: object,
 *   onQuantityClick: (event: React.MouseEvent<HTMLButtonElement>) => void,
 *   onRemoveClick: (event: React.MouseEvent<HTMLButtonElement>) => void,
 *   styles: CSSModuleClasses,
 * }} props - Cart line data, callbacks, and style classes.
 * @returns {JSX.Element} The cart line item.
 */
function CartItem({
  formatCurrency,
  item,
  onQuantityClick,
  onRemoveClick,
  styles,
}) {
  return (
    <div className={styles.cartItem}>
      <div>
        <strong>{item.name}</strong>
        <span>
          {item.selectedQuantity} x {formatCurrency(item.price)}
        </span>
      </div>
      <div className={styles.cartActions}>
        <button
          type="button"
          data-product-id={item.id}
          onClick={onQuantityClick}
          aria-label={`Remove one ${item.name}`}
        >
          -
        </button>
        <button
          className={styles.removeItemButton}
          type="button"
          data-product-id={item.id}
          onClick={onRemoveClick}
        >
          Remove
        </button>
      </div>
    </div>
  );
}

export default CartItem;
