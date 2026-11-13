
import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Lightbulb,
  Search,
  Sparkles,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const Route = createFileRoute("/ai-insights")({
  component: AiInsights,
  head: () => ({
    meta: [
      { title: "Business Insights — AI Business Anomaly Monitor" },
      {
        name: "description",
        content: "Data-driven insights from uploaded customer review analysis.",
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
  q1: number;
  q3: number;
  iqr: number;
  lower_bound: number;
  upper_bound: number;
  anomalies: Record<string, unknown>[];
};

type HybridAnalysisResponse = {
  message: string;
  filename: string;

  validation_report: {
    total_rows: number;
    status: string;
    issues: string[];
  };

  baseline_analysis: {
    latest_date: string;
    baseline_method: string;
    metrics: Record<string, unknown>;
  };

  detected_anomalies: {
    metric: string;
    current_value: number;
    expected_direction: string;
    severity: string;
    message: string;
    signals: {
      window: string;
      percentage_change: number;
      threshold: number;
    }[];
  }[];

  business_alerts: {
    alert_id: string;
    severity: string;
    affected_metrics: string[];
    total_anomalies: number;
    critical_count: number;
    high_count: number;
    summary: string;
  }[];

  business_explanations: {
    metric: string;
    severity: string;
    current_value: number;
    explanation: string;
    business_impact: string;
    recommended_actions: string[];
  }[];

  business_summary: {
    status: string;
    summary: string;
    affected_metrics: string[];
    total_anomalies: number;
    explanations: {
      metric: string;
      severity: string;
      current_value: number;
      explanation: string;
      business_impact: string;
      recommended_actions: string[];
    }[];
  };

  total_anomalies: number;
  total_business_alerts: number;
};


function AiInsights() {
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);

  const [hybridAnalysis, setHybridAnalysis] =
    useState<HybridAnalysisResponse | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("latestAnomalyAnalysis");
      if (saved) {
        const parsed = JSON.parse(saved) as AnalysisResponse;

        if (
          parsed &&
          typeof parsed.total_records === "number" &&
          Array.isArray(parsed.anomalies)
        ) {
          setAnalysis(parsed);
        }
      }
      const savedHybrid = localStorage.getItem("latestHybridAnalysis");

if (savedHybrid) {
  const parsedHybrid = JSON.parse(savedHybrid) as HybridAnalysisResponse;

  if (
    parsedHybrid &&
    typeof parsedHybrid.filename === "string" &&
    Array.isArray(parsedHybrid.business_alerts) &&
    Array.isArray(parsedHybrid.business_explanations)
  ) {
    setHybridAnalysis(parsedHybrid);
  }
}
    } catch {
      setAnalysis(null);
    }
  }, []);


if (hybridAnalysis) {
  return (
    <div className="space-y-6">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="font-display text-2xl font-semibold md:text-3xl">
            Business Insights
          </h1>
          <Badge variant="outline" className="border-destructive/30 bg-destructive/10 text-destructive">
            Business Analysis
          </Badge>
        </div>

        <p className="mt-1 text-sm text-muted-foreground">
          Historical KPI monitoring and business anomaly detection.
        </p>
      </div>

      <Card className="card-shadow">
        <CardHeader>
          <CardTitle className="font-display text-lg">
            Business Summary
          </CardTitle>
          <CardDescription>
            File: {hybridAnalysis.filename}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm leading-relaxed">
            {hybridAnalysis.business_summary.summary}
          </p>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Total Records</p>
              <p className="text-2xl font-semibold">
                {hybridAnalysis.validation_report.total_rows}
              </p>
            </div>

            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Anomalies</p>
              <p className="text-2xl font-semibold">
                {hybridAnalysis.total_anomalies}
              </p>
            </div>

            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Business Alerts</p>
              <p className="text-2xl font-semibold">
                {hybridAnalysis.total_business_alerts}
              </p>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Latest date: {hybridAnalysis.baseline_analysis.latest_date}
          </p>
        </CardContent>
      </Card>

      <Card className="card-shadow">
        <CardHeader>
          <CardTitle className="font-display text-lg">
            Detected Business Alerts
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {hybridAnalysis.business_alerts.length > 0 ? (
            hybridAnalysis.business_alerts.map((alert) => (
              <div
                key={alert.alert_id}
                className="rounded-lg border border-destructive/30 p-4 space-y-2"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="text-destructive">
                    {alert.severity.toUpperCase()}
                  </Badge>
                  <span className="text-sm font-medium">
                    {alert.affected_metrics.join(", ")}
                  </span>
                </div>

                <p className="text-sm">{alert.summary}</p>

                <p className="text-xs text-muted-foreground">
                  Critical: {alert.critical_count} | High: {alert.high_count}
                </p>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">
              No business alerts detected.
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="card-shadow">
        <CardHeader>
          <CardTitle className="font-display text-lg">
            Business Explanations
          </CardTitle>
          <CardDescription>
            Explanation, potential business impact and recommended actions.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5">
          {hybridAnalysis.business_explanations.length > 0 ? (
            hybridAnalysis.business_explanations.map((item, index) => (
              <div
                key={`${item.metric}-${index}`}
                className="space-y-3 rounded-lg border p-4"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold capitalize">
                    {item.metric}
                  </h3>
                  <Badge variant="outline" className="text-destructive">
                    {item.severity.toUpperCase()}
                  </Badge>
                </div>

                <p className="text-sm">{item.explanation}</p>

                <div>
                  <p className="text-sm font-semibold">Current Value</p>
                  <p className="text-sm text-muted-foreground">
                    {item.current_value.toLocaleString()}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-semibold">Business Impact</p>
                  <p className="text-sm text-muted-foreground">
                    {item.business_impact}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-semibold">
                    Recommended Actions
                  </p>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                    {item.recommended_actions.map((action, actionIndex) => (
                      <li key={actionIndex}>{action}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">
              No unusual business movements detected.
            </p>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        Insights are generated using rule-based anomaly detection and
        historical KPI comparisons, not a live generative AI model.
      </p>
    </div>
  );
}


  if (!analysis) {
    return (
      <div className="space-y-6">
        <h1 className="font-display text-2xl font-semibold md:text-3xl">
          Business Insights
        </h1>

        <Card>
          <CardContent className="py-10 text-center">
            <Activity className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
            <h2 className="font-semibold">No analysis available yet</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Open Upload Data, upload a CSV and run Analyze anomalies first.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const anomalyPercentage =
    analysis.valid_records > 0
      ? (analysis.anomaly_count / analysis.valid_records) * 100
      : 0;

  
  const isReviewScoreMetric = analysis.metric_column.toLowerCase().includes("review_score");

  const scoreCounts = new Map<number, number>();

  if (isReviewScoreMetric) {
    for (const row of analysis.anomalies) {
      const score = Number(row[analysis.metric_column]);

      if (Number.isFinite(score) && score <= analysis.lower_bound) {
        scoreCounts.set(score, (scoreCounts.get(score) ?? 0) + 1);
      }
    }
  }

  const returnedLowScores = [...scoreCounts.entries()].sort(
    ([a], [b]) => a - b
  );


  return (
    <div className="space-y-6">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">
            Business Insights
          </h1>
          <Badge variant="outline" className="border-success/30 bg-success/10 text-success">
            Data-driven
          </Badge>
        </div>

        <p className="mt-1 text-sm text-muted-foreground">
          Findings based on the latest uploaded dataset and IQR analysis.
        </p>
      </div>

      <Card className="card-shadow border-primary/25 bg-primary/[0.04]">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <CardTitle className="font-display text-lg">
              Analysis summary
            </CardTitle>
          </div>
          <CardDescription>
            The selected metric is {analysis.metric_column} in{" "}
            {analysis.filename}. The {analysis.method} method flagged{" "}
            {analysis.anomaly_count.toLocaleString()} potential outliers out of{" "}
            {analysis.valid_records.toLocaleString()} valid records.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="card-shadow">
          <CardHeader className="pb-2">
            <CardDescription>Potential outlier rate</CardDescription>
            <CardTitle className="font-display text-3xl">
              {anomalyPercentage.toFixed(2)}%
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Percentage of valid records flagged by the selected statistical method.
          </CardContent>
        </Card>

        <Card className="card-shadow">
          <CardHeader className="pb-2">
            <CardDescription>Detection boundaries</CardDescription>
            <CardTitle className="font-display text-3xl">
              {analysis.lower_bound} – {analysis.upper_bound}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Values outside these bounds are flagged as potential outliers.
          </CardContent>
        </Card>
      </div>

      <Card className="card-shadow">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            <CardTitle className="font-display text-lg">
              Finding 1: Investigate flagged records
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 text-sm leading-relaxed text-foreground/90">
          <p>
            {analysis.anomaly_count.toLocaleString()} records were flagged by
            the IQR method for {analysis.metric_column}. These records deserve
            review, but statistical outliers are not automatically incorrect data.
          </p>
          
          <p className="text-muted-foreground">
            {isReviewScoreMetric
              ? "Suggested action: review low customer ratings, inspect available feedback, and compare rating patterns across relevant groups before deciding on corrective action."
              : `Suggested action: inspect the records flagged for ${analysis.metric_column}, verify whether the unusual values have a valid business explanation, and compare available categories or dates for recurring patterns.`}
          </p>

        </CardContent>
      </Card>

      
      <Card className="card-shadow">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Search className="h-5 w-5 text-primary" />
            <CardTitle className="font-display text-lg">
              {isReviewScoreMetric
                ? "Finding 2: Review low-score outliers"
                : `Finding 2: Investigate unusual ${analysis.metric_column} values`}
            </CardTitle>
          </div>
          <CardDescription>
            Details from the anomaly records returned by the API, up to 100 rows.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-3">
          {analysis.anomalies.length > 0 ? (
            <>
              {analysis.anomalies.slice(0, 5).map((row, index) => (
                <div
                  key={`${String(row["transaction_id"] ?? row["order_id"] ?? index)}-${index}`}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border p-3"
                >
                  <span className="text-sm font-medium">
                    {String(
                      row["transaction_id"] ??
                        row["order_id"] ??
                        `Anomaly ${index + 1}`
                    )}
                  </span>

                  <Badge variant="outline">
                    {analysis.metric_column}:{" "}
                    {String(row[analysis.metric_column] ?? "N/A")}
                  </Badge>
                </div>
              ))}

              <p className="text-sm text-muted-foreground">
                Review these records to verify whether the unusual values have
                a valid business explanation.
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              No anomaly records were returned for this analysis.
            </p>
          )}
        </CardContent>
      </Card>

      
      <Card className="card-shadow">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-primary" />
            <CardTitle className="font-display text-lg">
              Recommended next steps
            </CardTitle>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 text-success" />
            <div>
              <p className="font-medium">
                {isReviewScoreMetric
                  ? "Investigate low customer ratings"
                  : `Validate unusual ${analysis.metric_column} values`}
              </p>
              <p className="text-sm text-muted-foreground">
                {isReviewScoreMetric
                  ? "Review customer comments and look for recurring complaints before deciding on corrective action."
                  : `Inspect records outside the IQR boundaries of ${analysis.lower_bound} to ${analysis.upper_bound} and verify whether the values have a valid business explanation.`}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 text-success" />
            <div>
              <p className="font-medium">
                {isReviewScoreMetric
                  ? "Compare review patterns"
                  : "Compare business segments"}
              </p>
              <p className="text-sm text-muted-foreground">
                {isReviewScoreMetric
                  ? "Compare low ratings across products, sellers and time periods to identify recurring patterns."
                  : "Compare unusual values across available categories, products or dates to identify patterns."}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 text-success" />
            <div>
              <p className="font-medium">Monitor future uploads</p>
              <p className="text-sm text-muted-foreground">
                Run the analysis on future datasets and compare anomaly counts
                before setting business alert thresholds.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>


      <p className="text-xs text-muted-foreground">
        These are rule-based observations and investigation recommendations,
        not output from a live generative AI model. The API currently returns
        up to 100 anomaly records, so sample-level counts may not represent
        all flagged records.
      </p>
    </div>
  );
}
