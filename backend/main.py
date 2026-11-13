
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
import pandas as pd
import io
import os

app = FastAPI(
    title="AI Business Anomaly Monitoring API",
    description="API for business KPI data processing and anomaly detection",
    version="1.1.0"
)

# --------------------------------------------------
# CORS CONFIGURATION
# --------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8080",
        "http://localhost:8081"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --------------------------------------------------
# COMMON FILE READER
# --------------------------------------------------

def read_business_file(contents: bytes, filename: str):

    extension = os.path.splitext(filename)[1].lower()

    try:
        if extension == ".csv":
            df = pd.read_csv(io.BytesIO(contents))

        elif extension == ".xlsx":
            df = pd.read_excel(
                io.BytesIO(contents),
                engine="openpyxl"
            )

        else:
            raise HTTPException(
                status_code=400,
                detail="Only CSV and XLSX files are supported."
            )

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Unable to read file: {str(e)}"
        )

    if df.empty:
        raise HTTPException(
            status_code=400,
            detail="Uploaded file is empty."
        )

    return df


# --------------------------------------------------
# DATA VALIDATION AND CLEANING REPORT
# --------------------------------------------------

def validate_business_data(df: pd.DataFrame):

    validation = {
        "total_rows": int(len(df)),
        "missing_values": {},
        "duplicate_rows": int(df.duplicated().sum()),
        "invalid_dates": 0,
        "negative_values": {},
        "issues": []
    }

    # Check missing values
    missing = df.isnull().sum()

    validation["missing_values"] = {
        column: int(count)
        for column, count in missing.items()
        if count > 0
    }

    # Check date columns
    for column in df.columns:

        if "date" in column.lower():

            dates = pd.to_datetime(
                df[column],
                errors="coerce"
            )

            invalid_count = int(dates.isna().sum())

            validation["invalid_dates"] += invalid_count

    # Check negative business KPI values
    non_negative_metrics = [
        "revenue",
        "orders",
        "traffic",
        "cost",
        "refunds"
    ]

    for column in df.columns:

        if column.lower() in non_negative_metrics:

            numeric_values = pd.to_numeric(
                df[column],
                errors="coerce"
            )

            negative_count = int(
                (numeric_values < 0).sum()
            )

            if negative_count > 0:

                validation["negative_values"][column] = (
                    negative_count
                )

    # Generate issue messages
    if validation["missing_values"]:
        validation["issues"].append(
            "Missing values detected."
        )

    if validation["duplicate_rows"] > 0:
        validation["issues"].append(
            "Duplicate records detected."
        )

    if validation["invalid_dates"] > 0:
        validation["issues"].append(
            "Invalid dates detected."
        )

    if validation["negative_values"]:
        validation["issues"].append(
            "Negative KPI values detected."
        )

    validation["status"] = (
        "issues_found"
        if validation["issues"]
        else "clean"
    )

    return validation


# --------------------------------------------------
# HOME API
# --------------------------------------------------

@app.get("/")
def home():

    return {
        "message": "AI Business Anomaly Monitoring API is running!"
    }


# --------------------------------------------------
# UPLOAD API
# --------------------------------------------------

@app.post("/api/upload")
async def upload_csv(file: UploadFile = File(...)):

    try:

        contents = await file.read()

        df = read_business_file(
            contents,
            file.filename
        )

        # Validate data
        validation_report = validate_business_data(df)

        # Identify numeric columns
        numeric_columns = df.select_dtypes(
            include="number"
        ).columns.tolist()

        # Identify date columns
        date_columns = []

        for column in df.columns:

            date_as_string = (
                df[column].astype(str).str.strip()
            )

            converted_dates = pd.to_datetime(
                date_as_string,
                errors="coerce",
                format="mixed"
            )

            valid_date_ratio = (
                converted_dates.notna().mean()
            )

            has_date_pattern = (
                date_as_string.str.contains(
                    r"[-/:]",
                    regex=True
                ).mean() >= 0.8
            )

            if (
                valid_date_ratio >= 0.8
                and has_date_pattern
            ):
                date_columns.append(column)

        # Exclude date columns from numeric metrics
        numeric_columns = [
            column
            for column in numeric_columns
            if column not in date_columns
        ]

        # Prepare preview
        preview_df = df.head(5).copy()

        preview_df = preview_df.astype(object).where(
            pd.notna(preview_df),
            ""
        )

        preview = preview_df.to_dict(
            orient="records"
        )

        return {
            "message": "File uploaded successfully!",
            "filename": file.filename,
            "total_rows": int(len(df)),
            "total_columns": int(len(df.columns)),
            "columns": df.columns.tolist(),
            "numeric_columns": numeric_columns,
            "date_columns": date_columns,
            "validation_report": validation_report,
            "preview": preview
        }

    except HTTPException:
        raise

    except Exception as e:

        raise HTTPException(
            status_code=400,
            detail=f"Unable to process file: {str(e)}"
        )


