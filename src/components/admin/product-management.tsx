"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import {
  deleteProduct,
  updateProductStatus,
} from "../../app/actions/manageProducts";
import type { StoreProduct } from "../store/cart-context";

export function ProductManagement({
  products,
}: {
  products: (StoreProduct & { sku: string | null })[];
}) {
  const [items, setItems] = useState(products);
  const [query, setQuery] = useState("");
  const [isPending, startTransition] = useTransition();
  const visible = items.filter(
    (item) =>
      item.productName.toLowerCase().includes(query.toLowerCase()) ||
      item.sku?.toLowerCase().includes(query.toLowerCase()),
  );

  function toggle(id: string, field: "isActive" | "featured", value: boolean) {
    setItems((current) =>
      current.map((item) =>
        item.id === id ? { ...item, [field]: value } : item,
      ),
    );
    startTransition(() => {
      void updateProductStatus(id, field, value);
    });
  }

  function remove(id: string) {
    if (!window.confirm("Delete this product and its images?")) return;
    setItems((current) => current.filter((item) => item.id !== id));
    startTransition(() => {
      void deleteProduct(id);
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search products or SKU"
          className="h-9 w-full max-w-sm rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
        <Link
          href="/admin/add-product"
          className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm text-primary-foreground"
        >
          Add product
        </Link>
      </div>
      <div className="overflow-hidden rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted text-left">
            <tr>
              <th className="p-3">Product</th>
              <th className="p-3">SKU</th>
              <th className="p-3">Price</th>
              <th className="p-3">Stock</th>
              <th className="p-3">Visibility</th>
              <th className="p-3">Featured</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="p-8 text-center text-muted-foreground"
                >
                  No products found.
                </td>
              </tr>
            ) : (
              visible.map((product) => (
                <tr key={product.id} className="border-t">
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-10 overflow-hidden rounded bg-muted">
                        {product.images[0] && (
                          <img
                            src={product.images[0].imageUrl}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        )}
                      </div>
                      <div>
                        <div className="font-medium">{product.productName}</div>
                        <div className="text-xs text-muted-foreground">
                          {product.category?.name || "Uncategorised"}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="p-3 text-muted-foreground">
                    {product.sku || "-"}
                  </td>
                  <td className="p-3">${Number(product.price).toFixed(2)}</td>
                  <td
                    className={`p-3 ${(product.inventoryCount ?? 0) <= 5 ? "font-medium text-destructive" : ""}`}
                  >
                    {product.inventoryCount ?? 0}
                  </td>
                  <td className="p-3">
                    <Link
                      href={`/admin/product-list/${product.id}`}
                      className="mr-3 text-xs underline"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() =>
                        toggle(product.id, "isActive", !product.isActive)
                      }
                      className="text-xs underline"
                    >
                      {product.isActive ? "Published" : "Draft"}
                    </button>
                  </td>
                  <td className="p-3">
                    <button
                      onClick={() =>
                        toggle(product.id, "featured", !product.featured)
                      }
                      className="text-xs underline"
                    >
                      {product.featured ? "Yes" : "No"}
                    </button>
                  </td>
                  <td className="p-3">
                    <button
                      disabled={isPending}
                      onClick={() => remove(product.id)}
                      className="text-xs text-destructive underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
