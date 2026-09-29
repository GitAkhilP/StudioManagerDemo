/**
 * Renders one persisted sale in the admin sales table.
 *
 * @param {{
 *   formatDate: (iso: string) => string,
 *   sale: object,
 *   user?: object,
 * }} props - Sale record, matching user, and formatter.
 * @returns {JSX.Element} The sale table row.
 */
function SaleRow({ formatDate, sale, user }) {
  return (
    <tr>
      <td>{user ? user.username : sale.userId}</td>
      <td>${Number(sale.amount).toFixed(2)}</td>
      <td>{sale.description}</td>
      <td>{formatDate(sale.createdAt)}</td>
    </tr>
  );
}

export default SaleRow;
