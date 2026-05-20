import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { symbol, openaiApiKey } = body;

    if (!symbol) {
      return NextResponse.json({ error: "رمز السهم مطلوب." }, { status: 400 });
    }

    const host = req.headers.get("host") || "localhost:3000";
    const protocol = host.includes("localhost") ? "http" : "https";

    // Fetch quote and summary data from existing internal APIs
    const quoteUrl = `${protocol}://${host}/api/quote/${symbol}`;
    const summaryUrl = `${protocol}://${host}/api/summary/${symbol}`;

    const [quoteRes, summaryRes] = await Promise.all([
      fetch(quoteUrl, { cache: "no-store" }).catch(() => null),
      fetch(summaryUrl, { cache: "no-store" }).catch(() => null),
    ]);

    const quote = quoteRes && quoteRes.ok ? await quoteRes.json() : null;
    const summary = summaryRes && summaryRes.ok ? await summaryRes.json() : null;

    if (!quote) {
      return NextResponse.json({ error: "فشل جلب بيانات السهم الفورية." }, { status: 502 });
    }

    // Initialize local metrics
    const pe = quote.trailingPE ?? null;
    const eps = quote.eps ?? null;
    const divYield = quote.dividendYield ? (quote.dividendYield * 100).toFixed(2) : null;
    const price = quote.price ?? 0;
    const marketCap = quote.marketCap ?? null;
    const shortName = quote.shortName ?? "سهم سعودي";

    // 1. OpenAI GPT Powered Analysis
    if (openaiApiKey && openaiApiKey.trim().startsWith("sk-")) {
      try {
        const prompt = `أنت خبير مالي محترف ومتخصص في السوق المالي السعودي (تداول). 
قم بإجراء تحليل مالي وفني معمق واحترافي باللغة العربية لسهم "${shortName}" (الرمز: ${symbol}).

فيما يلي بيانات السهم الحالية التي تم جمعها:
- السعر الحالي: ${price} ريال سعودي.
- مكرر الأرباح (P/E Ratio): ${pe ?? "غير متوفر"}.
- ربحية السهم (EPS): ${eps ?? "غير متوفر"}.
- عائد التوزيعات النقدي: ${divYield ?? "غير متوفر"}%.
- القيمة السوقية: ${marketCap ? (marketCap / 1e9).toFixed(2) + " مليار ريال" : "غير متوفر"}.

البيانات المالية التفصيلية المتاحة (قوائم الدخل والميزانية العمومية):
${summary ? JSON.stringify(summary).substring(0, 4000) : "غير متوفرة حالياً"}.

قم بصياغة التقرير بشكل احترافي ومنظم باستخدام Markdown، ويجب أن يحتوي التقرير على الأقسام التالية بوضوح:
1. **التقييم الاستثماري الحالي**: تحليل مكرر الأرباح وربحية السهم وهل السعر الحالي عادل أم مبالغ فيه.
2. **الأداء المالي والصحة المالية**: قراءة سريعة في هوامش الربحية وهيكل الديون بناءً على البيانات.
3. **التوقعات الفنية والأساسية**: دمج التحليل الفني والأساسي للسهم.
4. **التوصية والتقييم النهائي**: حدد بوضوح التوصية (شراء قوي، شراء، احتفاظ، تجنب/بيع) مع سرد 3 نقاط أساسية تدعم التوصية.`;

        const response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${openaiApiKey}`,
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
              { role: "system", content: "أنت مستشار مالي ذكي للسوق السعودي تلتزم بالاحترافية والدقة وتكتب بلغة عربية سليمة." },
              { role: "user", content: prompt },
            ],
            temperature: 0.7,
          }),
        });

        if (response.ok) {
          const aiData = await response.json();
          const analysisMarkdown = aiData.choices[0].message.content;
          return NextResponse.json({
            mode: "AI_GPT",
            symbol,
            shortName,
            analysis: analysisMarkdown,
          });
        } else {
          const errText = await response.text();
          console.error("OpenAI API error response:", errText);
          // Fallback to local analysis if OpenAI call fails
        }
      } catch (err) {
        console.error("Failed to connect to OpenAI API, using local engine instead:", err);
      }
    }

    // 2. Local Expert Financial Engine (Auto Mode)
    // Calculate simple financial ratios and benchmarks
    let score = 50; // out of 100
    const reasons: string[] = [];
    const risks: string[] = [];

    // Valuation Analysis
    if (pe !== null) {
      if (pe < 15) {
        score += 15;
        reasons.push(`مكرر أرباح منخفض ومغري للاستثمار (${pe.toFixed(2)}) وهو أقل من متوسط السوق.`);
      } else if (pe >= 15 && pe <= 28) {
        score += 5;
        reasons.push(`مكرر أرباح معتدل وفي النطاق الطبيعي للنمو (${pe.toFixed(2)}).`);
      } else {
        score -= 10;
        risks.push(`مكرر أرباح مرتفع (${pe.toFixed(2)}) قد يشير إلى تضخم في السعر الحالي أو تطلعات نمو عالية جداً.`);
      }
    } else {
      risks.push("الشركة تسجل خسائر تشغيلية أو أن مكرر الأرباح غير متوفر حالياً.");
    }

    // Dividend Yield Analysis
    if (divYield !== null) {
      const dy = parseFloat(divYield);
      if (dy > 4.5) {
        score += 15;
        reasons.push(`عائد توزيعات نقدي ممتاز ومستقر (${divYield}%) مما يجعله سهم عوائد بامتياز.`);
      } else if (dy > 1.5) {
        score += 8;
        reasons.push(`توزيعات نقدية جيدة تدعم جاذبية السهم للمدى الطويل (${divYield}%).`);
      }
    } else {
      reasons.push("الشركة تفضل إعادة استثمار أرباحها لتمويل النمو بدلاً من توزيعها.");
    }

    // Financial Solvency & Health Analysis
    if (summary) {
      const balanceSheet = summary.balance?.[0];
      if (balanceSheet) {
        const totalLiab = balanceSheet.totalLiab?.raw ?? 0;
        const totalEquity = balanceSheet.totalStockholderEquity?.raw ?? 0;
        const currentAssets = balanceSheet.totalCurrentAssets?.raw ?? 0;
        const currentLiab = balanceSheet.totalCurrentLiabilities?.raw ?? 0;

        // Debt-to-Equity Ratio
        if (totalEquity > 0) {
          const deRatio = totalLiab / totalEquity;
          if (deRatio < 0.8) {
            score += 10;
            reasons.push("هيكل ديون متزن وملاءة مالية قوية؛ إجمالي الالتزامات يمثل نسبة منخفضة من حقوق المساهمين.");
          } else if (deRatio > 1.8) {
            score -= 8;
            risks.push("نسبة ديون إلى حقوق مساهمين مرتفعة، مما قد يشكل ضغطاً مالياً في بيئات الفائدة المرتفعة.");
          }
        }

        // Current Ratio (Liquidity)
        if (currentLiab > 0) {
          const currentRatio = currentAssets / currentLiab;
          if (currentRatio > 1.5) {
            score += 8;
            reasons.push("سيولة ممتازة؛ الأصول المتداولة قادرة على تغطية الالتزامات قصيرة الأجل بأكثر من 1.5 مرة.");
          } else if (currentRatio < 1.0) {
            score -= 10;
            risks.push("مؤشر السيولة السريعة ضعيف؛ الأصول المتداولة لا تغطي الالتزامات قصيرة الأجل بالكامل.");
          }
        }
      }
    }

    // Determine final recommendation rating
    let rating = "احتفاظ";
    let color = "text-warning";
    if (score >= 75) {
      rating = "شراء قوي";
      color = "text-success";
    } else if (score >= 60) {
      rating = "شراء";
      color = "text-success";
    } else if (score >= 40) {
      rating = "احتفاظ";
      color = "text-warning";
    } else {
      rating = "تجنب / بيع";
      color = "text-destructive";
    }

    // Construct highly formatted local analysis markdown
    const localAnalysisMarkdown = `### 📊 تقرير التحليل المالي والأساسي الخبير لسهم **${shortName}** (${symbol})

تم توليد هذا التقرير تلقائياً بواسطة **محرك التحليل المالي المحلي الخبير** عبر فحص البيانات المالية الحالية ونسب السيولة والتقييم:

---

#### 1. التقييم الاستثماري والأساسي 🔍
* **سعر السهم الحالي:** **${price.toFixed(2)} ريال سعودي**
* **مكرر الأرباح (P/E):** **${pe !== null ? pe.toFixed(2) + " مرة" : "غير متوفر (خسائر أو لا يوجد أرباح)"}**
* **ربحية السهم (EPS):** **${eps !== null ? eps.toFixed(2) + " ريال" : "غير متوفر"}**
* **عائد توزيع الأرباح:** **${divYield !== null ? divYield + "%" : "لا يوزع أرباح حالياً"}**
* **القيمة السوقية:** **${marketCap ? (marketCap / 1e9).toFixed(2) + " مليار ريال" : "غير متوفرة"}**

---

#### 2. نقاط القوة والمحفزات الاستثمارية ✅
${reasons.map((r) => `* **${r}**`).join("\n")}
${reasons.length === 0 ? "* لا توجد إشارات قوة استثنائية ظاهرة في البيانات المالية الحالية." : ""}

---

#### 3. المخاطر ونقاط الضعف ⚠️
${risks.map((r) => `* **${r}**`).join("\n")}
${risks.length === 0 ? "* لا توجد مخاطر هيكلية واضحة مستنتجة من المؤشرات المالية المباشرة." : ""}

---

#### 4. التوصية والتقييم النهائي 🎯
بناءً على التقييم الكلي للملاءة المالية ومكررات الأرباح والتوزيعات، يحصل السهم على تقييم **(${score}/100)**:

### 📢 التوصية الحالية: <span class="${color} font-bold text-xl">${rating}</span>

**أسباب التوصية:**
1. السهم يظهر **${score >= 60 ? "مستويات أمان مالي ممتازة ومكررات مغرية" : score >= 40 ? "توازناً بين الأرباح والمخاطر دون محفزات قوية حالية" : "مخاطر مرتفعة بسبب تضخم التقييم أو ضعف الملاءة والسيولة"}**.
2. سيولة الشركة وقدرتها على تغطية الالتزامات تعد **${score >= 60 ? "قوية جداً وتوفر حماية جيدة" : "مقبولة وتتطلب متابعة للتقارير القادمة"}**.
3. توافق عائد التوزيعات ومكرر الربحية يقدم **${pe && pe < 20 ? "نقطة دخول مناسبة للمستثمر طويل الأجل" : "فرصة للاحتفاظ بالسهم حالياً وانتظار تقارير الأرباح الربعية القادمة"}**.`;

    return NextResponse.json({
      mode: "LOCAL_EXPERT",
      symbol,
      shortName,
      analysis: localAnalysisMarkdown,
      score,
      rating,
    });

  } catch (error: any) {
    console.error("AI Analysis API error:", error);
    return NextResponse.json({ error: "حدث خطأ أثناء معالجة التحليل المالي.", details: error.message }, { status: 500 });
  }
}
