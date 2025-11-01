import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a number as CHF currency using Swiss format (1'000'000.000)
 * @param amount - The amount to format (can be null/undefined)
 * @param decimals - Number of decimal places (default: 3)
 * @returns Formatted string like "CHF 1'000'000.000" or "-" if amount is null/undefined
 */
export function formatCHF(
  amount: number | null | undefined,
  decimals: number = 2
): string {
  if (amount === null || amount === undefined) {
    return "-";
  }

  // Split into integer and decimal parts
  const parts = amount.toFixed(decimals).split(".");
  const integerPart = parts[0];
  const decimalPart = parts[1];

  // Add apostrophes every 3 digits from right to left
  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, "'");

  return `CHF ${formattedInteger}.${decimalPart}`;
}
