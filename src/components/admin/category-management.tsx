"use client";

import { useState, useTransition } from "react";
import { createCategory, deleteCategory } from "../../app/actions/manageCategories";

type Category = { id: string; name: string; slug: string; description: string | null; productCount: number };

export function CategoryManagement({ categories }: { categories: Category[] }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  function addCategory() {
    startTransition(() => {
      void createCategory({ name, description }).then((result) => {
        if (result.success) { setName(""); setDescription(""); setMessage("Category created."); }
        else setMessage(result.message || "Could not create category.");
      });
    });
  }

  function removeCategory(id: string) {
    if (!window.confirm("Delete this category? Products will become uncategorised.")) return;
    startTransition(() => { void deleteCategory(id); });
  }

  return <div className="space-y-6">
    <div className="grid gap-3 rounded-lg border p-4 sm:grid-cols-[1fr_1fr_auto]">
      <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Category name" className="h-10 rounded-md border bg-background px-3 text-sm" />
      <input value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Description (optional)" className="h-10 rounded-md border bg-background px-3 text-sm" />
      <button type="button" disabled={isPending} onClick={addCategory} className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50">Add category</button>
      {message && <p className="sm:col-span-3 text-sm text-muted-foreground">{message}</p>}
    </div>
    <div className="overflow-hidden rounded-lg border">
      <table className="w-full text-sm"><thead className="bg-muted text-left"><tr><th className="p-3">Name</th><th className="p-3">Description</th><th className="p-3">Products</th><th className="p-3">Action</th></tr></thead>
        <tbody>{categories.length ? categories.map((category) => <tr key={category.id} className="border-t"><td className="p-3 font-medium">{category.name}</td><td className="p-3 text-muted-foreground">{category.description || "—"}</td><td className="p-3">{category.productCount}</td><td className="p-3"><button type="button" disabled={isPending} onClick={() => removeCategory(category.id)} className="text-xs text-destructive underline">Delete</button></td></tr>) : <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">No categories yet.</td></tr>}</tbody>
      </table>
    </div>
  </div>;
}
