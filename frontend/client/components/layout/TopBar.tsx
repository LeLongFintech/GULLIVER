// components/layout/TopBar.tsx
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp } from "lucide-react";

type Props = {
  value: "home" | "analysis";
  onChange: (v: "home" | "analysis") => void;
};

export default function TopBar({ value, onChange }: Props) {
  return (
    <header className="sticky top-0 z-50 bg-gradient-to-r from-slate-900/80 to-slate-800/80 backdrop-blur border-b border-slate-700">
      <div className="container mx-auto flex items-center justify-between py-3">
        {/* Logo & brand */}
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold tracking-wide">GULLIVER</span>
        </div>

        {/* Tabs */}
        <Tabs value={value} onValueChange={(v) => onChange(v as "home" | "analysis")}>
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="home">Trang chủ</TabsTrigger>
            <TabsTrigger value="analysis">Phân tích</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
    </header>
  );
}