"use client";

import { createChart, ColorType, IChartApi, CandlestickSeries, LineSeries, AreaSeries, HistogramSeries } from "lightweight-charts";
import { STOCK_MAP } from "@/lib/stocks";
import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  MousePointer2,
  TrendingUp,
  Minus,
  ArrowDownToLine,
  Triangle,
  Square,
  Trash2,
  RotateCcw,
  Magnet,
} from "lucide-react";

// Drawing tool types
type DrawingTool = "none" | "trendline" | "hline" | "vline" | "fib" | "rect" | "arrow" | "ray" | "extended" | "price_label";

interface DrawnItem {
  type: DrawingTool;
  points: { time: any; value: number }[];
  series: any[];
}

/** 
 * TECHNICAL INDICATOR CALCULATORS 
 */
const calculateSMA = (data: any[], period = 20) => {
  const result = [];
  for (let i = period - 1; i < data.length; i++) {
    let sum = 0;
    for (let j = 0; j < period; j++) sum += data[i - j].close;
    result.push({ time: data[i].time, value: sum / period });
  }
  return result;
};

const calculateEMA = (data: any[], period = 20) => {
  if (!data.length) return [];
  const k = 2 / (period + 1);
  let prevEma = data[0].close;
  return data.map((d) => {
    const ema = (d.close - prevEma) * k + prevEma;
    prevEma = ema;
    return { time: d.time, value: ema };
  });
};

const calculateRSI = (data: any[], period = 14) => {
  const result = [];
  let gains = 0;
  let losses = 0;
  for (let i = 1; i < data.length; i++) {
    const change = data[i].close - data[i - 1].close;
    if (i <= period) {
      if (change > 0) gains += change;
      else losses -= change;
      if (i === period) {
        gains /= period;
        losses /= period;
        const rs = losses === 0 ? 100 : gains / losses;
        result.push({ time: data[i].time, value: 100 - 100 / (1 + rs) });
      }
    } else {
      const gain = change > 0 ? change : 0;
      const loss = change < 0 ? -change : 0;
      gains = (gains * (period - 1) + gain) / period;
      losses = (losses * (period - 1) + loss) / period;
      const rs = losses === 0 ? 100 : gains / losses;
      result.push({ time: data[i].time, value: 100 - 100 / (1 + rs) });
    }
  }
  return result;
};

const calculateMACD = (data: any[]) => {
  const closes = data.map((d) => d.close);
  const emaArray = (prices: number[], period: number) => {
    if (!prices.length) return [];
    const k = 2 / (period + 1);
    const result = [prices[0]];
    for (let i = 1; i < prices.length; i++) {
      result.push((prices[i] - result[i - 1]) * k + result[i - 1]);
    }
    return result;
  };
  const ema12 = emaArray(closes, 12);
  const ema26 = emaArray(closes, 26);
  const macdLine = ema12.map((v, i) => v - (ema26[i] || 0));
  const signalLine = emaArray(macdLine, 9);
  return data.map((d, i) => {
    const hist = macdLine[i] - (signalLine[i] || 0);
    return {
      time: d.time,
      macd: macdLine[i],
      signal: signalLine[i],
      histogram: hist,
      color: hist >= 0 ? "#26a69a" : "#ef5350",
    };
  });
};