# --------------------------------------------------
# HYBRID ANOMALY DETECTION ENGINE
# --------------------------------------------------

def detect_hybrid_anomalies(baseline_analysis):

    metrics = baseline_analysis["metrics"]

    # Initial configurable business thresholds (%)
    thresholds = {
        "revenue": {"direction": "decrease", "threshold": 10},
        "orders": {"direction": "decrease", "threshold": 10},
        "traffic": {"direction": "decrease", "threshold": 10},
        "conversion_rate": {"direction": "decrease", "threshold": 10},
        "cost": {"direction": "increase", "threshold": 10},
        "refunds": {"direction": "increase", "threshold": 20}
    }

    detected_anomalies = []

    for metric, metric_data in metrics.items():

        rule = thresholds.get(metric.lower())

        if not rule:
            continue

        signals = []

        for window in ["7_day", "28_day"]:

            comparison = metric_data.get(window)

            if not comparison:
                continue

            # Do not use incomplete historical windows
            if not comparison["coverage_complete"]:
                continue

            change = comparison["percentage_change"]

            if change is None:
                continue

            expected_direction = rule["direction"]
            threshold = rule["threshold"]

            breached = (
                change <= -threshold
                if expected_direction == "decrease"
                else change >= threshold
            )

            if breached:
                signals.append({
                    "window": window,
                    "percentage_change": change,
                    "threshold": threshold
                })

        if not signals:
            continue

        # Severity based on number of breached windows
        if len(signals) == 2:
            severity = "critical"
        else:
            severity = "high"

        detected_anomalies.append({
            "metric": metric,
            "current_value": metric_data["current_value"],
            "expected_direction": rule["direction"],
            "severity": severity,
            "signals": signals,
            "message": (
                f"{metric} shows an unusual "
                f"{rule['direction']} compared with "
                f"historical performance."
            )
        })

    return detected_anomalies


# --------------------------------------------------
# COMBINED BUSINESS ALERT GENERATOR
# --------------------------------------------------

def generate_business_alerts(detected_anomalies):

    if not detected_anomalies:
        return []

    critical = [
        item for item in detected_anomalies
        if item["severity"] == "critical"
    ]

    high = [
        item for item in detected_anomalies
        if item["severity"] == "high"
    ]

    affected_metrics = [
        item["metric"]
        for item in detected_anomalies
    ]

    if critical:
        severity = "critical"
    else:
        severity = "high"

    if len(affected_metrics) == 1:
        summary = (
            f"An unusual movement was detected in: "
            f"{affected_metrics[0]}."
        )
    else:
        summary = (
            "Multiple business KPIs show unusual movements: "
            + ", ".join(affected_metrics)
            + "."
        )

    return [{
        "alert_id": "business-anomaly-summary",
        "alert_type": "combined_business_anomaly",
        "severity": severity,
        "affected_metrics": affected_metrics,
        "total_anomalies": len(detected_anomalies),
        "critical_count": len(critical),
        "high_count": len(high),
        "summary": summary,
        "anomalies": detected_anomalies
    }]

# --------------------------------------------------
# BUSINESS INTELLIGENCE & EXPLANATION ENGINE
# --------------------------------------------------

