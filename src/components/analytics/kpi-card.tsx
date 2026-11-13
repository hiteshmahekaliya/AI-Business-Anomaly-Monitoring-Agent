import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  title: string;
  value: string;
  delta: string;
  /** Direction of the metric itself. */
  direction: "up" | "down";
  /** Whether "up" is good for this metric (e.g. revenue) or bad (e.g. refunds). */
  upIsGood: boolean;
  hint: string;
  icon: LucideIcon;
}

export function KpiCard({
  title,
  value,
  delta,
  direction,
  upIsGood,
  hint,
  icon: Icon,
}: KpiCardProps) {
  const positive = direction === "up" ? upIsGood : !upIsGood;

  return (
    <Card className="card-shadow border-border/80">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="mt-1.5 font-display text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
              {value}
            </p>
          </div>
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="h-5 w-5" />
          </span>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-semibold",
              positive
                ? "bg-success/10 text-success"
                : "bg-critical/10 text-critical",
            )}
          >
            {direction === "up" ? (
              <ArrowUpRight className="h-3.5 w-3.5" />
            ) : (
              <ArrowDownRight className="h-3.5 w-3.5" />
            )}
            {delta}
          </span>
          <span className="text-xs text-muted-foreground">{hint}</span>
        </div>
      </CardContent>
    </Card>
  );
}
