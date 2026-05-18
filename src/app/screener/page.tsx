"use client";

import { useState, useEffect } from "react";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
  SortingState,
} from "@tanstack/react-table";
import { 
  Filter, 
  Download, 
  Save, 
  Search, 
  ArrowDown, 
  ArrowUp, 
  ArrowUpDown, 
  Plus, 
  X, 
  FolderOpen, 
  CheckCircle2, 
  AlertCircle,
  TrendingUp,
  LineChart
} from "lucide-react";

type StockData = {
  symbol: string;
  name: string;
  sector: string;
  price: number;
  changePercent: number;
  volume: number;
  peRatio: number;
  rsi: number;
};

// Rich and realistic Saudi stock dataset
const initialStocks: StockData[] = [
  { symbol: "2222", name: "أرامكو السعودية", sector: "الطاقة", price: 32.40, changePercent: 3.8, volume: 15400000, peRatio: 16.5, rsi: 65.4 },
  { symbol: "1120", name: "الراجحي", sector: "البنوك", price: 88.50, changePercent: 2.4, volume: 8500000, peRatio: 21.2, rsi: 72.1 },
  { symbol: "2010", name: "سابك", sector: "المواد الأساسية", price: 82.10, changePercent: 2.2, volume: 5200000, peRatio: 18.4, rsi: 55.8 },
  { symbol: "7010", name: "اس تي سي", sector: "الاتصالات", price: 40.20, changePercent: -1.5, volume: 4100000, peRatio: 14.8, rsi: 45.2 },
  { symbol: "1180", name: "الأهلي", sector: "البنوك", price: 38.90, changePercent: -0.8, volume: 6300000, peRatio: 12.1, rsi: 38.5 },
  { symbol: "1150", name: "الإنماء", sector: "البنوك", price: 41.30, changePercent: 1.7, volume: 9200000, peRatio: 15.6, rsi: 58.1 },
  { symbol: "1211", name: "معادن", sector: "المواد الأساسية", price: 52.40, changePercent: 4.2, volume: 3800000, peRatio: 32.4, rsi: 68.7 },
  { symbol: "4260", name: "بدجت السعودية", sector: "الخدمات الاستهلاكية", price: 78.90, changePercent: -2.1, volume: 1200000, peRatio: 19.1, rsi: 28.4 },
  { symbol: "2310", name: "كيان السعودية", sector: "المواد الأساسية", price: 10.40, changePercent: -0.5, volume: 12400000, peRatio: 11.2, rsi: 32.1 },
  { symbol: "4030", name: "البحري", sector: "النقل", price: 24.60, changePercent: 0.8, volume: 2100000, peRatio: 13.2, rsi: 51.5 },
  { symbol: "1111", name: "مجموعة تداول", sector: "الخدمات المالية", price: 215.40, changePercent: 5.4, volume: 800000, peRatio: 28.7, rsi: 78.4 },
  { symbol: "4190", name: "جرير", sector: "التجزئة", price: 14.80, changePercent: -1.2, volume: 5400000, peRatio: 17.2, rsi: 42.1 },
  { symbol: "4003", name: "إكسترا", sector: "التجزئة", price: 94.20, changePercent: 2.9, volume: 1800000, peRatio: 22.4, rsi: 63.2 },
  { symbol: "1010", name: "بنك الرياض", sector: "البنوك", price: 28.10, changePercent: -0.2, volume: 4700000, peRatio: 11.5, rsi: 48.9 }
];

type FilterCondition = {
  id: string;
  field: keyof StockData | "market";
  fieldNameAr: string;
  operator: "equals" | "greaterThan" | "lessThan" | "between";
  operatorNameAr: string;
  value: any;
  displayText: string;
};

const columnHelper = createColumnHelper<StockData>();

