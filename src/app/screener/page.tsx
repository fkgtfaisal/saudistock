"use client";

import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";

import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
} from "@tanstack/react-table";

import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  CheckCircle2,
  Download,
  Filter,
  FolderOpen,
  LineChart,
  Plus,
  Save,
  Search,
  X,
} from "lucide-react";

type MarketCode = "TASI" | "NOMU";

type StockData = {
  symbol: string;
  name: string;
  market: MarketCode;
  sector: string;
  price: number;
  changePercent: number;
  volume: number;
  peRatio: number;
  rsi: number;
};

type FilterOperator = "equals" | "greaterThan" | "lessThan" | "between";

type FilterField = keyof StockData;

type FilterValue = string | number | [number, number];

type FilterCondition = {
  id: string;
  field: FilterField;
  fieldNameAr: string;
  operator: FilterOperator;
  operatorNameAr: string;
  value: FilterValue;
  displayText: string;
};

type ToastType = "success" | "info" | "error";

const STORAGE_KEY = "saudi_stock_saved_filters_v2";

const initialStocks: StockData[] = [
  {
    symbol: "2222",
    name: "أرامكو السعودية",
    market: "TASI",
    sector: "الطاقة",
    price: 32.4,
    changePercent: 3.8,
    volume: 15400000,
    peRatio: 16.5,
    rsi: 65.4,
  },
  {
    symbol: "1120",
    name: "الراجحي",
    market: "TASI",
    sector: "البنوك",
    price: 88.5,
    changePercent: 2.4,
    volume: 8500000,
    peRatio: 21.2,
    rsi: 72.1,
  },
  {
    symbol: "2010",
    name: "سابك",
    market: "TASI",
    sector: "المواد الأساسية",
    price: 82.1,
    changePercent: 2.2,
    volume: 5200000,
    peRatio: 18.4,
    rsi: 55.8,
  },
  {
    symbol: "7010",
    name: "اس تي سي",
    market: "TASI",
    sector: "الاتصالات",
    price: 40.2,
    changePercent: -1.5,
    volume: 4100000,
    peRatio: 14.8,
    rsi: 45.2,
  },
  {
    symbol: "1180",
    name: "الأهلي",
    market: "TASI",
    sector: "البنوك",
    price: 38.9,
    changePercent: -0.8,
    volume: 6300000,
    peRatio: 12.1,
    rsi: 38.5,
  },
  {
    symbol: "1150",
    name: "الإنماء",
    market: "TASI",
    sector: "البنوك",
    price: 41.3,
    changePercent: 1.7,
    volume: 9200000,
    peRatio: 15.6,
    rsi: 58.1,
  },
  {
    symbol: "1211",
    name: "معادن",
    market: "TASI",
    sector: "المواد الأساسية",
    price: 52.4,
    changePercent: 4.2,
    volume: 3800000,
    peRatio: 32.4,
    rsi: 68.7,
  },
  {
    symbol: "4260",
    name: "بدجت السعودية",
    market: "TASI",
    sector: "الخدمات الاستهلاكية",
    price: 78.9,
    changePercent: -2.1,
    volume: 1200000,
    peRatio: 19.1,
    rsi: 28.4,
  },
  {
    symbol: "2310",
    name: "كيان السعودية",
    market: "TASI",
    sector: "المواد الأساسية",
    price: 10.4,
    changePercent: -0.5,
    volume: 12400000,
    peRatio: 11.2,
    rsi: 32.1,
  },
  {
    symbol: "4030",
    name: "البحري",
    market: "TASI",
    sector: "النقل",
    price: 24.6,
    changePercent: 0.8,
    volume: 2100000,
    peRatio: 13.2,
    rsi: 51.5,
  },
  {
    symbol: "1111",
    name: "مجموعة تداول",
    market: "TASI",
    sector: "الخدمات المالية",
    price: 215.4,
    changePercent: 5.4,
    volume: 800000,
    peRatio: 28.7,
    rsi: 78.4,
  },
  {
    symbol: "4190",
    name: "جرير",
    market: "TASI",
    sector: "التجزئة",
    price: 14.8,
    changePercent: -1.2,
    volume: 5400000,
    peRatio: 17.2,
    rsi: 42.1,
  },
  {
    symbol: "4003",
    name: "إكسترا",
    market: "TASI",
    sector: "التجزئة",
    price: 94.2,
    changePercent: 2.9,
    volume: 1800000,
    peRatio: 22.4,
    rsi: 63.2,
  },
  {
    symbol: "1010",
    name: "بنك الرياض",
    market: "TASI",
    sector: "البنوك",
    price: 28.1,
    changePercent: -0.2,
    volume: 4700000,
    peRatio: 11.5,
    rsi: 48.9,
  },
  {
    symbol: "9550",
    name: "سهل",
    market: "NOMU",
    sector: "التطبيقات وخدمات التقنية",
    price: 62.5,
    changePercent: 1.1,
    volume: 180000,
    peRatio: 27.3,
    rsi: 61.2,
  },
];

