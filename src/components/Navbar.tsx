"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, Building2, Globe, LayoutDashboard, BarChart3, Filter, Bell, Newspaper, Users, Zap, Shield, Settings } from "lucide-react";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  const navLinks = [
    { href: "/", label: "الرئيسية", icon: <LayoutDashboard className="h-4 w-4" /> },
    { href: "/markets/saudi", label: "السوق", icon: <Globe className="h-4 w-4" /> },
    { href: "/screener", label: "الفلاتر", icon: <Filter className="h-4 w-4" /> },
    { href: "/watchlists", label: "المراقبة", icon: <Bell className="h-4 w-4" /> },
    { href: "/news", label: "الأخبار", icon: <Newspaper className="h-4 w-4" /> },
    { href: "/community", label: "المجتمع", icon: <Users className="h-4 w-4" /> },
    { href: "/ai-analysis", label: "تحليل AI", icon: <Zap className="h-4 w-4" /> },
    { href: "/subscriptions", label: "الاشتراكات", icon: <Shield className="h-4 w-4" /> },
    { href: "/admin", label: "الإدارة", icon: <Settings className="h-4 w-4 text-destructive" /> },
  ];

  return (
    <header className="sticky top-0 z-[100] w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center font-bold text-primary-foreground shadow-lg shadow-primary/20">
            S
          </div>
          <span className="font-bold text-lg tracking-tight hidden sm:inline-block">منصة ذكاء الأسهم</span>
          <span className="font-bold text-lg tracking-tight sm:hidden">ذكاء الأسهم</span>
        </Link>

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
          <button className="hidden sm:block text-sm font-medium text-foreground/60 hover:text-foreground transition-colors">
            تسجيل الدخول
          </button>
          <button className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-bold hover:bg-primary/90 transition-all shadow-md shadow-primary/20 hover:scale-105 active:scale-95">
            اشترك الآن
          </button>
          
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
              <button className="w-full py-3 text-center font-bold text-foreground/70 hover:text-foreground">
                تسجيل الدخول
              </button>
              <button className="w-full py-4 bg-primary text-primary-foreground rounded-xl font-bold">
                اشترك الآن مجاناً
              </button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
