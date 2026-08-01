import { SHARE_MESSAGE, SITE_URL } from "@/lib/site";

export function getSocialShareLinks() {
  const encodedMessage = encodeURIComponent(SHARE_MESSAGE);
  const encodedUrl = encodeURIComponent(`${SITE_URL}/`);
  const xText = encodeURIComponent(
    "Consulta las tasas actualizadas de Venezuela en Open Cambio:",
  );

  return {
    whatsapp: `https://wa.me/?text=${encodedMessage}`,
    x: `https://twitter.com/intent/tweet?text=${xText}&url=${encodedUrl}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedMessage}`,
  };
}

export function getShareImageFilename(fetchedAt: string): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Caracas",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(fetchedAt));
  const values = Object.fromEntries(
    parts.map(({ type, value }) => [type, value]),
  );

  return `tasas-open-cambio-${values.year}-${values.month}-${values.day}.png`;
}
