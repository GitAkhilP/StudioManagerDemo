import Card from "./Card";
import CartItem from "./CartItem";
import TotalsRow from "./TotalsRow";

/**
 * Renders the shop cart summary, totals, checkout action, and feedback notice.
 * TotalsRow keeps summary-line markup consistent with other display panels.
 *
 * @param {{
 *   cartItems: Array<object>,
 *   cartSubtotal: number,
 *   estimatedTotal: number,
 *   formatCurrency: (value: number|string) => string,
 *   notice: string,
 *   onCheckout: () => void,
 *   onClearCart: () => void,
 *   onItemRemoveClick: (event: React.MouseEvent<HTMLButtonElement>) => void,
 *   onQuantityClick: (event: React.MouseEvent<HTMLButtonElement>) => void,
 *   selectedService?: object,
 *   serviceDeposit: number,
 *   styles: CSSModuleClasses,
 * }} props - Cart data, totals, callbacks, and style classes.
 * @returns {JSX.Element} The cart summary card.
 */
function CartSummary({
  cartItems,
  cartSubtotal,
  estimatedTotal,
  formatCurrency,
  notice,
  onCheckout,
  onClearCart,
  onItemRemoveClick,
  onQuantityClick,
  selectedService,
  serviceDeposit,
  styles,
}) {
  return (
    <Card className={styles.cartCard} variant="custom">
      <div className={styles.sectionHeader}>
        <div>
          <h2>Cart Summary</h2>
          <p>Local estimate only</p>
        </div>
        {(cartItems.length > 0 || selectedService) && (
          <button
            className={styles.clearButton}
            onClick={onClearCart}
            type="button"
          >
            Clear
          </button>
        )}
      </div>

      <div className={styles.cartItems}>
        {cartItems.length === 0 ? (
          <p className={styles.emptyCart}>No products selected yet.</p>
        ) : (
          cartItems.map((item) => (
            <CartItem
              formatCurrency={formatCurrency}
              item={item}
              key={item.id}
              onQuantityClick={onQuantityClick}
              onRemoveClick={onItemRemoveClick}
              styles={styles}
            />
          ))
        )}
      </div>

      <div className={styles.totals}>
        <TotalsRow label="Products" value={formatCurrency(cartSubtotal)} />
        <TotalsRow
          label="Service deposit"
          value={formatCurrency(serviceDeposit)}
        />
        <TotalsRow
          className={styles.grandTotal}
          label="Estimated total"
          value={formatCurrency(estimatedTotal)}
        />
      </div>

      <button
        className={styles.checkoutButton}
        type="button"
        onClick={onCheckout}
      >
        Request Order
      </button>

      {notice && <p className={styles.notice}>{notice}</p>}
    </Card>
  );
}

export default CartSummary;
