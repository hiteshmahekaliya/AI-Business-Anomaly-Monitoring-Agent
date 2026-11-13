
import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  CheckCircle2,
  FileSpreadsheet,
  Loader2,
  TriangleAlert,
  UploadCloud,
} from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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

export const Route = createFileRoute("/upload-data")({
  component: UploadData,
});

const API_BASE_URL = "http://127.0.0.1:8000";

type UploadResponse = {
  message: string;
  filename: string;
  total_rows: number;
  total_columns: number;
  columns: string[];
  numeric_columns: string[];
  date_columns: string[];
  preview: Record<string, unknown>[];
};

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
type HybridAnalysisResponse = {
  filename: string;
  date_column: string;
  total_records: number;
  baseline: any;
  detected_anomalies: any[];
  business_alerts: any[];
  business_explanations: any[];
  business_summary: any;
};

async function getErrorMessage(response: Response) {
  try {
    const data = await response.json();
    return data.detail || "Something went wrong.";
  } catch {
    return "Something went wrong. Please try again.";
  }
}

function UploadData() {
  const [file, setFile] = useState<File | null>(null);
  const [uploadData, setUploadData] = useState<UploadResponse | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [hybridAnalysis, setHybridAnalysis] =
    useState<HybridAnalysisResponse | null>(null);

  const [dateColumn, setDateColumn] = useState("");
  const [hybridLoading, setHybridLoading] = useState(false);
  const [metricColumn, setMetricColumn] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleFileChange = (selectedFile: File | null) => {
  setFile(selectedFile);
  setUploadData(null);
  setAnalysis(null);
  setHybridAnalysis(null);
  setDateColumn("");
  setMetricColumn("");
  setError("");

    localStorage.removeItem("latestAnomalyAnalysis");
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a CSV file first.");
      return;
    }

    setLoading(true);
    setError("");
    setAnalysis(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`${API_BASE_URL}/api/upload`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(await getErrorMessage(response));
      }

      const data: UploadResponse = await response.json();

      setUploadData(data);
      setDateColumn(data.date_columns?.[0] || "");
      setMetricColumn(data.numeric_columns[0] || "");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to connect to the backend.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = async () => {
    if (!file || !metricColumn) {
      setError("Please select a numeric metric.");
      return;
    }

    setLoading(true);
    setError("");
    setAnalysis(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("metric_column", metricColumn);

      const response = await fetch(`${API_BASE_URL}/api/analyze`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(await getErrorMessage(response));
      }

      const data: AnalysisResponse = await response.json();

      setAnalysis(data);

      // Save the latest real analysis for the Anomaly Monitor page.
      localStorage.setItem(
        "latestAnomalyAnalysis",
        JSON.stringify(data),
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to analyze the uploaded file.",
      );
    } finally {
      setLoading(false);
    }
  };
const handleBusinessAnalysis = async () => {
  if (!file) {
    setError("Please select a file first.");
    return;
  }

  if (!dateColumn) {
    setError("Please select a date column.");
    return;
  }

  setHybridLoading(true);
  setError("");

  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("date_column", dateColumn);

    const response = await fetch(
      `${API_BASE_URL}/api/hybrid-analyze`,
      {
        method: "POST",
        body: formData,
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Business analysis failed.");
    }

    const result: HybridAnalysisResponse = await response.json();

    setHybridAnalysis(result);
    localStorage.setItem(
      "latestHybridAnalysis",
      JSON.stringify(result)
    );
  } catch (err) {
    setError(
      err instanceof Error
        ? err.message
        : "Something went wrong during business analysis."
    );
  } finally {
    setHybridLoading(false);
  }
};  
  
const downloadAnomalyReport = async () => {
  if (!file || !analysis) {
    setError("Please analyze a CSV file first.");
    return;
  }

  setLoading(true);
  setError("");

  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("metric_column", analysis.metric_column);

    const response = await fetch(
      `${API_BASE_URL}/api/export-anomalies`,
      {
        method: "POST",
        body: formData,
      }
    );

    if (!response.ok) {
      throw new Error(await getErrorMessage(response));
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `anomaly-report-${analysis.metric_column}.csv`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch (err) {
    setError(
      err instanceof Error
        ? err.message
        : "Unable to download the complete anomaly report."
    );
  } finally {
    setLoading(false);
  }
};


  const reset = () => {
    setFile(null);
    setUploadData(null);
    setAnalysis(null);
    setMetricColumn("");
    setError("");
    localStorage.removeItem("latestAnomalyAnalysis");
  };

  
return (
  <div className="space-y-6">
    <div>
      <div className="flex items-center gap-2">
        <h1 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">
          Upload Data
        </h1>
        <Badge variant="outline" className="border-success/30 bg-success/10 text-success">
          Live API
        </Badge>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Upload a CSV file and run real anomaly detection.
      </p>
    </div>

    <Card className="card-shadow">
      <CardContent className="p-6">
        <label
          htmlFor="file-upload"
          className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-input bg-muted/40 px-6 py-12 text-center transition-colors hover:border-primary/50 hover:bg-accent/40"
        >
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <UploadCloud className="h-7 w-7" />
          </span>
          <span className="font-medium text-foreground">
            Click to select a CSV file
          </span>
          <span className="text-sm text-muted-foreground">
            Supported format: .csv
          </span>
          <input
            id="file-upload"
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(event) =>
              handleFileChange(event.target.files?.[0] || null)
            }
          />
        </label>

        {file && (
          <div className="mt-4 flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card px-4 py-3">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium">{file.name}</span>
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto"
              onClick={reset}
              disabled={loading || hybridLoading}
            >
              Remove
            </Button>
          </div>
        )}

        {file && !uploadData && (
          <div className="mt-4 flex justify-end">
            <Button onClick={handleUpload} disabled={loading} className="gap-2">
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <UploadCloud className="h-4 w-4" />
              )}
              Upload and inspect
            </Button>
          </div>
        )}
      </CardContent>
    </Card>

    {error && (
      <Alert variant="destructive">
        <TriangleAlert className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )}

    {uploadData && (
      <Card className="card-shadow">
        <CardHeader>
          <CardTitle className="font-display text-lg">
            CSV uploaded successfully
          </CardTitle>
          <CardDescription>
            {uploadData.total_rows.toLocaleString()} rows and{" "}
            {uploadData.total_columns} columns detected.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div>
            <label
              htmlFor="metric-column"
              className="mb-2 block text-sm font-medium"
            >
              Select numeric metric
            </label>
            <select
              id="metric-column"
              value={metricColumn}
              onChange={(event) => {
                setMetricColumn(event.target.value);
                setAnalysis(null);
                setError("");
              }}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {uploadData.numeric_columns.map((column) => (
                <option key={column} value={column}>
                  {column}
                </option>
              ))}
            </select>
          </div>

          {uploadData.numeric_columns.length === 0 && (
            <Alert variant="destructive">
              <TriangleAlert className="h-4 w-4" />
              <AlertTitle>No numeric metrics found</AlertTitle>
              <AlertDescription>
                Upload a CSV containing a numeric column.
              </AlertDescription>
            </Alert>
          )}

          {/* NEW: Business Analysis section */}
          <div className="space-y-3 rounded-lg border border-border p-4">
            <h3 className="font-semibold">Business KPI Analysis</h3>

            <div>
              <label
                htmlFor="date-column"
                className="mb-2 block text-sm font-medium"
              >
                Select Date Column
              </label>

              <select
                id="date-column"
                value={dateColumn}
                onChange={(event) => setDateColumn(event.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {uploadData.date_columns.map((column) => (
                  <option key={column} value={column}>
                    {column}
                  </option>
                ))}
              </select>
            </div>

            <Button
              onClick={handleBusinessAnalysis}
              disabled={hybridLoading || !dateColumn}
              className="gap-2"
            >
              {hybridLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              Run Business Analysis
            </Button>
          </div>

          {/* EXISTING: IQR Analysis button */}
          <Button
            onClick={handleAnalyze}
            disabled={loading || !metricColumn}
            className="gap-2"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            Analyze anomalies
          </Button>
        </CardContent>
      </Card>
    )}

    {uploadData && uploadData.preview.length > 0 && (
      <Card className="card-shadow">
        <CardHeader>
          <CardTitle className="font-display text-lg">File preview</CardTitle>
          <CardDescription>
            First {uploadData.preview.length} rows returned by the backend.
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {uploadData.columns.map((column) => (
                  <TableHead key={column}>{column}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {uploadData.preview.map((row, index) => (
                <TableRow key={index}>
                  {uploadData.columns.map((column) => (
                    <TableCell key={column}>
                      {String(row[column] ?? "")}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    )}

    {analysis && (
      <Card className="card-shadow">
        <CardHeader>
          <CardTitle className="font-display text-lg">
            Anomaly analysis complete
          </CardTitle>
          <CardDescription>
            Real results from the FastAPI backend using {analysis.method}.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Total records", value: analysis.total_records },
              { label: "Valid records", value: analysis.valid_records },
              { label: "Normal records", value: analysis.normal_count },
              { label: "Anomalies found", value: analysis.anomaly_count },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-lg border border-border bg-muted/40 p-4"
              >
                <p className="font-display text-2xl font-semibold">
                  {stat.value.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>

          <Alert className="border-success/30 bg-success/5">
            <CheckCircle2 className="h-4 w-4 text-success" />
            <AlertTitle>Analysis successful</AlertTitle>
            <AlertDescription>
              Metric: {analysis.metric_column}. Lower bound: {analysis.lower_bound}.
              Upper bound: {analysis.upper_bound}.
            </AlertDescription>
          </Alert>

          <div>
            <h3 className="mb-3 font-semibold">Detected anomaly records</h3>

            {analysis.anomalies.length > 0 && (
              <Button
                onClick={downloadAnomalyReport}
                variant="outline"
                className="mb-3"
              >
                Download anomaly report (CSV)
              </Button>
            )}

            <p className="mb-3 text-sm text-muted-foreground">
              Showing {analysis.anomalies.length} returned records out of{" "}
              {analysis.anomaly_count.toLocaleString()} total anomalies.
            </p>

            {analysis.anomalies.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {Object.keys(analysis.anomalies[0] ?? {}).map((column) => (
                        <TableHead key={column}>{column}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analysis.anomalies.map((row, index) => (
                      <TableRow key={index}>
                        {Object.keys(analysis.anomalies[0] ?? {}).map((column) => (
                          <TableCell key={column}>
                            {String(row[column] ?? "")}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No anomalies detected for this metric.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    )}
  </div>
);
}