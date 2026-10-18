const formatters = new Map<string, Intl.NumberFormat>();

/**
 * "1480.00" → "€1,480", "65.50" → "€65.50". Whole amounts drop the cents, as
 * in the design. Prices are strings from the API, so no float math happens
 * before formatting.
 */
export function formatPrice(amount: string, locale = "en", currency = "EUR"): string {
  const whole = amount.endsWith(".00");
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