const fieldLabels: Record<FilterField, string> = {
  symbol: "الرمز",
  name: "الشركة",
  market: "السوق",
  sector: "القطاع",
  price: "السعر",
  changePercent: "التغير (%)",
  volume: "الحجم",
  peRatio: "مكرر الربحية",
  rsi: "RSI (14)",
};

const operatorLabels: Record<FilterOperator, string> = {
  equals: "يساوي",
  greaterThan: "أكبر من",
  lessThan: "أصغر من",
  between: "بين",
};

const marketLabels: Record<MarketCode, string> = {
  TASI: "تاسي",
  NOMU: "نمو",
};

const sectors = Array.from(new Set(initialStocks.map((stock) => stock.sector)));

const numericFields: FilterField[] = [
  "price",
  "changePercent",
  "volume",
  "peRatio",
  "rsi",
];

const selectableFields: FilterField[] = [
  "market",
  "sector",
  "price",
  "changePercent",
  "volume",
  "peRatio",
  "rsi",
];

const currencyFormatter = new Intl.NumberFormat("ar-SA", {
  style: "currency",
  currency: "SAR",
  maximumFractionDigits: 2,
});

const numberFormatter = new Intl.NumberFormat("ar-SA");

function formatVolume(value: number) {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }

  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K`;
  }

  return numberFormatter.format(value);
}

function isFilterField(value: unknown): value is FilterField {
  return (
    typeof value === "string" &&
    [
      "symbol",
      "name",
      "market",
      "sector",
      "price",
      "changePercent",
      "volume",
      "peRatio",
      "rsi",
    ].includes(value)
  );
}

function isFilterOperator(value: unknown): value is FilterOperator {
  return (
    typeof value === "string" &&
    ["equals", "greaterThan", "lessThan", "between"].includes(value)
  );
}

function isValidFilterCondition(value: unknown): value is FilterCondition {
  if (!value || typeof value !== "object") return false;

  const item = value as Partial<FilterCondition>;

  if (typeof item.id !== "string") return false;
  if (!isFilterField(item.field)) return false;
  if (!isFilterOperator(item.operator)) return false;
  if (typeof item.fieldNameAr !== "string") return false;
  if (typeof item.operatorNameAr !== "string") return false;
  if (typeof item.displayText !== "string") return false;

  if (item.operator === "between") {
    return (
      Array.isArray(item.value) &&
      item.value.length === 2 &&
      typeof item.value[0] === "number" &&
      typeof item.value[1] === "number"
    );
  }

  return typeof item.value === "string" || typeof item.value === "number";
}

function getDefaultFilters(): FilterCondition[] {
  return [
    {
      id: "market-tasi",
      field: "market",
      fieldNameAr: "السوق",
      operator: "equals",
      operatorNameAr: "يساوي",
      value: "TASI",
      displayText: "السوق: تاسي",
    },
    {
      id: "rsi-greater",
      field: "rsi",
      fieldNameAr: "RSI (14)",
      operator: "greaterThan",
      operatorNameAr: "أكبر من",
      value: 70,
      displayText: "RSI (14) > 70",
    },
    {
      id: "pe-between",
      field: "peRatio",
      fieldNameAr: "مكرر الربحية",
      operator: "between",
      operatorNameAr: "بين",
      value: [10, 25],
      displayText: "مكرر الربحية: 10 - 25",
    },
  ];
}

function buildFilterDisplayText(
  field: FilterField,
  operator: FilterOperator,
  value: FilterValue
) {
  const fieldName = fieldLabels[field];

  if (field === "market") {
    return `السوق: ${marketLabels[value as MarketCode] ?? String(value)}`;
  }

  if (field === "sector") {
    return `القطاع: ${String(value)}`;
  }

  if (operator === "between" && Array.isArray(value)) {
    return `${fieldName}: ${value[0]} - ${value[1]}`;
  }

  if (operator === "greaterThan") {
    return `${fieldName} > ${value}`;
  }

  if (operator === "lessThan") {
    return `${fieldName} < ${value}`;
  }

  return `${fieldName}: ${value}`;
}

function escapeCsvCell(value: string) {
  return `"${value.replace(/"/g, '""')}"`;
}

