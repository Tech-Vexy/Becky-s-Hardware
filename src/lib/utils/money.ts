/**
 * Money helpers for KES retail arithmetic.
 *
 * All store totals are VAT-inclusive at 16% (see AGENTS.md). Keeping the
 * rounding rules in one place prevents POS, sync and reporting from drifting
 * apart by a cent.
 */

/** Rounds a KES amount to two decimal places (half away from zero). */
export function roundMoney(amount: number): number {
  if (!Number.isFinite(amount)) return 0;
  const sign = amount < 0 ? -1 : 1;
  return (sign * Math.round((Math.abs(amount) + Number.EPSILON) * 100)) / 100;
}

/**
 * Extracts the VAT portion of a VAT-inclusive gross amount.
 * Defaults to Kenya's standard 16% rate.
 */
export function vatFromInclusiveTotal(
  grossTotal: number,
  vatRatePercent: number = 16
): number {
  if (!Number.isFinite(grossTotal) || grossTotal <= 0 || vatRatePercent <= 0) {
    return 0;
  }
  return roundMoney(grossTotal * (vatRatePercent / (100 + vatRatePercent)));
}

/** Computes a rounded line total, never allowing it to fall below zero. */
export function calculateLineTotal(
  quantity: number,
  unitPrice: number,
  discount: number = 0
): number {
  if (!Number.isFinite(quantity) || !Number.isFinite(unitPrice)) return 0;
  const safeDiscount = Number.isFinite(discount) ? discount : 0;
  return Math.max(0, roundMoney(quantity * unitPrice - safeDiscount));
}
