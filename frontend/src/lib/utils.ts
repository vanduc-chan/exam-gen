import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Normalizes search keyword like modern search engines:
 * - Trims leading and trailing whitespace
 * - Collapses consecutive whitespace characters into a single space
 */
export function normalizeSearchQuery(query?: string | null): string {
  if (!query) return '';
  return query.trim().replace(/\s+/g, ' ');
}

/**
 * Returns normalized search query or undefined if empty / whitespace-only.
 * Ideal for passing into API requests and URL parameters to avoid sending
 * unnecessary empty search queries.
 */
export function cleanSearchParam(query?: string | null): string | undefined {
  const normalized = normalizeSearchQuery(query);
  return normalized.length > 0 ? normalized : undefined;
}
