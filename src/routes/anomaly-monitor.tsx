
import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AlertCircle, Database, RefreshCw } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const Route = createFileRoute("/anomaly-monitor")({
  component: AnomalyMonitor,
  head: () => ({
    meta: [
      { title: "Anomaly Monitor — AI Business Anomaly Monitor" },
      {
        name: "description",
        content: "View anomalies detected from your uploaded business data.",
      },
    ],
  }),
});

type AnalysisResponse = {
  message: string;
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

function AnomalyMonitor() {
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [filter, setFilter] = useState<"all" | "low" | "other">("all");

  const loadAnalysis = () => {
    try {
      const saved = localStorage.getItem("latestAnomalyAnalysis");

      if (!saved) {
        setAnalysis(null);
        return;
      }

      const parsed: AnalysisResponse = JSON.parse(saved);

      if (
        !parsed ||
        !Array.isArray(parsed.anomalies) ||
        typeof parsed.anomaly_count !== "number"
      ) {
        setAnalysis(null);
        return;
      }

      setAnalysis(parsed);
    } catch {
      setAnalysis(null);
    }
  };

  useEffect(() => {
    loadAnalysis();
  }, []);

  const filteredAnomalies = useMemo(() => {
    if (!analysis) return [];

    if (filter === "low") {
      return analysis.anomalies.filter((row) => {
        const value = Number(row[analysis.metric_column]);
return Number.isFinite(value) && value < analysis.lower_bound;      });
    }

    
    if (filter === "other") {
      return analysis.anomalies.filter((row) => {
        const value = Number(row[analysis.metric_column]);
        return Number.isFinite(value) && value > analysis.upper_bound;
      });
    }


    return analysis.anomalies;
  }, [analysis, filter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">
              Anomaly Monitor
            </h1>
            <Badge variant="outline" className="border-success/30 bg-success/10 text-success">
              Real analysis
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Anomalies from your latest uploaded CSV analysis.
          </p>
        </div>

        <Button variant="outline" onClick={loadAnalysis} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Refresh results
        </Button>
      </div>

      {!analysis ? (
        <Card className="card-shadow">
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <Database className="h-10 w-10 text-muted-foreground" />
            <h2 className="text-lg font-semibold">No saved analysis found</h2>
            <p className="max-w-md text-sm text-muted-foreground">
              Open Upload Data, upload a CSV, and click Analyze anomalies first.
              The latest successful analysis will appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="card-shadow">
            <CardHeader>
              <CardTitle className="font-display text-lg">
                Latest analysis summary
              </CardTitle>
              <CardDescription>
                File: {analysis.filename} · Metric: {analysis.metric_column} · Method:{" "}
                {analysis.method}
              </CardDescription>
            </CardHeader>

            <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: "Total records", value: analysis.total_records },
                { label: "Normal records", value: analysis.normal_count },
                { label: "Potential anomalies", value: analysis.anomaly_count },
                { label: "Invalid records", value: analysis.invalid_records },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-lg border border-border bg-muted/40 p-4"
                >
                  <p className="font-display text-2xl font-semibold">
                    {item.value.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="card-shadow">
            <CardHeader>
              <CardTitle className="font-display text-lg">
                Detected anomaly records
              </CardTitle>
              <CardDescription>
                The backend returns up to 100 anomaly rows. The summary above shows
                the total count detected.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {[
                  { value: "all", label: "All returned records" },
                  { value: "low", label: "At or below lower bound" },
                  { value: "other", label: "Above upper bound" },
                ].map((item) => (
                  <Button
                    key={item.value}
                    size="sm"
                    variant={filter === item.value ? "default" : "outline"}
                    onClick={() =>
                      setFilter(item.value as "all" | "low" | "other")
                    }
                  >
                    {item.label}
                  </Button>
                ))}
              </div>

              <div className="text-sm text-muted-foreground">
                Bounds: {analysis.lower_bound} to {analysis.upper_bound}. Showing{" "}
                {filteredAnomalies.length} of {analysis.anomalies.length} returned rows.
              </div>

              {filteredAnomalies.length === 0 ? (
                <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
                  <AlertCircle className="h-4 w-4" />
                  No records match this filter.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {Object.keys(filteredAnomalies[0] ?? {}).map((column) => (
                          <TableHead key={column}>{column}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {filteredAnomalies.map((row, index) => (
                        <TableRow key={index}>
                          {Object.keys(filteredAnomalies[0] ?? {}).map((column) => (
                            <TableCell key={column}>
                              {String(row[column] ?? "")}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              <p className="text-xs text-muted-foreground">
                These records are statistical outliers under the selected metric;
                an outlier is not automatically an incorrect record.
              </p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
