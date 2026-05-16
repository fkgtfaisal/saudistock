"use client";

import { useState } from "react";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
  SortingState,
} from "@tanstack/react-table";
import { Filter, Download, Save, Search, ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";

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

const dummyData: StockData[] = [
  { symbol: "2222", name: "أرامكو السعودية", sector: "الطاقة", price: 32.40, changePercent: 3.8, volume: 15400000, peRatio: 16.5, rsi: 65.4 },
  { symbol: "1120", name: "الراجحي", sector: "البنوك", price: 88.50, changePercent: 2.4, volume: 8500000, peRatio: 21.2, rsi: 72.1 },
  { symbol: "2010", name: "سابك", sector: "المواد الأساسية", price: 82.10, changePercent: 2.2, volume: 5200000, peRatio: 18.4, rsi: 55.8 },
  { symbol: "7010", name: "اس تي سي", sector: "الاتصالات", price: 40.20, changePercent: -1.5, volume: 4100000, peRatio: 14.8, rsi: 45.2 },
  { symbol: "1180", name: "الأهلي", sector: "البنوك", price: 38.90, changePercent: -0.8, volume: 6300000, peRatio: 12.1, rsi: 38.5 },
];

const columnHelper = createColumnHelper<StockData>();

const columns = [
  columnHelper.accessor("symbol", {
    header: "الرمز",
    cell: info => <span className="font-bold">{info.getValue()}</span>,
  }),
  columnHelper.accessor("name", {
    header: "الشركة",
    cell: info => info.getValue(),
  }),
  columnHelper.accessor("sector", {
    header: "القطاع",
    cell: info => <span className="text-muted-foreground">{info.getValue()}</span>,
  }),
  columnHelper.accessor("price", {
    header: "السعر",
    cell: info => <span className="font-bold" dir="ltr">{info.getValue().toFixed(2)}</span>,
  }),
  columnHelper.accessor("changePercent", {
    header: "التغير (%)",
    cell: info => {
      const val = info.getValue();
      const isUp = val > 0;
      return (
        <span className={`font-bold ${isUp ? 'text-success' : 'text-destructive'}`} dir="ltr">
          {isUp ? '+' : ''}{val.toFixed(2)}%
        </span>
      );
    },
  }),
  columnHelper.accessor("volume", {
    header: "الحجم",
    cell: info => <span dir="ltr">{(info.getValue() / 1000000).toFixed(1)}M</span>,
  }),
  columnHelper.accessor("peRatio", {
    header: "مكرر الربحية",
    cell: info => <span dir="ltr">{info.getValue().toFixed(2)}</span>,
  }),
  columnHelper.accessor("rsi", {
    header: "RSI (14)",
    cell: info => {
      const val = info.getValue();
      return (
        <span className={`font-medium ${val > 70 ? 'text-destructive' : val < 30 ? 'text-success' : ''}`} dir="ltr">
          {val.toFixed(1)}
        </span>
      );
    },
  }),
];

export default function ScreenerPage() {
  const [data] = useState(() => [...dummyData]);
  const [sorting, setSorting] = useState<SortingState>([]);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">فلاتر الأسهم (Screener)</h1>
          <p className="text-muted-foreground">قم بتصفية السوق السعودي بناءً على أكثر من 50 مؤشر مالي وفني.</p>
        </div>
        <div className="flex gap-2">
          <button className="bg-card border border-border hover:bg-muted text-foreground px-4 py-2 rounded-md font-medium transition-colors flex items-center gap-2">
            <Save className="h-4 w-4" />
            حفظ الفلتر
          </button>
          <button className="bg-card border border-border hover:bg-muted text-foreground px-4 py-2 rounded-md font-medium transition-colors flex items-center gap-2">
            <Download className="h-4 w-4" />
            تصدير
          </button>
        </div>
      </div>

      {/* Filters Area */}
      <div className="bg-card border border-border rounded-xl p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold flex items-center gap-2">
            <Filter className="h-5 w-5 text-primary" />
            الفلاتر النشطة
          </h2>
          <button className="text-primary text-sm font-medium hover:underline">إضافة فلتر +</button>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="bg-background border border-border px-3 py-1.5 rounded-md flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">السوق:</span>
            <span className="font-bold">تاسي</span>
          </div>
          <div className="bg-background border border-border px-3 py-1.5 rounded-md flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">RSI (14):</span>
            <span className="font-bold">&lt; 70</span>
          </div>
          <div className="bg-background border border-border px-3 py-1.5 rounded-md flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">مكرر الربحية:</span>
            <span className="font-bold">10 - 25</span>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="p-4 border-b border-border flex justify-between items-center bg-muted/20">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="بحث عن شركة أو رمز..." 
              className="bg-background border border-border rounded-md pr-10 pl-4 py-2 text-sm focus:outline-none focus:border-primary w-64"
            />
          </div>
          <p className="text-sm text-muted-foreground">{data.length} نتائج</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-muted/50 border-b border-border">
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map(header => (
                    <th key={header.id} className="p-4 font-medium text-muted-foreground select-none cursor-pointer hover:bg-muted/80 transition-colors" onClick={header.column.getToggleSortingHandler()}>
                      <div className="flex items-center gap-2">
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        {{
                          asc: <ArrowUp className="h-3 w-3" />,
                          desc: <ArrowDown className="h-3 w-3" />,
                        }[header.column.getIsSorted() as string] ?? <ArrowUpDown className="h-3 w-3 opacity-30" />}
                      </div>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-border">
              {table.getRowModel().rows.map(row => (
                <tr key={row.id} className="hover:bg-muted/20 transition-colors">
                  {row.getVisibleCells().map(cell => (
                    <td key={cell.id} className="p-4">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
