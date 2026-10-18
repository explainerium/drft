/** "1480.00" → 148000. Only for ratios and comparisons; totals come from the API. */
export function toCents(amount: string): number {
  const [whole = "0", fraction = ""] = amount.split(".");
  return Number(whole) * 100 + Number(fraction.padEnd(2, "0").slice(0, 2));
}