const columnHelper = createColumnHelper<StockData>();

const columns = [
  columnHelper.accessor("symbol", {
    header: "الرمز",
    cell: (info) => (
      <span className="font-bold text-foreground hover:text-primary transition-colors cursor-pointer">
        {info.getValue()}
      </span>
    ),
  }),

  columnHelper.accessor("name", {
    header: "الشركة",
    cell: (info) => (
      <span className="font-medium text-foreground">
        {info.getValue()}
      </span>
    ),
  }),

  columnHelper.accessor("market", {
    header: "السوق",
    cell: (info) => {
      const value = info.getValue();

      return (
        <span className="text-muted-foreground bg-muted/30 border border-border/40 px-2 py-0.5 rounded text-xs">
          {marketLabels[value]}
        </span>
      );
    },
  }),

  columnHelper.accessor("sector", {
    header: "القطاع",
    cell: (info) => (
      <span className="text-muted-foreground bg-muted/30 border border-border/40 px-2 py-0.5 rounded text-xs">
        {info.getValue()}
      </span>
    ),
  }),

  columnHelper.accessor("price", {
    header: "السعر",
    cell: (info) => (
      <span className="font-bold text-foreground" dir="ltr">
        {currencyFormatter.format(info.getValue())}
      </span>
    ),
  }),

  columnHelper.accessor("changePercent", {
    header: "التغير (%)",
    cell: (info) => {
      const value = info.getValue();
      const isUp = value > 0;

      return (
        <span
          className={`font-bold ${
            isUp
              ? "text-emerald-500"
              : value < 0
                ? "text-rose-500"
                : "text-muted-foreground"
          }`}
          dir="ltr"
        >
          {isUp ? "+" : ""}
          {value.toFixed(2)}%
        </span>
      );
    },
  }),

  columnHelper.accessor("volume", {
    header: "الحجم",
    cell: (info) => (
      <span className="text-muted-foreground" dir="ltr">
        {formatVolume(info.getValue())}
      </span>
    ),
  }),

  columnHelper.accessor("peRatio", {
    header: "مكرر الربحية",
    cell: (info) => (
      <span className="font-medium text-foreground" dir="ltr">
        {info.getValue().toFixed(2)}
      </span>
    ),
  }),

  columnHelper.accessor("rsi", {
    header: "RSI (14)",
    cell: (info) => {
      const value = info.getValue();

      const className =
        value > 70
          ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
          : value < 30
            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
            : "bg-muted/40 text-muted-foreground";

      return (
        <span
          className={`font-bold px-2 py-0.5 rounded text-xs ${className}`}
          dir="ltr"
        >
          {value.toFixed(1)}
        </span>
      );
    },
  }),
];

