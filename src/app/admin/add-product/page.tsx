"use client";
import { ProductSchema } from "@/types/admin/admin";
import React from "react";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import Image from "next/image";
import { IconCirclePlus, IconCircleX, IconRefresh } from "@tabler/icons-react";

type product = z.infer<typeof ProductSchema>;

export default function AddProduct() {
  const [previews, setPreviews] = React.useState<string[]>([]);
  const [images, setImages] = React.useState<File[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const fileReplaceRef = React.useRef<HTMLInputElement | null>(null);

  const form = useForm<product>({
    resolver: zodResolver(ProductSchema),
  });

  const handleImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    const newFiles = [...images, ...files].slice(0, 5); // limit to 5 images
    setImages(newFiles);
    if (!files) return;
    const urls = newFiles.map((file) => URL.createObjectURL(file));
    setPreviews(urls);
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    setImages(newImages);
    const newPreviews = previews.filter((_, i) => i !== index);
    setPreviews(newPreviews);
  };

  const replaceImage = (index: number) => {
    if (!fileReplaceRef.current) return;
    fileReplaceRef.current.onchange = (e: any) => {
      const file = e.target.files[0];
      if (file) {
        const updated = images.map((img, i) => (i === index ? file : img));
        setImages(updated);
        setPreviews(updated.map((f) => URL.createObjectURL(f)));
      }
    };
    fileReplaceRef.current.click();
  };

  return (
    <section className="flex flex-warp gap-6 p-5">
      <Form {...form}>
        <section className="flex flex-col gap-3.5">
          <h2 className="font-semibold text-xl">Basic details</h2>
          <FormField
            control={form.control}
            name="productName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Product Name</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Product Description</FormLabel>
                <FormControl>
                  <Textarea {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <h2 className="font-semibold text-xl">Pricing</h2>
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Price</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="costPrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Discount Price</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </section>
        <section>
          <h2 className="font-semibold text-xl">Upload Product Image</h2>
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
                        className="w-full h-[296px] object-cover rounded border"
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
                        <IconRefresh className="inline" /> <span>Replace</span>
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
          <FormField
            control={form.control}
            name="images"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Product Image</FormLabel>
                <FormControl>
                  <Input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      handleImages(e);
                      field.onChange(e); // keep RHF in sync
                    }}
                    ref={(el) => {
                      field.ref(el); //keep RHF ref
                      fileInputRef.current = el; // keep your custom ref
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <input type="file" hidden ref={fileReplaceRef} />
        </section>
      </Form>
    </section>
  );
}
