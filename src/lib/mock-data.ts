/**
 * Demo/mock data for the AI Business Anomaly Monitoring Agent prototype.
 *
 * All values here are synthetic demo data — clearly labeled as such in the UI.
 * When the real FastAPI backend is connected, replace these exports with API
 * responses that mirror the same shapes.
 */

export type Severity = "critical" | "high" | "moderate" | "low";
export type AnomalyStatus = "open" | "investigating" | "resolved";
export type AlertStatus = "new" | "investigating" | "resolved";

export interface TrendPoint {
  date: string;
  value: number;
}

export interface Anomaly {
  id: string;
  date: string;
  metric: string;
  currentValue: string;
  baseline: string;
  changePct: number;
  severity: Severity;
  status: AnomalyStatus;
  description: string;
  possibleCauses: string[];
  nextSteps: string[];
}

export interface Alert {
  id: string;
  date: string;
  severity: Severity;
  summary: string;
  status: AlertStatus;
}

function formatDate(day: Date): string {
  return day.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function buildTrend(
  base: number,
  dailyGrowth: number,
  weekendFactor: number,
  overrides: Record<number, number>,
): TrendPoint[] {
  return Array.from({ length: 30 }, (_, i) => {
    const day = new Date(2026, 8, 22 + i); // Sep 22 → Oct 21, 2026
    const weekend = day.getDay() === 0 || day.getDay() === 6 ? weekendFactor : 1;
    const value = overrides[i] ?? base * (1 + i * dailyGrowth) * weekend;
    return { date: formatDate(day), value: Math.round(value * 100) / 100 };
  });
}

// Daily revenue dips sharply over the last two days (the headline anomaly).
export const revenueTrend: TrendPoint[] = buildTrend(9100, 0.0035, 0.86, {
  28: 7900,
  29: 6450,
});

// Daily orders dip in parallel with revenue.
export const ordersTrend: TrendPoint[] = buildTrend(126, 0.002, 0.84, {
  28: 104,
  29: 92,
});

export const lastAnalysis = "Today, 09:42 UTC";

export const recentAnomalies: Anomaly[] = [
  {
    id: "an-1",
    date: "Oct 21, 2026",
    metric: "Revenue",
    currentValue: "$6,450",
    baseline: "$9,490",
    changePct: -32.0,
    severity: "critical",
    status: "open",
    description:
      "Daily revenue fell 32% below the 30-day rolling baseline, the largest single-day deviation in the current window.",
    possibleCauses: [
      "Checkout or payment provider issue",
      "Traffic source mix shifted to lower-intent visitors",
      "Pricing or promotion change",
    ],
    nextSteps: [
      "Verify checkout funnel completion rates",
      "Review payment provider logs for failed transactions",
      "Compare traffic source breakdown day-over-day",
    ],
  },
  {
    id: "an-2",
    date: "Oct 21, 2026",
    metric: "Conversion Rate",
    currentValue: "2.05%",
    baseline: "2.85%",
    changePct: -28.1,
    severity: "high",
    status: "open",
    description:
      "Conversion rate declined while sessions grew, indicating traffic quality or funnel friction issues.",
    possibleCauses: [
      "New traffic campaign bringing low-intent visitors",
      "Checkout friction (form errors, slow payment step)",
      "Site performance degradation on key pages",
    ],
    nextSteps: [
      "Segment conversion rate by traffic source",
      "Test the checkout flow end-to-end",
      "Check page speed on landing and cart pages",
    ],
  },
  {
    id: "an-3",
    date: "Oct 20, 2026",
    metric: "Traffic (Sessions)",
    currentValue: "18,420",
    baseline: "13,064",
    changePct: 41.1,
    severity: "moderate",
    status: "investigating",
    description:
      "Session volume spiked 41% above baseline. Not inherently negative, but unexpected and correlated with falling conversion.",
    possibleCauses: [
      "New marketing campaign or referral traffic",
      "Bot or crawler activity inflating sessions",
      "Viral social mention",
    ],
    nextSteps: [
      "Identify top referral sources for the spike",
      "Filter out suspected bot traffic",
      "Track conversion rate per source",
    ],
  },
  {
    id: "an-4",
    date: "Oct 20, 2026",
    metric: "Average Order Value",
    currentValue: "$68.40",
    baseline: "$71.10",
    changePct: -3.8,
    severity: "low",
    status: "resolved",
    description: "Minor dip in average order value, within normal weekly variation.",
    possibleCauses: ["Product mix shift toward lower-priced items"],
    nextSteps: ["Monitor for another 48 hours"],
  },
  {
    id: "an-5",
    date: "Oct 19, 2026",
    metric: "Checkout Completions",
    currentValue: "412",
    baseline: "548",
    changePct: -24.8,
    severity: "high",
    status: "open",
    description: "Completed checkouts dropped well below baseline despite higher traffic.",
    possibleCauses: [
      "Payment step failures",
      "Shipping cost changes",
      "Cart UX regression after a release",
    ],
    nextSteps: [
      "Review payment error rates",
      "Check for recent releases affecting the cart",
      "Inspect funnel drop-off per step",
    ],
  },
  {
    id: "an-6",
    date: "Oct 18, 2026",
    metric: "Refund Rate",
    currentValue: "4.6%",
    baseline: "2.1%",
    changePct: 119.0,
    severity: "critical",
    status: "investigating",
    description: "Refund rate more than doubled, concentrated in orders from paid social campaigns.",
    possibleCauses: [
      "Product quality or expectation mismatch",
      "Misleading ad creative",
      "Defective batch or fulfillment issue",
    ],
    nextSteps: [
      "Read recent refund reasons in support tickets",
      "Compare refunds by campaign and product",
      "Pause or review underperforming campaigns",
    ],
  },
  {
    id: "an-7",
    date: "Oct 17, 2026",
    metric: "Cart Abandonment",
    currentValue: "71.8%",
    baseline: "64.2%",
    changePct: 11.8,
    severity: "moderate",
    status: "open",
    description: "Cart abandonment trending above baseline for three consecutive days.",
    possibleCauses: ["Shipping cost surprise at checkout", "Slow checkout page", "Coupon code errors"],
    nextSteps: ["Review checkout step analytics", "Test coupon application flow"],
  },
  {
    id: "an-8",
    date: "Oct 16, 2026",
    metric: "Email Signups",
    currentValue: "1,240",
    baseline: "1,198",
    changePct: 3.5,
    severity: "low",
    status: "resolved",
    description: "Slight uptick in email signups, within expected range.",
    possibleCauses: ["Newsletter feature promoted in app"],
    nextSteps: ["No action needed"],
  },
];

export const initialAlerts: Alert[] = [
  {
    id: "al-1",
    date: "Oct 21, 2026 · 09:42 UTC",
    severity: "critical",
    summary: "Revenue dropped 32% day-over-day against the 30-day baseline while sessions increased 41%.",
    status: "investigating",
  },
  {
    id: "al-2",
    date: "Oct 20, 2026 · 22:10 UTC",
    severity: "high",
    summary: "Checkout completions down 24.8% despite higher session volume — funnel friction suspected.",
    status: "new",
  },
  {
    id: "al-3",
    date: "Oct 18, 2026 · 18:05 UTC",
    severity: "critical",
    summary: "Refund rate doubled to 4.6%, concentrated in orders from paid social campaigns.",
    status: "new",
  },
  {
    id: "al-4",
    date: "Oct 17, 2026 · 08:30 UTC",
    severity: "moderate",
    summary: "Cart abandonment trending above baseline for 3 consecutive days.",
    status: "resolved",
  },
  {
    id: "al-5",
    date: "Oct 12, 2026 · 11:15 UTC",
    severity: "low",
    summary: "Average order value drifting slightly below baseline for the week.",
    status: "resolved",
  },
];

export interface InsightSection {
  title: string;
  icon: "activity" | "target" | "search" | "compass";
  paragraphs: string[];
  bullets?: string[];
}

export const demoInsight: InsightSection[] = [
  {
    title: "What changed",
    icon: "activity",
    paragraphs: [
      "Revenue decreased 32% day-over-day against the 30-day baseline, while traffic (sessions) increased 41% and conversion rate declined 28%.",
      "Checkout completions fell 24.8% and cart abandonment rose 11.8% over the same window, and the refund rate doubled to 4.6%.",
    ],
  },
  {
    title: "Why it matters",
    icon: "target",
    paragraphs: [
      "The usual growth relationship between traffic and revenue appears inverted: more visitors are arriving, but a much smaller share is converting. If the traffic surge continues without a conversion recovery, projected monthly revenue falls materially below plan.",
      "The simultaneous rise in refunds, concentrated in paid-social orders, compounds the revenue impact and may signal a mismatch between what ads promise and what customers receive.",
    ],
  },
  {
    title: "Possible causes to investigate",
    icon: "search",
    paragraphs: [
      "These are hypotheses to validate, not confirmed facts:",
    ],
    bullets: [
      "Traffic source mix: the new sessions may come from low-intent channels or campaigns",
      "Checkout funnel friction: payment failures, shipping-cost surprises, or a recent release affecting the cart",
      "Ad-to-product mismatch driving both weak conversion and elevated refunds",
      "Bot or crawler traffic inflating session counts",
    ],
  },
  {
    title: "Recommended next steps",
    icon: "compass",
    paragraphs: ["Suggested actions, in order of expected impact:"],
    bullets: [
      "Segment conversion rate by traffic source to see whether the new sessions convert at all",
      "Walk the checkout flow end-to-end and review payment error logs for the affected window",
      "Audit recent paid-social creative against the landing page and refund reasons",
      "Re-run the anomaly analysis in 24–48 hours to confirm whether the deviation persists",
    ],
  },
];
