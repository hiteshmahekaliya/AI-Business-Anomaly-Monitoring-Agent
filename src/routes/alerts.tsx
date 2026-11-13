
import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  AlertTriangle,
  BellRing,
  CircleCheck,
  ClipboardCheck,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const Route = createFileRoute("/alerts")({
  component: Alerts,
  head: () => ({
    meta: [
      { title: "Alerts — AI Business Anomaly Monitor" },
      {
        name: "description",
        content: "Review alerts generated from CSV anomaly analysis.",
      },
    ],
  }),
});

type AnalysisResponse = {
  filename: string;
  metric_column: string;
  method: string;
  total_records: number;
  valid_records: number;
  invalid_records: number;
  anomaly_count: number;
  normal_count: number;
  lower_bound: number;
  upper_bound: number;
};

type HybridAnalysisResponse = {
  filename: string;
  total_anomalies: number;
  total_business_alerts: number;

  business_alerts: {
    alert_id: string;
    alert_type: string;
    severity: string;
    affected_metrics: string[];
    total_anomalies: number;
    critical_count: number;
    high_count: number;
    summary: string;
    anomalies: {
      metric: string;
      current_value: number;
      expected_direction: string;
      severity: string;
      message: string;
    }[];
  }[];
};


type AlertStatus = "new" | "investigating" | "resolved";
type AlertSeverity = "critical" | "high" | "moderate" | "low";
type AppAlert = {
  id: string;
  summary: string;
  description: string;
  severity: AlertSeverity;
  status: AlertStatus;
  source: "IQR" | "Business KPI";
};


