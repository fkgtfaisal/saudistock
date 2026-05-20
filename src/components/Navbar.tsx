"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { STOCK_MAP } from "@/lib/stocks";
import { Menu, X, Building2, Globe, LayoutDashboard, BarChart3, Filter, Bell, Newspaper, Users, Zap, Shield, Settings, LogOut, User as UserIcon, ChevronDown, Search } from "lucide-react";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { data: session } = useSession();
  const pathname = usePathname();

  const isChartPage = pathname?.startsWith("/chart/");
  const currentSymbol = isChartPage ? pathname.split("/").pop() || "2222" : "";
  const currentStock = STOCK_MAP[currentSymbol];
  
  const [showSymbolDropdown, setShowSymbolDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredStocks = Object.values(STOCK_MAP).filter(stock => 
    stock.symbol.includes(searchTerm) || 
    stock.nameAr.includes(searchTerm) || 
    stock.nameEn?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const isAdmin = mounted && (session?.user as any)?.subscriptionTier === "ELITE";

  const navLinks = [
    { href: "/", label: "الرئيسية", icon: <LayoutDashboard className="h-4 w-4" /> },
    { href: "/markets/saudi", label: "السوق", icon: <Globe className="h-4 w-4" /> },
    { href: "/screener", label: "الفلاتر", icon: <Filter className="h-4 w-4" /> },
    { href: "/watchlists", label: "المراقبة", icon: <Bell className="h-4 w-4" /> },
    { href: "/portfolio", label: "المحفظة", icon: <BarChart3 className="h-4 w-4" /> },
    { href: "/news", label: "الأخبار", icon: <Newspaper className="h-4 w-4" /> },
    { href: "/community", label: "المجتمع", icon: <Users className="h-4 w-4" /> },
    { href: "/ai-analysis", label: "تحليل AI", icon: <Zap className="h-4 w-4" /> },
    { href: "/subscriptions", label: "الاشتراكات", icon: <Shield className="h-4 w-4" /> },
    ...(isAdmin ? [{ href: "/admin", label: "الإدارة", icon: <Settings className="h-4 w-4 text-destructive" /> }] : []),
  ];

  return (
    <header className="sticky top-0 z-[100] w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo and Stock Selector */}
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center font-bold text-primary-foreground shadow-lg shadow-primary/20 animate-pulse-slow">
              S
            </div>
            <span className="font-bold text-lg tracking-tight hidden sm:inline-block">منصة ذكاء الأسهم</span>
            <span className="font-bold text-lg tracking-tight sm:hidden">ذكاء الأسهم</span>
          </Link>

          {isChartPage && currentStock && (
            <div className="relative">
              <button
                onClick={() => setShowSymbolDropdown(!showSymbolDropdown)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/65 hover:bg-muted text-xs sm:text-sm font-bold transition-all border border-border/60 hover:border-primary/50 text-foreground"
              >
                <span className="text-primary font-mono">{currentStock.symbol}</span>
                <span className="text-foreground hidden md:inline-block">{currentStock.nameAr}</span>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
              {showSymbolDropdown && (
                <div className="absolute top-full right-0 mt-2 w-72 bg-popover border border-border rounded-xl shadow-2xl z-[150] p-2 flex flex-col gap-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="relative flex items-center px-2 py-1 bg-muted/50 rounded-lg border border-border">
                    <Search className="h-4 w-4 text-muted-foreground ml-2 shrink-0" />
                    <input
                      type="text"
                      placeholder="ابحث بالرمز أو الاسم..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-transparent border-none text-xs py-1.5 focus:outline-none font-bold text-foreground"
                      autoFocus
                    />
                  </div>
                  <div className="max-h-64 overflow-y-auto flex flex-col gap-0.5 scrollbar-thin">
                    {filteredStocks.length === 0 ? (
                      <div className="text-center text-xs text-muted-foreground py-4">
                        لا توجد نتائج
                      </div>
                    ) : (
                      filteredStocks.map((stock) => (
                        <Link
                          key={stock.symbol}
                          href={`/chart/${stock.symbol}`}
                          onClick={() => { setShowSymbolDropdown(false); setSearchTerm(""); }}
                          className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                            stock.symbol === currentSymbol
                              ? "bg-primary/20 text-primary"
                              : "hover:bg-muted text-foreground"
                          }`}
                        >
                          <span className="text-foreground">{stock.nameAr}</span>
                          <span className="font-mono text-muted-foreground" dir="ltr">{stock.symbol}</span>
                        </Link>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Desktop Nav */}
        <nav className="hidden xl:flex items-center gap-6 text-sm font-medium">
          {navLinks.map((link) => (
            <Link 
              key={link.href} 
              href={link.href} 
              className="transition-colors hover:text-primary text-foreground/70"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-4">
          {!mounted ? (
            <div className="w-20 h-8" />
          ) : session ? (
            <>
              <span className="hidden sm:inline-block text-sm font-bold text-primary">
                مرحباً، {session.user?.name || 'مستخدم'}
              </span>
              <button 
                onClick={() => signOut({ callbackUrl: '/' })}
                className="hidden sm:flex items-center gap-1 text-sm font-medium text-foreground/60 hover:text-destructive transition-colors"
                title="تسجيل الخروج"
              >
                <LogOut className="h-4 w-4" /> خروج
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="hidden sm:block text-sm font-medium text-foreground/60 hover:text-foreground transition-colors">
                تسجيل الدخول
              </Link>
              <Link href="/register" className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-bold hover:bg-primary/90 transition-all shadow-md shadow-primary/20 hover:scale-105 active:scale-95">
                اشترك الآن
              </Link>
            </>
          )}
          
          {/* Mobile Menu Toggle */}
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className="xl:hidden p-2 rounded-md hover:bg-muted transition-colors"
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {isOpen && (
        <div className="fixed inset-0 top-16 z-[90] xl:hidden">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
          
          {/* Menu Content */}
          <nav className="absolute top-0 right-0 bottom-0 w-72 bg-card border-l border-border p-6 flex flex-col gap-1 shadow-2xl animate-in slide-in-from-right duration-300">
            {navLinks.map((link) => (
              <Link 
                key={link.href} 
                href={link.href}
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-base font-bold transition-all hover:bg-primary/10 hover:text-primary group"
              >
                <div className="p-2 rounded-lg bg-muted group-hover:bg-primary/20 transition-colors">
                  {link.icon}
                </div>
                {link.label}
              </Link>
            ))}
            <div className="mt-auto pt-6 border-t border-border flex flex-col gap-3">
              {!mounted ? (
                <div className="w-full h-10" />
              ) : session ? (
                <>
                  <div className="text-center py-2 text-sm text-primary font-bold">
                    مرحباً، {session.user?.name}
                  </div>
                  <button 
                    onClick={() => signOut({ callbackUrl: '/' })}
                    className="w-full py-4 bg-destructive/10 text-destructive rounded-xl font-bold hover:bg-destructive/20 transition-colors flex justify-center items-center gap-2"
                  >
                    <LogOut className="h-4 w-4" /> تسجيل الخروج
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" onClick={() => setIsOpen(false)} className="w-full py-3 text-center font-bold text-foreground/70 hover:text-foreground">
                    تسجيل الدخول
                  </Link>
                  <Link href="/register" onClick={() => setIsOpen(false)} className="w-full py-4 bg-primary text-primary-foreground rounded-xl font-bold flex justify-center">
                    إنشاء حساب
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
