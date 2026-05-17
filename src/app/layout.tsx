import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const cairo = Cairo({ 
  subsets: ["arabic", "latin"],
  variable: "--font-cairo",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Saudi Stock Intelligence Platform | منصة ذكاء الأسهم السعودية",
  description: "منصة تحليل ومتابعة الأسهم السعودية المتقدمة. توفر رسوم بيانية، فلاتر، تنبيهات والتحليل المالي لأسواق تداول ونمو.",
};

import { Navbar } from "@/components/Navbar";
import { AuthProvider } from "@/components/AuthProvider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className="dark" suppressHydrationWarning>
      <body className={`${cairo.variable} font-sans antialiased bg-background text-foreground min-h-screen flex flex-col`} suppressHydrationWarning>
        <AuthProvider>
          <Navbar />

          <main className="flex-1 overflow-x-hidden">
            {children}
          </main>
        </AuthProvider>

        <footer className="border-t py-6 md:py-0">
          <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4 md:h-16 text-sm text-muted-foreground">
            <p>
              © {new Date().getFullYear()} منصة ذكاء الأسهم السعودية. جميع الحقوق محفوظة.
            </p>
            <p className="text-xs max-w-lg text-center md:text-right">
              إخلاء مسؤولية: جميع البيانات والتحليلات لأغراض معلوماتية وتعليمية فقط ولا تعد توصية شراء أو بيع.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
