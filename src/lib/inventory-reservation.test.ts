import assert from "node:assert/strict";
import { test } from "node:test";
import { getReservationExpiry, isReservationActive } from "./inventory-reservations";

type State = "active" | "converted" | "released";
type Payment = "pending" | "paid" | "expired" | "payment_initialization_failed" | "refund_required";

type SimulatedOrder = {
  key: string;
  productId: string;
  quantity: number;
  reservationStatus: State;
  paymentStatus: Payment;
  expiresAt: Date;
};

function createInventorySimulator(initialStock: number) {
  let stock = initialStock;
  let nextOrder = 1;
  const orders = new Map<string, SimulatedOrder>();
  let lock = Promise.resolve();

  async function atomic<T>(operation: () => T | Promise<T>) {
    const previous = lock;
    let release!: () => void;
    lock = new Promise<void>((resolve) => { release = resolve; });
    await previous;
    try {
      return await operation();
    } finally {
      release();
    }
  }

  return {
    async reserve(key: string, quantity: number, expiresAt: Date) {
      return atomic(() => {
        const existing = orders.get(key);
        if (existing) return existing;
        if (stock < quantity) return null;
        stock -= quantity;
        const order = { key, productId: "product-1", quantity, reservationStatus: "active" as const, paymentStatus: "pending" as const, expiresAt };
        orders.set(key, order);
        return order;
      });
    },
    async release(key: string, reason: "expired" | "payment_initialization_failed") {
      return atomic(() => {
        const order = orders.get(key);
        if (!order || order.reservationStatus !== "active") return false;
        stock += order.quantity;
        order.reservationStatus = "released";
        order.paymentStatus = reason;
        return true;
      });
    },
    async finalize(key: string, paymentSucceeded: boolean, at: Date) {
      return atomic(() => {
        const order = orders.get(key);
        if (!order) throw new Error("missing order");
        if (order.paymentStatus === "paid") return "paid";
        if (!paymentSucceeded) return "pending";
        if (!isReservationActive(order.reservationStatus, order.expiresAt, at)) {
          order.paymentStatus = "refund_required";
          return "refund_required";
        }
        order.reservationStatus = "converted";
        order.paymentStatus = "paid";
        return "paid";
      });
    },
    get stock() {
      return stock;
    },
    get orderCount() {
      return orders.size;
    },
    getOrder(key: string) {
      return orders.get(key);
    },
    nextOrderNumber() {
      return `GS-${nextOrder++}`;
    },
  };
}

test("reservation expiry is configurable and produces a future timestamp", () => {
  const start = new Date("2026-01-01T00:00:00.000Z");
  const expiry = getReservationExpiry(start);
  assert.equal(expiry.getTime() - start.getTime(), 30 * 60_000);
  assert.equal(isReservationActive("active", expiry, start), true);
  assert.equal(isReservationActive("active", expiry, new Date(expiry.getTime() + 1)), false);
});

test("concurrent customers cannot reserve the final unit twice", async () => {
  const simulator = createInventorySimulator(1);
  const [first, second] = await Promise.all([
    simulator.reserve("checkout-a", 1, getReservationExpiry()),
    simulator.reserve("checkout-b", 1, getReservationExpiry()),
  ]);
  assert.equal([first, second].filter(Boolean).length, 1);
  assert.equal(simulator.stock, 0);
});

test("idempotent checkout submission reuses one reservation", async () => {
  const simulator = createInventorySimulator(1);
  const first = await simulator.reserve("same-checkout", 1, getReservationExpiry());
  const second = await simulator.reserve("same-checkout", 1, getReservationExpiry());
  assert.equal(first, second);
  assert.equal(simulator.orderCount, 1);
  assert.equal(simulator.stock, 0);
});

test("failed payment initialization releases stock exactly once", async () => {
  const simulator = createInventorySimulator(1);
  await simulator.reserve("initialization-failure", 1, getReservationExpiry());
  assert.equal(await simulator.release("initialization-failure", "payment_initialization_failed"), true);
  assert.equal(await simulator.release("initialization-failure", "payment_initialization_failed"), false);
  assert.equal(simulator.stock, 1);
  assert.equal(simulator.getOrder("initialization-failure")?.paymentStatus, "payment_initialization_failed");
});

test("expired reservations release stock and repeated cleanup is harmless", async () => {
  const simulator = createInventorySimulator(1);
  await simulator.reserve("expired-checkout", 1, new Date("2026-01-01T00:00:00.000Z"));
  const releases = await Promise.all([
    simulator.release("expired-checkout", "expired"),
    simulator.release("expired-checkout", "expired"),
  ]);
  assert.deepEqual(releases.sort(), [false, true]);
  assert.equal(simulator.stock, 1);
});

test("successful payment converts the reservation without decrementing stock again", async () => {
  const simulator = createInventorySimulator(1);
  await simulator.reserve("successful-payment", 1, getReservationExpiry());
  assert.equal(await simulator.finalize("successful-payment", true, new Date()), "paid");
  assert.equal(await simulator.finalize("successful-payment", true, new Date()), "paid");
  assert.equal(simulator.stock, 0);
  assert.equal(simulator.getOrder("successful-payment")?.reservationStatus, "converted");
});

test("browser verification and webhook retries are idempotent", async () => {
  const simulator = createInventorySimulator(1);
  await simulator.reserve("duplicate-webhook", 1, getReservationExpiry());
  const [browser, webhook] = await Promise.all([
    simulator.finalize("duplicate-webhook", true, new Date()),
    simulator.finalize("duplicate-webhook", true, new Date()),
  ]);
  assert.deepEqual([browser, webhook].sort(), ["paid", "paid"]);
  assert.equal(simulator.stock, 0);
});

test("successful payment after release becomes refund-required without reallocating stock", async () => {
  const simulator = createInventorySimulator(1);
  await simulator.reserve("late-payment", 1, new Date("2026-01-01T00:00:00.000Z"));
  await simulator.release("late-payment", "expired");
  assert.equal(await simulator.finalize("late-payment", true, new Date("2026-01-01T00:31:00.000Z")), "refund_required");
  assert.equal(simulator.stock, 1);
  assert.equal(simulator.getOrder("late-payment")?.paymentStatus, "refund_required");
});
