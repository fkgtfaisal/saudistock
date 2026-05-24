"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Loader2, Sparkles, AlertCircle } from "lucide-react";

type Message = {
  role: "user" | "assistant";
  content: string;
};

export function ChartAICopilot({ symbol, onClose }: { symbol: string, onClose: () => void }) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: `مرحباً بك! أنا مساعدك الذكي 🤖. كيف يمكنني مساعدتك في تحليل سهم ${symbol.replace(".SR", "")} اليوم؟`
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const apiKey = localStorage.getItem("tadawul_openai_key");
      const res = await fetch(`/api/chat/${symbol}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          history: messages,
          openaiApiKey: apiKey
        })
      });

      if (res.ok) {
        const data = await res.json();
        setMessages(prev => [...prev, { role: "assistant", content: data.reply }]);
      } else {
        const data = await res.json();
        setMessages(prev => [...prev, { role: "assistant", content: `❌ عذراً، حدث خطأ: ${data.error}` }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, { role: "assistant", content: "❌ فشل الاتصال بالخادم. تأكد من اتصالك بالإنترنت." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-card/95 backdrop-blur-sm shadow-xl">
      <div className="flex items-center justify-between p-4 border-b border-border bg-slate-900/40 shrink-0">
        <div className="flex items-center gap-2">
          <div className="bg-primary/20 p-2 rounded-xl border border-primary/30">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-extrabold text-foreground text-sm">مساعد الذكاء الاصطناعي</h3>
            <p className="text-[10px] text-muted-foreground font-bold">تحليل فني وأساسي لحظي</p>
          </div>
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-rose-400 transition-colors p-2 rounded-lg hover:bg-slate-800">
          إغلاق
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
        {!localStorage.getItem("tadawul_openai_key") && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 flex gap-3 text-xs mb-4">
            <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
            <p className="text-amber-200">
              لم تقم بإضافة مفتاح OpenAI في صفحة التحليل. المساعد سيعمل بالوضع المحلي المحدود ولن يتمكن من الإجابة المعمقة.
            </p>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div key={idx} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === "user" ? "bg-blue-600 text-white" : "bg-primary text-primary-foreground"}`}>
              {msg.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>
            <div className={`px-4 py-3 rounded-2xl max-w-[85%] text-sm leading-relaxed ${
              msg.role === "user" 
                ? "bg-blue-600 text-white rounded-tr-none" 
                : "bg-slate-800 text-slate-200 border border-border rounded-tl-none"
            }`}>
              {msg.content.split('\n').map((line, i) => (
                <span key={i}>
                  {line}
                  <br />
                </span>
              ))}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="px-4 py-3 rounded-2xl bg-slate-800 text-slate-200 border border-border rounded-tl-none flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              <span className="text-xs font-bold text-muted-foreground animate-pulse">جاري تحليل البيانات...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-border bg-slate-900/40 shrink-0">
        <form onSubmit={sendMessage} className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            placeholder="اسألني عن الدعوم، المقاومات، أو توجه السهم..."
            className="w-full bg-slate-950 border border-border rounded-2xl pr-4 pl-12 py-4 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-foreground disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-primary text-primary-foreground p-2 rounded-xl disabled:opacity-50 transition-all hover:bg-primary/90"
          >
            <Send className="w-4 h-4 rotate-180" />
          </button>
        </form>
      </div>
    </div>
  );
}
