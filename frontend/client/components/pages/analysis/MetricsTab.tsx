// components/pages/analysis/MetricsTab.tsx

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type IndicatorRow = {
  "Mã": string;
  "Năm": string;
  "P/E": string;
  "P/B": string;
  "EPS": string;
  "BVPS": string;
  "ROE (%)": string;
  "ROA (%)": string;
  "Nợ / Vốn chủ sở hữu (DE)": string;
  "Biên lợi nhuận gộp": string;
  "Biên lợi nhuận ròng": string;
  "Thanh khoản hiện hành": string;
  "Thanh khoản nhanh": string;
  [key: string]: string;
};

// Parse CSV helper (giống Analysis.tsx)
function parseCSV(text: string): { headers: string[]; rows: string[][] } {
  const rows: string[][] = [];
  let current: string[] = [];
  let field = "";
  let inQuotes = false;
  
  const pushField = () => { current.push(field); field = ""; };
  const pushRow = () => { rows.push(current); current = []; };
  
  for (let i = 0; i < text.length; i++) {
    const c = text[i], next = text[i + 1];
    if (inQuotes) {
      if (c === '"' && next === '"') { field += '"'; i++; }
      else if (c === '"') { inQuotes = false; }
      else { field += c; }
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ",") pushField();
      else if (c === "\n") { pushField(); pushRow(); }
      else if (c !== "\r") field += c;
    }
  }
  
  pushField(); 
  if (current.length) pushRow();
  const headers = rows.shift() || [];
  return { headers, rows };
}

function toObjects(headers: string[], rows: string[][]): Record<string, string>[] {
  return rows.map((r) => {
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => { obj[h] = r[i] ?? ""; });
    return obj;
  });
}

function formatValue(val: string | number | undefined): string {
  // Nếu không có dữ liệu hoặc là giá trị không hợp lệ → trả về "0"
  if (!val || val === "" || val === "nan" || val === "inf") return "0";
  
  const str = String(val).trim();
  const num = parseFloat(str.replace(/,/g, ""));
  
  // Nếu parse không thành công → trả về "0"
  if (isNaN(num)) return "0";
  
  // Format theo từng loại chỉ số
  if (Math.abs(num) > 1000000) {
    return num.toLocaleString('en-US', { maximumFractionDigits: 0 });
  } else if (Math.abs(num) < 100) {
    return num.toLocaleString('en-US', { maximumFractionDigits: 2 });
  } else {
    return num.toLocaleString('en-US', { maximumFractionDigits: 1 });
  }
}

export default function MetricsTab({ 
  selectedSymbol 
}: { 
  selectedSymbol: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [indicators, setIndicators] = useState<IndicatorRow[]>([]);
  
  const INDICATORS_URL = "/Indicators.csv";
  
  useEffect(() => {
    const loadIndicators = async () => {
      if (!selectedSymbol) {
        setIndicators([]);
        return;
      }
      
      setLoading(true);
      setError("");
      
      try {
        const res = await fetch(INDICATORS_URL, { cache: "no-store" });
        if (!res.ok) throw new Error("Không thể tải file Indicators.csv");
        
        const text = await res.text();
        const { headers, rows } = parseCSV(text);
        const objects = toObjects(headers, rows) as IndicatorRow[];
        
        // Filter theo mã và năm 2020-2024
        const filtered = objects.filter(row => {
          const ma = (row["Mã"] || row["Ma"] || "").trim().toUpperCase();
          const nam = parseInt(row["Năm"] || row["Nam"] || "0");
          return ma === selectedSymbol.toUpperCase() && nam >= 2020 && nam <= 2024;
        });
        
        // Sort theo năm
        filtered.sort((a, b) => {
          const yearA = parseInt(a["Năm"] || a["Nam"] || "0");
          const yearB = parseInt(b["Năm"] || b["Nam"] || "0");
          return yearA - yearB;
        });
        
        setIndicators(filtered);
        
        if (filtered.length === 0) {
          setError(`Không tìm thấy dữ liệu chỉ số cho mã ${selectedSymbol}`);
        }
        
      } catch (e: any) {
        setError(e?.message || "Có lỗi khi tải dữ liệu Indicators.csv");
        setIndicators([]);
      } finally {
        setLoading(false);
      }
    };
    
    loadIndicators();
  }, [selectedSymbol]);
  
  // Danh sách chỉ số cần hiển thị
  const metricsToShow = [
    { key: "P/E", label: "P/E (Giá/Thu nhập)" },
    { key: "P/B", label: "P/B (Giá/Sổ sách)" },
    { key: "EPS", label: "EPS (Thu nhập/Cổ phiếu)" },
    { key: "BVPS", label: "BVPS (Giá trị sổ sách/CP)" },
    { key: "ROE (%)", label: "ROE (%)" },
    { key: "ROA (%)", label: "ROA (%)" },
    { key: "Nợ / Vốn chủ sở hữu (DE)", label: "Nợ/VCSH (D/E)" },
    { key: "Biên lợi nhuận gộp", label: "Biên lợi nhuận gộp" },
    { key: "Biên lợi nhuận ròng", label: "Biên lợi nhuận ròng" },
    { key: "Thanh khoản hiện hành", label: "Thanh khoản hiện hành" },
    { key: "Thanh khoản nhanh", label: "Thanh khoản nhanh" },
  ];
  
  const years = indicators.map(row => row["Năm"] || row["Nam"] || "");
  
  return (
    <Card className="bg-slate-900/50 border-slate-700">
      <CardHeader>
        <CardTitle className="text-slate-100">Chỉ số tài chính</CardTitle>
        <CardDescription className="text-slate-400">
          {loading 
            ? "Đang tải dữ liệu..." 
            : years?.length 
              ? `Giai đoạn ${years[0]} – ${years[years.length - 1]}`
              : "Chưa có dữ liệu"
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error ? (
          <div className="text-amber-400 text-sm">⚠ {error}</div>
        ) : loading ? (
          <div className="text-slate-400 text-sm">Đang xử lý dữ liệu…</div>
        ) : indicators.length === 0 ? (
          <div className="text-slate-400 text-sm">Chưa có dữ liệu hiển thị.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left px-4 py-3 font-semibold text-slate-100 sticky left-0 bg-slate-900/80 z-10">
                    CHỈ SỐ
                  </th>
                  {years.map((y, idx) => (
                    <th 
                      key={idx} 
                      className="text-center px-4 py-3 font-semibold text-slate-100"
                    >
                      {y}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {metricsToShow.map((metric, idx) => (
                  <tr 
                    key={idx}
                    className="border-b border-slate-800 hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-slate-200 sticky left-0 bg-slate-900/50 border-r border-slate-700 z-10">
                      {metric.label}
                    </td>
                    {indicators.map((row, yearIdx) => (
                      <td 
                        key={yearIdx}
                        className="text-center px-4 py-3 text-slate-300 tabular-nums"
                      >
                        {formatValue(row[metric.key])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
