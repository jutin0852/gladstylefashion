"use client";

import { useState, useTransition } from "react";
import { deleteProductImage } from "../../app/actions/manageProducts";
import type { StoreProduct } from "../store/cart-context";
import { ProductMediaUpload } from "./product-media-upload";

export function ProductMediaLibrary({
  products,
}: {
  products: StoreProduct[];
}) {
  const [items, setItems] = useState(products);
  const [isPending, startTransition] = useTransition();
  const media = items.flatMap((product) =>
    product.images.map((image, index) => ({ ...image, product, index })),
  );

  function remove(imageId: number, productId: string) {
    if (!window.confirm("Remove this product image?")) return;
    setItems((current) =>
      current.map((product) =>
        product.id === productId
          ? {
              ...product,
              images: product.images.filter((image) => image.id !== imageId),
            }
          : product,
      ),
    );
    startTransition(() => {
      void deleteProductImage(imageId);
    });
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {media.length} images across {items.length} products.
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        {items
          .filter((product) => product.isActive || product.images.length === 0)
          .map((product) => (
            <div key={product.id} className="rounded-lg border bg-card p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="font-medium">{product.productName}</p>
                <span className="text-xs text-muted-foreground">
                  {product.images.length}/5 images
                </span>
              </div>
              <ProductMediaUpload productId={product.id} />
            </div>
          ))}
      </div>
      {media.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
          No product media uploaded yet.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-5">
          {media.map((image) => (
            <div
              key={image.id}
              className="group overflow-hidden rounded-lg border bg-card"
            >
              <div className="aspect-[3/4] bg-muted">
                <img
                  src={image.imageUrl}
                  alt={image.altText || image.product.productName}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="flex items-center justify-between gap-2 p-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {image.product.productName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Image {image.index + 1}
                  </p>
                </div>
                <button
                  disabled={isPending}
                  onClick={() => remove(image.id, image.product.id)}
                  className="text-xs text-destructive underline"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
