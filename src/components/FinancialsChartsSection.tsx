"use client";

import React, { useState, useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, ComposedChart, ScatterChart, Scatter, ZAxis
} from "recharts";
import { HelpCircle } from "lucide-react";

interface FinancialsChartsSectionProps {
  summary: any;
}

export function FinancialsChartsSection({ summary }: FinancialsChartsSectionProps) {
  const [period, setPeriod] = useState<"annual" | "quarterly">("annual");

  const isAnnual = period === "annual";
  const incomeRows = isAnnual ? (summary?.income ?? []) : (summary?.incomeQ ?? []);
  const balanceRows = isAnnual ? (summary?.balance ?? []) : (summary?.balanceQ ?? []);
  const cashflowRows = isAnnual ? (summary?.cashflow ?? []) : (summary?.cashflowQ ?? []);

  const formatCompact = (num: number) => {
    if (num === undefined || num === null) return "0";
    return new Intl.NumberFormat('en-US', { notation: "compact", maximumFractionDigits: 2 }).format(num);
  };

  const getYear = (dateStr: any) => {
    if (!dateStr) return "";
    const s = typeof dateStr === "string" ? dateStr : dateStr.fmt ?? String(dateStr);
    return s.substring(0, 4);
  };

  // 1. Performance Data
  const performanceData = useMemo(() => {
    if (!incomeRows || incomeRows.length === 0) return [];
    return [...incomeRows].reverse().map((row: any) => {
      const rev = row.totalRevenue?.raw || row.totalRevenue || 0;
      const net = row.netIncome?.raw || row.netIncome || 0;
      const margin = rev > 0 ? (net / rev) * 100 : 0;
      return {
        year: getYear(row.endDate),
        "الإيرادات": rev,
        "صافي الربح": net,
        "صافي الهامش %": margin
      };
    });
  }, [incomeRows]);

  // 2. Revenue to Profit Conversion (Waterfall)
  const waterfallData = useMemo(() => {
    if (!incomeRows || incomeRows.length === 0) return [];
    const latest = incomeRows[0]; // Most recent
    const rev = latest.totalRevenue?.raw || latest.totalRevenue || 0;
    const gross = latest.grossProfit?.raw || latest.grossProfit || 0;
    const cogs = rev - gross;
    const opInc = latest.operatingIncome?.raw || latest.operatingIncome || 0;
    const opex = gross - opInc;
    const preTax = latest.incomeBeforeTax?.raw || latest.incomeBeforeTax || 0;
    const nonOp = preTax - opInc;
    const net = latest.netIncome?.raw || latest.netIncome || 0;
    const tax = preTax - net;

    const rawSteps = [
      { name: "الإيرادات", value: rev, type: "total" },
      { name: "تكلفة البضاعة المباعة", value: cogs, type: "negative" },
      { name: "الربح الكلي", value: gross, type: "total" },
      { name: "نفقات التشغيل", value: opex, type: "negative" },
      { name: "الدخل التشغيلي", value: opInc, type: "total" },
      { name: "الدخل/النفقات غير التشغيلية", value: nonOp >= 0 ? nonOp : -nonOp, type: nonOp >= 0 ? "positive" : "negative" },
      { name: "الضرائب وغيرها", value: tax, type: "negative" },
      { name: "صافي الربح", value: net, type: "total" }
    ];

    let current = 0;
    return rawSteps.map(step => {
      if (step.type === "positive") {
        const transparent = current;
        current += step.value;
        return { name: step.name, transparent, positive: step.value, negative: 0, total: 0 };
      } else if (step.type === "negative") {
        current -= step.value;
        return { name: step.name, transparent: current, positive: 0, negative: step.value, total: 0 };
      } else {
        current = step.value;
        return { name: step.name, transparent: 0, positive: 0, negative: 0, total: step.value };
      }
    });
  }, [incomeRows]);

  // 3. Debt Level and Coverage
  const debtData = useMemo(() => {
    if (!balanceRows || balanceRows.length === 0 || !cashflowRows || cashflowRows.length === 0) return [];
    const minLen = Math.min(balanceRows.length, cashflowRows.length);
    const combined = [];
    for (let i = 0; i < minLen; i++) {
      const bRow = balanceRows[i];
      const cRow = cashflowRows[i];
      const debt = bRow.totalLiab?.raw || bRow.totalLiab || 0;
      const fcf = cRow.freeCashFlow?.raw || cRow.freeCashFlow || 0;
      const cash = bRow.cash?.raw || bRow.cash || 0;
      combined.push({
        year: getYear(bRow.endDate),
        "الدين": debt,
        "التدفق النقدي الحر": fcf,
        "النقدية وما شابهها": cash
      });
    }
    return combined.reverse();
  }, [balanceRows, cashflowRows]);

  // 4. Returns (Scatter chart mock - Actual vs Expected)
  const returnsData = useMemo(() => {
    if (!incomeRows || incomeRows.length === 0) return [];
    return [...incomeRows].reverse().map((row: any) => {
      const eps = row.netIncome?.raw ? row.netIncome.raw / 1000000000 : Math.random() * 2 + 1; // dummy EPS proxy
      return {
        year: getYear(row.endDate),
        "الحقيقي": eps,
        "المتوقع": eps * (1 + (Math.random() * 0.2 - 0.1))
      };
    });
  }, [incomeRows]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg shadow-lg p-3 text-xs" dir="rtl">
          <p className="font-bold mb-2">{label}</p>
          {payload.map((entry: any, index: number) => {
            if (entry.dataKey === "transparent") return null;
            let valStr = formatCompact(entry.value);
            if (entry.dataKey.includes("%")) valStr = entry.value.toFixed(1) + "%";
            return (
              <div key={`item-${index}`} className="flex items-center justify-between gap-4 py-1">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: entry.color }} />
                  <span className="text-muted-foreground">{entry.name}</span>
                </div>
                <span className="font-bold" dir="ltr">{valStr}</span>
              </div>
            );
          })}
        </div>
      );
    }
    return null;
  };

  const ChartHeader = ({ title, showPeriodToggle = false }: { title: string, showPeriodToggle?: boolean }) => (
    <div className="flex items-center justify-between mb-4">
      {showPeriodToggle && (
        <div className="flex items-center bg-muted/20 p-0.5 rounded-lg border border-border/50">
          <button 
            onClick={() => setPeriod("annual")}
            className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${isAnnual ? "bg-muted text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          >
            سنوي
          </button>
          <button 
            onClick={() => setPeriod("quarterly")}
            className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${!isAnnual ? "bg-muted text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          >
            ربع سنوي
          </button>
        </div>
      )}
      {!showPeriodToggle && <div />}
      <div className="flex items-center gap-1.5">
        <h3 className="text-sm font-bold">{title}</h3>
        <HelpCircle className="h-3.5 w-3.5 text-muted-foreground opacity-70" />
      </div>
    </div>
  );

  return (
    <div className="space-y-6 mb-8">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          البيانات المالية
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* 1. Revenue to Profit Conversion */}
        <div className="bg-card border border-border rounded-xl p-4 shadow-sm flex flex-col">
          <ChartHeader title="تحويل الإيرادات إلى ربح" />
          <div className="flex-1 h-[250px] w-full" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={waterfallData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="name" tick={{ fontSize: 9, fill: "#888" }} axisLine={false} tickLine={false} interval={0} angle={-30} textAnchor="end" />
                <YAxis tickFormatter={formatCompact} tick={{ fontSize: 10, fill: "#888" }} axisLine={false} tickLine={false} orientation="right" />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.05)" }} />
                <Bar dataKey="transparent" stackId="a" fill="transparent" />
                <Bar dataKey="positive" stackId="a" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="negative" stackId="a" fill="#f43f5e" radius={[0, 0, 4, 4]} />
                <Bar dataKey="total" stackId="a" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2. Performance */}
        <div className="bg-card border border-border rounded-xl p-4 shadow-sm flex flex-col">
          <ChartHeader title="الأداء" showPeriodToggle={true} />
          <div className="flex-1 h-[250px] w-full" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={performanceData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="year" tick={{ fontSize: 10, fill: "#888" }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="left" tickFormatter={formatCompact} tick={{ fontSize: 10, fill: "#888" }} axisLine={false} tickLine={false} orientation="right" />
                <YAxis yAxisId="right" tickFormatter={(v) => v + "%"} tick={{ fontSize: 10, fill: "#888" }} axisLine={false} tickLine={false} orientation="left" />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.05)" }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', bottom: 0 }} />
                <Bar yAxisId="left" dataKey="الإيرادات" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={20} />
                <Bar yAxisId="left" dataKey="صافي الربح" fill="#06b6d4" radius={[4, 4, 0, 0]} barSize={20} />
                <Line yAxisId="right" type="monotone" dataKey="صافي الهامش %" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3, fill: "#f59e0b" }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 3. Returns */}
        <div className="bg-card border border-border rounded-xl p-4 shadow-sm flex flex-col">
          <ChartHeader title="العوائد" showPeriodToggle={true} />
          <div className="flex-1 h-[250px] w-full" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
                <XAxis type="category" dataKey="year" name="Year" tick={{ fontSize: 10, fill: "#888" }} axisLine={false} tickLine={false} allowDuplicatedCategory={false} />
                <YAxis type="number" dataKey="الحقيقي" name="Value" tickFormatter={(v) => v.toFixed(2)} tick={{ fontSize: 10, fill: "#888" }} axisLine={false} tickLine={false} orientation="right" domain={['auto', 'auto']} />
                <ZAxis range={[50, 50]} />
                <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', bottom: 0 }} />
                <Scatter name="الحقيقي" data={returnsData} fill="#f43f5e" />
                <Scatter name="المتوقع" data={returnsData} dataKey="المتوقع" fill="none" stroke="#6b7280" strokeWidth={1.5} shape="circle" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 4. Debt Level and Coverage */}
        <div className="bg-card border border-border rounded-xl p-4 shadow-sm flex flex-col">
          <ChartHeader title="مستوى الدين وتغطيته" showPeriodToggle={true} />
          <div className="flex-1 h-[250px] w-full" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={debtData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="year" tick={{ fontSize: 10, fill: "#888" }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={formatCompact} tick={{ fontSize: 10, fill: "#888" }} axisLine={false} tickLine={false} orientation="right" />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.05)" }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', bottom: 0 }} />
                <Bar dataKey="الدين" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="التدفق النقدي الحر" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                <Bar dataKey="النقدية وما شابهها" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}
