import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Resend } from "resend";
import yahooFinance from "yahoo-finance2";

// Initialize Resend with your API key
const resend = new Resend(process.env.RESEND_API_KEY);

export async function GET(req: Request) {
  try {
    // 1. Verify Cron Secret to prevent unauthorized access
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized cron execution" }, { status: 401 });
    }

    // 2. Fetch users who have enabled alerts and have PRO or ELITE tier
    const users = await prisma.user.findMany({
      where: {
        emailAlertsEnabled: true,
        subscriptionTier: { in: ["PRO", "ELITE"] },
        // Ensure we don't send multiple times a day
        OR: [
          { lastEmailSentAt: null },
          { lastEmailSentAt: { lt: new Date(Date.now() - 20 * 60 * 60 * 1000) } } // Sent at least 20 hours ago
        ]
      },
      include: {
        watchlists: {
          include: { items: true }
        }
      }
    });

    if (users.length === 0) {
      return NextResponse.json({ message: "No users need notifications today." });
    }

    // 3. Collect all unique symbols to minimize API calls to Yahoo Finance
    const allSymbols = new Set<string>();
    users.forEach(user => {
      user.watchlists.forEach(list => {
        list.items.forEach(item => {
          allSymbols.add(item.symbol);
        });
      });
    });

    if (allSymbols.size === 0) {
      return NextResponse.json({ message: "No symbols in watchlists." });
    }

    // 4. Fetch market data for all symbols
    const symbolsArray = Array.from(allSymbols);
    const quotes = await yahooFinance.quote(symbolsArray);
    
    // Create a lookup map
    const marketData: Record<string, any> = {};
    for (const quote of quotes) {
      marketData[quote.symbol] = {
        price: quote.regularMarketPrice,
        change: quote.regularMarketChange,
        changePercent: quote.regularMarketChangePercent,
        name: quote.longName || quote.shortName || quote.symbol
      };
    }

    let emailsSent = 0;

    // 5. Generate and send emails for each user
    for (const user of users) {
      if (!user.email) continue;

      let emailHtml = `
        <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px; background-color: #f9f9f9;">
          <h2 style="color: #2962FF; text-align: center;">الملخص اليومي لأسهمك 📊</h2>
          <p style="font-size: 16px; color: #333;">أهلاً ${user.name || "عزيزي المتداول"}،</p>
          <p style="font-size: 14px; color: #555;">هذا ملخص بأداء أسهمك في قوائم المراقبة بعد إغلاق جلسة اليوم:</p>
      `;

      let hasData = false;

      user.watchlists.forEach(list => {
        if (list.items.length === 0) return;
        
        hasData = true;
        emailHtml += `
          <div style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
            <h3 style="margin-top: 0; color: #444; border-bottom: 2px solid #eee; padding-bottom: 5px;">${list.name}</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="text-align: right; font-size: 12px; color: #888;">
                  <th style="padding: 8px 0; border-bottom: 1px solid #eee;">الشركة</th>
                  <th style="padding: 8px 0; border-bottom: 1px solid #eee;">السعر</th>
                  <th style="padding: 8px 0; border-bottom: 1px solid #eee;">التغير</th>
                </tr>
              </thead>
              <tbody>
        `;

        list.items.forEach(item => {
          const sData = marketData[item.symbol];
          if (!sData) return;

          const isUp = sData.changePercent > 0;
          const color = isUp ? "#10B981" : sData.changePercent < 0 ? "#EF4444" : "#6B7280";
          const sign = isUp ? "+" : "";
          const cleanSymbol = item.symbol.replace('.SR', '');

          emailHtml += `
            <tr>
              <td style="padding: 10px 0; font-weight: bold; color: #333; border-bottom: 1px solid #f5f5f5;">
                ${sData.name} <span style="color: #999; font-size: 11px;">(${cleanSymbol})</span>
              </td>
              <td dir="ltr" style="padding: 10px 0; font-weight: bold; border-bottom: 1px solid #f5f5f5;">${sData.price.toFixed(2)}</td>
              <td dir="ltr" style="padding: 10px 0; font-weight: bold; color: ${color}; border-bottom: 1px solid #f5f5f5;">
                ${sign}${sData.changePercent.toFixed(2)}%
              </td>
            </tr>
          `;
        });

        emailHtml += `
              </tbody>
            </table>
          </div>
        `;
      });

      emailHtml += `
          <div style="text-align: center; margin-top: 30px;">
            <a href="https://tasistock.com/watchlists" style="background-color: #2962FF; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              فتح منصة التداول
            </a>
          </div>
          <p style="font-size: 12px; color: #aaa; text-align: center; margin-top: 20px;">
            يمكنك إيقاف هذه الإشعارات في أي وقت من إعدادات قائمة المراقبة.
          </p>
        </div>
      `;

      if (hasData) {
        // Send email
        await resend.emails.send({
          from: "SaudiStock <noreply@tasistock.com>",
          to: [user.email],
          subject: "📊 الملخص اليومي لأداء أسهمك",
          html: emailHtml,
        });
        
        emailsSent++;

        // Update last notified time
        await prisma.user.update({
          where: { id: user.id },
          data: { lastEmailSentAt: new Date() }
        });
      }
    }

    return NextResponse.json({ success: true, emailsSent });
  } catch (error) {
    console.error("Cron Error:", error);
    return NextResponse.json({ error: "Failed to run cron" }, { status: 500 });
  }
}
