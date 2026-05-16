"use client";

import { createChart, ColorType, IChartApi, LineSeries } from "lightweight-charts";
import React, { useEffect, useRef } from "react";

export function SparklineComponent({ data, isPositive = true }: { data: any[], isPositive?: boolean }) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const handleResize = () => {
      chartRef.current?.applyOptions({ width: chartContainerRef.current?.clientWidth });
    };

    const chartColor = isPositive ? "#10b981" : "#ef4444"; // Success Green or Destructive Red

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
      },
      width: chartContainerRef.current.clientWidth,
      height: 250,
      grid: {
        vertLines: { visible: false },
        horzLines: { visible: false },
      },
      crosshair: {
        mode: 1, // Magnet
      },
      rightPriceScale: {
        visible: false,
      },
      timeScale: {
        visible: false,
      },
      handleScroll: false,
      handleScale: false,
    });
    
    chartRef.current = chart;

    const lineSeries = chart.addSeries(LineSeries, {
      color: chartColor,
      lineWidth: 2,
      crosshairMarkerVisible: true,
      lastValueVisible: false,
      priceLineVisible: false,
    });

    // Format data from candlestick (time, open, high, low, close) to line (time, value)
    const lineData = data.map(d => ({ time: d.time, value: d.close }));
    lineSeries.setData(lineData);

    chart.timeScale().fitContent();

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, [data, isPositive]);

  return <div ref={chartContainerRef} className="w-full h-[250px]" dir="ltr" />;
}
