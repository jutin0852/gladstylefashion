"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { IconFileTypePdf, IconPhoto, IconShare } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";

interface Prepared {
  png: Blob;
  dataUrl: string;
  width: number;
  height: number;
  pdf: Blob | null;
}

function waitForImages(node: HTMLElement) {
  return Promise.all(
    [...node.querySelectorAll("img")].map((img) =>
      img.complete && img.naturalWidth > 0
        ? Promise.resolve()
        : new Promise<void>((resolve) => {
            img.addEventListener("load", () => resolve(), { once: true });
            img.addEventListener("error", () => resolve(), { once: true });
          }),
    ),
  );
}

async function renderImage(targetId: string) {
  const node = document.getElementById(targetId);
  if (!node) throw new Error("Nothing to export yet.");
  await document.fonts?.ready;
  await waitForImages(node);
  const { toPng } = await import("html-to-image");
  // Safari can return a blank first render, so warm up once before the real one.
  await toPng(node, { pixelRatio: 1, backgroundColor: "#ffffff" });
  const dataUrl = await toPng(node, { pixelRatio: 2, backgroundColor: "#ffffff", cacheBust: true });
  const png = await (await fetch(dataUrl)).blob();
  return { png, dataUrl, width: node.offsetWidth, height: node.offsetHeight };
}

async function renderPdf({ dataUrl, width, height }: { dataUrl: string; width: number; height: number }) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "px", format: [width, height], orientation: width > height ? "landscape" : "portrait", compress: true });
  doc.addImage(dataUrl, "PNG", 0, 0, width, height);
  return doc.output("blob");
}

function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

function isStandalone() {
  return window.matchMedia?.("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
}

const PREPARE_ERROR = "Could not prepare the file. Reload the page and try again.";

export function ExportButtons({ targetId, filename }: { targetId: string; filename: string }) {
  const prepared = useRef<Prepared | null>(null);
  const run = useRef(0);
  const [imageReady, setImageReady] = useState(false);
  const [pdfReady, setPdfReady] = useState(false);
  const [note, setNote] = useState("");

  // Build the image (then the PDF) ahead of time. Safari only opens the share
  // sheet straight after a tap, so nothing slow may be left to do on click.
  const prepare = useCallback(async () => {
    const mine = ++run.current;
    try {
      const image = await renderImage(targetId);
      if (mine !== run.current) return;
      prepared.current = { ...image, pdf: null };
      setImageReady(true);
      setNote((current) => (current === PREPARE_ERROR ? "" : current));
      const pdf = await renderPdf(image);
      if (mine !== run.current || !prepared.current) return;
      prepared.current.pdf = pdf;
      setPdfReady(true);
    } catch {
      if (mine !== run.current) return;
      prepared.current = null;
      setImageReady(false);
      setPdfReady(false);
      setNote(PREPARE_ERROR);
    }
  }, [targetId]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    let baseline = "";
    const node = document.getElementById(targetId);
    const schedule = (delay: number) => {
      clearTimeout(timer);
      run.current += 1; // anything still in flight is out of date
      prepared.current = null;
      setImageReady(false);
      setPdfReady(false);
      timer = setTimeout(() => {
        baseline = node?.outerHTML ?? "";
        void prepare();
      }, delay);
    };
    schedule(400);
    // If the sheet's content really changes (e.g. a receipt is voided), prepare a fresh copy.
    const observer = node
      ? new MutationObserver(() => {
          if (node.outerHTML !== baseline) schedule(600);
        })
      : null;
    if (node && observer) observer.observe(node, { subtree: true, childList: true, characterData: true, attributes: true });
    return () => {
      clearTimeout(timer);
      observer?.disconnect();
      run.current += 1;
    };
  }, [prepare, targetId]);

  function canShareFile(file: File) {
    return typeof navigator.canShare === "function" && typeof navigator.share === "function" && navigator.canShare({ files: [file] });
  }

  async function shareFile(blob: Blob, name: string, type: string) {
    const file = new File([blob], name, { type });
    if (!canShareFile(file)) return false;
    try {
      await navigator.share({ files: [file], title: filename });
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError")) throw error;
    }
    return true;
  }

  // Called straight from the tap: no awaits before navigator.share.
  async function onShare() {
    const files = prepared.current;
    if (!files) return;
    setNote("");
    try {
      if (await shareFile(files.png, `${filename}.png`, "image/png")) return;
      saveBlob(files.png, `${filename}.png`);
      setNote(
        window.isSecureContext
          ? "Sharing isn't supported in this browser. The image was saved. Open WhatsApp and attach it."
          : "Sharing needs the secure (https) site. The image was saved. Open WhatsApp and attach it.",
      );
    } catch {
      setNote("Could not open the share sheet. Try Download image instead.");
    }
  }

  async function onDownload(kind: "png" | "pdf") {
    const files = prepared.current;
    const blob = kind === "png" ? files?.png : files?.pdf;
    if (!files || !blob) return;
    setNote("");
    const name = `${filename}.${kind}`;
    const type = kind === "png" ? "image/png" : "application/pdf";
    try {
      // Home-screen apps on iPhone can't save downloads directly, so use the share sheet ("Save Image", "Save to Files").
      if (isStandalone() && (await shareFile(blob, name, type))) return;
      saveBlob(blob, name);
    } catch {
      setNote("Could not save the file. Try Share instead.");
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" onClick={onShare} disabled={!imageReady}>
          <IconShare className="size-4" /> {imageReady ? "Share on WhatsApp" : "Preparing..."}
        </Button>
        <Button type="button" variant="outline" onClick={() => onDownload("png")} disabled={!imageReady}>
          <IconPhoto className="size-4" /> Download image
        </Button>
        <Button type="button" variant="outline" onClick={() => onDownload("pdf")} disabled={!pdfReady}>
          <IconFileTypePdf className="size-4" /> {pdfReady || !imageReady ? "Download PDF" : "Preparing PDF..."}
        </Button>
      </div>
      {note && <p role="status" className="text-sm text-muted-foreground">{note}</p>}
    </div>
  );
}