const columns = [
  columnHelper.accessor("symbol", {
    header: "الرمز",
    cell: info => <span className="font-bold text-foreground hover:text-primary transition-colors cursor-pointer">{info.getValue()}</span>,
  }),
  columnHelper.accessor("name", {
    header: "الشركة",
    cell: info => <span className="font-medium text-foreground">{info.getValue()}</span>,
  }),
  columnHelper.accessor("sector", {
    header: "القطاع",
    cell: info => <span className="text-muted-foreground bg-muted/30 border border-border/40 px-2 py-0.5 rounded text-xs">{info.getValue()}</span>,
  }),
  columnHelper.accessor("price", {
    header: "السعر",
    cell: info => <span className="font-bold text-foreground" dir="ltr">{info.getValue().toFixed(2)} ر.س</span>,
  }),
  columnHelper.accessor("changePercent", {
    header: "التغير (%)",
    cell: info => {
      const val = info.getValue();
      const isUp = val > 0;
      return (
        <span className={`font-bold ${isUp ? 'text-emerald-500' : val < 0 ? 'text-rose-500' : 'text-muted-foreground'}`} dir="ltr">
          {isUp ? '+' : ''}{val.toFixed(2)}%
        </span>
      );
    },
  }),
  columnHelper.accessor("volume", {
    header: "الحجم",
    cell: info => <span className="text-muted-foreground" dir="ltr">{(info.getValue() / 1000000).toFixed(1)}M</span>,
  }),
  columnHelper.accessor("peRatio", {
    header: "مكرر الربحية",
    cell: info => <span className="font-medium text-foreground" dir="ltr">{info.getValue().toFixed(2)}</span>,
  }),
  columnHelper.accessor("rsi", {
    header: "RSI (14)",
    cell: info => {
      const val = info.getValue();
      return (
        <span className={`font-bold px-2 py-0.5 rounded text-xs ${val > 70 ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : val < 30 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-muted/40 text-muted-foreground'}`} dir="ltr">
          {val.toFixed(1)}
        </span>
      );
    },
  }),
];

