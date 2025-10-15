"use client";
import { DragHandle } from "@/components/admin/data-table";

import React from "react";
import {
  IconDotsVertical,
  IconPointFilled,
  IconTruck,
  IconTruckDelivery,
} from "@tabler/icons-react";
import { ColumnDef } from "@tanstack/react-table";

import { z } from "zod";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { Checkbox } from "@/components/ui/checkbox";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const productOrderSchema = z.object({
  id: z.number(),
  orderId: z.string(),
  product: z.string(),
  status: z.string(),
  date: z.string(),
  payment: z.string(),
  price: z.string(),
});

export const customerSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string(),
  phone: z.string(),
  location: z.string(),
  orderCount: z.string(),
  totalSpent: z.string(),
  status: z.string(),
});

export const productOrderColumns: ColumnDef<
  z.infer<typeof productOrderSchema>
>[] = [
  {
    id: "drag",
    header: () => null,
    cell: ({ row }) => <DragHandle id={row.original.id} />,
  },
  {
    id: "select",
    header: ({ table }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "orderId",
    header: "Order Id",
    cell: ({ row }) => {
      // return <TableCellViewer item={row.original} />;
      return <div className="w-32">{row.original.orderId} </div>;
    },
    enableHiding: false,
  },
  {
    accessorKey: "product",
    header: "Product",
    cell: ({ row }) => (
      <div className="w-32">
        {row.original.product}
        {/* <Badge variant="outline" className="text-muted-foreground px-1.5">
          {row.original.type}
        </Badge> */}
      </div>
    ),
  },
  {
    accessorKey: "date",
    header: "Date",
    cell: ({ row }) => {
      const productDate = new Date(row.original.date);
      const formatted = productDate
        .toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })
        .replaceAll("/", "-");

      return <div className="w-32">{formatted} </div>;
    },
  },
  {
    accessorKey: "price",
    header: "Price",
    cell: ({ row }) => <div className="w-32">{row.original.price} </div>,
  },
  {
    accessorKey: "payment",
    header: "Payment",
    cell: ({ row }) => (
      <span className="w-32 inline-flex items-center gap-1">
        {row.original.payment === "Paid" ? (
          <IconPointFilled color="green" size={11} />
        ) : (
          <IconPointFilled color="red" size={11} />
        )}
        {row.original.payment}
      </span>
    ),
  },

  {
    id: "actions",
    cell: () => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="data-[state=open]:bg-muted text-muted-foreground flex size-8"
            size="icon"
          >
            <IconDotsVertical />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-32">
          <DropdownMenuItem>Edit</DropdownMenuItem>
          <DropdownMenuItem>Make a copy</DropdownMenuItem>
          <DropdownMenuItem>Favorite</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive">Delete</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <Badge variant="outline" className="text-muted-foreground px-1.5">
        {row.original.status === "Delivered" ? (
          <IconTruckDelivery className="fill-green-500 dark:fill-green-400" />
        ) : row.original.status === "pending" ? (
          <IconTruck size={7} className="fill-yellow-300 " />
        ) : (
          <IconTruck />
        )}
        {row.original.status}
      </Badge>
    ),
  },
];

export const customerColumns: ColumnDef<z.infer<typeof customerSchema>>[] = [
  {
    id: "drag",
    header: () => null,
    cell: ({ row }) => <DragHandle id={row.original.id} />,
  },
  {
    id: "select",
    header: ({ table }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "id",
    header: "Customer Id",
    cell: ({ row }) => {
      // return <TableCellViewer item={row.original} />;
      return <div className="w-32">{row.original.id} </div>;
    },
    enableHiding: false,
  },
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => (
      <div className="w-32">
        {row.original.name}
        {/* <Badge variant="outline" className="text-muted-foreground px-1.5">
          {row.original.type}
        </Badge> */}
      </div>
    ),
  },
  {
    accessorKey: "phone",
    header: "Phone",
    cell: ({ row }) => {
      return <div className="w-32">{row.original.phone}</div>;
    },
  },
  {
    accessorKey: "orderCount",
    header: "Order count",
    cell: ({ row }) => <div className="w-32">{row.original.orderCount} </div>,
  },
  {
    accessorKey: "totalSpent",
    header: "Total Spent",
    cell: ({ row }) => (
      <div className="w-32 inline-flex items-center gap-1">
        {row.original.totalSpent}
      </div>
    ),
  },

  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <Badge variant="outline" className="text-muted-foreground px-1.5">
        {row.original.status === "Delivered" ? (
          <IconTruckDelivery className="fill-green-500 dark:fill-green-400" />
        ) : row.original.status === "pending" ? (
          <IconTruck size={7} className="fill-yellow-300 " />
        ) : (
          <IconTruck />
        )}
        {row.original.status}
      </Badge>
    ),
  },
  {
    id: "actions",
    cell: () => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="data-[state=open]:bg-muted text-muted-foreground flex size-8"
            size="icon"
          >
            <IconDotsVertical />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-32">
          <DropdownMenuItem>Edit</DropdownMenuItem>
          <DropdownMenuItem>Make a copy</DropdownMenuItem>
          <DropdownMenuItem>Favorite</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive">Delete</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
];
