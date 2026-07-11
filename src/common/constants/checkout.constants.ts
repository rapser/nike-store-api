export const TAX_RATE = 0.1;
export const SHIPPING_COST = 0;

export function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
