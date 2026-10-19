"use client";

import * as React from "react";
import { Area, Bar, CartesianGrid, ComposedChart, XAxis, YAxis } from "recharts";

import { useIsMobile } from "@/hooks/use-mobile";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

export const description = "Orders and revenue per day";

type DayPoint = { date: string; orders: number; revenue: number };

const chartConfig = {
  revenue: {
    label: "Revenue",
    color: "#d3146d",
  },
  orders: {
    label: "Orders",
    color: "#1d1b2c",
  },
} satisfies ChartConfig;

const RANGES = {
  "90d": { days: 90, label: "Last 3 months", sentence: "the last 3 months" },
  "30d": { days: 30, label: "Last 30 days", sentence: "the last 30 days" },
  "7d": { days: 7, label: "Last 7 days", sentence: "the last 7 days" },
} as const;

type RangeKey = keyof typeof RANGES;

function dayKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

/**
 * One point for every day in the range, with zeros on days that had no orders.
 * Without this the chart only has points on order days, so a quiet store
 * draws nothing (an area needs at least two points to show a shape).
 */
function fillDays(data: DayPoint[], days: number): DayPoint[] {
  const byDay = new Map(data.map((point) => [point.date, point]));
  const today = new Date();
  const points: DayPoint[] = [];
  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const day = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - offset));
    const key = dayKey(day);
    const found = byDay.get(key);
    points.push({ date: key, orders: found?.orders ?? 0, revenue: found?.revenue ?? 0 });
  }
  return points;
}

const naira = (value: number) => `₦${Math.round(value).toLocaleString("en-NG")}`;
const compactNaira = (value: number) =>
  value >= 1_000_000 ? `₦${+(value / 1_000_000).toFixed(1)}m` : value >= 1000 ? `₦${Math.round(value / 1000)}k` : `₦${value}`;

const formatDay = (value: string) =>
  new Date(`${value}T00:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

export function ChartAreaInteractive({ data = [] }: { data?: DayPoint[] }) {
  const isMobile = useIsMobile();
  const [timeRange, setTimeRange] = React.useState<RangeKey>("90d");

  React.useEffect(() => {
    if (isMobile) {
      setTimeRange("30d");
    }
  }, [isMobile]);

  const range = RANGES[timeRange];
  const series = React.useMemo(() => fillDays(data, range.days), [data, range.days]);
  const totals = series.reduce(
    (sum, point) => ({ orders: sum.orders + point.orders, revenue: sum.revenue + point.revenue }),
    { orders: 0, revenue: 0 },
  );
  const maxOrders = Math.max(1, ...series.map((point) => point.orders));

  return (
    <Card className="@container/card rounded-none border-black/15 bg-white shadow-none">
      <CardHeader>
        <CardTitle>Store performance</CardTitle>
        <CardDescription>
          {totals.orders === 0
            ? `No orders in ${range.sentence}`
            : `${totals.orders} ${totals.orders === 1 ? "order" : "orders"} · ${naira(totals.revenue)} in ${range.sentence}`}
        </CardDescription>
        <CardAction>
          <ToggleGroup
            type="single"
            value={timeRange}
            onValueChange={(value) => value && setTimeRange(value as RangeKey)}
            variant="outline"
            className="hidden *:data-[slot=toggle-group-item]:!px-4 @[767px]/card:flex"
          >
            <ToggleGroupItem value="90d">{RANGES["90d"].label}</ToggleGroupItem>
            <ToggleGroupItem value="30d">{RANGES["30d"].label}</ToggleGroupItem>
            <ToggleGroupItem value="7d">{RANGES["7d"].label}</ToggleGroupItem>
          </ToggleGroup>
          <Select value={timeRange} onValueChange={(value) => setTimeRange(value as RangeKey)}>
            <SelectTrigger
              className="flex w-40 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden"
              size="sm"
              aria-label="Select a time range"
            >
              <SelectValue placeholder={RANGES["90d"].label} />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="90d" className="rounded-lg">{RANGES["90d"].label}</SelectItem>
              <SelectItem value="30d" className="rounded-lg">{RANGES["30d"].label}</SelectItem>
              <SelectItem value="7d" className="rounded-lg">{RANGES["7d"].label}</SelectItem>
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <div className="mb-2 flex items-center gap-4 px-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5"><span className="inline-block size-2.5" style={{ background: chartConfig.revenue.color }} />Revenue (₦)</span>
          <span className="inline-flex items-center gap-1.5"><span className="inline-block size-2.5" style={{ background: chartConfig.orders.color }} />Orders</span>
        </div>
        <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
          <ComposedChart data={series} margin={{ left: 0, right: 0 }}>
            <defs>
              <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-revenue)" stopOpacity={0.55} />
                <stop offset="95%" stopColor="var(--color-revenue)" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={28}
              tickFormatter={formatDay}
            />
            <YAxis
              yAxisId="revenue"
              tickLine={false}
              axisLine={false}
              width={44}
              tickMargin={4}
              tickFormatter={compactNaira}
              domain={[0, (max: number) => Math.max(max, 50000)]}
            />
            <YAxis
              yAxisId="orders"
              orientation="right"
              tickLine={false}
              axisLine={false}
              width={28}
              tickMargin={4}
              allowDecimals={false}
              domain={[0, Math.max(maxOrders, 3)]}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => formatDay(String(value))}
                  indicator="dot"
                  formatter={(value, name) => (
                    <div className="flex w-full items-center justify-between gap-4">
                      <span className="text-muted-foreground">{name === "revenue" ? "Revenue" : "Orders"}</span>
                      <span className="font-mono font-medium tabular-nums">{name === "revenue" ? naira(Number(value)) : String(value)}</span>
                    </div>
                  )}
                />
              }
            />
            <Area
              yAxisId="revenue"
              dataKey="revenue"
              type="monotone"
              fill="url(#fillRevenue)"
              stroke="var(--color-revenue)"
              strokeWidth={2}
              dot={false}
            />
            <Bar yAxisId="orders" dataKey="orders" fill="var(--color-orders)" radius={[2, 2, 0, 0]} maxBarSize={14} />
          </ComposedChart>
        </ChartContainer>
        {totals.orders === 0 && (
          <p className="px-2 pt-3 text-center text-sm text-muted-foreground">Orders and revenue will show here as soon as the first order comes in.</p>
        )}
      </CardContent>
    </Card>
  );
}
