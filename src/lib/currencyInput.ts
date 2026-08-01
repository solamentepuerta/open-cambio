export type ConversionDirection = "usd" | "bs";

export function sanitizeCurrencyInput(value: string): string | null {
  let clean = value.replace(/,/g, "").replace(/[^0-9.]/g, "");

  if ((clean.match(/\./g) ?? []).length > 1) return null;
  if (clean.startsWith(".")) clean = `0${clean}`;

  return clean.replace(/^0+(\d)/, "$1");
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