def generate_business_explanations(detected_anomalies):

    explanations = []

    business_recommendations = {
        "revenue": [
            "Review recent sales performance.",
            "Check product pricing and order value.",
            "Investigate changes in customer demand."
        ],
        "orders": [
            "Review order trends and checkout performance.",
            "Check product availability.",
            "Investigate changes in customer purchasing behavior."
        ],
        "traffic": [
            "Review marketing campaign performance.",
            "Check organic and paid traffic sources.",
            "Investigate website acquisition channels."
        ],
        "conversion_rate": [
            "Review the website checkout process.",
            "Check landing page performance.",
            "Investigate possible customer experience issues."
        ],
        "cost": [
            "Review operating and marketing expenses.",
            "Check recent cost increases.",
            "Identify opportunities to control spending."
        ],
        "refunds": [
            "Review customer refund reasons.",
            "Investigate product quality complaints.",
            "Check order fulfillment and delivery issues."
        ]
    }

    business_impacts = {
        "revenue": "Revenue changes may affect overall business performance and profitability.",
        "orders": "Changes in orders may affect sales volume and business growth.",
        "traffic": "Lower traffic may reduce potential customer acquisition.",
        "conversion_rate": "Lower conversion may indicate problems in the customer purchase journey.",
        "cost": "Higher costs may put pressure on business profitability.",
        "refunds": "Higher refunds may indicate customer satisfaction or product quality issues."
    }

    for anomaly in detected_anomalies:

        metric = anomaly["metric"].lower()

        direction = anomaly["expected_direction"]

        signals = anomaly["signals"]

        # Format historical comparison details
        comparisons = []

        for signal in signals:

            window = signal["window"].replace("_", "-")

            change = signal["percentage_change"]

            comparisons.append(
                f"{window} baseline: {change:+.2f}%"
            )

        comparison_text = "; ".join(comparisons)

        # Generate metric-specific explanation
        explanation = (
            f"{metric.replace('_', ' ').title()} shows an unusual "
            f"{direction} compared with historical performance. "
            f"{comparison_text}."
        )

        # Get business impact
        impact = business_impacts.get(
            metric,
            "This unusual movement may affect business performance."
        )

        # Get recommended actions
        recommendations = business_recommendations.get(
            metric,
            ["Investigate this KPI and monitor its performance."]
        )

        explanations.append({
            "metric": metric,
            "severity": anomaly["severity"],
            "current_value": anomaly["current_value"],
            "explanation": explanation,
            "business_impact": impact,
            "recommended_actions": recommendations
        })

    return explanations


# --------------------------------------------------
# COMBINED BUSINESS SUMMARY
# --------------------------------------------------

def generate_business_summary(
    detected_anomalies,
    business_explanations
):

    if not detected_anomalies:

        return {
            "status": "normal",
            "summary": "No configured KPI anomaly thresholds were breached.",
            "affected_metrics": [],
            "total_anomalies": 0
        }

    affected_metrics = [
        item["metric"]
        for item in detected_anomalies
    ]

    if len(affected_metrics) == 1:

        summary = (
            f"An unusual movement was detected in "
            f"{affected_metrics[0]}."
        )

    else:

        summary = (
            "Unusual movements were detected in multiple business KPIs: "
            + ", ".join(affected_metrics)
            + "."
        )

    return {
        "status": "anomalies_detected",
        "summary": summary,
        "affected_metrics": affected_metrics,
        "total_anomalies": len(detected_anomalies),
        "explanations": business_explanations
    }

# --------------------------------------------------
# HISTORICAL BASELINE ANALYSIS API
# --------------------------------------------------

@app.post("/api/baseline-analysis")
async def baseline_analysis(
    file: UploadFile = File(...),
    date_column: str = Form(...)
):

    try:
        contents = await file.read()

        df = read_business_file(
            contents,
            file.filename
        )

        # Validate uploaded data
        validation_report = validate_business_data(df)

        # Calculate historical baselines
        baseline_results = calculate_historical_baselines(
            df,
            date_column
        )

        return {
            "message": "Historical baseline analysis completed successfully!",
            "filename": file.filename,
            "validation_report": validation_report,
            "baseline_analysis": baseline_results
        }

    except HTTPException:
        raise

    except Exception as e:

        raise HTTPException(
            status_code=400,
            detail=f"Unable to calculate historical baseline: {str(e)}"
        )

# --------------------------------------------------
# HYBRID ANOMALY ANALYSIS API
# --------------------------------------------------