export default function ScreenerPage() {
  const [data] = useState<StockData[]>(() => [...initialStocks]);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Initialize default active filters from the user's screenshot
  const [filters, setFilters] = useState<FilterCondition[]>([
    {
      id: "market-tasi",
      field: "market",
      fieldNameAr: "السوق",
      operator: "equals",
      operatorNameAr: "يساوي",
      value: "تاسي",
      displayText: "السوق: تاسي"
    },
    {
      id: "rsi-greater",
      field: "rsi",
      fieldNameAr: "RSI (14)",
      operator: "greaterThan",
      operatorNameAr: "أكبر من",
      value: 70,
      displayText: "RSI (14) > 70"
    },
    {
      id: "pe-between",
      field: "peRatio",
      fieldNameAr: "مكرر الربحية",
      operator: "between",
      operatorNameAr: "بين",
      value: [10, 25],
      displayText: "مكرر الربحية: 10 - 25"
    }
  ]);

  // Modal related states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedField, setSelectedField] = useState<keyof StockData | "market">("price");
  const [selectedOperator, setSelectedOperator] = useState<"equals" | "greaterThan" | "lessThan" | "between">("greaterThan");
  const [singleValue, setSingleValue] = useState("");
  const [minBound, setMinBound] = useState("");
  const [maxBound, setMaxBound] = useState("");
  const [selectedSector, setSelectedSector] = useState("البنوك");

  // Premium UI notification / toast state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"success" | "info">("success");

  const showToast = (message: string, type: "success" | "info" = "success") => {
    setToastMessage(message);
    setToastType(type);
  };

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage(null);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Load saved filters on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("saudi_stock_saved_filters");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const validFilters = parsed.filter(f => {
            return (
              f &&
              typeof f === "object" &&
              typeof f.id === "string" &&
              (f.field === "market" || f.field in initialStocks[0]) &&
              typeof f.fieldNameAr === "string" &&
              ["equals", "greaterThan", "lessThan", "between"].includes(f.operator) &&
              typeof f.operatorNameAr === "string" &&
              f.value !== undefined &&
              f.value !== null
            );
          });
          if (validFilters.length > 0) {
            setFilters(validFilters);
          }
        }
      }
    } catch (e) {
      console.error("Failed to parse saved filters:", e);
    }
  }, []);

  // Automatically adapt operators when the chosen metric changes
  useEffect(() => {
    if (selectedField === "sector" || selectedField === "market") {
      setSelectedOperator("equals");
    } else {
      setSelectedOperator("greaterThan");
    }
  }, [selectedField]);

  // Filter application logic
  const filteredData = data.filter(stock => {
    // 1. Apply Search Query
    if (searchQuery) {
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch = 
        (stock.symbol || "").includes(q) || 
        (stock.name || "").toLowerCase().includes(q) || 
        (stock.sector || "").toLowerCase().includes(q);
      
      if (!matchesSearch) return false;
    }

    // 2. Apply Dynamic Filters
    for (const filter of filters) {
      if (filter.field === "market") continue; // Mock filter, does not limit results

      const val = stock[filter.field as keyof StockData];
      if (val === undefined || val === null) continue;

      if (filter.operator === "equals") {
        if (String(val).toLowerCase() !== String(filter.value).toLowerCase()) return false;
      } else if (filter.operator === "greaterThan") {
        if (Number(val) <= Number(filter.value)) return false;
      } else if (filter.operator === "lessThan") {
        if (Number(val) >= Number(filter.value)) return false;
      } else if (filter.operator === "between") {
        const min = Array.isArray(filter.value) ? Number(filter.value[0]) : 0;
        const max = Array.isArray(filter.value) ? Number(filter.value[1]) : 0;
        if (Number(val) < min || Number(val) > max) return false;
      }
    }

    return true;
  });

  const table = useReactTable({
    data: filteredData,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  // Handle adding filter from modal
  const handleAddFilter = (e: React.FormEvent) => {
    e.preventDefault();

    let value: any;
    let displayText = "";
    let fieldNameAr = "";
    let operatorNameAr = "";

    // Field Arabic Names
    switch (selectedField) {
      case "price": fieldNameAr = "السعر"; break;
      case "changePercent": fieldNameAr = "التغير (%)"; break;
      case "volume": fieldNameAr = "الحجم"; break;
      case "peRatio": fieldNameAr = "مكرر الربحية"; break;
      case "rsi": fieldNameAr = "RSI (14)"; break;
      case "sector": fieldNameAr = "القطاع"; break;
      case "market": fieldNameAr = "السوق"; break;
    }

    // Operator Arabic Names
    switch (selectedOperator) {
      case "equals": operatorNameAr = "يساوي"; break;
      case "greaterThan": operatorNameAr = "أكبر من"; break;
      case "lessThan": operatorNameAr = "أصغر من"; break;
      case "between": operatorNameAr = "بين"; break;
    }

    // Generate Value & Text
    if (selectedField === "sector") {
      value = selectedSector;
      displayText = `القطاع: ${selectedSector}`;
    } else if (selectedField === "market") {
      value = "تاسي";
      displayText = "السوق: تاسي";
    } else {
      if (selectedOperator === "between") {
        const min = Number(minBound) || 0;
        const max = Number(maxBound) || 0;
        value = [min, max];
        displayText = `${fieldNameAr}: ${min} - ${max}`;
      } else {
        const numVal = Number(singleValue) || 0;
        value = numVal;
        const opSym = selectedOperator === "greaterThan" ? ">" : "<";
        displayText = `${fieldNameAr} ${opSym} ${numVal}`;
      }
    }

    const newFilter: FilterCondition = {
      id: `${selectedField}-${Date.now()}`,
      field: selectedField,
      fieldNameAr,
      operator: selectedOperator,
      operatorNameAr,
      value,
      displayText
    };

    setFilters(prev => [...prev.filter(f => f.field !== selectedField || selectedField === "sector"), newFilter]);
    setIsModalOpen(false);
    
    // Clear inputs
    setSingleValue("");
    setMinBound("");
    setMaxBound("");
    
    showToast(`تمت إضافة فلتر ${fieldNameAr} بنجاح!`);
  };

  // Remove a filter
  const removeFilter = (id: string) => {
    setFilters(prev => prev.filter(f => f.id !== id));
    showToast("تمت إزالة الفلتر المحدد.", "info");
  };

  // Export to CSV using safe UTF-8 BOM
  const handleExportCSV = () => {
    const headers = ["الرمز", "الشركة", "القطاع", "السعر", "التغير (%)", "الحجم", "مكرر الربحية", "RSI (14)"];
    const rows = filteredData.map(stock => [
      stock.symbol || "",
      stock.name || "",
      stock.sector || "",
      (stock.price ?? 0).toFixed(2),
      `${(stock.changePercent ?? 0).toFixed(2)}%`,
      (stock.volume ?? 0).toString(),
      (stock.peRatio ?? 0).toFixed(2),
      (stock.rsi ?? 0).toFixed(1)
    ]);

    // Escape cells with double quotes to comply with RFC 4180
    const csvContent = "\uFEFF" 
      + [
          headers.map(h => `"${h.replace(/"/g, '""')}"`).join(","),
          ...rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(","))
        ].join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `saudistock_screener_export_${Date.now()}.csv`);
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast("تم تصدير ملف البيانات بنجاح (CSV)!");
  };

  // Save current active filters to localStorage
  const handleSaveFilters = () => {
    try {
      localStorage.setItem("saudi_stock_saved_filters", JSON.stringify(filters));
      showToast("تم حفظ مجموعة الفلاتر النشطة في متصفحك!");
    } catch (e) {
      console.error("Failed to save filters:", e);
      showToast("فشل حفظ الفلاتر في المتصفح.", "info");
    }
  };

  // Load previously saved filters
  const handleLoadSavedFilters = () => {
    try {
      const saved = localStorage.getItem("saudi_stock_saved_filters");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const validFilters = parsed.filter(f => {
            return (
              f &&
              typeof f === "object" &&
              typeof f.id === "string" &&
              (f.field === "market" || f.field in initialStocks[0]) &&
              typeof f.fieldNameAr === "string" &&
              ["equals", "greaterThan", "lessThan", "between"].includes(f.operator) &&
              typeof f.operatorNameAr === "string" &&
              f.value !== undefined &&
              f.value !== null
            );
          });
          if (validFilters.length > 0) {
            setFilters(validFilters);
            showToast("تم استعادة الفلاتر المحفوظة بنجاح!");
            return;
          }
        }
      }
      showToast("لا توجد فلاتر صالحة محفوظة مسبقاً في متصفحك.", "info");
    } catch (e) {
      console.error("Failed to restore filters:", e);
      showToast("فشل استعادة الفلاتر بسبب تلف البيانات.", "info");
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl animate-fade-in relative">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[200] bg-slate-900 border border-border shadow-2xl rounded-lg p-4 flex items-center gap-3 animate-slide-up duration-300">
          {toastType === "success" ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 text-sky-400 flex-shrink-0" />
          )}
          <span className="text-sm font-medium text-slate-100">{toastMessage}</span>
        </div>
      )}

      {/* Header Container */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8 bg-card border border-border p-6 rounded-2xl shadow-xl">
        <div className="flex items-center gap-4">
          <div className="bg-primary/10 border border-primary/20 p-3 rounded-xl">
            <LineChart className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-black mb-1 bg-gradient-to-l from-white to-slate-400 bg-clip-text text-transparent">فلاتر الأسهم (Screener)</h1>
            <p className="text-sm text-muted-foreground">قم بتصفية وفلترة السوق السعودي بناءً على أكثر من 50 مؤشر فني ومالي دقيق.</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <button 
            onClick={handleLoadSavedFilters}
            className="flex-1 md:flex-none bg-slate-900 border border-border hover:bg-slate-800 text-slate-200 px-4 py-2.5 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 text-sm"
          >
            <FolderOpen className="h-4 w-4 text-sky-400" />
            استعادة
          </button>
          <button 
            onClick={handleSaveFilters}
            className="flex-1 md:flex-none bg-slate-900 border border-border hover:bg-slate-800 text-slate-200 px-4 py-2.5 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 text-sm"
          >
            <Save className="h-4 w-4 text-emerald-400" />
            حفظ الفلتر
          </button>
          <button 
            onClick={handleExportCSV}
            className="flex-1 md:flex-none bg-primary hover:bg-primary/95 text-primary-foreground px-4 py-2.5 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 text-sm shadow-lg shadow-primary/20"
          >
            <Download className="h-4 w-4" />
            تصدير النتائج
          </button>
        </div>
      </div>

      {/* Active Filters Panel */}
      <div className="bg-card border border-border rounded-2xl p-6 mb-8 shadow-xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-extrabold text-lg flex items-center gap-2 text-foreground">
            <Filter className="h-5 w-5 text-primary" />
            الفلاتر النشطة
          </h2>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="text-primary text-sm font-bold hover:text-primary/90 transition-colors flex items-center gap-1.5 bg-primary/10 px-3 py-1.5 rounded-xl border border-primary/20"
          >
            <Plus className="h-4 w-4" />
            إضافة فلتر
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {filters.length === 0 ? (
            <span className="text-sm text-muted-foreground">لا توجد فلاتر نشطة حالياً. يتم عرض جميع الأسهم.</span>
          ) : (
            filters.map(filter => (
              <button 
                key={filter.id} 
                onClick={() => removeFilter(filter.id)}
                className="bg-slate-900 border border-border px-3.5 py-2 rounded-xl flex items-center gap-2.5 text-sm hover:border-rose-500/30 hover:bg-rose-500/5 transition-all duration-200 cursor-pointer group"
                title="اضغط لحذف الفلتر"
              >
                <span className="text-muted-foreground group-hover:text-rose-300 transition-colors">{filter.fieldNameAr}:</span>
                <span className="font-bold text-foreground group-hover:text-rose-200 transition-colors">
                  {filter.operator === "between" 
                    ? `${Array.isArray(filter.value) ? filter.value[0] ?? 0 : 0} - ${Array.isArray(filter.value) ? filter.value[1] ?? 0 : 0}`
                    : filter.operator === "greaterThan"
                    ? `> ${filter.value}`
                    : filter.operator === "lessThan"
                    ? `< ${filter.value}`
                    : filter.value}
                </span>
                <X className="h-3.5 w-3.5 text-muted-foreground group-hover:text-rose-400 transition-colors" />
              </button>
            ))
          )}
        </div>
      </div>

      {/* Data Table Section */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-xl">
        <div className="p-5 border-b border-border flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 bg-slate-900/40">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute right-3.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="البحث بالشركة أو الرمز أو القطاع..." 
              className="bg-slate-900 border border-border rounded-xl pr-10 pl-4 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary w-full text-foreground transition-all duration-200 placeholder:text-muted-foreground"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="flex items-center justify-between sm:justify-end gap-3">
            <p className="text-sm font-semibold text-slate-300 bg-slate-900 border border-border px-3.5 py-1.5 rounded-xl">
              عدد النتائج: <span className="text-primary font-bold">{filteredData.length}</span>
            </p>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          {filteredData.length === 0 ? (
            <div className="py-16 flex flex-col items-center justify-center text-center px-4">
              <div className="bg-slate-900/60 p-4 rounded-full border border-border mb-4 animate-pulse">
                <AlertCircle className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-1">لا توجد أسهم مطابقة</h3>
              <p className="text-sm text-muted-foreground max-w-md">قم بتعديل الفلاتر النشطة أو ابحث بعبارة أخرى للوصول إلى الشركات المطلوبة.</p>
              <button 
                onClick={() => setFilters([])}
                className="mt-4 bg-slate-900 border border-border hover:bg-slate-800 text-foreground px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200"
              >
                مسح جميع الفلاتر
              </button>
            </div>
          ) : (
            <table className="w-full text-right text-sm">
              <thead className="bg-slate-900/50 border-b border-border">
                {table.getHeaderGroups().map(headerGroup => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map(header => (
                      <th 
                        key={header.id} 
                        className="p-4 font-semibold text-muted-foreground select-none cursor-pointer hover:bg-muted/30 transition-colors border-b border-border/80" 
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        <div className="flex items-center gap-2 justify-start">
                          <span>
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                          </span>
                          {{
                            asc: <ArrowUp className="h-3.5 w-3.5 text-primary" />,
                            desc: <ArrowDown className="h-3.5 w-3.5 text-primary" />,
                          }[header.column.getIsSorted() as string] ?? <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground/30 hover:text-muted-foreground transition-colors" />}
                        </div>
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody className="divide-y divide-border/60">
                {table.getRowModel().rows.map(row => (
                  <tr key={row.id} className="hover:bg-muted/10 transition-colors group">
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id} className="p-4 align-middle">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add Filter Modal */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 bg-black/85 backdrop-blur-md z-[200] flex items-center justify-center p-4 transition-all duration-300"
          onClick={() => setIsModalOpen(false)}
        >
          <div 
            className="bg-card border border-border rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-zoom-in"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-6 border-b border-border flex items-center justify-between bg-slate-900/40">
              <div className="flex items-center gap-2.5">
                <div className="bg-primary/10 border border-primary/20 p-2 rounded-xl text-primary">
                  <Filter className="h-5 w-5" />
                </div>
                <h3 className="font-extrabold text-lg text-foreground">إضافة فلتر جديد</h3>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-muted-foreground hover:text-foreground p-1.5 rounded-xl hover:bg-slate-800/60 transition-all duration-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleAddFilter} className="p-6 space-y-6">
              
              {/* Metric Select */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-300">اختر المؤشر المالي / الفني</label>
                <select 
                  value={selectedField}
                  onChange={e => setSelectedField(e.target.value as keyof StockData | "market")}
                  className="w-full bg-slate-900 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-foreground"
                >
                  <option value="price">السعر الحالي (Price)</option>
                  <option value="changePercent">التغير اليومي (Change %)</option>
                  <option value="volume">حجم التداول اليومي (Volume)</option>
                  <option value="peRatio">مكرر الربحية (P/E Ratio)</option>
                  <option value="rsi">مؤشر القوة النسبية (RSI 14)</option>
                  <option value="sector">القطاع الصناعي (Sector)</option>
                  <option value="market">السوق المالي (Market)</option>
                </select>
              </div>

              {/* Conditional Inputs */}
              {selectedField === "sector" ? (
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-300">اختر القطاع</label>
                  <select 
                    value={selectedSector}
                    onChange={e => setSelectedSector(e.target.value)}
                    className="w-full bg-slate-900 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-foreground"
                  >
                    <option value="الطاقة">الطاقة</option>
                    <option value="البنوك">البنوك</option>
                    <option value="المواد الأساسية">المواد الأساسية</option>
                    <option value="الاتصالات">الاتصالات</option>
                    <option value="الخدمات الاستهلاكية">الخدمات الاستهلاكية</option>
                    <option value="النقل">النقل</option>
                    <option value="الخدمات المالية">الخدمات المالية</option>
                    <option value="التجزئة">التجزئة</option>
                  </select>
                </div>
              ) : selectedField === "market" ? (
                <div className="bg-slate-900/60 border border-border p-4 rounded-2xl flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                  <p className="text-sm text-slate-300">سوق الأسهم السعودي الرئيسي (TASI) محدد افتراضياً.</p>
                </div>
              ) : (
                <div className="space-y-5">
                  {/* Operator Select */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-300">الشرط</label>
                    <select 
                      value={selectedOperator}
                      onChange={e => setSelectedOperator(e.target.value as any)}
                      className="w-full bg-slate-900 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-foreground"
                    >
                      <option value="greaterThan">أكبر من (&gt;)</option>
                      <option value="lessThan">أصغر من (&lt;)</option>
                      <option value="between">بين نطاقين (Between)</option>
                    </select>
                  </div>

                  {/* Values Inputs */}
                  {selectedOperator === "between" ? (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-400">الحد الأدنى</label>
                        <input 
                          type="number" 
                          step="any"
                          required
                          autoFocus
                          value={minBound}
                          onChange={e => setMinBound(e.target.value)}
                          placeholder="0.00"
                          className="w-full bg-slate-900 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-foreground"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-400">الحد الأقصى</label>
                        <input 
                          type="number" 
                          step="any"
                          required
                          value={maxBound}
                          onChange={e => setMaxBound(e.target.value)}
                          placeholder="100.00"
                          className="w-full bg-slate-900 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-foreground"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-300">القيمة المقارنة</label>
                      <input 
                        type="number" 
                        step="any"
                        required
                        autoFocus
                        value={singleValue}
                        onChange={e => setSingleValue(e.target.value)}
                        placeholder="أدخل القيمة الرقمية..."
                        className="w-full bg-slate-900 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-foreground"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Modal Footer Buttons */}
              <div className="flex gap-3 pt-4 border-t border-border">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-slate-900 border border-border hover:bg-slate-800 text-slate-300 py-3 rounded-xl font-semibold transition-all duration-200 text-sm"
                >
                  إلغاء
                </button>
                <button 
                  type="submit" 
                  className="flex-1 bg-primary hover:bg-primary/95 text-primary-foreground py-3 rounded-xl font-semibold transition-all duration-200 text-sm shadow-lg shadow-primary/10"
                >
                  تطبيق الفلتر
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
