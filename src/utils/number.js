export function parseLocaleNumber(str) {
  if (typeof str !== "string") return NaN;
  const cleaned = str
    .trim()
    .replace(/\s+/g, "") // remove spaces/thin spaces
    .replace(/,(?=\d)/g, "."); // treat comma as decimal sep
  // Disallow multiple dots
  if ((cleaned.match(/\./g) || []).length > 1) return NaN;
  return cleaned === "" ? NaN : Number(cleaned);
}

export function formatNumber(n) {
  return Number.isFinite(n) ? String(n) : "";
}
