"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Copy, Download, LoaderCircle, Share2, X } from "lucide-react";
import {
  FaFacebookF,
  FaTelegram,
  FaWhatsapp,
  FaXTwitter,
} from "react-icons/fa6";
import { getShareImageFilename, getSocialShareLinks } from "@/lib/share";
import { SHARE_MESSAGE, SITE_NAME, SITE_URL } from "@/lib/site";

interface ShareRatesProps {
  fetchedAt: string;
}

const IMAGE_ENDPOINT = "/api/share-image";
const SOCIAL_LINKS = getSocialShareLinks();
const SOCIAL_OPTIONS = [
  { label: "WhatsApp", icon: FaWhatsapp, url: SOCIAL_LINKS.whatsapp },
  { label: "X", icon: FaXTwitter, url: SOCIAL_LINKS.x },
  { label: "Facebook", icon: FaFacebookF, url: SOCIAL_LINKS.facebook },
  { label: "Telegram", icon: FaTelegram, url: SOCIAL_LINKS.telegram },
];

function openSocialLink(url: string) {
  window.open(url, "_blank", "noopener,noreferrer");
}

export default function ShareRates({ fetchedAt }: ShareRatesProps) {
  const [open, setOpen] = useState(false);
  const [busyAction, setBusyAction] = useState<"share" | "download" | null>(null);
  const [status, setStatus] = useState("");
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const triggerButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLElement>(null);
  const imageUrl = `${IMAGE_ENDPOINT}?v=${encodeURIComponent(fetchedAt)}`;
  const imageFilename = getShareImageFilename(fetchedAt);

  const close = useCallback(() => {
    setOpen(false);
    setStatus("");
  }, []);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    const triggerButton = triggerButtonRef.current;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
      if (event.key !== "Tab") return;

      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        "button:not([disabled]), a[href], [tabindex]:not([tabindex='-1'])",
      );
      if (!focusable?.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
      triggerButton?.focus();
    };
  }, [close, open]);

  const fetchImageFile = useCallback(async () => {
    const response = await fetch(imageUrl, { cache: "no-store" });
    if (!response.ok) throw new Error("No se pudo generar la imagen");

    const blob = await response.blob();
    return new File([blob], imageFilename, {
      type: "image/png",
    });
  }, [imageFilename, imageUrl]);

  const handleNativeShare = useCallback(async () => {
    if (!navigator.share) {
      setStatus("El menú para compartir no está disponible en este navegador.");
      return;
    }

    setBusyAction("share");
    setStatus("");
    try {
      const file = await fetchImageFile();
      const supportsFiles =
        typeof navigator.canShare === "function" &&
        navigator.canShare({ files: [file] });

      if (supportsFiles) {
        await navigator.share({
          title: SITE_NAME,
          text: SHARE_MESSAGE,
          files: [file],
        });
      } else {
        await navigator.share({
          title: SITE_NAME,
          text: SHARE_MESSAGE,
          url: `${SITE_URL}/`,
        });
      }
      setStatus("Contenido compartido.");
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError")) {
        setStatus("No se pudo compartir. Puedes copiar el enlace o descargar la imagen.");
      }
    } finally {
      setBusyAction(null);
    }
  }, [fetchImageFile]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(`${SITE_URL}/`);
      setStatus("Enlace copiado.");
    } catch {
      setStatus("No se pudo copiar el enlace.");
    }
  }, []);

  const handleDownload = useCallback(async () => {
    setBusyAction("download");
    setStatus("");
    try {
      const file = await fetchImageFile();
      const objectUrl = URL.createObjectURL(file);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = file.name;
      link.click();
      URL.revokeObjectURL(objectUrl);
      setStatus("Imagen descargada.");
    } catch {
      setStatus("No se pudo descargar la imagen.");
    } finally {
      setBusyAction(null);
    }
  }, [fetchImageFile]);

  return (
    <>
      <button
        ref={triggerButtonRef}
        type="button"
        onClick={() => setOpen(true)}
        className="group inline-flex items-center gap-1.5 rounded-full bg-surface px-2.5 py-1 text-[10px] font-semibold text-foreground/60 transition-all hover:text-primary active:scale-95"
        aria-haspopup="dialog"
      >
        <Share2 className="h-3 w-3 transition-transform group-hover:scale-110" />
        Compartir
      </button>

      <div
        className={`fixed inset-0 z-[80] transition ${open ? "visible" : "invisible delay-300"}`}
        aria-hidden={!open}
      >
        <button
          type="button"
          className={`absolute inset-0 bg-black/65 transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0"}`}
          onClick={close}
          aria-label="Cerrar opciones de compartir"
          tabIndex={open ? 0 : -1}
        />
        <section
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="share-title"
          className={`absolute inset-x-0 bottom-0 mx-auto max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-[2rem] bg-surface p-5 text-on-surface shadow-2xl transition-transform duration-300 ${open ? "translate-y-0" : "translate-y-full"}`}
        >
          <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-on-surface/20" />
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 id="share-title" className="font-display text-xl font-bold">
                Compartir tasas
              </h2>
              <p className="mt-0.5 text-xs text-foreground/50">
                Las tres tasas actuales en una sola imagen.
              </p>
            </div>
            <button
              ref={closeButtonRef}
              type="button"
              onClick={close}
              className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-on-surface/10"
              aria-label="Cerrar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="overflow-hidden rounded-2xl border border-white/10 bg-background shadow-sm">
            <Image
              src={imageUrl}
              alt="Tarjeta de Open Cambio con las tasas actuales"
              width={1200}
              height={630}
              className="h-auto w-full"
              unoptimized
            />
          </div>

          <button
            type="button"
            onClick={handleNativeShare}
            disabled={busyAction !== null}
            className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-primary font-semibold text-on-primary transition-transform active:scale-[0.98] disabled:opacity-60"
          >
            {busyAction === "share" ? (
              <LoaderCircle className="h-5 w-5 animate-spin" />
            ) : (
              <Share2 className="h-5 w-5" />
            )}
            Compartir imagen
          </button>

          <div className="mt-5 grid grid-cols-4 gap-3">
            {SOCIAL_OPTIONS.map(({ label, icon: Icon, url }) => (
              <button
                key={label}
                type="button"
                onClick={() => openSocialLink(url)}
                className="flex min-w-0 flex-col items-center gap-2 rounded-2xl py-3 text-[10px] font-medium text-foreground/65 transition-colors hover:bg-on-surface/8 hover:text-primary"
                aria-label={`Compartir en ${label}`}
              >
                <Icon className="h-6 w-6" />
                <span className="max-w-full truncate">{label}</span>
              </button>
            ))}
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handleCopy}
              className="flex h-11 items-center justify-center gap-2 rounded-xl bg-on-surface/8 text-sm font-semibold hover:bg-on-surface/15"
            >
              {status === "Enlace copiado." ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              Copiar enlace
            </button>
            <button
              type="button"
              onClick={handleDownload}
              disabled={busyAction !== null}
              className="flex h-11 items-center justify-center gap-2 rounded-xl bg-on-surface/8 text-sm font-semibold hover:bg-on-surface/15 disabled:opacity-60"
            >
              {busyAction === "download" ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              Descargar
            </button>
          </div>

          <p className="mt-4 min-h-5 text-center text-xs text-foreground/55" aria-live="polite">
            {status}
          </p>
        </section>
      </div>
    </>
  );
}
