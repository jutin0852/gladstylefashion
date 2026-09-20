"use client";

import { useRef, useState, useTransition } from "react";
import { handlecloudinaryUpload } from "../../lib/cloudinary";
import { addProductImages } from "../../app/actions/manageProducts";

export function ProductMediaUpload({
  productId,
  currentImageCount,
}: {
  productId: string;
  currentImageCount: number;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState("");

  function upload() {
    const files = Array.from(inputRef.current?.files || []);
    if (!files.length) return;
    setMessage("");

    const remainingSlots = 5 - currentImageCount;
    if (remainingSlots <= 0) {
      setMessage("This product already has the maximum of five images.");
      return;
    }
    if (files.length > remainingSlots) {
      setMessage(`You can add ${remainingSlots} more image${remainingSlots === 1 ? "" : "s"}.`);
      return;
    }
    if (files.some((file) => !file.type.startsWith("image/"))) {
      setMessage("Choose image files only.");
      return;
    }
    if (files.some((file) => file.size > 5 * 1024 * 1024)) {
      setMessage("Each image must be 5MB or smaller.");
      return;
    }

    startTransition(() => {
      void handlecloudinaryUpload(files)
        .then((urls) =>
          addProductImages(productId, Array.isArray(urls) ? urls : [urls]),
        )
        .then((result) =>
          setMessage(
            result.success
              ? "Images uploaded."
              : result.message || "Could not upload images.",
          ),
        )
        .catch(() =>
          setMessage("Image upload failed. Check Cloudinary configuration."),
        );
    });
  }

  return (
    <div className="border border-dashed border-black/25 bg-[#fcfbfc] p-4">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="block w-full text-sm file:mr-3 file:border-0 file:bg-[#f9e4ee] file:px-3 file:py-2 file:text-xs file:font-semibold file:text-black"
      />
      <p className="mt-3 text-xs leading-5 text-muted-foreground">
        Add up to {5 - currentImageCount} more image{5 - currentImageCount === 1 ? "" : "s"}. Use clear front, back, and detail views. Images must be 5MB or smaller.
      </p>
      <button
        type="button"
        disabled={isPending}
        onClick={upload}
        className="mt-4 bg-[#d3146d] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-black disabled:opacity-50"
      >
        {isPending ? "Uploading..." : "Upload images"}
      </button>
      {message && (
        <p className="mt-2 text-sm text-muted-foreground">{message}</p>
      )}
    </div>
  );
}