export default function ScreenerPage() {
  const [data] = useState<StockData[]>(() => [...initialStocks]);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const [filters, setFilters] = useState<FilterCondition[]>(() =>
    getDefaultFilters()
  );

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedField, setSelectedField] = useState<FilterField>("price");
  const [selectedOperator, setSelectedOperator] =
    useState<FilterOperator>("greaterThan");

  const [singleValue, setSingleValue] = useState("");
  const [minBound, setMinBound] = useState("");
  const [maxBound, setMaxBound] = useState("");
  const [selectedSector, setSelectedSector] = useState(sectors[0] ?? "البنوك");
  const [selectedMarket, setSelectedMarket] = useState<MarketCode>("TASI");

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<ToastType>("success");

  // Cloud Screeners
  const [dbScreeners, setDbScreeners] = useState<{id: string, name: string, criteria: any}[]>([]);

  useEffect(() => {
    fetch("/api/screeners")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setDbScreeners(data);
      })
      .catch(console.error);
  }, []);

  const showToast = (
    message: string,
    type: ToastType = "success"
  ) => {
    setToastMessage(message);
    setToastType(type);
  };

  useEffect(() => {
    if (!toastMessage) return;

    const timer = window.setTimeout(() => {
      setToastMessage(null);
    }, 3500);

    return () => window.clearTimeout(timer);
  }, [toastMessage]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return;

      const parsed = JSON.parse(saved);

      if (!Array.isArray(parsed)) return;

      const validFilters = parsed.filter(isValidFilterCondition);

      if (validFilters.length > 0) {
        setFilters(validFilters);
      }
    } catch (error) {
      console.error("Failed to parse saved filters:", error);
    }
  }, []);

  useEffect(() => {
    if (selectedField === "sector" || selectedField === "market") {
      setSelectedOperator("equals");
      return;
    }

    setSelectedOperator("greaterThan");
  }, [selectedField]);

  useEffect(() => {
    if (!isModalOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsModalOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isModalOpen]);

  const filteredData = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return data.filter((stock) => {
      if (query) {
        const matchesSearch =
          stock.symbol.toLowerCase().includes(query) ||
          stock.name.toLowerCase().includes(query) ||
          stock.sector.toLowerCase().includes(query) ||
          marketLabels[stock.market].toLowerCase().includes(query);

        if (!matchesSearch) return false;
      }

      for (const filter of filters) {
        const stockValue = stock[filter.field];

        if (filter.operator === "equals") {
          if (
            String(stockValue).toLowerCase() !==
            String(filter.value).toLowerCase()
          ) {
            return false;
          }
        }

        if (filter.operator === "greaterThan") {
          if (Number(stockValue) <= Number(filter.value)) {
            return false;
          }
        }

        if (filter.operator === "lessThan") {
          if (Number(stockValue) >= Number(filter.value)) {
            return false;
          }
        }

        if (filter.operator === "between") {
          if (!Array.isArray(filter.value)) return false;

          const [min, max] = filter.value;

          if (Number(stockValue) < min || Number(stockValue) > max) {
            return false;
          }
        }
      }

      return true;
    });
  }, [data, filters, searchQuery]);

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

  const resetModalInputs = () => {
    setSingleValue("");
    setMinBound("");
    setMaxBound("");
  };

  const handleAddFilter = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    let value: FilterValue;

    if (selectedField === "sector") {
      value = selectedSector;
    } else if (selectedField === "market") {
      value = selectedMarket;
    } else {
      if (!numericFields.includes(selectedField)) {
        showToast("هذا الحقل غير مدعوم كفلتر رقمي.", "error");
        return;
      }

      if (selectedOperator === "between") {
        const min = Number(minBound);
        const max = Number(maxBound);

        if (Number.isNaN(min) || Number.isNaN(max)) {
          showToast("يرجى إدخال حدود رقمية صحيحة.", "error");
          return;
        }

        if (min > max) {
          showToast("الحد الأدنى يجب أن يكون أقل من الحد الأعلى.", "error");
          return;
        }

        value = [min, max];
      } else {
        const numericValue = Number(singleValue);

        if (Number.isNaN(numericValue)) {
          showToast("يرجى إدخال قيمة رقمية صحيحة.", "error");
          return;
        }

        value = numericValue;
      }
    }

    const fieldNameAr = fieldLabels[selectedField];
    const operatorNameAr = operatorLabels[selectedOperator];

    const newFilter: FilterCondition = {
      id: `${selectedField}-${Date.now()}`,
      field: selectedField,
      fieldNameAr,
      operator: selectedOperator,
      operatorNameAr,
      value,
      displayText: buildFilterDisplayText(
        selectedField,
        selectedOperator,
        value
      ),
    };

    setFilters((previousFilters) => [
      ...previousFilters.filter((filter) => filter.field !== selectedField),
      newFilter,
    ]);

    setIsModalOpen(false);
    resetModalInputs();
    showToast(`تمت إضافة فلتر ${fieldNameAr} بنجاح.`);
  };

  const removeFilter = (id: string) => {
    setFilters((previousFilters) =>
      previousFilters.filter((filter) => filter.id !== id)
    );

    showToast("تمت إزالة الفلتر المحدد.", "info");
  };

  const clearAllFilters = () => {
    setFilters([]);
    showToast("تم مسح جميع الفلاتر.", "info");
  };

  const resetDefaultFilters = () => {
    setFilters(getDefaultFilters());
    showToast("تمت استعادة الفلاتر الافتراضية.", "info");
  };

  const handleExportCSV = () => {
    const headers = [
      "الرمز",
      "الشركة",
      "السوق",
      "القطاع",
      "السعر",
      "التغير (%)",
      "الحجم",
      "مكرر الربحية",
      "RSI (14)",
    ];

    const rows = filteredData.map((stock) => [
      stock.symbol,
      stock.name,
      marketLabels[stock.market],
      stock.sector,
      stock.price.toFixed(2),
      `${stock.changePercent.toFixed(2)}%`,
      stock.volume.toString(),
      stock.peRatio.toFixed(2),
      stock.rsi.toFixed(1),
    ]);

    const csvContent =
      "\uFEFF" +
      [
        headers.map(escapeCsvCell).join(","),
        ...rows.map((row) => row.map(escapeCsvCell).join(",")),
      ].join("\n");

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `saudi_stock_screener_export_${Date.now()}.csv`;
    link.style.display = "none";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);

    showToast("تم تصدير ملف البيانات بنجاح بصيغة CSV.");
  };

  const handleSaveFilters = async () => {
    if (filters.length === 0) {
      showToast("لا توجد فلاتر نشطة لحفظها.", "error");
      return;
    }

    const name = window.prompt("أدخل اسماً مميزاً لهذا الفلتر (مثال: أسهم الانفجار السعري):");
    if (!name?.trim()) return;

    try {
      const res = await fetch("/api/screeners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), criteria: filters }),
      });

      if (res.ok) {
        const newScreener = await res.json();
        // Update local state so it appears in dropdown immediately
        setDbScreeners(prev => {
          const filtered = prev.filter(s => s.name !== newScreener.name);
          return [newScreener, ...filtered];
        });
        showToast("تم حفظ الفلتر بنجاح في حسابك السحابي! ☁️");
      } else {
        showToast("فشل الحفظ في السحابة.", "error");
      }
    } catch (error) {
      console.error("Failed to save filters:", error);
      showToast("خطأ في الاتصال بالخادم.", "error");
    }
  };

  const getFilterValueLabel = (filter: FilterCondition) => {
    if (filter.field === "market") {
      return marketLabels[filter.value as MarketCode] ?? String(filter.value);
    }

    if (filter.operator === "between" && Array.isArray(filter.value)) {
      return `${filter.value[0]} - ${filter.value[1]}`;
    }

    if (filter.operator === "greaterThan") {
      return `> ${filter.value}`;
    }

    if (filter.operator === "lessThan") {
      return `< ${filter.value}`;
    }

    return String(filter.value);
  };

  return (
    <div
      className="container mx-auto px-4 py-8 max-w-7xl animate-fade-in relative"
      dir="rtl"
    >
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[200] bg-slate-900 border border-border shadow-2xl rounded-lg p-4 flex items-center gap-3 animate-slide-up duration-300">
          {toastType === "success" ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0" />
          ) : (
            <AlertCircle
              className={`h-5 w-5 flex-shrink-0 ${
                toastType === "error" ? "text-rose-400" : "text-sky-400"
              }`}
            />
          )}

          <span className="text-sm font-medium text-slate-100">
            {toastMessage}
          </span>
        </div>
      )}

      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8 bg-card border border-border p-6 rounded-2xl shadow-xl">
        <div className="flex items-center gap-4">
          <div className="bg-primary/10 border border-primary/20 p-3 rounded-xl">
            <LineChart className="h-8 w-8 text-primary" />
          </div>

          <div>
            <h1 className="text-3xl font-black mb-1 bg-gradient-to-l from-white to-slate-400 bg-clip-text text-transparent">
              فلاتر الأسهم السعودية
            </h1>

            <p className="text-sm text-muted-foreground">
              قم بتصفية وفلترة الأسهم حسب السوق، القطاع، السعر، الحجم،
              ومؤشرات مالية وفنية مختارة.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 w-full md:w-auto items-center">
          {dbScreeners.length > 0 && (
            <select
              className="bg-slate-900 border border-border text-slate-200 px-3 py-2.5 rounded-xl text-sm outline-none cursor-pointer hover:bg-slate-800 transition-colors"
              onChange={(e) => {
                if (!e.target.value) return;
                const selected = dbScreeners.find(s => s.id === e.target.value);
                if (selected && Array.isArray(selected.criteria)) {
                  setFilters(selected.criteria as FilterCondition[]);
                  showToast(`تم تحميل الفلتر السحابي: ${selected.name}`);
                }
                e.target.value = ""; // reset
              }}
            >
              <option value="">📂 فلاتري المحفوظة...</option>
              {dbScreeners.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          )}

          <button
            type="button"
            onClick={handleSaveFilters}
            className="flex-1 md:flex-none bg-slate-900 border border-border hover:bg-slate-800 text-slate-200 px-4 py-2.5 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 text-sm shadow-sm"
          >
            <Save className="h-4 w-4 text-emerald-400" />
            حفظ الفلتر سحابياً
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="flex-1 md:flex-none bg-primary hover:bg-primary/95 text-primary-foreground px-4 py-2.5 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 text-sm shadow-lg shadow-primary/20"
          >
            <Download className="h-4 w-4" />
            تصدير النتائج
          </button>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-6 mb-8 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <h2 className="font-extrabold text-lg flex items-center gap-2 text-foreground">
            <Filter className="h-5 w-5 text-primary" />
            الفلاتر النشطة
          </h2>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="text-primary text-sm font-bold hover:text-primary/90 transition-colors flex items-center gap-1.5 bg-primary/10 px-3 py-1.5 rounded-xl border border-primary/20"
            >
              <Plus className="h-4 w-4" />
              إضافة فلتر
            </button>

            <button
              type="button"
              onClick={resetDefaultFilters}
              className="text-slate-300 text-sm font-bold hover:text-white transition-colors bg-slate-900 px-3 py-1.5 rounded-xl border border-border"
            >
              الافتراضي
            </button>

            {filters.length > 0 && (
              <button
                type="button"
                onClick={clearAllFilters}
                className="text-rose-300 text-sm font-bold hover:text-rose-200 transition-colors bg-rose-500/10 px-3 py-1.5 rounded-xl border border-rose-500/20"
              >
                مسح الكل
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {filters.length === 0 ? (
            <span className="text-sm text-muted-foreground">
              لا توجد فلاتر نشطة حالياً. يتم عرض جميع الأسهم.
            </span>
          ) : (
            filters.map((filter) => (
              <button
                type="button"
                key={filter.id}
                onClick={() => removeFilter(filter.id)}
                className="bg-slate-900 border border-border px-3.5 py-2 rounded-xl flex items-center gap-2.5 text-sm hover:border-rose-500/30 hover:bg-rose-500/5 transition-all duration-200 cursor-pointer group"
                title="اضغط لحذف الفلتر"
              >
                <span className="text-muted-foreground group-hover:text-rose-300 transition-colors">
                  {filter.fieldNameAr}:
                </span>

                <span className="font-bold text-foreground group-hover:text-rose-200 transition-colors">
                  {getFilterValueLabel(filter)}
                </span>

                <X className="h-3.5 w-3.5 text-muted-foreground group-hover:text-rose-400 transition-colors" />
              </button>
            ))
          )}
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-xl">
        <div className="p-5 border-b border-border flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 bg-slate-900/40">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />

            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="البحث بالشركة أو الرمز أو القطاع أو السوق..."
              className="bg-slate-900 border border-border rounded-xl pr-10 pl-10 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary w-full text-foreground transition-all duration-200 placeholder:text-muted-foreground"
            />

            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label="مسح البحث"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-3">
            <p className="text-sm font-semibold text-slate-300 bg-slate-900 border border-border px-3.5 py-1.5 rounded-xl">
              عدد النتائج:{" "}
              <span className="text-primary font-bold">
                {filteredData.length}
              </span>
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          {filteredData.length === 0 ? (
            <div className="py-16 flex flex-col items-center justify-center text-center px-4">
              <div className="bg-slate-900/60 p-4 rounded-full border border-border mb-4 animate-pulse">
                <AlertCircle className="h-10 w-10 text-muted-foreground" />
              </div>

              <h3 className="text-lg font-bold text-foreground mb-1">
                لا توجد أسهم مطابقة
              </h3>

              <p className="text-sm text-muted-foreground max-w-md">
                قم بتعديل الفلاتر النشطة أو ابحث بعبارة أخرى للوصول إلى الشركات
                المطلوبة.
              </p>

              <button
                type="button"
                onClick={clearAllFilters}
                className="mt-4 bg-slate-900 border border-border hover:bg-slate-800 text-foreground px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200"
              >
                مسح جميع الفلاتر
              </button>
            </div>
          ) : (
            <table className="w-full text-right text-sm">
              <thead className="bg-slate-900/50 border-b border-border">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      const sortDirection = header.column.getIsSorted();

                      return (
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

                            {sortDirection === "asc" ? (
                              <ArrowUp className="h-3.5 w-3.5 text-primary" />
                            ) : sortDirection === "desc" ? (
                              <ArrowDown className="h-3.5 w-3.5 text-primary" />
                            ) : (
                              <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground/30 hover:text-muted-foreground transition-colors" />
                            )}
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                ))}
              </thead>

              <tbody className="divide-y divide-border/60">
                {table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="hover:bg-muted/10 transition-colors group"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="p-4 align-middle">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div
          className="fixed inset-0 bg-black/85 backdrop-blur-md z-[200] flex items-center justify-center p-4 transition-all duration-300"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-filter-title"
            className="bg-card border border-border rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-zoom-in"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="p-6 border-b border-border flex items-center justify-between bg-slate-900/40">
              <div className="flex items-center gap-2.5">
                <div className="bg-primary/10 border border-primary/20 p-2 rounded-xl text-primary">
                  <Filter className="h-5 w-5" />
                </div>

                <h3
                  id="add-filter-title"
                  className="font-extrabold text-lg text-foreground"
                >
                  إضافة فلتر جديد
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-muted-foreground hover:text-foreground p-1.5 rounded-xl hover:bg-slate-800/60 transition-all duration-200"
                aria-label="إغلاق النافذة"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddFilter} className="p-6 space-y-6">
              <div className="space-y-2">
                <label
                  htmlFor="filter-field"
                  className="text-sm font-semibold text-slate-300"
                >
                  اختر المؤشر أو الحقل
                </label>

                <select
                  id="filter-field"
                  value={selectedField}
                  onChange={(event) =>
                    setSelectedField(event.target.value as FilterField)
                  }
                  className="w-full bg-slate-900 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-foreground"
                >
                  {selectableFields.map((field) => (
                    <option key={field} value={field}>
                      {fieldLabels[field]}
                    </option>
                  ))}
                </select>
              </div>

              {selectedField === "market" ? (
                <div className="space-y-2">
                  <label
                    htmlFor="filter-market"
                    className="text-sm font-semibold text-slate-300"
                  >
                    اختر السوق
                  </label>

                  <select
                    id="filter-market"
                    value={selectedMarket}
                    onChange={(event) =>
                      setSelectedMarket(event.target.value as MarketCode)
                    }
                    className="w-full bg-slate-900 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-foreground"
                  >
                    <option value="TASI">تاسي - السوق الرئيسية</option>
                    <option value="NOMU">نمو - السوق الموازية</option>
                  </select>
                </div>
              ) : selectedField === "sector" ? (
                <div className="space-y-2">
                  <label
                    htmlFor="filter-sector"
                    className="text-sm font-semibold text-slate-300"
                  >
                    اختر القطاع
                  </label>

                  <select
                    id="filter-sector"
                    value={selectedSector}
                    onChange={(event) => setSelectedSector(event.target.value)}
                    className="w-full bg-slate-900 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-foreground"
                  >
                    {sectors.map((sector) => (
                      <option key={sector} value={sector}>
                        {sector}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="space-y-2">
                    <label
                      htmlFor="filter-operator"
                      className="text-sm font-semibold text-slate-300"
                    >
                      الشرط
                    </label>

                    <select
                      id="filter-operator"
                      value={selectedOperator}
                      onChange={(event) =>
                        setSelectedOperator(
                          event.target.value as FilterOperator
                        )
                      }
                      className="w-full bg-slate-900 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-foreground"
                    >
                      <option value="greaterThan">أكبر من &gt;</option>
                      <option value="lessThan">أصغر من &lt;</option>
                      <option value="between">بين نطاقين</option>
                    </select>
                  </div>

                  {selectedOperator === "between" ? (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label
                          htmlFor="filter-min"
                          className="text-xs font-semibold text-slate-400"
                        >
                          الحد الأدنى
                        </label>

                        <input
                          id="filter-min"
                          type="number"
                          step="any"
                          required
                          autoFocus
                          value={minBound}
                          onChange={(event) =>
                            setMinBound(event.target.value)
                          }
                          placeholder="0.00"
                          className="w-full bg-slate-900 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-foreground"
                        />
                      </div>

                      <div className="space-y-2">
                        <label
                          htmlFor="filter-max"
                          className="text-xs font-semibold text-slate-400"
                        >
                          الحد الأقصى
                        </label>

                        <input
                          id="filter-max"
                          type="number"
                          step="any"
                          required
                          value={maxBound}
                          onChange={(event) =>
                            setMaxBound(event.target.value)
                          }
                          placeholder="100.00"
                          className="w-full bg-slate-900 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-foreground"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <label
                        htmlFor="filter-value"
                        className="text-sm font-semibold text-slate-300"
                      >
                        القيمة المقارنة
                      </label>

                      <input
                        id="filter-value"
                        type="number"
                        step="any"
                        required
                        autoFocus
                        value={singleValue}
                        onChange={(event) =>
                          setSingleValue(event.target.value)
                        }
                        placeholder="أدخل القيمة الرقمية..."
                        className="w-full bg-slate-900 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-foreground"
                      />
                    </div>
                  )}
                </div>
              )}

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