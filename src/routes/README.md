# AI Business Anomaly Monitoring Agent

An intelligent business monitoring dashboard that detects statistical outliers and unusual business KPI movements using historical data analysis.

The system combines **IQR-based Statistical Anomaly Detection** and **Historical KPI Monitoring** to identify unusual patterns, generate business alerts, explain potential business impact, and recommend investigation actions.

## Overview

Businesses generate large volumes of operational data, making it difficult to identify unusual changes and performance issues manually.

This project provides a centralized monitoring solution that analyzes uploaded business datasets, identifies anomalies, compares current KPIs against historical baselines, and presents actionable insights through an interactive dashboard.

## Key Features

### 1. CSV and Excel Data Upload
- Upload business datasets in CSV and Excel formats.
- Preview uploaded records.
- Validate data quality.
- Identify missing values, duplicate dates, invalid dates, and negative KPI values.

### 2. IQR-Based Anomaly Detection
- Detect statistical outliers using the Interquartile Range (IQR) method.
- Calculate lower and upper detection boundaries.
- Identify unusual records.
- Export detected anomaly records as CSV.

### 3. Business KPI Monitoring
Monitor important business metrics:

- Revenue
- Orders
- Traffic
- Conversion Rate
- Cost
- Refunds

Compare current KPI values against historical 7-day and 28-day averages.

### 4. Hybrid Anomaly Detection
- Apply metric-specific business thresholds.
- Identify unusual increases and decreases.
- Generate High and Critical severity classifications.
- Detect business performance anomalies using historical comparisons.

### 5. Business Alerts and Insights
- Generate business-level alerts.
- Provide plain-English anomaly explanations.
- Highlight potential business impact.
- Recommend investigation actions.
- Track alert statuses: New, Investigating, and Resolved.

### 6. Interactive Dashboard
- Business KPI summary cards.
- Historical KPI comparison charts.
- Separate IQR and Business KPI alert sections.
- Statistical anomaly monitoring.
- Business insights and recommendations.

## Anomaly Detection Approaches

| Feature | IQR Detection | Business KPI Monitoring |
|---|---|---|
| Approach | Statistical analysis | Historical comparison |
| Method | Interquartile Range | 7-day and 28-day averages |
| Purpose | Identify unusual records | Identify business performance changes |
| Output | Statistical outliers | Business alerts |
| Explanation | Statistical boundaries | Business impact and recommendations |

## Technology Stack

**Frontend**
- React.js
- TypeScript
- TanStack Start / Router
- Tailwind CSS
- Vite
- Lucide Icons

**Backend**
- Python
- FastAPI
- Pandas
- Uvicorn

**Data Processing**
- CSV and Excel file processing
- Historical baseline calculations
- Statistical anomaly detection
- Rule-based business alert generation

## System Architecture

```text
             Business Dataset
              (CSV / Excel)
                    |
                    v
             Data Upload API
                    |
                    v
             Data Validation
                    |
          +---------+---------+
          |                   |
          v                   v
     IQR Detection       Historical KPI
          |               Calculation
          |                   |
          v                   v
    Statistical          7-Day / 28-Day
     Outliers             Baselines
          |                   |
          |                   v
          |             Hybrid Detection
          |                   |
          |                   v
          |             Business Alerts
          |                   |
          +---------+---------+
                    |
                    v
              React Dashboard
                    |
          +---------+---------+
          |         |         |
          v         v         v
       Overview  Insights   Alerts
```

## Project Structure

```text
AI-Business-Anomaly-Monitoring-Agent/
│
├── backend/
│   ├── main.py
│   └── .venv/
│
├── src/
│   ├── components/
│   ├── routes/
│   │   ├── index.tsx
│   │   ├── upload-data.tsx
│   │   ├── anomaly-monitor.tsx
│   │   ├── ai-insights.tsx
│   │   └── alerts.tsx
│   └── ...
│
├── public/
├── package.json
└── README.md
```

## Installation and Setup

### Prerequisites

- Node.js and npm
- Python 3.10+
- Git

### 1. Clone the Repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
cd AI-Business-Anomaly-Monitoring-Agent
```

Replace `YOUR_GITHUB_REPOSITORY_URL` with your actual GitHub repository URL.

### 2. Install Frontend Dependencies

```bash
npm install
```

### 3. Set Up Backend

```bash
cd backend
python -m venv .venv
```

Activate the virtual environment.

**Windows PowerShell:**

```powershell
.\.venv\Scripts\Activate.ps1
```

Install backend dependencies using the project's dependency file:

```bash
pip install -r requirements.txt
```

### 4. Start Backend Server

From the backend directory:

```bash
uvicorn main:app --reload --port 8000
```

Backend API:

```text
http://127.0.0.1:8000
```

Interactive API documentation:

```text
http://127.0.0.1:8000/docs
```

### 5. Start Frontend Server

Open another terminal in the project root:

```bash
npm run dev
```

Open the local URL displayed by Vite in your browser.

## API Endpoints

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/upload` | POST | Upload and validate datasets |
| `/api/analyze` | POST | Perform IQR anomaly detection |
| `/api/export-anomalies` | POST | Export anomaly records |
| `/api/baseline-analysis` | POST | Calculate historical KPI baselines |
| `/api/hybrid-analyze` | POST | Perform hybrid business anomaly analysis |

## Current Limitations

- Business explanations are generated using predefined rules, not a generative AI model.
- Root causes are not automatically established.
- Alert statuses are stored locally in the browser.
- Monitoring currently depends on manually uploaded datasets.
- Real-time scheduled monitoring and external alert notifications are not implemented.

## Future Enhancements

- AI-powered business explanations using an LLM.
- Automated scheduled KPI monitoring.
- Email and notification integrations.
- Database-backed analysis history.
- Advanced trend and forecasting analysis.
- Root-cause investigation support.
- User authentication and role-based access.

## Project Purpose

This project demonstrates practical applications of Python, data analysis, statistical anomaly detection, business KPI monitoring, API development, and interactive dashboard development.

It aims to bridge the gap between raw business data and actionable operational insights.

---

**Note:** This is a rules-based anomaly monitoring system with statistical and business KPI detection capabilities. It does not currently provide autonomous AI-based root-cause analysis.
