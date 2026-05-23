"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Lock, Mail } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      redirect: false,
      email,
      password,
    });

    if (result?.error) {
      setError("البريد الإلكتروني أو كلمة المرور غير صحيحة");
      setLoading(false);
    } else {
      // Use window.location.href to force a full document load, ensuring iOS Safari commits cookies first
      window.location.href = "/";
    }
  };

  return (
    <div className="min-h-screen bg-[#0d1117] flex flex-col justify-center py-12 sm:px-6 lg:px-8" dir="rtl">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
          تسجيل الدخول
        </h2>
        <p className="mt-2 text-center text-sm text-gray-400">
          أو{" "}
          <Link href="/register" className="font-medium text-[#2962FF] hover:text-[#2962FF]/80 transition-colors">
            إنشاء حساب جديد
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-[#161b22] py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-[#30363d]">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-md text-sm text-center">
                {error}
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-300">البريد الإلكتروني</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 right-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-500 mr-2" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-[#0d1117] border border-[#30363d] text-white block w-full pr-10 py-2 rounded-md focus:outline-none focus:ring-[#2962FF] focus:border-[#2962FF] sm:text-sm"
                  placeholder="name@example.com"
                  dir="ltr"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300">كلمة المرور</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 right-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-500 mr-2" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-[#0d1117] border border-[#30363d] text-white block w-full pr-10 py-2 rounded-md focus:outline-none focus:ring-[#2962FF] focus:border-[#2962FF] sm:text-sm"
                  placeholder="••••••••"
                  dir="ltr"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#2962FF] hover:bg-[#2962FF]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2962FF] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? "جاري الدخول..." : "دخول المنصة"}
              </button>
            </div>
          </form>

          <div className="mt-6">
             <Link href="/" className="flex items-center justify-center text-sm text-gray-400 hover:text-white transition-colors">
               <ArrowRight className="h-4 w-4 ml-1" /> العودة للرئيسية
             </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
