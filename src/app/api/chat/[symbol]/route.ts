import { NextRequest, NextResponse } from "next/server";
import YahooFinanceClass from "yahoo-finance2";

const YF = (YahooFinanceClass as any).default ?? YahooFinanceClass;
const yahooFinance = new YF({ suppressNotices: ["yahooSurvey"] });

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  try {
    const { symbol } = await params;
    const { message, history, openaiApiKey } = await req.json();

    if (!message) {
      return NextResponse.json({ error: "الرسالة فارغة" }, { status: 400 });
    }

    const ticker = symbol.endsWith(".SR") ? symbol : `${symbol}.SR`;

    // Fetch real-time market data to give the AI context
    const [quote, summaryData] = await Promise.all([
      yahooFinance.quote(ticker, {}, { validateResult: false }).catch(() => null),
      yahooFinance.quoteSummary(ticker, {
        modules: ["defaultKeyStatistics", "financialData"],
      }, { validateResult: false }).catch(() => null),
    ]);

    const price = quote?.regularMarketPrice ?? "غير متوفر";
    const change = quote?.regularMarketChangePercent ? (quote.regularMarketChangePercent).toFixed(2) + "%" : "غير متوفر";
    const volume = quote?.regularMarketVolume ?? "غير متوفر";
    const name = quote?.shortName ?? symbol;

    if (!openaiApiKey || !openaiApiKey.startsWith("sk-")) {
      // Local fallback mode if no API key
      return NextResponse.json({
        reply: `(الوضع المحلي) سعر سهم ${name} الآن ${price} والتغير ${change}. للإجابة العميقة حول دعوم ومقاومات السهم يرجى إضافة مفتاح OpenAI في صفحة التحليل.`
      });
    }

    // Call OpenAI API
    const systemPrompt = `أنت مساعد ذكي ومتخصص في سوق الأسهم السعودي، مهمتك مساعدة المستخدم في تحليل سهم ${name} (${symbol}).
بيانات السهم اللحظية الآن:
- السعر: ${price} ريال
- التغير اليومي: ${change}
- حجم التداول: ${volume}

${summaryData ? "بيانات إضافية: مكرر الربح " + (summaryData.defaultKeyStatistics?.forwardPE ?? "غير متوفر") : ""}

أجب بأسلوب احترافي، مباشر، ومختصر باللغة العربية. ركز على التحليل الفني والأساسي ولا تعطِ توصيات شراء/بيع مباشرة صريحة بل قدم مستويات الدعم والمقاومة والفرص.`;

    const openAiMessages = [
      { role: "system", content: systemPrompt },
      ...history.map((msg: any) => ({ role: msg.role, content: msg.content })),
      { role: "user", content: message }
    ];

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: openAiMessages,
        temperature: 0.7,
        max_tokens: 500
      }),
    });

    if (response.ok) {
      const aiData = await response.json();
      return NextResponse.json({ reply: aiData.choices[0].message.content });
    } else {
      const err = await response.json();
      return NextResponse.json({ error: err.error?.message || "فشل الاتصال بـ OpenAI" }, { status: 502 });
    }

  } catch (error: any) {
    console.error("AI Chat API error:", error);
    return NextResponse.json({ error: "حدث خطأ غير متوقع" }, { status: 500 });
  }
}
