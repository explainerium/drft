const formatters = new Map<string, Intl.NumberFormat>();

/**
 * "1480.00" → "€1,480", "65.50" → "€65.50". Whole amounts drop the cents, as
 * in the design. Prices are strings from the API, so no float math happens
 * before formatting. Totals pass `cents` to always show them ("€2,020.00").
 */
export function formatPrice(amount: string, locale = "en", currency = "EUR", { cents = false } = {}): string {
  const whole = !cents && amount.endsWith(".00");
  const key = `${locale}:${currency}:${whole}`;
  let formatter = formatters.get(key);
  if (!formatter) {
    formatter = new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      minimumFractionDigits: whole ? 0 : 2,
      maximumFractionDigits: 2,
    });
    formatters.set(key, formatter);
  }
  return formatter.format(Number(amount));
}
