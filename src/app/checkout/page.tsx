"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Shield, Loader2, CreditCard } from "lucide-react";
import Script from "next/script";

declare global {
  interface Window {
    Moyasar: any;
  }
}

export default function CheckoutPage() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();

  const tier = searchParams.get("tier");
  const cycle = searchParams.get("cycle");

  const [mounted, setMounted] = useState(false);
  const [amount, setAmount] = useState(0);
  const [description, setDescription] = useState("");
  const [scriptLoaded, setScriptLoaded] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/subscriptions");
      return;
    }

    if (!tier || !cycle || status === "loading") return;

    // Calculate amount based on tier and cycle (Amount is in Halalas for Moyasar)
    let calculatedAmount = 0;
    let desc = "";

    if (tier === "PRO") {
      calculatedAmount = cycle === "monthly" ? 99 : 990;
      desc = `باقة الاحترافية (Pro) - ${cycle === "monthly" ? "اشتراك شهري" : "اشتراك سنوي"}`;
    } else if (tier === "ELITE") {
      calculatedAmount = cycle === "monthly" ? 249 : 2490;
      desc = `باقة النخبة (Elite) - ${cycle === "monthly" ? "اشتراك شهري" : "اشتراك سنوي"}`;
    } else {
      router.push("/subscriptions");
      return;
    }

    setAmount(calculatedAmount * 100); // Convert SAR to Halalas
    setDescription(desc);
  }, [tier, cycle, status, router]);

  useEffect(() => {
    if (amount > 0 && scriptLoaded && typeof window !== "undefined" && window.Moyasar) {
      // Check if it's already initialized
      const formContainer = document.querySelector(".mysr-form");
      if (formContainer && formContainer.innerHTML.trim() !== "") return;

      window.Moyasar.init({
        element: ".mysr-form",
        amount: amount,
        currency: "SAR",
        description: description,
        publishable_api_key: process.env.NEXT_PUBLIC_MOYASAR_PUBLISHABLE_KEY || "pk_test_vgXbZ...", // Use env or fallback for testing
        callback_url: `${window.location.origin}/checkout/callback?tier=${tier}&cycle=${cycle}`,
        methods: ["creditcard", "stcpay", "applepay"],
        metadata: {
          userId: session?.user?.id,
          tier: tier,
          cycle: cycle
        }
      });
    }
  }, [amount, scriptLoaded, description, tier, cycle, session]);

  if (!mounted || status === "loading" || !amount) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-20 px-4 flex justify-center items-center" dir="rtl">
      
      {/* Load Moyasar CSS & JS */}
      <link rel="stylesheet" href="https://cdn.moyasar.com/mpf/1.14.0/moyasar.css" />
      <Script 
        src="https://cdn.moyasar.com/mpf/1.14.0/moyasar.js" 
        strategy="lazyOnload"
        onLoad={() => setScriptLoaded(true)}
      />

      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        
        {/* Order Summary */}
        <div className="bg-card border border-border rounded-2xl p-8 shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Shield className="h-5 w-5" />
            </div>
            <h2 className="text-2xl font-bold">ملخص الطلب</h2>
          </div>
          
          <div className="space-y-4 mb-8">
            <div className="flex justify-between items-center py-3 border-b border-border/50">
              <span className="text-muted-foreground">الباقة المختارة</span>
              <span className="font-bold">{tier === "PRO" ? "الاحترافية (Pro)" : "النخبة (Elite)"}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-border/50">
              <span className="text-muted-foreground">فترة الاشتراك</span>
              <span className="font-bold">{cycle === "monthly" ? "شهري" : "سنوي"}</span>
            </div>
            <div className="flex justify-between items-center py-3">
              <span className="text-lg font-bold">الإجمالي المراد دفعه</span>
              <span className="text-3xl font-black text-primary font-mono">{(amount / 100).toLocaleString()} <span className="text-sm text-foreground font-normal">ريال</span></span>
            </div>
          </div>

          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl text-sm flex gap-3">
            <Shield className="h-5 w-5 flex-shrink-0" />
            <span>جميع المدفوعات مشفرة وآمنة بنسبة 100٪. لن يتم حفظ تفاصيل بطاقتك لدينا أبداً.</span>
          </div>
        </div>

        {/* Moyasar Payment Form Container */}
        <div className="bg-card border border-border rounded-2xl p-8 shadow-xl relative min-h-[400px]">
           <div className="flex items-center gap-3 mb-8 border-b border-border/50 pb-4">
              <CreditCard className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold">بيانات الدفع</h2>
           </div>
           
           {/* The div where Moyasar will inject the form */}
           <div className="mysr-form w-full"></div>
        </div>

      </div>
    </div>
  );
}
