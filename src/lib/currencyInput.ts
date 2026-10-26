export type ConversionDirection = "usd" | "bs";

/**
 * Normaliza lo que escribe el usuario a un número con punto decimal.
 * Acepta "." y "," como separador decimal (iOS y teclados latinos usan ",").
 * Si aparecen ambos, el último separador es el decimal y el resto se descarta
 * como separador de miles. Devuelve null cuando la entrada es ambigua o inválida.
 */
export function sanitizeCurrencyInput(value: string): string | null {
  const clean = value.replace(/[^0-9.,]/g, "");
  if (!clean) return "";

  const dotCount = (clean.match(/\./g) ?? []).length;
  const commaCount = (clean.match(/,/g) ?? []).length;

  let normalized: string;

  if (dotCount > 0 && commaCount > 0) {
    const lastSeparator = Math.max(clean.lastIndexOf("."), clean.lastIndexOf(","));
    const integerPart = clean.slice(0, lastSeparator).replace(/[.,]/g, "");
    const decimalPart = clean.slice(lastSeparator + 1).replace(/[.,]/g, "");
    normalized = `${integerPart}.${decimalPart}`;
  } else if (dotCount > 1 || commaCount > 1) {
    // Varios separadores iguales solo pueden ser separadores de miles.
    const separator = dotCount > 0 ? "." : ",";
    const [first = "", ...groups] = clean.split(separator);
    const isThousandsFormat =
      first.length > 0 &&
      first.length <= 3 &&
      groups.every((group) => group.length === 3);
    if (!isThousandsFormat) return null;
    normalized = clean.split(separator).join("");
  } else if (dotCount === 1 || commaCount === 1) {
    const separator = dotCount === 1 ? "." : ",";
    const [integerPart, decimalPart] = clean.split(separator);
    normalized = `${integerPart}.${decimalPart}`;
  } else {
    normalized = clean;
  }

  if (normalized.startsWith(".")) normalized = `0${normalized}`;

  return normalized.replace(/^0+(\d)/, "$1");
}

export function formatCurrencyInput(value: string): string {
  if (!value) return "";

  const [integerPart, decimalPart] = value.split(".");
  const formattedInteger = (integerPart || "0").replace(
    /\B(?=(\d{3})+(?!\d))/g,
    ",",
  );

  return decimalPart === undefined
    ? formattedInteger
    : `${formattedInteger}.${decimalPart}`;
}

export function parseCurrencyInput(value: string): number | null {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}
