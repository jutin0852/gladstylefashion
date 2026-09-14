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
    <section className="">
      <form
        onSubmit={form.handleSubmit((data) => onFormSubmit(data, images))}
        id="add-product-form"
        className="my-5"
      >
        <FieldGroup className="md:flex md:flex-row px-5">
          <section className=" shadow p-6 w-full flex flex-col gap-4 rounded">
            <h2 className="text-xl font-semibold">Basic Details</h2>
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
            <Controller
              name="categoryId"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="categoryId">Category</FieldLabel>
                  <select {...field} id="categoryId" className="h-9 w-full rounded-md border bg-background px-3 text-sm">
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
            <div className="flex gap-6 text-sm">
              <label className="flex items-center gap-2"><input type="checkbox" defaultChecked {...form.register("isActive")} /> Publish product</label>
              <label className="flex items-center gap-2"><input type="checkbox" {...form.register("featured")} /> Featured</label>
            </div>
            {/* add inventory count */}

            <Field orientation="horizontal" className="my-5">
              <Button
                type="button"
                variant="outline"
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

          <section className=" shadow px-6 pb-6 w-full rounded ">
            <h2 className="font-semibold text-xl my-5">Upload Product Image</h2>
            {/* preview section */}
            {previews.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {previews.map((src, i) => {
                  if (i === 0)
                    return (
                      <div
                        key={i}
                        className="relative p-10  border-dashed border-gray-400 rounded border"
                      >
                        <Image
                          src={src}
                          alt={`preview-${i}`}
                          className="w-full h-74 object-cover rounded border"
                          width={100}
                          height={100}
                        />
                        <IconCircleX
                          onClick={() => removeImage(i)}
                          stroke={1}
                          className="absolute right-0.5 top-0.5 cursor-pointer text-gray-500"
                        />
                        <button
                          onClick={() => replaceImage(i)}
                          className="border rounded absolute right-0 bottom-0"
                        >
                          <IconRefresh className="inline" />{" "}
                          <span>Replace</span>
                        </button>
                      </div>
                    );
                  return (
                    <span
                      key={i}
                      className="relative mr-1.5 p-5 border-dashed border-gray-400 rounded border self-center"
                    >
                      <Image
                        src={src}
                        alt={`preview-${i}`}
                        className="w-24 h-24 object-cover rounded border"
                        width={100}
                        height={100}
                      />
                      <IconCircleX
                        onClick={() => removeImage(i)}
                        stroke={1}
                        className="absolute right-0.5 top-0.5 cursor-pointer text-gray-500"
                      />
                    </span>
                  );
                })}
              </div>
            )}
            {images.length < 5 && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="border border-dashed border-gray-400 p-3 rounded text-gray-600 hover:bg-gray-100"
              >
                <IconCirclePlus className="inline mr-2" />
                Add Image ({images.length}/5)
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