export function ChartComponent(props: {
  data: any[];
  symbol?: string;
  indicators?: string[];
  colors?: { backgroundColor?: string; textColor?: string };
  chartType?: "candles" | "line" | "area";
  showGrid?: boolean;
}) {
  const { data, symbol = "TADAWUL", indicators = [], chartType = "candles", showGrid = true } = props;

  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<any>(null);
  const seriesRef = useRef<any>({});
  
  const rsiLegendRef = useRef<HTMLDivElement>(null);
  const macdLegendRef = useRef<HTMLDivElement>(null);

  const lastCrosshairRef = useRef<{ time: any; value: number; originalPoint: any } | null>(null);
  const drawingPointsRef = useRef<{ time: any; value: number }[]>([]);
  const previewSeriesGroupRef = useRef<any[]>([]);
  const drawnItemsRef = useRef<DrawnItem[]>([]);
  
  const [magnetMode, setMagnetMode] = useState(true);
  const [activeTool, setActiveToolState] = useState<DrawingTool>("none");
  const activeToolRef = useRef<DrawingTool>("none");
  const [drawCount, setDrawCount] = useState(0);

  const setActiveTool = useCallback((tool: DrawingTool) => {
    setActiveToolState(tool);
    activeToolRef.current = tool;
    drawingPointsRef.current = [];
    previewSeriesGroupRef.current.forEach(s => { try { chartRef.current?.removeSeries(s); } catch {} });
    previewSeriesGroupRef.current = [];
  }, []);

  const saveDrawings = useCallback(async () => {
    if (typeof window === "undefined") return;
    const toSave = drawnItemsRef.current.map(item => ({ type: item.type, points: item.points }));
    localStorage.setItem(`drawings_${props.symbol || "default"}`, JSON.stringify(toSave));
    
    try {
      await fetch(`/api/charts/${props.symbol}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ drawingsData: toSave })
      });
    } catch (e) {
      console.error("Failed to save to DB", e);
    }
  }, [props.symbol]);

  const undoLastDrawing = useCallback(() => {
    if (drawnItemsRef.current.length === 0 || !chartRef.current) return;
    const last = drawnItemsRef.current.pop();
    last?.series.forEach(s => { try { chartRef.current?.removeSeries(s); } catch {} });
    setDrawCount(drawnItemsRef.current.length);
    saveDrawings();
  }, [saveDrawings]);

  const getMagnetPoint = (time: any, price: number) => {
    if (!magnetMode) return { time, value: price };
    const candle = data.find(d => d.time === time);
    if (!candle) return { time, value: price };
    const ohlc = [candle.open, candle.high, candle.low, candle.close];
    const nearest = ohlc.reduce((prev, curr) => Math.abs(curr - price) < Math.abs(prev - price) ? curr : prev);
    return { time, value: nearest };
  };

  const interpolateLine = (p1: { time: string; value: number }, p2: { time: string; value: number }, allTimes: string[]) => {
    const t1Idx = allTimes.indexOf(String(p1.time));
    const t2Idx = allTimes.indexOf(String(p2.time));
    if (t1Idx === -1 || t2Idx === -1) return [p1, p2];
    const startIdx = Math.min(t1Idx, t2Idx);
    const endIdx = Math.max(t1Idx, t2Idx);
    const steps = endIdx - startIdx;
    if (steps < 1) return [p1];
    const startVal = t1Idx < t2Idx ? p1.value : p2.value;
    const endVal = t1Idx < t2Idx ? p2.value : p1.value;
    const points = [];
    for (let i = 0; i <= steps; i++) {
      points.push({ time: allTimes[startIdx + i], value: startVal + ((endVal - startVal) * i) / steps });
    }
    return points;
  };

  useEffect(() => {
    if (!chartContainerRef.current || !data || data.length === 0) return;

    const container = chartContainerRef.current;
    const tvBackground = "#131722";
    const tvGrid = "#242832";
    const tvText = "#d1d4dc";
    const tvBlue = "#2962FF";

    const chart = createChart(container, {
      width: container.clientWidth,
      height: container.clientHeight || 650,
      layout: {
        background: { type: ColorType.Solid, color: tvBackground },
        textColor: tvText,
        fontFamily: "var(--font-cairo), sans-serif",
        panes: {
          separatorColor: "#2a2e39",
          separatorHoverColor: tvBlue,
          enableResize: true,
        },
      },
      grid: {
        vertLines: { color: showGrid ? tvGrid : "transparent" },
        horzLines: { color: showGrid ? tvGrid : "transparent" },
      },
      crosshair: {
        mode: 0,
        vertLine: { color: "#758696", width: 1, style: 3, labelBackgroundColor: tvBlue },
        horzLine: { color: "#758696", width: 1, style: 3, labelBackgroundColor: tvBlue },
      },
      rightPriceScale: {
        visible: true,
        borderColor: "#2a2e39",
        scaleMargins: { top: 0.08, bottom: 0.18 },
      },
      timeScale: {
        borderColor: "#2a2e39",
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 12,
        barSpacing: 7,
      },
      localization: { locale: "ar-SA" },
    });

    chartRef.current = chart;
    let isDisposed = false;

    /** Pane 0: Main Series (Candles, Line, or Area) */
    let mainSeries;
    if (chartType === "line") {
      mainSeries = chart.addSeries(LineSeries, {
        color: "#2962FF",
        lineWidth: 2,
        lastValueVisible: true,
      }, 0);
    } else if (chartType === "area") {
      mainSeries = chart.addSeries(AreaSeries, {
        topColor: "rgba(41, 98, 255, 0.3)",
        bottomColor: "rgba(41, 98, 255, 0.0)",
        lineColor: "#2962FF",
        lineWidth: 2,
        lastValueVisible: true,
      }, 0);
    } else {
      mainSeries = chart.addSeries(CandlestickSeries, {
        upColor: "#26a69a", downColor: "#ef5350", borderUpColor: "#26a69a", borderDownColor: "#ef5350",
        wickUpColor: "#26a69a", wickDownColor: "#ef5350", borderVisible: true, lastValueVisible: true,
      }, 0);
    }
    candlestickSeriesRef.current = mainSeries;
    seriesRef.current.candlestick = mainSeries;
    mainSeries.setData(data);

    /** Volume integration inside Pane 0 (Overlay at bottom) */
    const hasVolume = data.some(d => typeof d.volume === "number");
    if (hasVolume) {
      const volumeSeries = chart.addSeries(HistogramSeries, {
        priceFormat: { type: "volume" }, priceScaleId: "", lastValueVisible: false, priceLineVisible: false,
      }, 0);
      volumeSeries.setData(data.map(d => ({
        time: d.time,
        value: d.volume,
        color: d.close >= d.open ? "rgba(38, 166, 154, 0.35)" : "rgba(239, 83, 80, 0.35)",
      })));
      volumeSeries.priceScale().applyOptions({ scaleMargins: { top: 0.78, bottom: 0 } });
    }

    /** Main Chart Overlays (SMA, EMA, BB) */
    if (indicators.includes("SMA")) {
      const sma = chart.addSeries(LineSeries, { color: "#3b82f6", lineWidth: 2, title: "SMA 20", crosshairMarkerVisible: false, lastValueVisible: false }, 0);
      sma.setData(calculateSMA(data, 20));
      seriesRef.current.sma = sma;
    }
    if (indicators.includes("EMA")) {
      const ema = chart.addSeries(LineSeries, { color: "#f59e0b", lineWidth: 2, title: "EMA 20", crosshairMarkerVisible: false, lastValueVisible: false }, 0);
      ema.setData(calculateEMA(data, 20));
      seriesRef.current.ema = ema;
    }
    if (indicators.includes("BB")) {
      const period = 20;
      const upperData = [];
      const lowerData = [];
      for (let i = period - 1; i < data.length; i++) {
        let sum = 0;
        for (let j = 0; j < period; j++) sum += data[i - j].close;
        const avg = sum / period;
        let variance = 0;
        for (let j = 0; j < period; j++) variance += Math.pow(data[i - j].close - avg, 2);
        const stdDev = Math.sqrt(variance / period);
        upperData.push({ time: data[i].time, value: avg + 2 * stdDev });
        lowerData.push({ time: data[i].time, value: avg - 2 * stdDev });
      }
      const bbUpper = chart.addSeries(LineSeries, { color: "#ec4899", lineWidth: 1, lineStyle: 2, title: "BB Upper", crosshairMarkerVisible: false, lastValueVisible: false }, 0);
      const bbLower = chart.addSeries(LineSeries, { color: "#ec4899", lineWidth: 1, lineStyle: 2, title: "BB Lower", crosshairMarkerVisible: false, lastValueVisible: false }, 0);
      bbUpper.setData(upperData);
      bbLower.setData(lowerData);
      seriesRef.current.bbUpper = bbUpper;
      seriesRef.current.bbLower = bbLower;
    }

    /** Pane Management (RSI, MACD) */
    let nextPaneIndex = 1;

    if (indicators.includes("RSI")) {
      const rsiPaneIndex = nextPaneIndex++;
      const rsiSeries = chart.addSeries(LineSeries, {
        color: "#7e57c2", lineWidth: 2, title: "RSI 14", lastValueVisible: true, crosshairMarkerVisible: false,
      }, rsiPaneIndex);
      const rsiData = calculateRSI(data, 14);
      rsiSeries.setData(rsiData);
      seriesRef.current.rsi = rsiSeries;
      rsiSeries.createPriceLine({ price: 70, color: "rgba(239, 83, 80, 0.7)", lineWidth: 1, lineStyle: 2, axisLabelVisible: true, title: "70" });
      rsiSeries.createPriceLine({ price: 30, color: "rgba(38, 166, 154, 0.7)", lineWidth: 1, lineStyle: 2, axisLabelVisible: true, title: "30" });
      if (rsiLegendRef.current && rsiData.length > 0) {
        rsiLegendRef.current.innerText = `RSI(14): ${rsiData[rsiData.length - 1].value.toFixed(2)}`;
      }
    }

    if (indicators.includes("MACD")) {
      const macdPaneIndex = nextPaneIndex++;
      const macdData = calculateMACD(data);
      const macdHist = chart.addSeries(HistogramSeries, { title: "Histogram", lastValueVisible: false, priceLineVisible: false }, macdPaneIndex);
      const macdLine = chart.addSeries(LineSeries, { color: "#2962FF", lineWidth: 2, title: "MACD", crosshairMarkerVisible: false }, macdPaneIndex);
      const macdSignal = chart.addSeries(LineSeries, { color: "#FF6D00", lineWidth: 2, title: "Signal", crosshairMarkerVisible: false }, macdPaneIndex);
      macdHist.setData(macdData.map(d => ({ time: d.time, value: d.histogram, color: d.color })));
      macdLine.setData(macdData.map(d => ({ time: d.time, value: d.macd })));
      macdSignal.setData(macdData.map(d => ({ time: d.time, value: d.signal })));
      seriesRef.current.macdHist = macdHist;
      seriesRef.current.macdLine = macdLine;
      seriesRef.current.macdSignal = macdSignal;
      if (macdLegendRef.current && macdData.length > 0) {
        const last = macdData[macdData.length - 1];
        macdLegendRef.current.innerText = `MACD(12,26,9): ${last.macd.toFixed(3)}, ${last.signal.toFixed(3)}`;
      }
    }

    /** Set Pane Heights Proportionality */
    requestAnimationFrame(() => {
      if (isDisposed) return;
      try {
        const panes = chart.panes();
        const h = container.clientHeight || 650;
        if (panes.length === 1) panes[0]?.setHeight(h);
        else if (panes.length === 2) {
          panes[0]?.setHeight(Math.floor(h * 0.72));
          panes[1]?.setHeight(Math.floor(h * 0.28));
        } else if (panes.length >= 3) {
          panes[0]?.setHeight(Math.floor(h * 0.58));
          panes[1]?.setHeight(Math.floor(h * 0.21));
          panes[2]?.setHeight(Math.floor(h * 0.21));
        }
        chart.timeScale().fitContent();
      } catch (e) {
        // Ignore disposed errors
      }
    });

    /** Drawing Tools Integration */
    const onChartClick = () => {
      const tool = activeToolRef.current;
      if (tool === "none" || !lastCrosshairRef.current) return;
      const point = getMagnetPoint(lastCrosshairRef.current.time, lastCrosshairRef.current.value);
      if (drawingPointsRef.current.length === 0) {
        drawingPointsRef.current = [point];
        const color = tool === "rect" ? "rgba(99, 102, 241, 0.4)" : "#eab308";
        const s = chart.addSeries(tool === "rect" ? AreaSeries : LineSeries, {
          color, lineWidth: 2, crosshairMarkerVisible: false, lastValueVisible: false, priceLineVisible: false,
          ...(tool === "rect" ? { topColor: "rgba(99, 102, 241, 0.20)", bottomColor: "rgba(99, 102, 241, 0.05)", lineVisible: true } : {}),
        }, 0);
        previewSeriesGroupRef.current = [s];
      } else {
        const startPoint = drawingPointsRef.current[0];
        const endPoint = point;
        const allTimes = data.map(d => d.time);
        if (tool === "fib") {
          previewSeriesGroupRef.current.forEach(s => { try { chart.removeSeries(s); } catch {} });
          const high = Math.max(startPoint.value, endPoint.value);
          const low = Math.min(startPoint.value, endPoint.value);
          const diff = high - low;
          const fibLevels = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];
          const fibColors = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#8b5cf6", "#ef4444"];
          const fibSeriesGroup: any[] = [];
          fibLevels.forEach((level, idx) => {
            const fibPrice = high - diff * level;
            const line = chart.addSeries(LineSeries, { color: fibColors[idx], lineWidth: 1, lineStyle: 2, title: `${(level * 100).toFixed(1)}%`, lastValueVisible: true, priceLineVisible: false, crosshairMarkerVisible: false }, 0);
            line.setData([{ time: allTimes[0], value: fibPrice }, { time: allTimes[allTimes.length - 1], value: fibPrice }]);
            fibSeriesGroup.push(line);
          });
          drawnItemsRef.current.push({ type: "fib", points: [startPoint, endPoint], series: fibSeriesGroup });
        } else {
          drawnItemsRef.current.push({ type: tool, points: [startPoint, endPoint], series: [...previewSeriesGroupRef.current] });
        }
        setDrawCount(drawnItemsRef.current.length);
        saveDrawings();
        drawingPointsRef.current = [];
        previewSeriesGroupRef.current = [];
        setActiveTool("none");
      }
    };

    let updateLock = false;
    chart.subscribeCrosshairMove((param: any) => {
      if (updateLock) return;
      if (!param.point || !param.time) { lastCrosshairRef.current = null; return; }
      const price = mainSeries.coordinateToPrice(param.point.y);
      if (price === null) return;
      lastCrosshairRef.current = { time: param.time, value: price, originalPoint: param.point };

      if (drawingPointsRef.current.length === 1 && previewSeriesGroupRef.current.length > 0) {
        updateLock = true;
        try {
          const tool = activeToolRef.current;
          const start = drawingPointsRef.current[0];
          const end = getMagnetPoint(param.time, price);
          const allTimes = data.map(d => d.time);
          if (tool === "trendline" || tool === "arrow" || tool === "fib") {
            previewSeriesGroupRef.current[0].setData(interpolateLine(start, end, allTimes));
          }
          if (tool === "hline") {
            previewSeriesGroupRef.current[0].setData([{ time: allTimes[0], value: start.value }, { time: allTimes[allTimes.length - 1], value: start.value }]);
          }
          if (tool === "vline") {
            const minP = Math.min(...data.map(d => d.low)) * 0.95;
            const maxP = Math.max(...data.map(d => d.high)) * 1.05;
            previewSeriesGroupRef.current[0].setData([{ time: start.time, value: minP }, { time: start.time, value: maxP }]);
          }
          if (tool === "ray" || tool === "extended") {
            const t1 = allTimes.indexOf(String(start.time));
            const t2 = allTimes.indexOf(String(end.time));
            if (t1 !== -1 && t2 !== -1 && t1 !== t2) {
              const slope = (end.value - start.value) / (t2 - t1);
              if (tool === "ray") {
                previewSeriesGroupRef.current[0].setData([{ time: start.time, value: start.value }, { time: allTimes[allTimes.length - 1], value: start.value + slope * (allTimes.length - 1 - t1) }]);
              } else {
                previewSeriesGroupRef.current[0].setData([{ time: allTimes[0], value: start.value + slope * (0 - t1) }, { time: allTimes[allTimes.length - 1], value: start.value + slope * (allTimes.length - 1 - t1) }]);
              }
            }
          }
          if (tool === "rect") {
            const top = Math.max(start.value, end.value);
            const t0 = String(start.time);
            const t1 = String(end.time);
            const range = [t0, t1].sort();
            const rectData = allTimes.filter(t => String(t) >= range[0] && String(t) <= range[1]).map(t => ({ time: t, value: top }));
            previewSeriesGroupRef.current[0].setData(rectData);
          }
        } finally { updateLock = false; }
      }
    });

    container.addEventListener("click", onChartClick);

    /**
     * ROBUST RESIZE OBSERVER
     * Ensures the canvas always fills the container perfectly, even during transitions.
     */
    const resizeObserver = new ResizeObserver(() => {
      if (isDisposed || !container || !chart) return;
      const w = container.clientWidth;
      const h = container.clientHeight || 650;
      
      try {
        chart.applyOptions({ width: w, height: h });
      } catch (e) {
        return;
      }
      
      requestAnimationFrame(() => {
        if (isDisposed) return;
        try {
          const panes = chart.panes() || [];
          if (panes.length === 1) panes[0]?.setHeight(h);
          else if (panes.length === 2) {
            panes[0]?.setHeight(Math.floor(h * 0.72));
            panes[1]?.setHeight(Math.floor(h * 0.28));
          } else if (panes.length >= 3) {
            panes[0]?.setHeight(Math.floor(h * 0.58));
            panes[1]?.setHeight(Math.floor(h * 0.21));
            panes[2]?.setHeight(Math.floor(h * 0.21));
          }
        } catch (e) {}
      });
    });

    resizeObserver.observe(container);

    const loadDrawings = async () => {
      try {
        const res = await fetch(`/api/charts/${symbol}`);
        if (!res.ok || isDisposed) return;
        const result = await res.json();
        if (isDisposed) return;
        let savedDrawings = result.drawingsData;
        
        if (!savedDrawings) {
          const local = localStorage.getItem(`drawings_${symbol || "default"}`);
          if (local) savedDrawings = JSON.parse(local);
        }

        if (savedDrawings && Array.isArray(savedDrawings) && savedDrawings.length > 0) {
          const allTimes = data.map(d => d.time);
          savedDrawings.forEach(item => {
            if (!item.points || item.points.length < 2) return;
            const start = item.points[0];
            const end = item.points[1];
            const tool = item.type;
            
            if (tool === "fib") {
              const high = Math.max(start.value, end.value);
              const low = Math.min(start.value, end.value);
              const diff = high - low;
              const fibLevels = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];
              const fibColors = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#8b5cf6", "#ef4444"];
              const fibSeriesGroup: any[] = [];
              fibLevels.forEach((level, idx) => {
                const fibPrice = high - diff * level;
                const line = chart.addSeries(LineSeries, { color: fibColors[idx], lineWidth: 1, lineStyle: 2, title: `${(level * 100).toFixed(1)}%`, lastValueVisible: true, priceLineVisible: false, crosshairMarkerVisible: false }, 0);
                line.setData([{ time: allTimes[0], value: fibPrice }, { time: allTimes[allTimes.length - 1], value: fibPrice }]);
                fibSeriesGroup.push(line);
              });
              drawnItemsRef.current.push({ type: "fib", points: [start, end], series: fibSeriesGroup });
            } else {
              const color = tool === "rect" ? "rgba(99, 102, 241, 0.4)" : "#eab308";
              const s = chart.addSeries(tool === "rect" ? AreaSeries : LineSeries, {
                color, lineWidth: 2, crosshairMarkerVisible: false, lastValueVisible: false, priceLineVisible: false,
                ...(tool === "rect" ? { topColor: "rgba(99, 102, 241, 0.20)", bottomColor: "rgba(99, 102, 241, 0.05)", lineVisible: true } : {}),
              }, 0);
              
              if (tool === "trendline" || tool === "arrow") {
                s.setData(interpolateLine(start, end, allTimes));
              } else if (tool === "hline") {
                s.setData([{ time: allTimes[0], value: start.value }, { time: allTimes[allTimes.length - 1], value: start.value }]);
              } else if (tool === "vline") {
                const minP = Math.min(...data.map(d => d.low)) * 0.95;
                const maxP = Math.max(...data.map(d => d.high)) * 1.05;
                s.setData([{ time: start.time, value: minP }, { time: start.time, value: maxP }]);
              } else if (tool === "ray" || tool === "extended") {
                const t1 = allTimes.indexOf(String(start.time));
                const t2 = allTimes.indexOf(String(end.time));
                if (t1 !== -1 && t2 !== -1 && t1 !== t2) {
                  const slope = (end.value - start.value) / (t2 - t1);
                  if (tool === "ray") {
                    s.setData([{ time: start.time, value: start.value }, { time: allTimes[allTimes.length - 1], value: start.value + slope * (allTimes.length - 1 - t1) }]);
                  } else {
                    s.setData([{ time: allTimes[0], value: start.value + slope * (0 - t1) }, { time: allTimes[allTimes.length - 1], value: start.value + slope * (allTimes.length - 1 - t1) }]);
                  }
                }
              } else if (tool === "rect") {
                const top = Math.max(start.value, end.value);
                const t0 = String(start.time);
                const t1 = String(end.time);
                const range = [t0, t1].sort();
                const rectData = allTimes.filter(t => String(t) >= range[0] && String(t) <= range[1]).map(t => ({ time: t, value: top }));
                s.setData(rectData);
              }
              drawnItemsRef.current.push({ type: tool, points: [start, end], series: [s] });
            }
          });
          setDrawCount(drawnItemsRef.current.length);
        }
      } catch (e) {
        console.error("Failed to load drawings", e);
      }
    };
    
    loadDrawings();

    return () => {
      isDisposed = true;
      resizeObserver.disconnect();
      container.removeEventListener("click", onChartClick);
      try { chart.remove(); } catch {}
      chartRef.current = null;
      candlestickSeriesRef.current = null;
      seriesRef.current = {};
    };
  }, [data, indicators, chartType, showGrid]);

  const tools: { id: DrawingTool; icon: React.ReactNode; label: string }[] = [
    { id: "none", icon: <MousePointer2 className="h-4 w-4" />, label: "مؤشر" },
    { id: "trendline", icon: <TrendingUp className="h-4 w-4" />, label: "خط اتجاه" },
    { id: "arrow", icon: <ArrowDownToLine className="h-4 w-4 rotate-45" />, label: "سهم" },
    { id: "ray", icon: <Minus className="h-4 w-4" />, label: "شعاع" },
    { id: "extended", icon: <TrendingUp className="h-4 w-4" />, label: "خط ممتد" },
    { id: "hline", icon: <Minus className="h-4 w-4" />, label: "خط أفقي" },
    { id: "vline", icon: <ArrowDownToLine className="h-4 w-4" />, label: "خط عمودي" },
    { id: "fib", icon: <Triangle className="h-4 w-4" />, label: "فيبوناتشي" },
    { id: "rect", icon: <Square className="h-4 w-4" />, label: "منطقة" },
  ];

  return (
    <div className="w-full h-full flex gap-1" dir="ltr">
      <div className="w-11 shrink-0 flex flex-col gap-1 bg-[#131722] border-r border-[#242832] p-1.5 shadow-xl h-full">
        {tools.map((tool) => (
          <button
            key={tool.id}
            onClick={() => setActiveTool(tool.id)}
            className={`p-2 rounded-md flex items-center justify-center transition-all ${
              activeTool === tool.id ? "bg-[#2962FF] text-white shadow-lg" : "text-[#d1d4dc] hover:bg-[#2a2e39]"
            }`}
            title={tool.label}
          >
            {tool.icon}
          </button>
        ))}
        <div className="w-full h-px bg-[#242832] my-1"></div>
        <button
          onClick={() => setMagnetMode(!magnetMode)}
          className={`p-2 rounded-md flex items-center justify-center transition-all ${
            magnetMode ? "bg-[#2962FF]/20 text-[#2962FF]" : "text-[#d1d4dc] hover:bg-[#2a2e39]"
          }`}
          title="وضع المغناطيس"
        >
          <Magnet className="h-4 w-4" />
        </button>
        <button onClick={undoLastDrawing} className="p-2 rounded-md text-[#d1d4dc] hover:bg-[#2a2e39]" title="تراجع"><RotateCcw className="h-4 w-4" /></button>
        <button 
          onClick={() => { if (confirm("حذف الكل؟")) { drawnItemsRef.current.forEach(i => i.series.forEach(s => chartRef.current?.removeSeries(s))); drawnItemsRef.current = []; setDrawCount(0); saveDrawings(); } }} 
          className="p-2 rounded-md text-[#d1d4dc] hover:bg-destructive/10 hover:text-destructive mt-auto" 
          title="حذف الكل"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 flex flex-col relative bg-[#131722] border border-[#242832] rounded-lg overflow-hidden h-full">
        {activeTool !== "none" && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 z-50 bg-[#1e222d]/90 backdrop-blur border border-[#2962FF]/30 px-4 py-1.5 rounded-full text-[11px] font-bold shadow-2xl flex items-center gap-3">
            <span className="flex h-2 w-2 rounded-full bg-[#2962FF] animate-pulse"></span>
            <span className="text-[#d1d4dc]">وضع {tools.find(t => t.id === activeTool)?.label}</span>
            <button onClick={() => setActiveTool("none")} className="text-[#2962FF] hover:underline">إلغاء</button>
          </div>
        )}
        <div className="flex flex-col flex-1 bg-[#131722] h-full">
          <div className="relative group flex-1 h-full">
            <div ref={chartContainerRef} className="w-full h-full cursor-crosshair" />
            <div className="absolute top-2 left-2 pointer-events-none text-[11px] font-bold text-[#d1d4dc]/60 bg-[#131722]/60 px-1 rounded">
              {symbol} · {STOCK_MAP[symbol]?.nameAr}
            </div>
            
            <div
              ref={rsiLegendRef}
              className="absolute left-2 pointer-events-none text-[10px] font-bold text-[#7e57c2] bg-[#131722]/70 px-1 rounded shadow-sm"
              style={{
                top: indicators.includes("RSI") && indicators.includes("MACD") ? "59%" : "72%",
                display: indicators.includes("RSI") ? "block" : "none",
              }}
            />

            <div
              ref={macdLegendRef}
              className="absolute left-2 pointer-events-none text-[10px] font-bold text-[#d1d4dc]/80 bg-[#131722]/70 px-1 rounded shadow-sm"
              style={{
                top: indicators.includes("RSI") ? "80%" : "72%",
                display: indicators.includes("MACD") ? "block" : "none",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
