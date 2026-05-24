"use client";

import { useState, useEffect } from "react";
import { Calculator, AlertTriangle, TrendingUp, TrendingDown, Target } from "lucide-react";

type RiskCalculatorProps = {
  currentPrice: number | null;
  availableCash: number;
  onApplyQuantity: (qty: number) => void;
};

export function RiskCalculator({ currentPrice, availableCash, onApplyQuantity }: RiskCalculatorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [riskPercent, setRiskPercent] = useState<number>(2);
  const [stopLoss, setStopLoss] = useState<number>(currentPrice ? currentPrice * 0.95 : 0); // Default 5% below
  const [takeProfit, setTakeProfit] = useState<number>(currentPrice ? currentPrice * 1.10 : 0); // Default 10% above

  const [calcQty, setCalcQty] = useState(0);
  const [riskAmount, setRiskAmount] = useState(0);

  useEffect(() => {
    if (currentPrice && currentPrice > 0 && stopLoss > 0 && stopLoss < currentPrice && availableCash > 0) {
      // Risk Amount = Total Cash * (Risk% / 100)
      const allowedRiskAmount = availableCash * (riskPercent / 100);
      setRiskAmount(allowedRiskAmount);

      // Risk per share = Entry Price - Stop Loss Price
      const riskPerShare = currentPrice - stopLoss;
      
      if (riskPerShare > 0) {
        // Safe Quantity = Allowed Risk Amount / Risk Per Share
        let safeQty = Math.floor(allowedRiskAmount / riskPerShare);
        
        // Ensure total cost doesn't exceed available cash
        if (safeQty * currentPrice > availableCash) {
          safeQty = Math.floor(availableCash / currentPrice);
        }
        
        setCalcQty(safeQty);
      } else {
        setCalcQty(0);
      }
    } else {
      setCalcQty(0);
    }
  }, [currentPrice, availableCash, riskPercent, stopLoss]);

  if (!isOpen) {
    return (
      <button 
        type="button"
        onClick={() => setIsOpen(true)}
        className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-indigo-500/50 bg-indigo-500/5 text-indigo-400 hover:bg-indigo-500/10 hover:border-indigo-500 transition-colors text-sm font-bold mt-2"
      >
        <Calculator className="h-4 w-4" />
        استخدام حاسبة إدارة المخاطر (احترافي)
      </button>
    );
  }

  return (
    <div className="bg-slate-900/60 border border-indigo-500/30 rounded-xl p-4 mt-4 space-y-4 animate-in fade-in zoom-in-95 duration-200">
      <div className="flex items-center justify-between border-b border-border pb-2">
        <h4 className="text-sm font-bold text-indigo-400 flex items-center gap-2">
          <Calculator className="h-4 w-4" />
          حاسبة حجم الصفقة (Position Sizing)
        </h4>
        <button 
          type="button"
          onClick={() => setIsOpen(false)}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          إغلاق
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="space-y-1.5">
          <label className="text-xs text-slate-400 font-bold">نسبة المخاطرة من الكاش (%)</label>
          <div className="relative">
            <input 
              type="number" 
              step="0.1"
              min="0.1"
              max="10"
              value={riskPercent}
              onChange={(e) => setRiskPercent(parseFloat(e.target.value) || 0)}
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-foreground focus:border-indigo-500 focus:outline-none"
            />
            <AlertTriangle className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-amber-500" />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs text-slate-400 font-bold">نقطة وقف الخسارة (ر.س)</label>
          <div className="relative">
            <input 
              type="number"
              step="0.01"
              value={stopLoss}
              onChange={(e) => setStopLoss(parseFloat(e.target.value) || 0)}
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-foreground focus:border-indigo-500 focus:outline-none"
            />
            <TrendingDown className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-rose-500" />
          </div>
        </div>
      </div>

      <div className="bg-background rounded-lg p-3 border border-border flex flex-col gap-2 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1 h-full bg-indigo-500"></div>
        <div className="flex justify-between items-center">
          <span className="text-xs text-muted-foreground font-bold">المبلغ المسموح بخسارته:</span>
          <span className="text-sm font-mono text-amber-500 font-bold">{riskAmount.toFixed(2)} ر.س</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs text-muted-foreground font-bold">الكمية الآمنة للشراء:</span>
          <span className="text-base font-mono text-emerald-400 font-extrabold">{calcQty} سهم</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs text-muted-foreground font-bold">تكلفة الصفقة:</span>
          <span className="text-sm font-mono text-foreground font-bold">{currentPrice ? (calcQty * currentPrice).toFixed(2) : 0} ر.س</span>
        </div>
      </div>

      <button 
        type="button"
        disabled={calcQty <= 0}
        onClick={() => onApplyQuantity(calcQty)}
        className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-colors text-sm disabled:opacity-50 flex items-center justify-center gap-2"
      >
        <Target className="w-4 h-4" />
        تطبيق الكمية الآمنة في أمر الشراء
      </button>
    </div>
  );
}
