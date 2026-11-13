import { Badge } from "@/components/ui/badge";
import type { AnomalyStatus, Severity, AlertStatus } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const severityStyles: Record<Severity, string> = {
  critical: "bg-critical/10 text-critical border-critical/25",
  high: "bg-critical/10 text-critical border-critical/20",
  moderate: "bg-warning/15 text-warning border-warning/30",
  low: "bg-muted text-muted-foreground border-border",
};

export const severityLabels: Record<Severity, string> = {
  critical: "Critical",
  high: "High",
  moderate: "Moderate",
  low: "Low",
};

export function SeverityBadge({
  severity,
  className,
}: {
  severity: Severity;
  className?: string;
}) {
  return (
    <Badge
      variant="outline"
      className={cn("border font-medium capitalize", severityStyles[severity], className)}
    >
      {severityLabels[severity]}
    </Badge>
  );
}

const statusStyles: Record<AnomalyStatus | AlertStatus, string> = {
  new: "bg-primary/10 text-primary border-primary/25",
  open: "bg-critical/10 text-critical border-critical/25",
  investigating: "bg-warning/15 text-warning border-warning/30",
  resolved: "bg-success/10 text-success border-success/25",
};

const statusDot: Record<AnomalyStatus | AlertStatus, string> = {
  new: "bg-primary",
  open: "bg-critical",
  investigating: "bg-warning",
  resolved: "bg-success",
};

export function StatusBadge({
  status,
  className,
}: {
  status: AnomalyStatus | AlertStatus;
  className?: string;
}) {
  return (
    <Badge
      variant="outline"
      className={cn("border gap-1.5 capitalize", statusStyles[status], className)}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", statusDot[status])} />
      {status}
    </Badge>
  );
}
