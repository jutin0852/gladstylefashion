"use client";

import type { AdminOrder } from "../../lib/admin/queries/analytics";
import { Badge } from "../ui/badge";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";

export function LiveOrdersTable({ orders }: { orders: AdminOrder[] }) {
  return (
    <div className="overflow-hidden rounded-lg border">
      <Table>
        <TableHeader className="bg-muted">
          <TableRow>
            <TableHead>Order</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Items</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Payment</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="h-24 text-center">
                No orders yet.
              </TableCell>
            </TableRow>
          ) : (
            orders.map((order) => (
              <TableRow key={order.id}>
                <TableCell className="font-medium">
                  <Link href={`/admin/orders/${order.id}`} className="underline">
                    {order.orderNumber}
                  </Link>
                </TableCell>
                <TableCell>
                  <div>{order.customerName}</div>
                  <div className="text-muted-foreground text-xs">
                    {order.customerEmail}
                  </div>
                </TableCell>
                <TableCell>{order.itemCount}</TableCell>
                <TableCell>${Number(order.totalAmount).toFixed(2)}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      order.paymentStatus === "paid" ? "default" : "outline"
                    }
                  >
                    {order.paymentStatus}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Link href={`/admin/orders/${order.id}`} className="capitalize underline">
                    {order.status}
                  </Link>
                </TableCell>
                <TableCell>
                  {order.createdAt
                    ? new Date(order.createdAt).toLocaleDateString("en-GB")
                    : "-"}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
