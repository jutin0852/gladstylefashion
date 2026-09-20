"use client";
import React, { useEffect } from "react";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import Image from "next/image";
import { IconCirclePlus, IconCircleX, IconRefresh } from "@tabler/icons-react";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "../../../components/ui/field";
import { Button } from "../../../components/ui/button";
import { handlecloudinaryUpload } from "../../../lib/cloudinary";
import { ImageFilesSchema, ProductSchema } from "../../../types/admin/admin";
import { toast } from "sonner";
import { Spinner } from "../../../components/ui/spinner";
import {
  checkSlugExists,
  createProductAction,
} from "../../actions/addProducts";
import { getCategoryOptions } from "../../actions/manageCategories";

type ProductFormValues = z.infer<typeof ProductSchema>;

export default function AddProduct() {
  const [previews, setPreviews] = React.useState<string[]>([]);
  const [images, setImages] = React.useState<File[]>([]);
  const [categories, setCategories] = React.useState<{ id: string; name: string }[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const fileReplaceRef = React.useRef<HTMLInputElement | null>(null);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(ProductSchema),
    defaultValues: {
      productName: "",
      description: "",
      price: 0,
      costPrice: 0,
      inventoryCount: 0,
      isActive: true,
      featured: false,
      categoryId: "",
      materials: "",
      careInstructions: "",
    },
  });
  const isSubmitting = form.formState.isSubmitting;

  const onFormSubmit = async (
    data: ProductFormValues,
    image: File | File[],
  ) => {
    if (isSubmitting) return;

    const fileValidation = ImageFilesSchema.safeParse(images);
    console.log(fileValidation.success, fileValidation.error);

    if (!fileValidation.success) {
      form.setError("images", {
        type: "manual",
        message: fileValidation.error.issues[0].message,
      });
      return;
    }

    const formData = new FormData();

    // Add object fields
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, String(value)); // numbers must be converted
      }
    });

    const slugExists = await checkSlugExists(data.productName);
    if (slugExists) {
      form.setError("productName", {
        type: "manual",
        message:
          "A product with this name already exists. Please use a different name.",
      });
      return;
    }

    const productImages = await handlecloudinaryUpload(image);
    productImages.map((image) => formData.append("images", image));
    const res = await createProductAction(formData);

    if (!res.success) {
      toast.error(res.message);
      return;
    }
    toast.success(res.message);
  };

  useEffect(() => {
    void getCategoryOptions().then(setCategories);
  }, []);

  useEffect(() => {
    return () => {
      previews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [previews]);

  const fileKey = (file: File): string =>
    `${file.name}-${file.size}-${file.lastModified}`;

  const handleImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = Array.from(e.target.files ?? []);
    if (!file.length) return;

    const added = new Set<string>();
    const uniqueFiles = [...images, ...file].filter((file) => {
      const key = fileKey(file);
      if (added.has(key)) {
        return false;
      }
      added.add(key);
      return true;
    });
    console.log("added", added);
    console.log(uniqueFiles, "unique files");

    const newFiles = uniqueFiles.slice(0, 5); // limit to 5 images
    setImages(newFiles);
    const urls = newFiles.map((file) => URL.createObjectURL(file));
    setPreviews(urls);
    form.clearErrors("images");
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    setImages(newImages);
    const newPreviews = previews.filter((_, i) => i !== index);
    setPreviews(newPreviews);
  };

  const replaceImage = (index: number) => {
    if (!fileReplaceRef.current) return;
    fileReplaceRef.current.onchange = (event) => {
      const input = event.currentTarget as HTMLInputElement;
      const file = input.files?.[0];
      if (file) {
        const updated = images.map((img, i) => (i === index ? file : img));
        setImages(updated);
        setPreviews(updated.map((f) => URL.createObjectURL(f)));
      }
    };
    fileReplaceRef.current.click();
  };

  return (
    <section className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-4 border-b border-black/15 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#d3146d]">Catalogue</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-black sm:text-4xl">Add a product</h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-black/60">Build a complete listing with the details customers need before it goes live.</p>
        </div>
        <p className="max-w-xs border-l-4 border-[#d3146d] bg-[#f9e4ee] px-4 py-3 text-xs leading-5 text-black/70">Add product information, stock, and up to five product images before publishing.</p>
      </div>
      <form
        onSubmit={form.handleSubmit((data) => onFormSubmit(data, images))}
        id="add-product-form"
        className="pb-8"
      >
        <FieldGroup className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(320px,.75fr)]">
          <section className="flex w-full flex-col gap-5 border border-black/15 bg-white p-5 shadow-none sm:p-7">
            <div className="border-b border-black/15 pb-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#d3146d]">Product details</p>
              <h2 className="mt-2 text-xl font-semibold tracking-tight">The essentials</h2>
              <p className="mt-1 text-sm leading-6 text-black/60">Name the piece clearly and describe the fit, silhouette, and standout details.</p>
            </div>
            <Controller
              name="productName"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="productName">Product Name</FieldLabel>
                  <Input
                    {...field}
                    id="productName"
                    aria-invalid={fieldState.invalid}
                    placeholder="Enter product name"
                    autoComplete="off"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              name="description"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="description">
                    Product Description
                  </FieldLabel>
                  <Textarea
                    {...field}
                    id="description"
                    aria-invalid={fieldState.invalid}
                    placeholder="Enter product description"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <div className="border-t border-black/15 pt-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#d3146d]">Pricing &amp; inventory</p>
              <p className="mt-1 text-sm text-black/60">Set the selling price, internal cost, and available units.</p>
            </div>
            <Controller
              name="price"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="price">Product Price</FieldLabel>
                  <Input
                    {...field}
                    id="price"
                    onChange={(e) =>
                      field.onChange(
                        e.target.value ? parseFloat(e.target.value) : undefined,
                      )
                    }
                    aria-invalid={fieldState.invalid}
                    placeholder="Enter product price"
                    autoComplete="off"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            {/* change to discounted prices */}
            <Controller
              name="costPrice"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="costPrice">Cost Price</FieldLabel>
                  <Input
                    {...field}
                    id="costPrice"
                    aria-invalid={fieldState.invalid}
                    placeholder="Enter cost price"
                    autoComplete="off"
                    onChange={(e) =>
                      field.onChange(
                        e.target.value ? parseFloat(e.target.value) : undefined,
                      )
                    }
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            {/* <Controller
              name="price"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="price">Product Price</FieldLabel>
                  <Input
                    {...field}
                    id="price"
                    aria-invalid={fieldState.invalid}
                    placeholder="Enter product price"
                    autoComplete="off"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )} */}
            {/* /> */}
            {/* expiration date for discounted prices */}

            {/* <h2>stock quantity</h2> */}
            {/* change to stock quantity */}
            <Controller
              name="inventoryCount"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="inventoryCount">
                    Inventory Count
                  </FieldLabel>
                  <Input
                    {...field}
                    id="inventoryCount"
                    onChange={(e) =>
                      field.onChange(
                        e.target.value ? parseFloat(e.target.value) : undefined,
                      )
                    }
                    aria-invalid={fieldState.invalid}
                    placeholder="Enter inventory count"
                    autoComplete="off"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              name="sku"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="sku">SKU</FieldLabel>
                  <Input {...field} id="sku" placeholder="e.g. GS-DRESS-001" />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <div className="border-t border-black/15 pt-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#d3146d]">Product options</p>
              <p className="mt-1 text-sm text-black/60">Add the category, sizes, fabric, and care information.</p>
            </div>
            <Controller
              name="categoryId"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="categoryId">Category</FieldLabel>
                  <select {...field} id="categoryId" className="h-10 w-full border border-black/20 bg-white px-3 text-sm outline-none transition focus:border-[#d3146d] focus:ring-2 focus:ring-[#d3146d]/20">
                    <option value="">Uncategorised</option>
                    {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                  </select>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <Controller
              name="sizes"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="sizes">Sizes</FieldLabel>
                  <Input
                    id="sizes"
                    value={field.value?.join(", ") || ""}
                    onChange={(event) => field.onChange(event.target.value.split(",").map((size) => size.trim()).filter(Boolean))}
                    placeholder="XS, S, M, L, XL"
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <Controller
              name="materials"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="materials">Materials</FieldLabel>
                  <Input {...field} value={field.value || ""} id="materials" placeholder="e.g. 100% organic cotton" />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <Controller
              name="careInstructions"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="careInstructions">Care instructions</FieldLabel>
                  <Textarea {...field} value={field.value || ""} id="careInstructions" placeholder="e.g. Machine wash cold" />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <div className="flex flex-col gap-3 border-t border-black/15 pt-5 text-sm sm:flex-row sm:gap-6">
              <label className="flex items-center gap-2 font-medium"><input className="accent-[#d3146d]" type="checkbox" defaultChecked {...form.register("isActive")} /> Publish product</label>
              <label className="flex items-center gap-2 font-medium"><input className="accent-[#d3146d]" type="checkbox" {...form.register("featured")} /> Feature on storefront</label>
            </div>
            {/* add inventory count */}

            <Field orientation="horizontal" className="mt-2 flex flex-col-reverse gap-3 border-t border-black/15 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <Button
                type="button"
                variant="outline"
                className="w-full border-black/25 sm:w-auto"
                onClick={() => {
                  form.reset();
                  toast.success("Form has been reset", {
                    position: "bottom-center",
                  });
                }}
              >
                Reset
              </Button>
              <Button
                type="submit"
                form="add-product-form"
                disabled={isSubmitting}
                className="w-full bg-[#d3146d] text-white hover:bg-black sm:w-auto"
              >
                {isSubmitting ? (
                  <span className="flex flex-nowrap gap-2">
                    <Spinner className="self-center" />
                    Adding Product..
                  </span>
                ) : (
                  <span>Add Product</span>
                )}
              </Button>
              {/* <Button
                type="button"
                onClick={() => handlecloudinaryUpload(images)}
              >
                Upload
              </Button> */}
            </Field>
          </section>

          <section className="w-full border border-black/15 bg-white p-5 shadow-none sm:p-7 lg:sticky lg:top-6">
            <div className="border-b border-black/15 pb-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#d3146d]">Product photography</p>
              <h2 className="mt-2 text-xl font-semibold tracking-tight">Add images</h2>
              <p className="mt-1 text-sm leading-6 text-black/60">Upload the main image first. It will lead the product card and details page.</p>
            </div>
            {/* preview section */}
            {previews.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-3">
                {previews.map((src, i) => {
                  if (i === 0)
                    return (
                      <div
                        key={i}
                        className="relative w-full overflow-hidden border border-black/15 bg-[#f9e4ee] p-3"
                      >
                        <Image
                          src={src}
                          alt={`preview-${i}`}
                          className="aspect-[4/5] h-auto w-full object-cover"
                          width={720}
                          height={900}
                        />
                        <button type="button" onClick={() => removeImage(i)} aria-label="Remove primary image" className="absolute right-5 top-5 rounded-full bg-white p-1.5 text-black shadow-sm transition hover:bg-[#d3146d] hover:text-white">
                          <IconCircleX stroke={1.5} size={20} />
                        </button>
                        <button
                          type="button"
                          onClick={() => replaceImage(i)}
                          className="absolute bottom-5 right-5 bg-white px-3 py-2 text-xs font-semibold text-black shadow-sm transition hover:bg-black hover:text-white"
                        >
                          <IconRefresh className="inline" />{" "}
                          <span>Replace</span>
                        </button>
                      </div>
                    );
                  return (
                    <div
                      key={i}
                      className="relative w-[calc(50%-0.375rem)] overflow-hidden border border-black/15 bg-[#f9e4ee] p-2 sm:w-[calc(33.333%-0.5rem)]"
                    >
                      <Image
                        src={src}
                        alt={`preview-${i}`}
                        className="aspect-square h-auto w-full object-cover"
                        width={240}
                        height={240}
                      />
                      <button type="button" onClick={() => removeImage(i)} aria-label={`Remove image ${i + 1}`} className="absolute right-3 top-3 rounded-full bg-white p-1 text-black shadow-sm transition hover:bg-[#d3146d] hover:text-white">
                        <IconCircleX stroke={1.5} size={18} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
            {images.length < 5 && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="mt-5 flex w-full items-center justify-center border border-dashed border-black/30 bg-[#fcfbfc] px-4 py-5 text-sm font-semibold text-black transition hover:border-[#d3146d] hover:bg-[#f9e4ee]"
              >
                <IconCirclePlus className="mr-2" size={20} />
                Add images ({images.length}/5)
              </button>
            )}
            {form.formState.errors.images && (
              <p className="text-sm text-red-500">
                {form.formState.errors.images.message}
              </p>
            )}

            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                handleImages(e);
              }}
              ref={(el) => {
                fileInputRef.current = el;
              }}
            />

            <input type="file" hidden ref={fileReplaceRef} />
          </section>
        </FieldGroup>
      </form>
    </section>
  );
}