function Alerts() {
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [hybridAnalysis, setHybridAnalysis] =
  useState<HybridAnalysisResponse | null>(null);
  const [statuses, setStatuses] = useState<Record<string, AlertStatus>>({});

  useEffect(() => {
    try {
      const savedAnalysis = localStorage.getItem("latestAnomalyAnalysis");

      if (savedAnalysis) {
        const parsed = JSON.parse(savedAnalysis) as AnalysisResponse;

        if (
          parsed &&
          typeof parsed.anomaly_count === "number" &&
          typeof parsed.total_records === "number"
        ) {
          setAnalysis(parsed);
        }
      }

      const savedHybrid = localStorage.getItem("latestHybridAnalysis");

if (savedHybrid) {
  const parsedHybrid = JSON.parse(savedHybrid) as HybridAnalysisResponse;

  if (
    parsedHybrid &&
    Array.isArray(parsedHybrid.business_alerts)
  ) {
    setHybridAnalysis(parsedHybrid);
  }
}

      const savedStatuses = localStorage.getItem("businessAlertStatuses");

      if (savedStatuses) {
        setStatuses(JSON.parse(savedStatuses) as Record<string, AlertStatus>);
      }
    } catch {
      setAnalysis(null);
    }
  }, []);

  const alerts: AppAlert[] = [];

  if (analysis) {
    const rate =
      analysis.valid_records > 0
        ? (analysis.anomaly_count / analysis.valid_records) * 100
        : 0;

    if (analysis.anomaly_count > 0) {
      alerts.push({
        id: "anomaly-count",
        summary: `${analysis.anomaly_count.toLocaleString()} potential anomalies detected`,
        description: `${analysis.filename}: ${analysis.metric_column} was analyzed using ${analysis.method}. Detection boundaries: ${analysis.lower_bound} to ${analysis.upper_bound}.`,
        severity: rate >= 10 ? "high" : rate >= 5 ? "moderate" : "low",
        status: statuses["anomaly-count"] ?? "new",
        source: "IQR",
      });
    }

    if (analysis.invalid_records > 0) {
      alerts.push({
        id: "invalid-records",
        summary: `${analysis.invalid_records.toLocaleString()} invalid records found`,
        description:
          "Some values in the selected metric could not be processed as numeric data. Review missing or invalid values.",
        severity: "moderate",
        status: statuses["invalid-records"] ?? "new",
        source: "IQR",
      });
    }

    
    const isReviewScoreMetric = analysis.metric_column
      .toLowerCase()
      .includes("review_score");

    const investigationAlertId = `metric-investigation-${analysis.metric_column}`;

    alerts.push({
      id: investigationAlertId,
      summary: isReviewScoreMetric
        ? "Review potential customer-rating issues"
        : `Investigate unusual ${analysis.metric_column} values`,
      description: isReviewScoreMetric
        ? "Investigate low review scores and review available customer feedback for recurring complaints. Statistical outliers are not automatically incorrect data."
        : `Review the ${analysis.anomaly_count} potential outlier records for ${analysis.metric_column}. Verify whether values outside the IQR boundaries (${analysis.lower_bound} to ${analysis.upper_bound}) have a valid business explanation.`,
      severity: rate >= 10 ? "high" : rate >= 5 ? "moderate" : "low",
      status: statuses[investigationAlertId] ?? "new",
      source: "IQR",
    });

  }
  if (hybridAnalysis) {
  for (const businessAlert of hybridAnalysis.business_alerts) {
    const alertId = `hybrid-${businessAlert.alert_id}`;

    alerts.push({
      id: alertId,
      summary: businessAlert.summary,
      description: `Affected metrics: ${businessAlert.affected_metrics.join(", ")}. Total anomalies: ${businessAlert.total_anomalies}.`,
      severity: businessAlert.severity.toLowerCase() as AlertSeverity,
      status: statuses[alertId] ?? "new",
      source: "Business KPI",
    });
  }
}
const iqrAlerts = alerts.filter(
  (alert) => alert.source === "IQR"
);

const businessKpiAlerts = alerts.filter(
  (alert) => alert.source === "Business KPI"
);

  const updateStatus = (id: string, status: AlertStatus) => {
    const updated = { ...statuses, [id]: status };
    setStatuses(updated);

    try {
      localStorage.setItem("businessAlertStatuses", JSON.stringify(updated));
    } catch {
      // Status remains available in the current page session.
    }
  };

  const openCount = alerts.filter((alert) => alert.status !== "resolved").length;

  const renderAlertCards = (items: AppAlert[]) => (
  <div className="space-y-3">
    {items.map((alert) => {
      const action =
        alert.status === "new"
          ? "Start investigating"
          : alert.status === "investigating"
            ? "Mark resolved"
            : null;

      return (
        <Card key={alert.id} className="card-shadow">
          <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:gap-5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-warning/10 text-warning">
              {alert.status === "resolved" ? (
                <CircleCheck className="h-5 w-5" />
              ) : (
                <AlertTriangle className="h-5 w-5" />
              )}
            </span>

            <div className="min-w-0 flex-1">
              <p className="font-medium leading-snug">{alert.summary}</p>
              <p className="mt-2 text-sm text-muted-foreground">
                {alert.description}
              </p>
            </div>

            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <Badge variant="outline">{alert.severity}</Badge>
              <Badge variant="outline">{alert.status}</Badge>

              {action && (
                <Button
                  size="sm"
                  variant={alert.status === "new" ? "default" : "outline"}
                  onClick={() =>
                    updateStatus(
                      alert.id,
                      alert.status === "new" ? "investigating" : "resolved"
                    )
                  }
                >
                  {action}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      );
    })}
  </div>
);
  const refreshResults = () => {
  try {
    const saved = localStorage.getItem("latestAnomalyAnalysis");
    const savedHybrid = localStorage.getItem("latestHybridAnalysis");

    setAnalysis(
      saved ? (JSON.parse(saved) as AnalysisResponse) : null
    );

    setHybridAnalysis(
      savedHybrid ? (JSON.parse(savedHybrid) as HybridAnalysisResponse) : null
    );
  } catch {
    setAnalysis(null);
    setHybridAnalysis(null);
  }
};

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">
              Alerts
            </h1>
            <Badge variant="outline" className="border-success/30 bg-success/10 text-success">
              Analysis-based
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {openCount} open alerts from your latest CSV analysis.
          </p>
        </div>

        <Button variant="outline" onClick={refreshResults}>
          <BellRing className="mr-2 h-4 w-4" />
          Refresh alerts
        </Button>
      </div>

      
{iqrAlerts.length === 0 && businessKpiAlerts.length === 0 ? (
  <Card className="card-shadow">
    <CardContent className="py-10 text-center">
      <ClipboardCheck className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
      <h2 className="font-semibold">No alerts available</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Upload a dataset and run an analysis to generate alerts.
      </p>
    </CardContent>
  </Card>
) : (
  <div className="space-y-6">
    <Card className="card-shadow">
      <CardHeader>
        <CardTitle className="text-lg">
          IQR Alerts ({iqrAlerts.length})
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Statistical outliers detected using IQR boundaries.
        </p>
      </CardHeader>
      <CardContent>
        {iqrAlerts.length > 0 ? (
          renderAlertCards(iqrAlerts)
        ) : (
          <p className="text-sm text-muted-foreground">
            No IQR alerts available.
          </p>
        )}
      </CardContent>
    </Card>

    <Card className="card-shadow">
      <CardHeader>
        <CardTitle className="text-lg">
          Business KPI Alerts ({businessKpiAlerts.length})
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Business performance anomalies detected against historical baselines.
        </p>
      </CardHeader>
      <CardContent>
        {businessKpiAlerts.length > 0 ? (
          renderAlertCards(businessKpiAlerts)
        ) : (
          <p className="text-sm text-muted-foreground">
            No Business KPI alerts available.
          </p>
        )}
      </CardContent>
    </Card>
  </div>
)}

     

      <p className="text-xs text-muted-foreground">
        Alerts are generated from the latest analysis saved in this browser.
        They are not push notifications, and alert statuses are stored locally.
      </p>
    </div>
  );
}
