
import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Activity,
  AlertTriangle,
  FileSpreadsheet,
  ShieldCheck,
  Upload,
} from "lucide-react";

import { KpiCard } from "@/components/analytics/kpi-card";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Overview — AI Business Anomaly Monitor" },
      {
        name: "description",
        content: "Overview of real CSV anomaly analysis results.",
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
  validation_report: {
    total_rows: number;
  };
  baseline_analysis: {
  latest_date: string;
  baseline_method: string;
  metrics: Record<
    string,
    {
      current_value: number;
      current_date: string;
      "7_day": {
        baseline_average: number | null;
        current_value: number;
        percentage_change: number | null;
        direction: string;
        observed_days: number;
        expected_days: number;
        coverage_complete: boolean;
      };
      "28_day": {
        baseline_average: number | null;
        current_value: number;
        percentage_change: number | null;
        direction: string;
        observed_days: number;
        expected_days: number;
        coverage_complete: boolean;
      };
    }
  >;
};
  detected_anomalies: {
    metric: string;
    severity: string;
    current_value: number;
  }[];
  business_alerts: {
    severity: string;
    affected_metrics: string[];
    summary: string;
  }[];
  total_anomalies: number;
  total_business_alerts: number;
};

function Index() {
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [hybridAnalysis, setHybridAnalysis] =
  useState<HybridAnalysisResponse | null>(null);


  useEffect(() => {
    const loadAnalysis = () => {
      try {
        const saved = localStorage.getItem("latestAnomalyAnalysis");

        if (saved) {
          const parsed = JSON.parse(saved) as AnalysisResponse;

          if (
            parsed &&
            typeof parsed.total_records === "number" &&
            typeof parsed.anomaly_count === "number"
          ) {
            setAnalysis(parsed);
          } else {
            setAnalysis(null);
          }
        } else {
          setAnalysis(null);
        }
      } catch {
        setAnalysis(null);
      }
    };

    loadAnalysis();

    window.addEventListener("focus", loadAnalysis);
    window.addEventListener("storage", loadAnalysis);

    const savedHybrid = localStorage.getItem("latestHybridAnalysis");

if (savedHybrid) {
  const parsedHybrid = JSON.parse(savedHybrid) as HybridAnalysisResponse;
  setHybridAnalysis(parsedHybrid);
} else {
  setHybridAnalysis(null);
}

    return () => {
      window.removeEventListener("focus", loadAnalysis);
      window.removeEventListener("storage", loadAnalysis);
    };
  }, []);

  const anomalyRate =
    analysis && analysis.valid_records > 0
      ? (analysis.anomaly_count / analysis.valid_records) * 100
      : 0;

  const kpis = analysis
    ? [
        {
          title: "Total Records",
          value: analysis.total_records.toLocaleString(),
          delta: "Latest dataset",
          direction: "up" as const,
          upIsGood: true,
          hint: analysis.filename,
          icon: FileSpreadsheet,
        },
        {
          title: "Valid Records",
          value: analysis.valid_records.toLocaleString(),
          delta: `${analysis.invalid_records.toLocaleString()} invalid`,
          direction: "up" as const,
          upIsGood: true,
          hint: "Numeric values in selected metric",
          icon: ShieldCheck,
        },
        {
          title: "Normal Records",
          value: analysis.normal_count.toLocaleString(),
          delta: "Within IQR bounds",
          direction: "up" as const,
          upIsGood: true,
          hint: "Selected metric",
          icon: Activity,
        },
        {
          title: "Potential Anomalies",
          value: analysis.anomaly_count.toLocaleString(),
          delta: `${anomalyRate.toFixed(2)}% of valid records`,
          direction: "up" as const,
          upIsGood: false,
          hint: analysis.metric_column,
          icon: AlertTriangle,
        },
      ]
    : [];
  const hybridKpis = hybridAnalysis
  ? [
      {
        title: "Total Business Records",
        value: hybridAnalysis.validation_report.total_rows.toLocaleString(),
        delta: "Latest dataset",
        direction: "up" as const,
        upIsGood: true,
        hint: hybridAnalysis.filename,
        icon: FileSpreadsheet,
      },
      {
        title: "Business Anomalies",
        value: hybridAnalysis.total_anomalies.toLocaleString(),
        delta: "Hybrid detection",
        direction: "down" as const,
        upIsGood: false,
        hint: "Historical KPI monitoring",
        icon: AlertTriangle,
      },
      {
        title: "Critical Alerts",
        value: hybridAnalysis.business_alerts.filter(
          (alert) => alert.severity.toLowerCase() === "critical"
        ).length.toLocaleString(),
        delta: "Critical severity",
        direction: "down" as const,
        upIsGood: false,
        hint: "Requires investigation",
        icon: ShieldCheck,
      },
      {
        title: "Business Alerts",
        value: hybridAnalysis.total_business_alerts.toLocaleString(),
        delta: "Latest analysis",
        direction: "down" as const,
        upIsGood: false,
        hint: "Generated business alerts",
        icon: Activity,
      },
    ]
  : [];

  const chartMetrics = hybridAnalysis
  ? ["revenue", "orders", "traffic", "conversion_rate"]
      .map((metric) => {
        const data = hybridAnalysis.baseline_analysis.metrics[metric];

        if (!data) return null;

        return {
          name: metric.replace("_", " ").replace(/\b\w/g, (char) =>
            char.toUpperCase()
          ),
          current: data.current_value,
          sevenDay: data["7_day"].baseline_average,
          twentyEightDay: data["28_day"].baseline_average,
        };
      })
      .filter((item) => item !== null)
  : [];


  return (
    <div className="space-y-6">
      {hybridAnalysis && (
  <>
    <Card className="card-shadow border-primary/20">
      <CardHeader>
        <CardTitle className="font-display text-lg">
          Business KPI Monitoring
        </CardTitle>
        <CardDescription>
          {hybridAnalysis.filename} · Latest date:{" "}
          {hybridAnalysis.baseline_analysis.latest_date}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
  {kpis.map((kpi) => (
    <KpiCard key={kpi.title} {...kpi} />
  ))}
</div>
      </CardContent>
    </Card>
<Card className="card-shadow">
  <CardHeader>
    <CardTitle className="font-display text-lg">
      Historical KPI Comparison
    </CardTitle>
    <CardDescription>
      Current value compared with 7-day and 28-day historical averages.
    </CardDescription>
  </CardHeader>

  <CardContent className="grid gap-5 sm:grid-cols-2">
    {chartMetrics.map((metric) => {
      const values = [
        metric.current,
        metric.sevenDay ?? 0,
        metric.twentyEightDay ?? 0,
      ];

      const maxValue = Math.max(...values, 1);

      return (
        <div key={metric.name} className="rounded-lg border p-4 space-y-4">
          <h3 className="font-semibold">{metric.name}</h3>

          {[
            { label: "Current", value: metric.current },
            { label: "7-Day Average", value: metric.sevenDay },
            { label: "28-Day Average", value: metric.twentyEightDay },
          ].map((item) => (
            <div key={item.label} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{item.label}</span>
                <span className="font-medium">
                  {item.value === null
                    ? "N/A"
                    : item.value.toLocaleString(undefined, {
                        maximumFractionDigits: 2,
                      })}
                </span>
              </div>

              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{
                    width:
                      item.value === null
                        ? "0%"
                        : `${Math.max(0, (item.value / maxValue) * 100)}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      );
    })}

    {chartMetrics.length === 0 && (
      <p className="text-sm text-muted-foreground">
        No KPI comparison data available.
      </p>
    )}
  </CardContent>
</Card>
    <Card className="card-shadow">
      <CardHeader>
        <CardTitle className="font-display text-lg">
          Business Anomaly Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {hybridAnalysis.business_alerts.length > 0 ? (
          hybridAnalysis.business_alerts.map((alert, index) => (
            <div key={index} className="rounded-lg border p-4 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="border-destructive/30 text-destructive">
                  {alert.severity.toUpperCase()}
                </Badge>
                <span className="font-medium">
                  {alert.affected_metrics.join(", ")}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {alert.summary}
              </p>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">
            No business anomalies detected.
          </p>
        )}

        <Button asChild variant="outline">
          <Link to="/ai-insights">View Business Insights</Link>
        </Button>
        <Button asChild variant="outline" className="ml-2">
          <Link to="/alerts">View Business Alerts</Link>
        </Button>
      </CardContent>
    </Card>
  </>
)}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">
  Statistical Anomaly Monitoring
</h1>
            <Badge
              variant="outline"
              className={
                analysis
                  ? "border-success/30 bg-success/10 text-success"
                  : "border-warning/30 bg-warning/10 text-warning"
              }
            >
              {analysis ? "Real analysis" : "Awaiting analysis"}
            </Badge>
          </div>

          <p className="mt-1 text-sm text-muted-foreground">
  {analysis
    ? `Dataset: ${analysis.filename} · Metric: ${analysis.metric_column} · Method: ${analysis.method}`
    : "Upload a CSV file and run anomaly detection to populate your dashboard."}
</p>
        </div>

        <Button asChild size="lg" className="gap-2">
          <Link to="/upload-data">
            <Upload className="h-4 w-4" />
            Upload and analyze
          </Link>
        </Button>
      </div>

      {!analysis ? (
        <Card className="card-shadow">
          <CardContent className="flex flex-col items-center py-12 text-center">
            <FileSpreadsheet className="mb-4 h-12 w-12 text-muted-foreground" />
            <h2 className="font-display text-lg font-semibold">
              No saved analysis yet
            </h2>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              Your dashboard will show real metrics after you upload a CSV and
              run Analyze anomalies on the Upload Data page.
            </p>
            <Button asChild className="mt-5">
              <Link to="/upload-data">Go to Upload Data</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {kpis.map((kpi) => (
              <KpiCard key={kpi.title} {...kpi} />
            ))}
          </div>

          <Card className="card-shadow">
            <CardHeader>
              <CardTitle className="font-display text-lg">
                Latest analysis summary
              </CardTitle>
              <CardDescription>
  Traditional statistical outlier detection using the Interquartile Range (IQR) method.
</CardDescription>
            </CardHeader>

            <CardContent className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <p className="text-sm text-muted-foreground">Selected metric</p>
                <p className="mt-1 font-semibold">{analysis.metric_column}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Detection method</p>
                <p className="mt-1 font-semibold">{analysis.method}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">IQR lower bound</p>
                <p className="mt-1 font-semibold">{analysis.lower_bound}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">IQR upper bound</p>
                <p className="mt-1 font-semibold">{analysis.upper_bound}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Normal records</p>
                <p className="mt-1 font-semibold">
                  {analysis.normal_count.toLocaleString()}
                </p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Potential outlier rate</p>
                <p className="mt-1 font-semibold">{anomalyRate.toFixed(2)}%</p>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card className="card-shadow">
              <CardHeader>
                <CardTitle className="font-display text-lg">
                  Anomaly monitoring
                </CardTitle>
                <CardDescription>
                  Review the records flagged by statistical analysis.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {analysis.anomaly_count.toLocaleString()} records were flagged
                  for {analysis.metric_column}. An outlier is not automatically
                  an error; investigate the underlying business context.
                </p>
                <Button asChild variant="outline" className="mt-4">
                  <Link to="/anomaly-monitor">View anomaly records</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="card-shadow">
              <CardHeader>
                <CardTitle className="font-display text-lg">
                  Business investigation
                </CardTitle>
                <CardDescription>
                  Use the findings to decide what to investigate next.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  For customer review scores, inspect low ratings and related
                  review comments. Compare products, sellers and delivery
                  experience before drawing conclusions.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button asChild variant="outline">
                    <Link to="/ai-insights">View business insights</Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link to="/alerts">View alerts</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <p className="text-xs text-muted-foreground">
            Revenue and order trends are not shown because the current backend
            analysis endpoint does not calculate those metrics. This dashboard
            reflects the most recently saved analysis in this browser.
          </p>
        </>
      )}
    </div>
  );
}
