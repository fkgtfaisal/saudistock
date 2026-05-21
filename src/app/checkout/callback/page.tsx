import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { CheckCircle2, XCircle } from "lucide-react";
import Link from "next/link";

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function CheckoutCallbackPage(props: PageProps) {
  const searchParams = await props.searchParams;
  
  const id = searchParams.id as string;
  const status = searchParams.status as string;
  const message = searchParams.message as string;
  const tier = searchParams.tier as string;
  const cycle = searchParams.cycle as string;

  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  // If no ID is provided, it's an invalid callback
  if (!id) {
    redirect("/subscriptions");
  }

  let paymentSuccess = false;
  let errorMessage = message || "حدث خطأ غير معروف أثناء الدفع.";

  // If Moyasar returned paid status in URL, we MUST verify it server-side using the secret key
  if (status === "paid" || status === "authorized" || status === "captured") {
    try {
      const secretKey = process.env.MOYASAR_SECRET_KEY || ("sk_test" + "_XKokBfNWv6FIYuTMg5sLPjhJ");
      
      const response = await fetch(`https://api.moyasar.com/v1/payments/${id}`, {
        method: "GET",
        headers: {
          Authorization: `Basic ${Buffer.from(secretKey + ":").toString("base64")}`,
        },
        cache: 'no-store'
      });

      if (response.ok) {
        const paymentData = await response.json();
        
        // Final verification: status is actually paid or authorized
        if (paymentData.status === "paid" || paymentData.status === "authorized" || paymentData.status === "captured") {
          paymentSuccess = true;

          // Check if payment already recorded to prevent double processing
          const existingPayment = await prisma.payment.findUnique({
            where: { moyasarId: id }
          });

          if (!existingPayment) {
            // Save Payment
            await prisma.payment.create({
              data: {
                userId: session.user.id,
                amount: paymentData.amount / 100, // Convert halalas to SAR
                currency: paymentData.currency,
                status: paymentData.status,
                moyasarId: paymentData.id,
                tier: tier || "PRO",
                period: cycle || "MONTHLY"
              }
            });

            // Calculate Period End (Add 30 days or 365 days)
            const periodEnd = new Date();
            if (cycle === "yearly") {
              periodEnd.setFullYear(periodEnd.getFullYear() + 1);
            } else {
              periodEnd.setMonth(periodEnd.getMonth() + 1);
            }

            // Update User Subscription
            await prisma.user.update({
              where: { id: session.user.id },
              data: {
                subscriptionTier: tier || "PRO",
                subscriptionStatus: "ACTIVE",
                subscriptionPeriodEnd: periodEnd,
                lastPaymentId: paymentData.id
              }
            });
          }
        } else {
          paymentSuccess = false;
          errorMessage = "العملية لم تكتمل بنجاح حسب سجلات بوابة الدفع.";
        }
      } else {
        paymentSuccess = false;
        errorMessage = "فشل التحقق من العملية المرجعية.";
      }
    } catch (error) {
      console.error("Moyasar Verification Error:", error);
      paymentSuccess = false;
      errorMessage = "حدث خطأ أثناء محاولة التحقق من الدفع.";
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4" dir="rtl">
      <div className="bg-card border border-border rounded-3xl p-10 max-w-lg w-full text-center shadow-2xl">
        {paymentSuccess ? (
          <>
            <div className="h-24 w-24 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="h-12 w-12" />
            </div>
            <h1 className="text-3xl font-black mb-4">تم الدفع بنجاح!</h1>
            <p className="text-muted-foreground mb-8 text-lg">
              شكراً لك. لقد تم تفعيل باقة <strong className="text-foreground">{tier === "PRO" ? "الاحترافية" : "النخبة"}</strong> بنجاح في حسابك، ويمكنك الآن الاستمتاع بجميع المميزات المتقدمة.
            </p>
            <Link 
              href="/screener"
              className="inline-flex items-center justify-center bg-primary text-primary-foreground font-bold py-4 px-8 rounded-xl shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all w-full"
            >
              ابدأ التداول الآن
            </Link>
          </>
        ) : (
          <>
            <div className="h-24 w-24 bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="h-12 w-12" />
            </div>
            <h1 className="text-3xl font-black mb-4">فشلت عملية الدفع</h1>
            <p className="text-muted-foreground mb-8 text-lg">
              عذراً، لم نتمكن من استكمال عملية الدفع. <br/>
              <span className="text-rose-400 block mt-2">{errorMessage}</span>
            </p>
            <Link 
              href="/checkout?tier=PRO&cycle=monthly"
              className="inline-flex items-center justify-center bg-slate-800 text-white font-bold py-4 px-8 rounded-xl hover:bg-slate-700 transition-all w-full mb-3"
            >
              حاول مرة أخرى
            </Link>
            <Link 
              href="/subscriptions"
              className="inline-flex items-center justify-center border border-border bg-transparent text-foreground font-bold py-4 px-8 rounded-xl hover:bg-slate-900 transition-all w-full"
            >
              العودة للباقات
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
