import { LOCALE } from "../../types";

/**
 * Formats date in local format
 * @param isoDate - ISO date string
 * @returns Formatted date string
 */
export function formatDate(isoDate: string): string {
  try {
    const date = new Date(isoDate);
    return date.toLocaleDateString(LOCALE.RU);
  } catch (e) {
    return isoDate.split("T")[0];
  }
}
