"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { updateProduct } from "../../app/actions/manageProducts";
import { getCategoryOptions } from "../../app/actions/manageCategories";
import type { Product } from "../../lib/schema";

export function ProductEditForm({
  product,
}: {
  product: Product & { images: { imageUrl: string }[] };
}) {
  const [name, setName] = useState(product.productName);
  const [description, setDescription] = useState(product.description || "");
  const [price, setPrice] = useState(String(product.price));
  const [costPrice, setCostPrice] = useState(
    product.costPrice ? String(product.costPrice) : "",
  );
  const [inventory, setInventory] = useState(
    String(product.inventoryCount ?? 0),
  );
  const [sku, setSku] = useState(product.sku || "");
  const [categoryId, setCategoryId] = useState(product.categoryId || "");
  const [categories, setCategories] = useState<{ id: string; name: string }[]>(
    [],
  );
  const [sizes, setSizes] = useState((product.sizes || []).join(", "));
  const [materials, setMaterials] = useState(product.materials || "");
  const [care, setCare] = useState(product.careInstructions || "");
  const [isActive, setIsActive] = useState(product.isActive ?? true);
  const [featured, setFeatured] = useState(product.featured ?? false);
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    void getCategoryOptions().then(setCategories);
  }, []);

  function save() {
    setMessage("");
    startTransition(() => {
      void updateProduct(product.id, {
        productName: name,
        description,
        price: Number(price),
        costPrice: costPrice ? Number(costPrice) : undefined,
        inventoryCount: Number(inventory),
        sku,
        categoryId,
        sizes: sizes
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        materials,
        careInstructions: care,
        isActive,
        featured,
      }).then((result) =>
        setMessage(
          result.success
            ? "Product saved."
            : result.message || "Could not save product.",
        ),
      );
    });
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="sm:col-span-2">
          <span className="mb-2 block text-sm text-muted-foreground">
            Product name
          </span>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="w-full rounded-md border bg-background px-3 py-2"
          />
        </label>
        <label>
          <span className="mb-2 block text-sm text-muted-foreground">
            Price
          </span>
          <input
            type="number"
            min="0.01"
            step="0.01"
            value={price}
            onChange={(event) => setPrice(event.target.value)}
            className="w-full rounded-md border bg-background px-3 py-2"
          />
        </label>
        <label>
          <span className="mb-2 block text-sm text-muted-foreground">
            Cost price
          </span>
          <input
            type="number"
            min="0"
            step="0.01"
            value={costPrice}
            onChange={(event) => setCostPrice(event.target.value)}
            className="w-full rounded-md border bg-background px-3 py-2"
          />
        </label>
        <label>
          <span className="mb-2 block text-sm text-muted-foreground">
            Inventory
          </span>
          <input
            type="number"
            min="0"
            step="1"
            value={inventory}
            onChange={(event) => setInventory(event.target.value)}
            className="w-full rounded-md border bg-background px-3 py-2"
          />
        </label>
        <label>
          <span className="mb-2 block text-sm text-muted-foreground">SKU</span>
          <input
            value={sku}
            onChange={(event) => setSku(event.target.value)}
            className="w-full rounded-md border bg-background px-3 py-2"
          />
        </label>
        <label className="sm:col-span-2">
          <span className="mb-2 block text-sm text-muted-foreground">
            Category
          </span>
          <select
            value={categoryId}
            onChange={(event) => setCategoryId(event.target.value)}
            className="w-full rounded-md border bg-background px-3 py-2"
          >
            <option value="">Uncategorised</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
        <label className="sm:col-span-2">
          <span className="mb-2 block text-sm text-muted-foreground">
            Description
          </span>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={4}
            className="w-full rounded-md border bg-background px-3 py-2"
          />
        </label>
        <label className="sm:col-span-2">
          <span className="mb-2 block text-sm text-muted-foreground">
            Sizes, separated by commas
          </span>
          <input
            value={sizes}
            onChange={(event) => setSizes(event.target.value)}
            className="w-full rounded-md border bg-background px-3 py-2"
          />
        </label>
        <label>
          <span className="mb-2 block text-sm text-muted-foreground">
            Materials
          </span>
          <input
            value={materials}
            onChange={(event) => setMaterials(event.target.value)}
            className="w-full rounded-md border bg-background px-3 py-2"
          />
        </label>
        <label>
          <span className="mb-2 block text-sm text-muted-foreground">
            Care instructions
          </span>
          <input
            value={care}
            onChange={(event) => setCare(event.target.value)}
            className="w-full rounded-md border bg-background px-3 py-2"
          />
        </label>
      </div>
      <div className="flex gap-6 text-sm">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(event) => setIsActive(event.target.checked)}
          />{" "}
          Published
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={featured}
            onChange={(event) => setFeatured(event.target.checked)}
          />{" "}
          Featured
        </label>
      </div>
      {message && <p className="text-sm text-muted-foreground">{message}</p>}
      <div className="flex gap-3">
        <button
          disabled={isPending}
          onClick={save}
          className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
        >
          {isPending ? "Saving..." : "Save changes"}
        </button>
        <Link
          href="/admin/product-list"
          className="rounded-md border px-4 py-2 text-sm"
        >
          Back to products
        </Link>
      </div>
    </div>
  );
}