@app.post("/api/hybrid-analyze")
async def hybrid_analyze(
    file: UploadFile = File(...),
    date_column: str = Form(...)
):

    try:
        contents = await file.read()

        df = read_business_file(
            contents,
            file.filename
        )

        # Validate dataset
        validation_report = validate_business_data(df)

        # Calculate 7-day and 28-day baselines
        baseline_results = calculate_historical_baselines(
            df,
            date_column
        )

        # Detect hybrid anomalies
        detected_anomalies = detect_hybrid_anomalies(
            baseline_results
        )

        # Generate combined business alerts
        business_alerts = generate_business_alerts(
            detected_anomalies
        )
        business_explanations = generate_business_explanations(
            detected_anomalies
        )

        business_summary = generate_business_summary(
            detected_anomalies,
            business_explanations
        )

        return {
            
            "message": "Hybrid anomaly analysis completed successfully!",
            "filename": file.filename,
            "validation_report": validation_report,
            "baseline_analysis": baseline_results,
            "detected_anomalies": detected_anomalies,
            "business_alerts": business_alerts,
            "business_explanations": business_explanations,
            "business_summary": business_summary,
            "total_anomalies": len(detected_anomalies),
            "total_business_alerts": len(business_alerts)
        }

    except HTTPException:
        raise

    except Exception as e:

        raise HTTPException(
            status_code=400,
            detail=f"Hybrid analysis failed: {str(e)}"
        )

# --------------------------------------------------
# IQR ANOMALY ANALYSIS API
# --------------------------------------------------

@app.post("/api/analyze")
async def analyze_csv(
    file: UploadFile = File(...),
    metric_column: str = Form(...)
):

    try:

        contents = await file.read()

        df = read_business_file(
            contents,
            file.filename
        )

        if metric_column not in df.columns:

            raise HTTPException(
                status_code=400,
                detail=f"Column '{metric_column}' was not found."
            )

        numeric_data = pd.to_numeric(
            df[metric_column],
            errors="coerce"
        )

        valid_data = numeric_data.dropna()

        if valid_data.empty:

            raise HTTPException(
                status_code=400,
                detail="Selected column has no valid numeric values."
            )

        # Calculate IQR
        q1 = float(valid_data.quantile(0.25))
        q3 = float(valid_data.quantile(0.75))

        iqr = q3 - q1

        lower_bound = q1 - (1.5 * iqr)
        upper_bound = q3 + (1.5 * iqr)

        # Detect anomalies
        anomaly_mask = (
            (numeric_data < lower_bound)
            | (numeric_data > upper_bound)
        )

        anomaly_rows = df.loc[
            anomaly_mask
        ].copy()

        anomaly_rows.insert(
            0,
            "row_number",
            anomaly_rows.index + 2
        )

        anomaly_rows = anomaly_rows.astype(
            object
        ).where(
            pd.notna(anomaly_rows),
            ""
        )

        total_records = int(len(df))
        valid_records = int(len(valid_data))

        anomaly_count = int(anomaly_mask.sum())

        normal_count = (
            valid_records - anomaly_count
        )

        return {
            "message": "Anomaly analysis completed successfully!",
            "filename": file.filename,
            "metric_column": metric_column,
            "method": "IQR",
            "total_records": total_records,
            "valid_records": valid_records,
            "invalid_records": (
                total_records - valid_records
            ),
            "anomaly_count": anomaly_count,
            "normal_count": normal_count,
            "q1": q1,
            "q3": q3,
            "iqr": float(iqr),
            "lower_bound": float(lower_bound),
            "upper_bound": float(upper_bound),
            "anomalies": anomaly_rows.head(100).to_dict(
                orient="records"
            )
        }

    except HTTPException:
        raise

    except Exception as e:

        raise HTTPException(
            status_code=400,
            detail=f"Unable to analyze data: {str(e)}"
        )


# --------------------------------------------------
# EXPORT COMPLETE ANOMALY REPORT API
# --------------------------------------------------

