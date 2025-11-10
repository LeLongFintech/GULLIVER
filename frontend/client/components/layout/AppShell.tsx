// components/layout/AppShell.tsx
import { useState } from "react";
import TopBar from "./TopBar";
import HomePage from "@/components/pages/Home";
import AnalysisPage from "@/components/pages/Analysis";

export default function AppShell() {
  const [tab, setTab] = useState<"home" | "analysis">("home");

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 relative overflow-hidden">
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/3 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-cyan-500/3 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "2s" }} />
        <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-blue-500/3 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "4s" }} />
      </div>
      <div className="fixed inset-0 pointer-events-none opacity-[0.015]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,_rgb(148_163_184)_1px,_transparent_0)] bg-[size:40px_40px]" />
      </div>

      {/* Top bar */}
      <TopBar value={tab} onChange={setTab} />

      {/* Content */}
      <main className="relative z-10">
        {tab === "home" ? <HomePage /> : <AnalysisPage />}
      </main>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-slate-900 to-slate-800 border-t border-slate-700 py-8 mt-12 relative z-10">
        <div className="container mx-auto text-center">
          <p className="text-slate-400">© 2025 GULLIVER - Nền tảng phân tích cổ phiếu thông minh</p>
        </div>
      </footer>
    </div>
  );
}