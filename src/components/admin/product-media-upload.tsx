"use client";

import { useRef, useState, useTransition } from "react";
import { handlecloudinaryUpload } from "../../lib/cloudinary";
import { addProductImages } from "../../app/actions/manageProducts";

export function ProductMediaUpload({ productId }: { productId: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState("");

  function upload() {
    const files = Array.from(inputRef.current?.files || []);
    if (!files.length) return;
    setMessage("");
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
    <div className="rounded-lg border border-dashed p-4">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="block w-full text-sm"
      />
      <button
        type="button"
        disabled={isPending}
        onClick={upload}
        className="mt-3 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
      >
        {isPending ? "Uploading..." : "Upload images"}
      </button>
      {message && (
        <p className="mt-2 text-sm text-muted-foreground">{message}</p>
      )}
    </div>
  );
}
