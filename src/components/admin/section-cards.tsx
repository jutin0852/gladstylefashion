import { IconAlertTriangle, IconArrowUpRight } from "@tabler/icons-react";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export type CardData = {
  description: string;
  title: string;
  action: string;
  footerMain: string;
  footerSub: string;
  trend: "up" | "down";
};

export function SectionCards({ cardData }: { cardData: CardData[] }) {
  return (
    <div className="grid grid-cols-1 gap-3 px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      {cardData.map((card, i) => (
        <Card className="@container/card rounded-none border-black/15 bg-white shadow-none" key={i} data-slot="card">
          <CardHeader className="gap-2">
            <CardDescription className="text-[10px] font-semibold uppercase tracking-[.14em] text-black/55">{card.description}</CardDescription>
            <CardTitle className="text-3xl font-semibold tabular-nums tracking-tight">
              {card.title}
            </CardTitle>
            <CardAction className={card.trend === "down" ? "text-[#d3146d]" : "text-black/50"}>{card.trend === "down" ? <IconAlertTriangle className="size-4" /> : <IconArrowUpRight className="size-4" />}</CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 font-medium">{card.footerMain}</div>
            <div className="text-muted-foreground">{card.footerSub}</div>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
