import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Sanitize a URL for safe use in CSS backgroundImage.
 * Prevents CSS injection via url() by only allowing http(s) and data:image URIs,
 * and stripping characters that could break out of the url() context.
 */
export function sanitizeImageUrl(url) {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  // Only allow http(s) and data:image/ URIs
  if (
    !trimmed.startsWith('https://') &&
    !trimmed.startsWith('http://') &&
    !trimmed.startsWith('data:image/')
  ) {
    return '';
  }
  // Strip characters that can break out of CSS url()
  return trimmed.replace(/[()'"\\;\n\r{}]/g, '');
}
