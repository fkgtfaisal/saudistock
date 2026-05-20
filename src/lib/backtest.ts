/**
 * Backtesting & Technical Indicators Engine for Saudi Stocks
 */

export interface ChartBar {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface Trade {
  type: "BUY" | "SELL";
  date: string;
  price: number;
  shares: number;
  capitalBefore: number;
  capitalAfter: number;
  profitPercent?: number;
  profitSAR?: number;
  holdingDays?: number;
}

export interface BacktestResult {
  symbol: string;
  strategy: string;
  initialCapital: number;
  finalCapital: number;
  totalReturnPercent: number;
  totalReturnSAR: number;
  buyAndHoldReturnPercent: number;
  buyAndHoldReturnSAR: number;
  winRate: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  equityCurve: Array<{ time: string; capital: number; buyAndHoldCapital: number }>;
  trades: Trade[];
}

/**
 * Calculate Simple Moving Average (SMA)
 */
export function calculateSMA(data: number[], period: number): number[] {
  const sma: number[] = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      sma.push(NaN);
    } else {
      let sum = 0;
      for (let j = 0; j < period; j++) {
        sum += data[i - j];
      }
      sma.push(sum / period);
    }
  }
  return sma;
}

/**
 * Calculate Exponential Moving Average (EMA)
 */
export function calculateEMA(data: number[], period: number): number[] {
  const ema: number[] = [];
  if (data.length === 0) return ema;

  const k = 2 / (period + 1);
  let prevEma = data[0];
  ema.push(prevEma);

  for (let i = 1; i < data.length; i++) {
    const currentEma = data[i] * k + prevEma * (1 - k);
    ema.push(currentEma);
    prevEma = currentEma;
  }

  // Nullify initial values before period is reached for consistency
  for (let i = 0; i < period - 1; i++) {
    if (i < ema.length) {
      ema[i] = NaN;
    }
  }

  return ema;
}

/**
 * Calculate Relative Strength Index (RSI)
 */
export function calculateRSI(closes: number[], period: number = 14): number[] {
  const rsi: number[] = new Array(closes.length).fill(NaN);
  if (closes.length <= period) return rsi;

  let gains = 0;
  let losses = 0;

  // First RSI value calculations
  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff > 0) {
      gains += diff;
    } else {
      losses -= diff;
    }
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  let rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  rsi[period] = avgLoss === 0 ? 100 : 100 - 100 / (1 + rs);

  // Subsequent RSI calculations using Wilder's smoothing technique
  for (let i = period + 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    let currentGain = diff > 0 ? diff : 0;
    let currentLoss = diff < 0 ? -diff : 0;

    avgGain = (avgGain * (period - 1) + currentGain) / period;
    avgLoss = (avgLoss * (period - 1) + currentLoss) / period;

    rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    rsi[i] = avgLoss === 0 ? 100 : 100 - 100 / (1 + rs);
  }

  return rsi;
}

/**
 * Main Backtester Engine
 */