@app.post("/api/export-anomalies")
async def export_anomalies(
    file: UploadFile = File(...),
    metric_column: str = Form(...)
):

    try:

        contents = await file.read()

        df = read_business_file(
            contents,
            file.filename
        )

        if metric_column not in df.columns:

            raise HTTPException(
                status_code=400,
                detail=f"Column '{metric_column}' was not found."
            )

        numeric_data = pd.to_numeric(
            df[metric_column],
            errors="coerce"
        )

        valid_data = numeric_data.dropna()

        if valid_data.empty:

            raise HTTPException(
                status_code=400,
                detail="Selected column has no valid numeric values."
            )

        q1 = valid_data.quantile(0.25)
        q3 = valid_data.quantile(0.75)

        iqr = q3 - q1

        lower_bound = q1 - (1.5 * iqr)
        upper_bound = q3 + (1.5 * iqr)

        anomaly_mask = (
            (numeric_data < lower_bound)
            | (numeric_data > upper_bound)
        )

        anomaly_rows = df.loc[
            anomaly_mask
        ].copy()

        anomaly_rows.insert(
            0,
            "row_number",
            anomaly_rows.index + 2
        )

        csv_content = anomaly_rows.to_csv(
            index=False
        ).encode("utf-8-sig")

        return Response(
            content=csv_content,
            media_type="text/csv; charset=utf-8",
            headers={
                "Content-Disposition":
                'attachment; filename="complete-anomaly-report.csv"'
            }
        )

    except HTTPException:
        raise

    except Exception as e:

        raise HTTPException(
            status_code=400,
            detail=f"Unable to export anomalies: {str(e)}"
        )

def calculate_historical_baselines(
    df: pd.DataFrame,
    date_column: str
):
    """
    Compare the latest date's KPI values against
    previous 7-day and 28-day historical averages.
    """

    if date_column not in df.columns:
        raise HTTPException(
            status_code=400,
            detail=f"Date column '{date_column}' was not found."
        )

    data = df.copy()

    # Parse dates
    data[date_column] = pd.to_datetime(
        data[date_column],
        errors="coerce"
    )

    data = data.dropna(subset=[date_column])

    if data.empty:
        raise HTTPException(
            status_code=400,
            detail="No valid dates available for baseline analysis."
        )

    # Normalize dates to calendar days
    data[date_column] = data[date_column].dt.normalize()

    # Require one record per date to avoid ambiguous KPI aggregation
    if data[date_column].duplicated().any():
        raise HTTPException(
            status_code=400,
            detail="Duplicate dates found. Use one KPI record per date."
        )

    # Sort records chronologically
    data = data.sort_values(date_column)

    latest_date = data[date_column].max()
    current_row = data.loc[
        data[date_column] == latest_date
    ].iloc[0]

    # Identify numeric KPI columns
    numeric_columns = data.select_dtypes(
        include="number"
    ).columns.tolist()

    if not numeric_columns:
        raise HTTPException(
            status_code=400,
            detail="No numeric KPI columns found."
        )

    results = {}

    for metric in numeric_columns:

        metric_data = pd.to_numeric(
            data[metric],
            errors="coerce"
        )

        current_value = metric_data.loc[
            data[date_column] == latest_date
        ].iloc[0]

        if pd.isna(current_value):
            continue

        current_value = float(current_value)

        results[metric] = {
            "current_value": current_value,
            "current_date": latest_date.strftime("%Y-%m-%d")
        }

        for window in [7, 28]:

            start_date = latest_date - pd.Timedelta(
                days=window
            )

            # Exclude current date from historical baseline
            historical_mask = (
                (data[date_column] >= start_date)
                & (data[date_column] < latest_date)
            )

            historical_values = metric_data.loc[
                historical_mask
            ].dropna()

            observed_days = int(
                historical_values.count()
            )

            baseline = None
            percentage_change = None
            direction = "insufficient_data"

            if observed_days > 0:

                baseline = float(
                    historical_values.mean()
                )

                if baseline != 0:

                    percentage_change = round(
                        (
                            (current_value - baseline)
                            / abs(baseline)
                        ) * 100,
                        2
                    )

                    if percentage_change > 0:
                        direction = "increase"

                    elif percentage_change < 0:
                        direction = "decrease"

                    else:
                        direction = "unchanged"

                else:
                    direction = "zero_baseline"

            results[metric][f"{window}_day"] = {
                "baseline_average": baseline,
                "current_value": current_value,
                "percentage_change": percentage_change,
                "direction": direction,
                "observed_days": observed_days,
                "expected_days": window,
                "coverage_complete": (
                    observed_days == window
                )
            }

    if not results:
        raise HTTPException(
            status_code=400,
            detail="No valid numeric KPI values found for analysis."
        )

    return {
        "latest_date": latest_date.strftime("%Y-%m-%d"),
        "baseline_method": "Historical arithmetic mean",
        "metrics": results
    }
