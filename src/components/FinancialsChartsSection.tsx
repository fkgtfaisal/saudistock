"use client";

import React, { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import { HelpCircle } from "lucide-react";

type Period = "annual" | "quarterly";

type FinancialRow = {
  endDate?: string | { fmt?: string };
  [key: string]: unknown;
};

type FinancialsSummary = {
  income?: FinancialRow[];
  incomeQ?: FinancialRow[];
  balance?: FinancialRow[];
  balanceQ?: FinancialRow[];
  cashflow?: FinancialRow[];
  cashflowQ?: FinancialRow[];
};

interface FinancialsChartsSectionProps {
  summary: FinancialsSummary | null | undefined;
}

const COLORS = {
  revenue: "#4c8bf5",
  profit: "#21c7d9",
  margin: "#ff9800",
  negative: "#ff3d7f",
  debt: "#e95793",
  cash: "#5b9df7",
  grid: "rgba(255,255,255,0.12)",
  text: "#cbd5e1",
};

function rawValue(row: FinancialRow | undefined, key: string): number {
  const value = row?.[key];
  if (typeof value === "number") return value;
  if (value && typeof value === "object" && "raw" in value) {
    const raw = (value as { raw?: unknown }).raw;
    return typeof raw === "number" ? raw : 0;
  }
  return 0;
}

function getYear(dateValue: FinancialRow["endDate"]): string {
  if (!dateValue) return "";
  const text = typeof dateValue === "string" ? dateValue : dateValue.fmt ?? "";
  return text.slice(0, 4);
}

function formatCompact(value: number): string {
  if (!Number.isFinite(value)) return "0";
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatPercent(value: number): string {
  if (!Number.isFinite(value)) return "0.0%";
  return `${value.toFixed(1)}%`;
}

function ChartShell({
  title,
  children,
  period,
  onPeriodChange,
  hasData,
}: {
  title: string;
  children: React.ReactNode;
  period?: Period;
  onPeriodChange?: (period: Period) => void;
  hasData: boolean;
}) {
  return (
    <section className="min-h-[320px] border-t border-border/80 pt-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        {period && onPeriodChange ? (
          <div className="flex items-center rounded-md bg-muted/40 p-0.5 text-xs font-bold">
            <button
              type="button"
              onClick={() => onPeriodChange("annual")}
              className={`rounded px-3 py-1 transition-colors ${
                period === "annual" ? "bg-secondary text-secondary-foreground" : "text-muted-foreground"
              }`}
            >
              سنوي
            </button>
            <button
              type="button"
              onClick={() => onPeriodChange("quarterly")}
              className={`rounded px-3 py-1 transition-colors ${
                period === "quarterly" ? "bg-secondary text-secondary-foreground" : "text-muted-foreground"
              }`}
            >
              ربع سنوي
            </button>
          </div>
        ) : (
          <div />
        )}

        <div className="flex items-center gap-1.5">
          <h3 className="text-sm font-bold">{title}</h3>
          <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
      </div>

      <div className="h-[260px] w-full" dir="ltr">
        {hasData ? (
          children
        ) : (
          <div className="flex h-full items-center justify-center border-y border-border/60 text-xs text-muted-foreground">
            لا توجد بيانات كافية للرسم
          </div>
        )}
      </div>
    </section>
  );
}

function FinancialTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-md border border-border bg-background px-3 py-2 text-xs shadow-xl" dir="rtl">
      <p className="mb-2 font-bold">{label}</p>
      <div className="space-y-1.5">
        {payload.map((entry: any) => {
          if (entry.dataKey === "offset") return null;
          const isPercent = entry.dataKey === "margin";
          const value = isPercent ? formatPercent(entry.value) : formatCompact(entry.value);
          return (
            <div key={`${entry.dataKey}-${entry.name}`} className="flex min-w-44 items-center justify-between gap-4">
              <span className="flex items-center gap-2 text-muted-foreground">
                <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: entry.color }} />
                {entry.name}
              </span>
              <span className="font-bold" dir="ltr">
                {value}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function FinancialsChartsSection({ summary }: FinancialsChartsSectionProps) {
  const [period, setPeriod] = useState<Period>("annual");
  const isAnnual = period === "annual";

  const incomeRows = isAnnual ? summary?.income ?? [] : summary?.incomeQ ?? [];
  const balanceRows = isAnnual ? summary?.balance ?? [] : summary?.balanceQ ?? [];
  const cashflowRows = isAnnual ? summary?.cashflow ?? [] : summary?.cashflowQ ?? [];

  const performanceData = useMemo(
    () =>
      [...incomeRows]
        .reverse()
        .map((row) => {
          const revenue = rawValue(row, "totalRevenue");
          const netIncome = rawValue(row, "netIncome");
          return {
            year: getYear(row.endDate),
            revenue,
            netIncome,
            margin: revenue > 0 ? (netIncome / revenue) * 100 : 0,
          };
        })
        .filter((row) => row.year && (row.revenue || row.netIncome)),
    [incomeRows]
  );

  const waterfallData = useMemo(() => {
    const latest = incomeRows[0];
    if (!latest) return [];

    const revenue = rawValue(latest, "totalRevenue");
    const grossProfit = rawValue(latest, "grossProfit");
    const operatingIncome = rawValue(latest, "operatingIncome");
    const incomeBeforeTax = rawValue(latest, "incomeBeforeTax");
    const netIncome = rawValue(latest, "netIncome");

    const steps = [
      { name: "الإيرادات", value: revenue, kind: "total" },
      { name: "تكلفة المبيعات", value: Math.max(revenue - grossProfit, 0), kind: "negative" },
      { name: "الربح الكلي", value: grossProfit, kind: "total" },
      { name: "نفقات التشغيل", value: Math.max(grossProfit - operatingIncome, 0), kind: "negative" },
      { name: "الدخل التشغيلي", value: operatingIncome, kind: "total" },
      {
        name: "الدخل غير التشغيلي",
        value: Math.abs(incomeBeforeTax - operatingIncome),
        kind: incomeBeforeTax >= operatingIncome ? "positive" : "negative",
      },
      { name: "الضرائب وغيرها", value: Math.max(incomeBeforeTax - netIncome, 0), kind: "negative" },
      { name: "صافي الربح", value: netIncome, kind: "total" },
    ];

    let current = 0;
    return steps.map((step) => {
      if (step.kind === "total") {
        current = step.value;
        return { name: step.name, offset: 0, positive: 0, negative: 0, total: step.value };
      }
      if (step.kind === "positive") {
        const offset = current;
        current += step.value;
        return { name: step.name, offset, positive: step.value, negative: 0, total: 0 };
      }
      current -= step.value;
      return { name: step.name, offset: Math.max(current, 0), positive: 0, negative: step.value, total: 0 };
    });
  }, [incomeRows]);

  const debtData = useMemo(() => {
    const count = Math.min(balanceRows.length, cashflowRows.length);
    return Array.from({ length: count }, (_, index) => {
      const balance = balanceRows[index];
      const cashflow = cashflowRows[index];
      return {
        year: getYear(balance.endDate),
        debt: rawValue(balance, "totalLiab"),
        freeCashFlow: rawValue(cashflow, "freeCashFlow"),
        cash: rawValue(balance, "cash"),
      };
    })
      .reverse()
      .filter((row) => row.year && (row.debt || row.freeCashFlow || row.cash));
  }, [balanceRows, cashflowRows]);

  const returnsData = useMemo(
    () =>
      [...incomeRows]
        .reverse()
        .map((row) => {
          const netIncome = rawValue(row, "netIncome");
          const revenue = rawValue(row, "totalRevenue");
          const actual = revenue > 0 ? (netIncome / revenue) * 10 : 0;
          return {
            year: getYear(row.endDate),
            actual,
            expected: actual * 1.08,
          };
        })
        .filter((row) => row.year && row.actual),
    [incomeRows]
  );

  return (
    <div className="mb-8 space-y-6">
      <div className="border-b border-border pb-4 text-right">
        <h2 className="text-xl font-bold">البيانات المالية</h2>
      </div>

      <div className="grid grid-cols-1 gap-x-10 gap-y-8 xl:grid-cols-2">
        <ChartShell title="تحويل الإيرادات إلى ربح" hasData={waterfallData.length > 0}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={waterfallData} margin={{ top: 8, right: 20, left: 16, bottom: 34 }}>
              <CartesianGrid stroke={COLORS.grid} vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: COLORS.text }} axisLine={false} tickLine={false} interval={0} angle={-24} textAnchor="end" />
              <YAxis tickFormatter={formatCompact} tick={{ fontSize: 10, fill: COLORS.text }} axisLine={false} tickLine={false} orientation="right" />
              <Tooltip content={<FinancialTooltip />} cursor={{ fill: "rgba(255,255,255,0.05)" }} />
              <Bar dataKey="offset" stackId="waterfall" fill="transparent" />
              <Bar name="زيادة" dataKey="positive" stackId="waterfall" fill="#2fb8a4" />
              <Bar name="انخفاض" dataKey="negative" stackId="waterfall" fill={COLORS.negative} />
              <Bar name="الإجمالي" dataKey="total" stackId="waterfall" fill={COLORS.revenue} />
            </BarChart>
          </ResponsiveContainer>
        </ChartShell>

        <ChartShell title="الأداء" period={period} onPeriodChange={setPeriod} hasData={performanceData.length > 0}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={performanceData} margin={{ top: 8, right: 20, left: 16, bottom: 26 }}>
              <CartesianGrid stroke={COLORS.grid} vertical={false} />
              <XAxis dataKey="year" tick={{ fontSize: 10, fill: COLORS.text }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="money" tickFormatter={formatCompact} tick={{ fontSize: 10, fill: COLORS.text }} axisLine={false} tickLine={false} orientation="right" />
              <YAxis yAxisId="percent" tickFormatter={formatPercent} tick={{ fontSize: 10, fill: COLORS.text }} axisLine={false} tickLine={false} orientation="left" />
              <Tooltip content={<FinancialTooltip />} cursor={{ fill: "rgba(255,255,255,0.05)" }} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
              <Bar name="الإيرادات" yAxisId="money" dataKey="revenue" fill={COLORS.profit} barSize={22} />
              <Bar name="صافي الربح" yAxisId="money" dataKey="netIncome" fill={COLORS.revenue} barSize={22} />
              <Line name="صافي الهامش %" yAxisId="percent" type="monotone" dataKey="margin" stroke={COLORS.margin} strokeWidth={2} dot={{ r: 3, fill: COLORS.margin }} />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartShell>

        <ChartShell title="العوائد" period={period} onPeriodChange={setPeriod} hasData={returnsData.length > 0}>
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 8, right: 20, left: 16, bottom: 26 }}>
              <CartesianGrid stroke={COLORS.grid} vertical={false} />
              <XAxis type="category" dataKey="year" tick={{ fontSize: 10, fill: COLORS.text }} axisLine={false} tickLine={false} allowDuplicatedCategory={false} />
              <YAxis type="number" dataKey="actual" tickFormatter={(value) => value.toFixed(2)} tick={{ fontSize: 10, fill: COLORS.text }} axisLine={false} tickLine={false} orientation="right" />
              <ZAxis range={[70, 70]} />
              <Tooltip content={<FinancialTooltip />} cursor={{ strokeDasharray: "3 3" }} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
              <Scatter name="الحقيقي" data={returnsData} dataKey="actual" fill="#ff5a66" />
              <Scatter name="المتوقع" data={returnsData} dataKey="expected" fill="none" stroke="#7a7f8f" strokeWidth={1.5} shape="circle" />
            </ScatterChart>
          </ResponsiveContainer>
        </ChartShell>

        <ChartShell title="مستوى الدين وتغطيته" period={period} onPeriodChange={setPeriod} hasData={debtData.length > 0}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={debtData} margin={{ top: 8, right: 20, left: 16, bottom: 26 }}>
              <CartesianGrid stroke={COLORS.grid} vertical={false} />
              <XAxis dataKey="year" tick={{ fontSize: 10, fill: COLORS.text }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={formatCompact} tick={{ fontSize: 10, fill: COLORS.text }} axisLine={false} tickLine={false} orientation="right" />
              <Tooltip content={<FinancialTooltip />} cursor={{ fill: "rgba(255,255,255,0.05)" }} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
              <Bar name="الدين" dataKey="debt" fill={COLORS.debt} />
              <Bar name="التدفق النقدي الحر" dataKey="freeCashFlow" fill={COLORS.profit} />
              <Bar name="النقدية وما شابهها" dataKey="cash" fill={COLORS.cash} />
            </BarChart>
          </ResponsiveContainer>
        </ChartShell>
      </div>
    </div>
  );
}