export function runBacktest(
  symbol: string,
  history: ChartBar[],
  strategy: "EMA_CROSS" | "RSI" | "MACD",
  initialCapital: number = 100000
): BacktestResult {
  if (history.length < 30) {
    throw new Error("بيانات السهم التاريخية غير كافية لإجراء المحاكاة (يجب أن لا تقل عن 30 يوماً).");
  }

  const closes = history.map((h) => h.close);
  const dates = history.map((h) => h.time);

  let signals: Array<"BUY" | "SELL" | "HOLD"> = new Array(history.length).fill("HOLD");

  // Calculate Technical Indicators based on strategy
  if (strategy === "EMA_CROSS") {
    const emaFast = calculateEMA(closes, 9);  // 9-day EMA
    const emaSlow = calculateEMA(closes, 21); // 21-day EMA

    for (let i = 1; i < history.length; i++) {
      if (isNaN(emaFast[i - 1]) || isNaN(emaSlow[i - 1]) || isNaN(emaFast[i]) || isNaN(emaSlow[i])) continue;

      // Golden Cross (Buy): Fast EMA crosses above Slow EMA
      if (emaFast[i - 1] <= emaSlow[i - 1] && emaFast[i] > emaSlow[i]) {
        signals[i] = "BUY";
      }
      // Death Cross (Sell): Fast EMA crosses below Slow EMA
      else if (emaFast[i - 1] >= emaSlow[i - 1] && emaFast[i] < emaSlow[i]) {
        signals[i] = "SELL";
      }
    }
  } else if (strategy === "RSI") {
    const rsi = calculateRSI(closes, 14);

    for (let i = 1; i < history.length; i++) {
      if (isNaN(rsi[i - 1]) || isNaN(rsi[i])) continue;

      // Buy when RSI crosses above 30 from below (oversold bounce)
      if (rsi[i - 1] < 30 && rsi[i] >= 30) {
        signals[i] = "BUY";
      }
      // Sell when RSI crosses below 70 from above (overbought reversal)
      else if (rsi[i - 1] > 70 && rsi[i] <= 70) {
        signals[i] = "SELL";
      }
    }
  } else {
    // Default MACD MACD(12, 26, 9) strategy simulation
    const ema12 = calculateEMA(closes, 12);
    const ema26 = calculateEMA(closes, 26);
    const macdLine = ema12.map((val, idx) => val - ema26[idx]);
    const signalLine = calculateEMA(macdLine.filter(val => !isNaN(val)), 9);
    
    // Align signal line array back to match closing prices
    const fullSignalLine: number[] = new Array(closes.length).fill(NaN);
    const diffOffset = closes.length - signalLine.length;
    for (let i = 0; i < signalLine.length; i++) {
      fullSignalLine[i + diffOffset] = signalLine[i];
    }

    for (let i = 1; i < history.length; i++) {
      if (isNaN(macdLine[i - 1]) || isNaN(fullSignalLine[i - 1]) || isNaN(macdLine[i]) || isNaN(fullSignalLine[i])) continue;

      // Buy when MACD crosses above signal line
      if (macdLine[i - 1] <= fullSignalLine[i - 1] && macdLine[i] > fullSignalLine[i]) {
        signals[i] = "BUY";
      }
      // Sell when MACD crosses below signal line
      else if (macdLine[i - 1] >= fullSignalLine[i - 1] && macdLine[i] < fullSignalLine[i]) {
        signals[i] = "SELL";
      }
    }
  }

  // Simulation parameters
  let capital = initialCapital;
  let position = 0; // Number of shares held
  let buyPrice = 0;
  let buyDate = "";
  const tradesList: Trade[] = [];
  const equityCurve: Array<{ time: string; capital: number; buyAndHoldCapital: number }> = [];

  const initialPrice = history[0].close;
  const initialSharesBuyAndHold = initialCapital / initialPrice;

  for (let i = 0; i < history.length; i++) {
    const currentBar = history[i];
    const todayPrice = currentBar.close;
    const signal = signals[i];

    if (signal === "BUY" && position === 0) {
      // Execute BUY (using closing price for simplicity)
      position = capital / todayPrice;
      buyPrice = todayPrice;
      buyDate = currentBar.time;
      tradesList.push({
        type: "BUY",
        date: currentBar.time,
        price: todayPrice,
        shares: position,
        capitalBefore: capital,
        capitalAfter: capital, // Capital remains tied in shares
      });
    } else if (signal === "SELL" && position > 0) {
      // Execute SELL
      const revenue = position * todayPrice;
      const profitPercent = ((todayPrice - buyPrice) / buyPrice) * 100;
      const profitSAR = revenue - (position * buyPrice);
      
      const holdingDays = Math.round(
        (new Date(currentBar.time).getTime() - new Date(buyDate).getTime()) / (1000 * 60 * 60 * 24)
      );

      const oldCapital = capital;
      capital = revenue;
      position = 0;

      tradesList.push({
        type: "SELL",
        date: currentBar.time,
        price: todayPrice,
        shares: position,
        capitalBefore: oldCapital,
        capitalAfter: capital,
        profitPercent: parseFloat(profitPercent.toFixed(2)),
        profitSAR: parseFloat(profitSAR.toFixed(2)),
        holdingDays,
      });
    }

    // Record current day equity
    const currentEquity = position > 0 ? position * todayPrice : capital;
    const currentBuyAndHoldEquity = initialSharesBuyAndHold * todayPrice;

    equityCurve.push({
      time: currentBar.time,
      capital: parseFloat(currentEquity.toFixed(2)),
      buyAndHoldCapital: parseFloat(currentBuyAndHoldEquity.toFixed(2)),
    });
  }

  // Force close any open position at the final bar to compute final stats
  let finalCapital = capital;
  if (position > 0) {
    const finalBar = history[history.length - 1];
    const finalPrice = finalBar.close;
    const revenue = position * finalPrice;
    const profitPercent = ((finalPrice - buyPrice) / buyPrice) * 100;
    const profitSAR = revenue - (position * buyPrice);
    const holdingDays = Math.round(
      (new Date(finalBar.time).getTime() - new Date(buyDate).getTime()) / (1000 * 60 * 60 * 24)
    );

    tradesList.push({
      type: "SELL",
      date: finalBar.time,
      price: finalPrice,
      shares: 0,
      capitalBefore: capital,
      capitalAfter: revenue,
      profitPercent: parseFloat(profitPercent.toFixed(2)),
      profitSAR: parseFloat(profitSAR.toFixed(2)),
      holdingDays,
    });
    finalCapital = revenue;
  }

  // Compute stats
  const totalReturnSAR = finalCapital - initialCapital;
  const totalReturnPercent = (totalReturnSAR / initialCapital) * 100;

  const finalBuyAndHoldCapital = initialSharesBuyAndHold * history[history.length - 1].close;
  const buyAndHoldReturnSAR = finalBuyAndHoldCapital - initialCapital;
  const buyAndHoldReturnPercent = (buyAndHoldReturnSAR / initialCapital) * 100;

  const sellTrades = tradesList.filter((t) => t.type === "SELL");
  const totalTrades = sellTrades.length;
  const winningTrades = sellTrades.filter((t) => (t.profitPercent ?? 0) > 0).length;
  const losingTrades = totalTrades - winningTrades;
  const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;

  // Compile final results
  return {
    symbol,
    strategy,
    initialCapital,
    finalCapital: parseFloat(finalCapital.toFixed(2)),
    totalReturnPercent: parseFloat(totalReturnPercent.toFixed(2)),
    totalReturnSAR: parseFloat(totalReturnSAR.toFixed(2)),
    buyAndHoldReturnPercent: parseFloat(buyAndHoldReturnPercent.toFixed(2)),
    buyAndHoldReturnSAR: parseFloat(buyAndHoldReturnSAR.toFixed(2)),
    winRate: parseFloat(winRate.toFixed(2)),
    totalTrades,
    winningTrades,
    losingTrades,
    equityCurve,
    trades: tradesList,
  };
}
