// components/pages/analysis/ChartsTab.tsx

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, AreaChart, Area, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart, ReferenceLine } from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

type BalanceSheetRow = {
  "Mã": string;
  "Năm": string;
  " TÀI SẢN NGẮN HẠN": string;
  " TÀI SẢN DÀI HẠN": string;
  " NỢ PHẢI TRẢ": string;
  " VỐN CHỦ SỞ HỮU": string;
  " Nợ ngắn hạn": string;
  " Nợ dài hạn": string;
  [key: string]: string;
};

type IncomeStatementRow = {
  "Mã": string;
  "Năm": string;
  " Doanh thu thuần": string;
  " Cổ đông của Công ty mẹ": string;
  " Chi phí bán hàng": string;
  " Chi phí quản lý doanh  nghiệp": string;
  " Lãi cơ bản trên cổ phiếu": string;
  [key: string]: string;
};

type IndicatorRow = {
  "Mã": string;
  "Năm": string;
  "P/E": string;
  "P/B": string;
  "EPS": string;
  "ROE (%)": string;
  "ROA (%)": string;
  "Nợ / Vốn chủ sở hữu (DE)": string;
  "Biên lợi nhuận gộp": string;
  "Biên lợi nhuận ròng": string;
  "Thanh khoản hiện hành": string;
  "Thanh khoản nhanh": string;
  [key: string]: string;
};

type CashFlowRow = {
  "Mã": string;
  "Năm": string;
  " Lưu chuyển tiền tệ ròng từ các hoạt động sản xuất kinh doanh (TT)": string;
  " Lưu chuyển tiền tệ ròng từ hoạt động đầu tư (TT)": string;
  " Lưu chuyển tiền tệ từ hoạt động tài chính (TT)": string;
  " Tiền chi để mua sắm, xây dựng TSCĐ và các tài sản dài hạn khác (TT)": string;
  " Tiền thu được các khoản đi vay (TT)": string;
  " Tiền trả nợ gốc vay (TT)": string;
  " Cổ tức đã trả (TT)": string;
  [key: string]: string;
};

type AverageIndicatorRow = {
  "Sector": string;
  "Năm": string;
  "P/E": string;
  "P/B": string;
  "ROE (%)": string;
  "ROA (%)": string;
  "Nợ / Vốn chủ sở hữu (DE)": string;
  [key: string]: string;
};

type StockInfoRow = {
  "Symbol": string;
  "Sector": string;
  [key: string]: string;
};

// Parse CSV helper
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

function toNumberSafe(val: string | number | undefined): number {
  if (val == null || val === "") return 0;
  const str = String(val).trim().replace(/,/g, "");
  if (!str || str === "nan" || str === "inf" || str === "NaN") return 0;
  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
}

// Format số cho tooltip
function formatNumber(num: number): string {
  if (num === 0) return "0";
  if (Math.abs(num) >= 1000000000) {
    return (num / 1000000000).toFixed(2) + " tỷ";
  } else if (Math.abs(num) >= 1000000) {
    return (num / 1000000).toFixed(2) + " triệu";
  } else if (Math.abs(num) >= 1000) {
    return (num / 1000).toFixed(2) + " nghìn";
  }
  return num.toFixed(2);
}

// Format cho percentage
function formatPercent(num: number): string {
  return (num * 100).toFixed(2) + "%";
}

// Custom tooltip
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-800/95 border border-slate-600 p-3 rounded-lg shadow-xl">
        <p className="text-slate-200 font-semibold mb-2">Năm {label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: <span className="font-bold">{formatNumber(entry.value)}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// Custom tooltip cho P/E (không format số lớn)
const CustomPETooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-800/95 border border-slate-600 p-3 rounded-lg shadow-xl">
        <p className="text-slate-200 font-semibold mb-2">Năm {label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: <span className="font-bold">{entry.value > 0 ? entry.value.toFixed(2) : "N/A"}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// Custom tooltip cho Pie chart
const CustomPieTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-800/95 border border-slate-600 p-3 rounded-lg shadow-xl">
        <p className="text-slate-200 font-semibold mb-1">{payload[0].name}</p>
        <p className="text-sm text-emerald-400">
          Giá trị: <span className="font-bold">{formatNumber(payload[0].value)}</span>
        </p>
        <p className="text-sm text-cyan-400">
          Tỷ lệ: <span className="font-bold">{payload[0].payload.percent}%</span>
        </p>
      </div>
    );
  }
  return null;
};

// Custom tooltip cho biên lợi nhuận (%)
const CustomPercentTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-800/95 border border-slate-600 p-3 rounded-lg shadow-xl">
        <p className="text-slate-200 font-semibold mb-2">Năm {label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: <span className="font-bold">{formatPercent(entry.value)}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function ChartsTab({ 
  selectedSymbol 
}: { 
  selectedSymbol: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [balanceData, setBalanceData] = useState<BalanceSheetRow[]>([]);
  const [incomeData, setIncomeData] = useState<IncomeStatementRow[]>([]);
  const [indicatorData, setIndicatorData] = useState<IndicatorRow[]>([]);
  const [cashFlowData, setCashFlowData] = useState<CashFlowRow[]>([]);
  const [averageIndicatorData, setAverageIndicatorData] = useState<AverageIndicatorRow[]>([]);
  const [companySector, setCompanySector] = useState<string>("");
  
  const BALANCE_SHEET_URL = "/Balance_sheet.csv";
  const INCOME_STATEMENT_URL = "/Income_statement.csv";
  const INDICATORS_URL = "/Indicators.csv";
  const CASH_FLOW_URL = "/Cash_flow.csv";
  const AVERAGE_INDICATORS_URL = "/Average_indicators.csv";
  const STOCK_INFO_URL = "/Stock_info.csv";
  
  useEffect(() => {
    const loadAllData = async () => {
      if (!selectedSymbol) {
        setBalanceData([]);
        setIncomeData([]);
        setIndicatorData([]);
        setCashFlowData([]);
        setAverageIndicatorData([]);
        setCompanySector("");
        return;
      }
      
      setLoading(true);
      setError("");
      
      try {
        // Load Balance Sheet
        const resBalance = await fetch(BALANCE_SHEET_URL, { cache: "no-store" });
        if (!resBalance.ok) throw new Error("Không thể tải file Balance_sheet.csv");
        const textBalance = await resBalance.text();
        const { headers: headersBalance, rows: rowsBalance } = parseCSV(textBalance);
        const objectsBalance = toObjects(headersBalance, rowsBalance) as BalanceSheetRow[];
        
        const filteredBalance = objectsBalance.filter(row => {
          const ma = (row["Mã"] || "").trim().toUpperCase();
          const nam = parseInt(row["Năm"] || "0");
          return ma === selectedSymbol.toUpperCase() && nam >= 2020 && nam <= 2024;
        });
        filteredBalance.sort((a, b) => parseInt(a["Năm"] || "0") - parseInt(b["Năm"] || "0"));
        setBalanceData(filteredBalance);
        
        // Load Income Statement
        const resIncome = await fetch(INCOME_STATEMENT_URL, { cache: "no-store" });
        if (!resIncome.ok) throw new Error("Không thể tải file Income_statement.csv");
        const textIncome = await resIncome.text();
        const { headers: headersIncome, rows: rowsIncome } = parseCSV(textIncome);
        const objectsIncome = toObjects(headersIncome, rowsIncome) as IncomeStatementRow[];
        
        const filteredIncome = objectsIncome.filter(row => {
          const ma = (row["Mã"] || "").trim().toUpperCase();
          const nam = parseInt(row["Năm"] || "0");
          return ma === selectedSymbol.toUpperCase() && nam >= 2020 && nam <= 2024;
        });
        filteredIncome.sort((a, b) => parseInt(a["Năm"] || "0") - parseInt(b["Năm"] || "0"));
        setIncomeData(filteredIncome);
        
        // Load Indicators
        const resIndicator = await fetch(INDICATORS_URL, { cache: "no-store" });
        if (!resIndicator.ok) throw new Error("Không thể tải file Indicators.csv");
        const textIndicator = await resIndicator.text();
        const { headers: headersIndicator, rows: rowsIndicator } = parseCSV(textIndicator);
        const objectsIndicator = toObjects(headersIndicator, rowsIndicator) as IndicatorRow[];
        
        const filteredIndicator = objectsIndicator.filter(row => {
          const ma = (row["Mã"] || "").trim().toUpperCase();
          const nam = parseInt(row["Năm"] || "0");
          return ma === selectedSymbol.toUpperCase() && nam >= 2020 && nam <= 2024;
        });
        filteredIndicator.sort((a, b) => parseInt(a["Năm"] || "0") - parseInt(b["Năm"] || "0"));
        setIndicatorData(filteredIndicator);
        
        // Load Cash Flow
        const resCashFlow = await fetch(CASH_FLOW_URL, { cache: "no-store" });
        if (!resCashFlow.ok) throw new Error("Không thể tải file Cash_flow.csv");
        const textCashFlow = await resCashFlow.text();
        const { headers: headersCashFlow, rows: rowsCashFlow } = parseCSV(textCashFlow);
        const objectsCashFlow = toObjects(headersCashFlow, rowsCashFlow) as CashFlowRow[];
        
        const filteredCashFlow = objectsCashFlow.filter(row => {
          const ma = (row["Mã"] || "").trim().toUpperCase();
          const nam = parseInt(row["Năm"] || "0");
          return ma === selectedSymbol.toUpperCase() && nam >= 2020 && nam <= 2024;
        });
        filteredCashFlow.sort((a, b) => parseInt(a["Năm"] || "0") - parseInt(b["Năm"] || "0"));
        setCashFlowData(filteredCashFlow);
        
        // Load Stock Info to get Sector
        const resStockInfo = await fetch(STOCK_INFO_URL, { cache: "no-store" });
        if (resStockInfo.ok) {
          const textStockInfo = await resStockInfo.text();
          const { headers: headersStock, rows: rowsStock } = parseCSV(textStockInfo);
          const objectsStock = toObjects(headersStock, rowsStock) as StockInfoRow[];
          
          const stockInfo = objectsStock.find(row => {
            const sym = (row["Symbol"] || row["Mã"] || "").trim().toUpperCase();
            return sym === selectedSymbol.toUpperCase();
          });
          
          if (stockInfo) {
            const sector = stockInfo["Sector"] || stockInfo["Ngành"] || "";
            setCompanySector(sector);
            
            // Load Average Indicators for this sector
            const resAvgIndicator = await fetch(AVERAGE_INDICATORS_URL, { cache: "no-store" });
            if (resAvgIndicator.ok) {
              const textAvgIndicator = await resAvgIndicator.text();
              const { headers: headersAvg, rows: rowsAvg } = parseCSV(textAvgIndicator);
              const objectsAvg = toObjects(headersAvg, rowsAvg) as AverageIndicatorRow[];
              
              const filteredAvg = objectsAvg.filter(row => {
                const rowSector = (row["Sector"] || "").trim();
                const nam = parseInt(row["Năm"] || "0");
                return rowSector === sector && nam >= 2020 && nam <= 2024;
              });
              filteredAvg.sort((a, b) => parseInt(a["Năm"] || "0") - parseInt(b["Năm"] || "0"));
              setAverageIndicatorData(filteredAvg);
            }
          }
        }
        
        if (filteredBalance.length === 0 && filteredIncome.length === 0 && filteredCashFlow.length === 0) {
          setError(`Không tìm thấy dữ liệu tài chính cho mã ${selectedSymbol}`);
        }
        
      } catch (e: any) {
        setError(e?.message || "Có lỗi khi tải dữ liệu");
        setBalanceData([]);
        setIncomeData([]);
        setIndicatorData([]);
        setCashFlowData([]);
        setAverageIndicatorData([]);
        setCompanySector("");
      } finally {
        setLoading(false);
      }
    };
    
    loadAllData();
  }, [selectedSymbol]);
  
  // Prepare data cho Cân đối kế toán
  const balanceChartData = balanceData.map(row => ({
    nam: row["Năm"],
    noPhaiTra: toNumberSafe(row[" NỢ PHẢI TRẢ"]),
    vonChuSoHuu: toNumberSafe(row[" VỐN CHỦ SỞ HỮU"]),
    taiSanNganHan: toNumberSafe(row[" TÀI SẢN NGẮN HẠN"]),
    taiSanDaiHan: toNumberSafe(row[" TÀI SẢN DÀI HẠN"]),
    noNganHan: toNumberSafe(row[" Nợ ngắn hạn"]),
    noDaiHan: toNumberSafe(row[" Nợ dài hạn"]),
  }));
  
  // Prepare data cho Kết quả kinh doanh
  const incomeChartData = incomeData.map(row => ({
    nam: row["Năm"],
    doanhThuThuan: toNumberSafe(row[" Doanh thu thuần"]),
    loiNhuan: toNumberSafe(row[" Cổ đông của Công ty mẹ"]),
    chiPhiBanHang: toNumberSafe(row[" Chi phí bán hàng"]),
    chiPhiQuanLy: toNumberSafe(row[" Chi phí quản lý doanh  nghiệp"]),
    eps: toNumberSafe(row[" Lãi cơ bản trên cổ phiếu"]),
  }));
  
  // Prepare data cho Biên lợi nhuận từ Indicators
  const marginChartData = indicatorData.map(row => ({
    nam: row["Năm"],
    bienLoiNhuanGop: toNumberSafe(row["Biên lợi nhuận gộp"]),
    bienLoiNhuanRong: toNumberSafe(row["Biên lợi nhuận ròng"]),
  }));
  
  // Prepare data cho Lưu chuyển tiền tệ
  const cashFlowChartData = cashFlowData.map(row => ({
    nam: row["Năm"],
    cfo: toNumberSafe(row[" Lưu chuyển tiền tệ ròng từ các hoạt động sản xuất kinh doanh (TT)"]),
    cfi: toNumberSafe(row[" Lưu chuyển tiền tệ ròng từ hoạt động đầu tư (TT)"]),
    cff: toNumberSafe(row[" Lưu chuyển tiền tệ từ hoạt động tài chính (TT)"]),
    capex: toNumberSafe(row[" Tiền chi để mua sắm, xây dựng TSCĐ và các tài sản dài hạn khác (TT)"]),
    vayMoi: toNumberSafe(row[" Tiền thu được các khoản đi vay (TT)"]),
    traNo: toNumberSafe(row[" Tiền trả nợ gốc vay (TT)"]),
    coTuc: toNumberSafe(row[" Cổ tức đã trả (TT)"]),
  }));
  
  // Combine data cho biểu đồ Chất lượng Lợi nhuận
  const profitQualityData = incomeData.map((row, index) => ({
    nam: row["Năm"],
    loiNhuanRong: toNumberSafe(row[" Cổ đông của Công ty mẹ"]),
    dongTienHDKD: cashFlowChartData[index]?.cfo || 0,
  }));
  
  // Prepare data cho Định giá (P/E)
  const valuationData = indicatorData.map((row, index) => {
    const nam = row["Năm"];
    const companyPE = toNumberSafe(row["P/E"]);
    
    // Lấy P/E trung bình ngành cho năm này
    const avgRow = averageIndicatorData.find(r => r["Năm"] === nam);
    const sectorPE = avgRow ? toNumberSafe(avgRow["P/E"]) : 0;
    
    return {
      nam,
      companyPE: companyPE > 0 && companyPE < 1000 ? companyPE : null, // Filter outliers
      sectorPE: sectorPE > 0 && sectorPE < 1000 ? sectorPE : null,
    };
  });
  
  // Tính P/E trung bình 5 năm của công ty
  const validPEs = valuationData
    .map(d => d.companyPE)
    .filter(pe => pe !== null && pe > 0) as number[];
  const avgCompanyPE = validPEs.length > 0 
    ? validPEs.reduce((sum, pe) => sum + pe, 0) / validPEs.length 
    : 0;
  
  // Thêm đường P/E trung bình lịch sử
  const valuationDataWithAvg = valuationData.map(d => ({
    ...d,
    avgHistoricalPE: avgCompanyPE > 0 ? avgCompanyPE : null,
  }));
  
  // Data cho Pie chart (lấy năm gần nhất)
  const latestBalance = balanceChartData[balanceChartData.length - 1];
  const pieData = latestBalance && (latestBalance.noNganHan + latestBalance.noDaiHan) > 0 ? [
    { 
      name: "Nợ ngắn hạn", 
      value: latestBalance.noNganHan,
      percent: ((latestBalance.noNganHan / (latestBalance.noNganHan + latestBalance.noDaiHan)) * 100).toFixed(1)
    },
    { 
      name: "Nợ dài hạn", 
      value: latestBalance.noDaiHan,
      percent: ((latestBalance.noDaiHan / (latestBalance.noNganHan + latestBalance.noDaiHan)) * 100).toFixed(1)
    },
  ] : [];
  
  // Colors
  const COLORS = {
    primary: '#10b981', // emerald-500
    secondary: '#3b82f6', // blue-500
    accent: '#f59e0b', // amber-500
    danger: '#ef4444', // red-500
    purple: '#a855f7', // purple-500
    cyan: '#06b6d4', // cyan-500
    rose: '#f43f5e', // rose-500
    indigo: '#6366f1', // indigo-500
    lime: '#84cc16', // lime-500
    pink: '#ec4899', // pink-500
    pie1: '#10b981',
    pie2: '#3b82f6',
  };
  
  if (loading) {
    return (
      <Card className="bg-slate-900/50 border-slate-700">
        <CardContent className="pt-6">
          <div className="text-slate-400 text-center py-10">Đang tải dữ liệu biểu đồ...</div>
        </CardContent>
      </Card>
    );
  }
  
  if (error) {
    return (
      <Card className="bg-slate-900/50 border-slate-700">
        <CardContent className="pt-6">
          <div className="text-amber-400 text-sm">⚠ {error}</div>
        </CardContent>
      </Card>
    );
  }
  
  if (!selectedSymbol || (balanceChartData.length === 0 && incomeChartData.length === 0 && cashFlowChartData.length === 0)) {
    return (
      <Card className="bg-slate-900/50 border-slate-700">
        <CardContent className="pt-6">
          <div className="text-slate-400 text-center py-10">Chưa có dữ liệu hiển thị. Vui lòng chọn mã cổ phiếu.</div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Tabs defaultValue="balance" className="w-full">
      <TabsList className="bg-slate-800/50 border border-slate-700 mb-6">
        <TabsTrigger value="balance">📊 Cân đối kế toán</TabsTrigger>
        <TabsTrigger value="income">💰 Kết quả kinh doanh</TabsTrigger>
        <TabsTrigger value="cashflow">💵 Lưu chuyển tiền tệ</TabsTrigger>
        <TabsTrigger value="health">❄️ Bông tuyết sức khỏe</TabsTrigger>
      </TabsList>

      {/* TAB 1: CÂN ĐỐI KẾ TOÁN */}
      <TabsContent value="balance" className="space-y-6">
        {/* Header */}
        <Card className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 border-slate-700">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-slate-100">
              📊 Dashboard Cân đối kế toán
            </CardTitle>
            <CardDescription className="text-slate-400">
              Phân tích trực quan bảng cân đối kế toán của {selectedSymbol} (Giai đoạn {balanceChartData[0]?.nam} - {balanceChartData[balanceChartData.length - 1]?.nam})
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Chart 1: Cấu trúc nguồn vốn */}
        <Card className="bg-slate-900/50 border-slate-700">
          <CardHeader className="bg-slate-800/50 border-b border-slate-700">
            <CardTitle className="text-lg font-bold text-slate-100">
              1. Cấu trúc nguồn vốn
            </CardTitle>
            <CardDescription className="text-slate-400">
              So sánh Nợ phải trả và Vốn chủ sở hữu theo năm
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={balanceChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="nam" stroke="#94a3b8" style={{ fontSize: '14px', fontWeight: 500 }} />
                <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} tickFormatter={(value) => formatNumber(value)} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="square" />
                <Bar dataKey="noPhaiTra" stackId="a" fill={COLORS.danger} name="Nợ phải trả" radius={[0, 0, 0, 0]} />
                <Bar dataKey="vonChuSoHuu" stackId="a" fill={COLORS.primary} name="Vốn chủ sở hữu" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Chart 2: Cấu trúc tài sản */}
        <Card className="bg-slate-900/50 border-slate-700">
          <CardHeader className="bg-slate-800/50 border-b border-slate-700">
            <CardTitle className="text-lg font-bold text-slate-100">2. Cấu trúc tài sản</CardTitle>
            <CardDescription className="text-slate-400">Xu hướng Tài sản ngắn hạn và Tài sản dài hạn</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={balanceChartData}>
                <defs>
                  <linearGradient id="colorTSNH" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.secondary} stopOpacity={0.8}/>
                    <stop offset="95%" stopColor={COLORS.secondary} stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="colorTSDH" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.accent} stopOpacity={0.8}/>
                    <stop offset="95%" stopColor={COLORS.accent} stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="nam" stroke="#94a3b8" style={{ fontSize: '14px', fontWeight: 500 }} />
                <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} tickFormatter={(value) => formatNumber(value)} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="square" />
                <Area type="monotone" dataKey="taiSanNganHan" stackId="1" stroke={COLORS.secondary} fill="url(#colorTSNH)" name="Tài sản ngắn hạn" />
                <Area type="monotone" dataKey="taiSanDaiHan" stackId="1" stroke={COLORS.accent} fill="url(#colorTSDH)" name="Tài sản dài hạn" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Row: Pie + Line */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart 3: Cấu trúc nợ */}
          <Card className="bg-slate-900/50 border-slate-700">
            <CardHeader className="bg-slate-800/50 border-b border-slate-700">
              <CardTitle className="text-lg font-bold text-slate-100">3. Cấu trúc nợ phải trả</CardTitle>
              <CardDescription className="text-slate-400">Tỷ lệ Nợ ngắn hạn / Nợ dài hạn (Năm {latestBalance?.nam || "N/A"})</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={320}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" labelLine={false} label={({ name, percent }) => `${name}: ${percent}%`} outerRadius={100} fill="#8884d8" dataKey="value">
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index === 0 ? COLORS.pie1 : COLORS.pie2} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomPieTooltip />} />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-slate-400 text-center py-10">Không có dữ liệu nợ để hiển thị</div>
              )}
            </CardContent>
          </Card>

          {/* Chart 4: Khả năng thanh khoản */}
          <Card className="bg-slate-900/50 border-slate-700">
            <CardHeader className="bg-slate-800/50 border-b border-slate-700">
              <CardTitle className="text-lg font-bold text-slate-100">4. Khả năng thanh khoản</CardTitle>
              <CardDescription className="text-slate-400">So sánh Tài sản ngắn hạn và Nợ ngắn hạn</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={balanceChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="nam" stroke="#94a3b8" style={{ fontSize: '14px', fontWeight: 500 }} />
                  <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} tickFormatter={(value) => formatNumber(value)} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="line" />
                  <Line type="monotone" dataKey="taiSanNganHan" stroke={COLORS.primary} strokeWidth={3} dot={{ r: 5, fill: COLORS.primary }} activeDot={{ r: 7 }} name="Tài sản ngắn hạn" />
                  <Line type="monotone" dataKey="noNganHan" stroke={COLORS.danger} strokeWidth={3} dot={{ r: 5, fill: COLORS.danger }} activeDot={{ r: 7 }} name="Nợ ngắn hạn" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Summary Stats */}
        <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-slate-100">📈 Thống kê tổng quan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Tổng tài sản</p>
                <p className="text-lg font-bold text-emerald-400">
                  {latestBalance ? formatNumber(latestBalance.taiSanNganHan + latestBalance.taiSanDaiHan) : "0"}
                </p>
              </div>
              <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Tổng nợ</p>
                <p className="text-lg font-bold text-red-400">
                  {latestBalance ? formatNumber(latestBalance.noPhaiTra) : "0"}
                </p>
              </div>
              <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Vốn chủ sở hữu</p>
                <p className="text-lg font-bold text-blue-400">
                  {latestBalance ? formatNumber(latestBalance.vonChuSoHuu) : "0"}
                </p>
              </div>
              <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Tỷ lệ Nợ/VCSH</p>
                <p className="text-lg font-bold text-amber-400">
                  {latestBalance && latestBalance.vonChuSoHuu !== 0 
                    ? (latestBalance.noPhaiTra / latestBalance.vonChuSoHuu).toFixed(2) 
                    : "0"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* TAB 2: KẾT QUẢ KINH DOANH */}
      <TabsContent value="income" className="space-y-6">
        {/* Header */}
        <Card className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 border-slate-700">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-slate-100">
              💰 Dashboard Kết quả kinh doanh
            </CardTitle>
            <CardDescription className="text-slate-400">
              Phân tích trực quan bảng kết quả kinh doanh của {selectedSymbol} (Giai đoạn {incomeChartData[0]?.nam} - {incomeChartData[incomeChartData.length - 1]?.nam})
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Chart 1: Tăng trưởng Doanh thu & Lợi nhuận */}
        <Card className="bg-slate-900/50 border-slate-700">
          <CardHeader className="bg-slate-800/50 border-b border-slate-700">
            <CardTitle className="text-lg font-bold text-slate-100">
              1. Tăng trưởng Doanh thu & Lợi nhuận
            </CardTitle>
            <CardDescription className="text-slate-400">
              Doanh thu thuần (Cột) và Lợi nhuận (Đường)
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <ResponsiveContainer width="100%" height={350}>
              <ComposedChart data={incomeChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="nam" stroke="#94a3b8" style={{ fontSize: '14px', fontWeight: 500 }} />
                <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} tickFormatter={(value) => formatNumber(value)} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                <Bar dataKey="doanhThuThuan" fill={COLORS.secondary} name="Doanh thu thuần" radius={[8, 8, 0, 0]} />
                <Line type="monotone" dataKey="loiNhuan" stroke={COLORS.primary} strokeWidth={3} dot={{ r: 6, fill: COLORS.primary }} activeDot={{ r: 8 }} name="Lợi nhuận" />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Chart 2: Phân tích Biên lợi nhuận */}
        <Card className="bg-slate-900/50 border-slate-700">
          <CardHeader className="bg-slate-800/50 border-b border-slate-700">
            <CardTitle className="text-lg font-bold text-slate-100">
              2. Phân tích Biên lợi nhuận
            </CardTitle>
            <CardDescription className="text-slate-400">
              Biên lợi nhuận gộp và Biên lợi nhuận ròng theo năm
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={marginChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="nam" stroke="#94a3b8" style={{ fontSize: '14px', fontWeight: 500 }} />
                <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} tickFormatter={(value) => formatPercent(value)} />
                <Tooltip content={<CustomPercentTooltip />} />
                <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="line" />
                <Line type="monotone" dataKey="bienLoiNhuanGop" stroke={COLORS.cyan} strokeWidth={3} dot={{ r: 5, fill: COLORS.cyan }} activeDot={{ r: 7 }} name="Biên lợi nhuận gộp" />
                <Line type="monotone" dataKey="bienLoiNhuanRong" stroke={COLORS.purple} strokeWidth={3} dot={{ r: 5, fill: COLORS.purple }} activeDot={{ r: 7 }} name="Biên lợi nhuận ròng" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Row: Chi phí + EPS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart 3: Cấu trúc Chi phí */}
          <Card className="bg-slate-900/50 border-slate-700">
            <CardHeader className="bg-slate-800/50 border-b border-slate-700">
              <CardTitle className="text-lg font-bold text-slate-100">
                3. Cấu trúc Chi phí
              </CardTitle>
              <CardDescription className="text-slate-400">
                Chi phí bán hàng và Chi phí quản lý doanh nghiệp
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={incomeChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="nam" stroke="#94a3b8" style={{ fontSize: '14px', fontWeight: 500 }} />
                  <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} tickFormatter={(value) => formatNumber(value)} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="square" />
                  <Bar dataKey="chiPhiBanHang" stackId="a" fill={COLORS.accent} name="Chi phí bán hàng" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="chiPhiQuanLy" stackId="a" fill={COLORS.danger} name="Chi phí quản lý DN" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Chart 4: Tăng trưởng EPS */}
          <Card className="bg-slate-900/50 border-slate-700">
            <CardHeader className="bg-slate-800/50 border-b border-slate-700">
              <CardTitle className="text-lg font-bold text-slate-100">
                4. Tăng trưởng EPS
              </CardTitle>
              <CardDescription className="text-slate-400">
                Lãi cơ bản trên cổ phiếu theo năm
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={incomeChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="nam" stroke="#94a3b8" style={{ fontSize: '14px', fontWeight: 500 }} />
                  <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="square" />
                  <Bar dataKey="eps" fill={COLORS.primary} name="EPS" radius={[8, 8, 0, 0]}>
                    {incomeChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.eps >= 0 ? COLORS.primary : COLORS.danger} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Summary Stats */}
        <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-slate-100">📈 Thống kê tổng quan</CardTitle>
          </CardHeader>
          <CardContent>
            {incomeChartData.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                  <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Doanh thu thuần</p>
                  <p className="text-lg font-bold text-blue-400">
                    {formatNumber(incomeChartData[incomeChartData.length - 1].doanhThuThuan)}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                  <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Lợi nhuận</p>
                  <p className="text-lg font-bold text-emerald-400">
                    {formatNumber(incomeChartData[incomeChartData.length - 1].loiNhuan)}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                  <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">EPS (VNĐ)</p>
                  <p className="text-lg font-bold text-purple-400">
                    {incomeChartData[incomeChartData.length - 1].eps.toFixed(2)}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                  <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Biên LN ròng</p>
                  <p className="text-lg font-bold text-cyan-400">
                    {marginChartData.length > 0 
                      ? formatPercent(marginChartData[marginChartData.length - 1].bienLoiNhuanRong)
                      : "0%"}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* TAB 3: LƯU CHUYỂN TIỀN TỆ */}
      <TabsContent value="cashflow" className="space-y-6">
        {/* Header */}
        <Card className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 border-slate-700">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-slate-100">
              💵 Dashboard Lưu chuyển tiền tệ
            </CardTitle>
            <CardDescription className="text-slate-400">
              Phân tích trực quan bảng lưu chuyển tiền tệ của {selectedSymbol} (Giai đoạn {cashFlowChartData[0]?.nam} - {cashFlowChartData[cashFlowChartData.length - 1]?.nam})
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Chart 1: Ba Dòng tiền */}
        <Card className="bg-slate-900/50 border-slate-700">
          <CardHeader className="bg-slate-800/50 border-b border-slate-700">
            <CardTitle className="text-lg font-bold text-slate-100">
              1. Ba Dòng tiền
            </CardTitle>
            <CardDescription className="text-slate-400">
              CFO, CFI, CFF - Dòng tiền từ hoạt động kinh doanh, đầu tư và tài chính
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={cashFlowChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="nam" stroke="#94a3b8" style={{ fontSize: '14px', fontWeight: 500 }} />
                <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} tickFormatter={(value) => formatNumber(value)} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="square" />
                <ReferenceLine y={0} stroke="#64748b" strokeDasharray="3 3" />
                <Bar dataKey="cfo" fill={COLORS.primary} name="CFO (Hoạt động KD)" radius={[8, 8, 0, 0]} />
                <Bar dataKey="cfi" fill={COLORS.danger} name="CFI (Đầu tư)" radius={[8, 8, 0, 0]} />
                <Bar dataKey="cff" fill={COLORS.secondary} name="CFF (Tài chính)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Chart 2: Chất lượng Lợi nhuận */}
        <Card className="bg-slate-900/50 border-slate-700">
          <CardHeader className="bg-slate-800/50 border-b border-slate-700">
            <CardTitle className="text-lg font-bold text-slate-100">
              2. Chất lượng Lợi nhuận (Tiền so với Lãi)
            </CardTitle>
            <CardDescription className="text-slate-400">
              So sánh Lợi nhuận ròng và Dòng tiền từ HĐKD
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={profitQualityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="nam" stroke="#94a3b8" style={{ fontSize: '14px', fontWeight: 500 }} />
                <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} tickFormatter={(value) => formatNumber(value)} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="line" />
                <ReferenceLine y={0} stroke="#64748b" strokeDasharray="3 3" />
                <Line type="monotone" dataKey="loiNhuanRong" stroke={COLORS.purple} strokeWidth={3} dot={{ r: 6, fill: COLORS.purple }} activeDot={{ r: 8 }} name="Lợi nhuận ròng" />
                <Line type="monotone" dataKey="dongTienHDKD" stroke={COLORS.cyan} strokeWidth={3} dot={{ r: 6, fill: COLORS.cyan }} activeDot={{ r: 8 }} name="Dòng tiền HĐKD" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Row: Capex + Financing */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart 3: Capex */}
          <Card className="bg-slate-900/50 border-slate-700">
            <CardHeader className="bg-slate-800/50 border-b border-slate-700">
              <CardTitle className="text-lg font-bold text-slate-100">
                3. Hoạt động Đầu tư (Capex)
              </CardTitle>
              <CardDescription className="text-slate-400">
                Chi phí mua sắm, xây dựng TSCĐ và tài sản dài hạn
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={cashFlowChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="nam" stroke="#94a3b8" style={{ fontSize: '14px', fontWeight: 500 }} />
                  <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} tickFormatter={(value) => formatNumber(value)} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="square" />
                  <ReferenceLine y={0} stroke="#64748b" strokeDasharray="3 3" />
                  <Bar dataKey="capex" fill={COLORS.accent} name="Capex" radius={[8, 8, 0, 0]}>
                    {cashFlowChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.capex >= 0 ? COLORS.primary : COLORS.danger} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Chart 4: Dòng tiền Tài chính */}
          <Card className="bg-slate-900/50 border-slate-700">
            <CardHeader className="bg-slate-800/50 border-b border-slate-700">
              <CardTitle className="text-lg font-bold text-slate-100">
                4. Dòng tiền Tài chính (Nợ & Cổ tức)
              </CardTitle>
              <CardDescription className="text-slate-400">
                Vay mới, Trả nợ gốc và Trả cổ tức
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={cashFlowChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="nam" stroke="#94a3b8" style={{ fontSize: '14px', fontWeight: 500 }} />
                  <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} tickFormatter={(value) => formatNumber(value)} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="square" />
                  <ReferenceLine y={0} stroke="#64748b" strokeDasharray="3 3" />
                  <Bar dataKey="vayMoi" stackId="a" fill={COLORS.primary} name="Vay nợ mới" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="traNo" stackId="a" fill={COLORS.rose} name="Trả nợ gốc" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="coTuc" stackId="a" fill={COLORS.indigo} name="Trả cổ tức" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Summary Stats */}
        <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-slate-100">📈 Thống kê tổng quan</CardTitle>
          </CardHeader>
          <CardContent>
            {cashFlowChartData.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                  <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">CFO</p>
                  <p className="text-lg font-bold text-emerald-400">
                    {formatNumber(cashFlowChartData[cashFlowChartData.length - 1].cfo)}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                  <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">CFI</p>
                  <p className="text-lg font-bold text-red-400">
                    {formatNumber(cashFlowChartData[cashFlowChartData.length - 1].cfi)}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                  <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">CFF</p>
                  <p className="text-lg font-bold text-blue-400">
                    {formatNumber(cashFlowChartData[cashFlowChartData.length - 1].cff)}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                  <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Capex</p>
                  <p className="text-lg font-bold text-amber-400">
                    {formatNumber(cashFlowChartData[cashFlowChartData.length - 1].capex)}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* TAB 4: BÔNG TUYẾT SỨC KHỎE */}
      <TabsContent value="health" className="space-y-6">
        {/* Header với Sector Badge */}
        <Card className="bg-gradient-to-br from-emerald-900/30 via-slate-800/90 to-slate-900/90 border-emerald-700/50">
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <CardTitle className="text-2xl font-bold text-slate-100 flex items-center gap-3">
                  ❄️ Bông tuyết Sức khỏe Tài chính
                </CardTitle>
                <CardDescription className="text-slate-400 mt-2">
                  Đánh giá toàn diện 5 trụ cột sức khỏe tài chính của {selectedSymbol}
                </CardDescription>
              </div>
              {companySector && (
                <Badge variant="outline" className="px-4 py-2 text-sm bg-emerald-500/10 border-emerald-500/30 text-emerald-400">
                  <span className="mr-2">🏢</span>
                  {companySector}
                </Badge>
              )}
            </div>
          </CardHeader>
        </Card>

        {/* PHẦN 1: ĐỊNH GIÁ */}
        <Card className="bg-slate-900/50 border-slate-700">
          <CardHeader className="bg-slate-800/50 border-b border-slate-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-lg">
                <span className="text-2xl">💎</span>
              </div>
              <div>
                <CardTitle className="text-xl font-bold text-slate-100">
                  1. Định giá
                </CardTitle>
                <CardDescription className="text-slate-400">
                  P/E so với ngành và lịch sử (2020-2024)
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {valuationDataWithAvg.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={400}>
                  <ComposedChart data={valuationDataWithAvg}>
                    <defs>
                      <linearGradient id="sectorPEGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COLORS.secondary} stopOpacity={0.4}/>
                        <stop offset="95%" stopColor={COLORS.secondary} stopOpacity={0.05}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis 
                      dataKey="nam" 
                      stroke="#94a3b8" 
                      style={{ fontSize: '14px', fontWeight: 500 }}
                    />
                    <YAxis 
                      stroke="#94a3b8" 
                      style={{ fontSize: '12px' }}
                      label={{ value: 'P/E', angle: -90, position: 'insideLeft', fill: '#94a3b8' }}
                    />
                    <Tooltip content={<CustomPETooltip />} />
                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                    
                    {/* Area: P/E ngành (nền tham chiếu) */}
                    <Area 
                      type="monotone" 
                      dataKey="sectorPE" 
                      fill="url(#sectorPEGradient)" 
                      stroke={COLORS.secondary}
                      strokeWidth={2}
                      name="P/E Trung bình ngành"
                      connectNulls
                    />
                    
                    {/* Line: P/E công ty */}
                    <Line 
                      type="monotone" 
                      dataKey="companyPE" 
                      stroke={COLORS.primary} 
                      strokeWidth={4}
                      dot={{ r: 6, fill: COLORS.primary, strokeWidth: 2, stroke: '#fff' }}
                      activeDot={{ r: 8 }}
                      name="P/E Công ty"
                      connectNulls
                    />
                    
                    {/* Dotted Line: P/E trung bình lịch sử */}
                    <Line 
                      type="monotone" 
                      dataKey="avgHistoricalPE" 
                      stroke={COLORS.accent} 
                      strokeWidth={3}
                      strokeDasharray="8 4"
                      dot={false}
                      name={`P/E TB lịch sử (${avgCompanyPE.toFixed(2)})`}
                      connectNulls
                    />
                  </ComposedChart>
                </ResponsiveContainer>

                {/* Insight Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                  <div className="p-4 rounded-lg bg-gradient-to-br from-emerald-900/20 to-slate-800/50 border border-emerald-700/30">
                    <p className="text-xs text-emerald-400 uppercase tracking-wider mb-1 flex items-center gap-2">
                      <span>📊</span>
                      P/E Hiện tại
                    </p>
                    <p className="text-2xl font-bold text-slate-100">
                      {valuationDataWithAvg[valuationDataWithAvg.length - 1]?.companyPE?.toFixed(2) || "N/A"}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Năm {valuationDataWithAvg[valuationDataWithAvg.length - 1]?.nam}
                    </p>
                  </div>
                  
                  <div className="p-4 rounded-lg bg-gradient-to-br from-blue-900/20 to-slate-800/50 border border-blue-700/30">
                    <p className="text-xs text-blue-400 uppercase tracking-wider mb-1 flex items-center gap-2">
                      <span>🏢</span>
                      P/E Ngành
                    </p>
                    <p className="text-2xl font-bold text-slate-100">
                      {valuationDataWithAvg[valuationDataWithAvg.length - 1]?.sectorPE?.toFixed(2) || "N/A"}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      {companySector || "N/A"}
                    </p>
                  </div>
                  
                  <div className="p-4 rounded-lg bg-gradient-to-br from-amber-900/20 to-slate-800/50 border border-amber-700/30">
                    <p className="text-xs text-amber-400 uppercase tracking-wider mb-1 flex items-center gap-2">
                      <span>📈</span>
                      P/E TB 5 năm
                    </p>
                    <p className="text-2xl font-bold text-slate-100">
                      {avgCompanyPE.toFixed(2)}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Tham chiếu lịch sử
                    </p>
                  </div>
                </div>

                {/* Analysis Note */}
                <div className="mt-6 p-4 rounded-lg bg-slate-800/30 border border-slate-700">
                  <p className="text-sm text-slate-300">
                    <span className="font-semibold text-emerald-400">💡 Phân tích:</span> 
                    {valuationDataWithAvg[valuationDataWithAvg.length - 1]?.companyPE && 
                     valuationDataWithAvg[valuationDataWithAvg.length - 1]?.sectorPE ? (
                      valuationDataWithAvg[valuationDataWithAvg.length - 1].companyPE! < valuationDataWithAvg[valuationDataWithAvg.length - 1].sectorPE! ? (
                        <span> Công ty đang được định giá <span className="text-emerald-400 font-semibold">thấp hơn</span> trung bình ngành, có thể là cơ hội đầu tư.</span>
                      ) : (
                        <span> Công ty đang được định giá <span className="text-amber-400 font-semibold">cao hơn</span> trung bình ngành, cần cân nhắc kỹ.</span>
                      )
                    ) : (
                      <span> Chưa đủ dữ liệu để so sánh với ngành.</span>
                    )}
                  </p>
                </div>
              </>
            ) : (
              <div className="text-slate-400 text-center py-10">
                Không có dữ liệu định giá để hiển thị
              </div>
            )}
          </CardContent>
        </Card>

        {/* PHẦN 2: TĂNG TRƯỞNG */}
        <Card className="bg-slate-900/50 border-slate-700">
          <CardHeader className="bg-slate-800/50 border-b border-slate-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg">
                <span className="text-2xl">📈</span>
              </div>
              <div>
                <CardTitle className="text-xl font-bold text-slate-100">
                  2. Tăng trưởng
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Động lực tăng trưởng doanh thu và EPS
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            {/* Biểu đồ 1: Động lực Tăng trưởng Doanh thu */}
            {incomeChartData.length > 0 && marginChartData.length > 0 ? (
              <>
                <div>
                  <h3 className="text-lg font-semibold text-slate-200 mb-4">
                    Động lực Tăng trưởng Doanh thu
                  </h3>
                  <ResponsiveContainer width="100%" height={400}>
                    <ComposedChart data={incomeChartData.map((item, index) => {
                      const prevRevenue = index > 0 ? incomeChartData[index - 1].doanhThuThuan : 0;
                      const growthRate = prevRevenue > 0 
                        ? ((item.doanhThuThuan - prevRevenue) / prevRevenue * 100).toFixed(1)
                        : null;
                      
                      return {
                        nam: item.nam,
                        doanhThuThuan: item.doanhThuThuan,
                        bienLoiNhuanGop: marginChartData[index]?.bienLoiNhuanGop || 0,
                        growthRate: growthRate,
                      };
                    })}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis 
                        dataKey="nam" 
                        stroke="#94a3b8" 
                        style={{ fontSize: '14px', fontWeight: 500 }}
                      />
                      <YAxis 
                        yAxisId="left"
                        stroke="#94a3b8" 
                        style={{ fontSize: '12px' }}
                        tickFormatter={(value) => formatNumber(value)}
                        label={{ value: 'Doanh thu (VNĐ)', angle: -90, position: 'insideLeft', fill: '#94a3b8' }}
                      />
                      <YAxis 
                        yAxisId="right"
                        orientation="right"
                        stroke="#94a3b8" 
                        style={{ fontSize: '12px' }}
                        tickFormatter={(value) => formatPercent(value)}
                        label={{ value: 'Biên LN gộp (%)', angle: 90, position: 'insideRight', fill: '#94a3b8' }}
                      />
                      <Tooltip content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-slate-800/95 border border-slate-600 p-3 rounded-lg shadow-xl">
                              <p className="text-slate-200 font-semibold mb-2">Năm {label}</p>
                              {payload.map((entry: any, index: number) => (
                                <p key={index} className="text-sm" style={{ color: entry.color }}>
                                  {entry.name}: <span className="font-bold">
                                    {entry.dataKey === 'bienLoiNhuanGop' 
                                      ? formatPercent(entry.value)
                                      : formatNumber(entry.value)}
                                  </span>
                                </p>
                              ))}
                              {payload[0]?.payload?.growthRate && (
                                <p className="text-sm text-emerald-400 mt-2 border-t border-slate-600 pt-2">
                                  Tăng trưởng: <span className="font-bold">{payload[0].payload.growthRate}%</span>
                                </p>
                              )}
                            </div>
                          );
                        }
                        return null;
                      }} />
                      <Legend wrapperStyle={{ paddingTop: '20px' }} />
                      
                      <Bar 
                        yAxisId="left"
                        dataKey="doanhThuThuan" 
                        fill={COLORS.secondary} 
                        name="Doanh thu thuần" 
                        radius={[8, 8, 0, 0]}
                        label={({ x, y, width, value, growthRate }: any) => {
                          if (growthRate) {
                            return (
                              <text 
                                x={x + width / 2} 
                                y={y - 10} 
                                fill={parseFloat(growthRate) >= 0 ? COLORS.primary : COLORS.danger}
                                textAnchor="middle"
                                fontSize="12"
                                fontWeight="bold"
                              >
                                {growthRate > 0 ? '+' : ''}{growthRate}%
                              </text>
                            );
                          }
                          return null;
                        }}
                      />
                      
                      <Line 
                        yAxisId="right"
                        type="monotone" 
                        dataKey="bienLoiNhuanGop" 
                        stroke={COLORS.purple} 
                        strokeWidth={3}
                        dot={{ r: 6, fill: COLORS.purple, strokeWidth: 2, stroke: '#fff' }}
                        activeDot={{ r: 8 }}
                        name="Biên lợi nhuận gộp"
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>

                {/* Biểu đồ 2: Tăng trưởng EPS */}
                <div>
                  <h3 className="text-lg font-semibold text-slate-200 mb-4">
                    Tăng trưởng EPS (Lịch sử)
                  </h3>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={indicatorData.map((row, index) => {
                      const nam = row["Năm"];
                      const companyEPS = toNumberSafe(row["EPS"]);
                      
                      const avgRow = averageIndicatorData.find(r => r["Năm"] === nam);
                      const sectorEPS = avgRow ? toNumberSafe(avgRow["EPS"]) : 0;
                      
                      return {
                        nam,
                        companyEPS,
                        sectorEPS,
                      };
                    })}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis 
                        dataKey="nam" 
                        stroke="#94a3b8" 
                        style={{ fontSize: '14px', fontWeight: 500 }}
                      />
                      <YAxis 
                        stroke="#94a3b8" 
                        style={{ fontSize: '12px' }}
                        label={{ value: 'EPS (VNĐ)', angle: -90, position: 'insideLeft', fill: '#94a3b8' }}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="square" />
                      <ReferenceLine y={0} stroke="#64748b" strokeDasharray="3 3" />
                      
                      <Bar 
                        dataKey="companyEPS" 
                        fill={COLORS.primary} 
                        name="EPS Công ty" 
                        radius={[8, 8, 0, 0]}
                      />
                      <Bar 
                        dataKey="sectorEPS" 
                        fill={COLORS.cyan} 
                        name="EPS Trung bình ngành" 
                        radius={[8, 8, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Insight Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg bg-gradient-to-br from-blue-900/20 to-slate-800/50 border border-blue-700/30">
                    <p className="text-xs text-blue-400 uppercase tracking-wider mb-1 flex items-center gap-2">
                      <span>💹</span>
                      Tăng trưởng Doanh Thu gần nhất
                    </p>
                    <p className="text-2xl font-bold text-slate-100">
                      {(() => {
                        const len = incomeChartData.length;
                        if (len < 2) return "N/A";
                        const current = incomeChartData[len - 1].doanhThuThuan;
                        const previous = incomeChartData[len - 2].doanhThuThuan;
                        const growth = previous > 0 ? ((current - previous) / previous * 100) : 0;
                        return (
                          <span className={growth >= 0 ? "text-emerald-400" : "text-red-400"}>
                            {growth >= 0 ? "+" : ""}{growth.toFixed(1)}%
                          </span>
                        );
                      })()}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      So với năm trước
                    </p>
                  </div>
                  
                  <div className="p-4 rounded-lg bg-gradient-to-br from-purple-900/20 to-slate-800/50 border border-purple-700/30">
                    <p className="text-xs text-purple-400 uppercase tracking-wider mb-1 flex items-center gap-2">
                      <span>📊</span>
                      EPS Hiện tại
                    </p>
                    <p className="text-2xl font-bold text-slate-100">
                      {indicatorData.length > 0 
                        ? toNumberSafe(indicatorData[indicatorData.length - 1]["EPS"]).toFixed(0)
                        : "N/A"} VNĐ
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Năm {indicatorData[indicatorData.length - 1]?.["Năm"]}
                    </p>
                  </div>
                  
                  <div className="p-4 rounded-lg bg-gradient-to-br from-cyan-900/20 to-slate-800/50 border border-cyan-700/30">
                    <p className="text-xs text-cyan-400 uppercase tracking-wider mb-1 flex items-center gap-2">
                      <span>🏢</span>
                      EPS TB Ngành
                    </p>
                    <p className="text-2xl font-bold text-slate-100">
                      {(() => {
                        const lastYear = indicatorData[indicatorData.length - 1]?.["Năm"];
                        const avgRow = averageIndicatorData.find(r => r["Năm"] === lastYear);
                        return avgRow 
                          ? toNumberSafe(avgRow["EPS"]).toFixed(0)
                          : "N/A";
                      })()} VNĐ
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      {companySector || "N/A"}
                    </p>
                  </div>
                </div>

                {/* Analysis Note */}
                <div className="p-4 rounded-lg bg-slate-800/30 border border-slate-700">
                  <p className="text-sm text-slate-300">
                    <span className="font-semibold text-blue-400">💡 Phân tích:</span>
                    {(() => {
                      const len = incomeChartData.length;
                      if (len < 2) return " Chưa đủ dữ liệu để phân tích tăng trưởng.";
                      
                      const current = incomeChartData[len - 1].doanhThuThuan;
                      const previous = incomeChartData[len - 2].doanhThuThuan;
                      const growth = previous > 0 ? ((current - previous) / previous * 100) : 0;
                      
                      const lastMargin = marginChartData[marginChartData.length - 1]?.bienLoiNhuanGop || 0;
                      const prevMargin = marginChartData[marginChartData.length - 2]?.bienLoiNhuanGop || 0;
                      
                      if (growth > 10 && lastMargin >= prevMargin) {
                        return " Công ty đang có tốc độ tăng trưởng doanh thu mạnh mẽ và duy trì được biên lợi nhuận gộp. Đây là dấu hiệu tích cực!";
                      } else if (growth > 0 && lastMargin < prevMargin) {
                        return " Doanh thu đang tăng nhưng biên lợi nhuận gộp giảm, cần theo dõi cấu trúc chi phí và sức mạnh định giá.";
                      } else if (growth < 0) {
                        return " Doanh thu đang sụt giảm, cần xem xét chiến lược kinh doanh và điều kiện thị trường.";
                      } else {
                        return " Tăng trưởng ổn định, cần theo dõi xu hướng dài hạn.";
                      }
                    })()}
                  </p>
                </div>
              </>
            ) : (
              <div className="text-slate-400 text-center py-10">
                Không có đủ dữ liệu tăng trưởng để hiển thị
              </div>
            )}
          </CardContent>
        </Card>

        {/* 3. Hiệu quả Quá khứ - FULL IMPLEMENTATION */}
        <Card className="bg-slate-900/50 border-slate-700">
          <CardHeader className="bg-slate-800/50 border-b border-slate-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg">
                <span className="text-2xl">🎯</span>
              </div>
              <div>
                <CardTitle className="text-xl font-bold text-slate-100">
                  3. Hiệu quả Quá khứ
                </CardTitle>
                <CardDescription className="text-slate-400">
                  ROE vượt trội và chất lượng lợi nhuận
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-8">
            {indicatorData.length > 0 && averageIndicatorData.length > 0 ? (
              <>
                {/* Biểu đồ 1: Heatmap - Chênh lệch ROE so với ngành */}
                <div>
                  <h3 className="text-lg font-semibold text-slate-200 mb-4">
                    Chênh lệch ROE so với Trung bình Ngành
                  </h3>
                  
                  {/* Heatmap Table */}
                  <div className="overflow-x-auto">
                    <div className="inline-block min-w-full">
                      <div className="grid grid-cols-1 gap-2">
                        {/* Header row */}
                        <div className="grid gap-2" style={{ gridTemplateColumns: `200px repeat(${indicatorData.length}, 1fr)` }}>
                          <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                            <p className="text-xs font-semibold text-slate-400 uppercase">Chỉ tiêu</p>
                          </div>
                          {indicatorData.map((row) => (
                            <div key={row["Năm"]} className="p-3 bg-slate-800/50 rounded-lg border border-slate-700 text-center">
                              <p className="text-sm font-bold text-slate-200">{row["Năm"]}</p>
                            </div>
                          ))}
                        </div>
                        
                        {/* Data row - ROE Delta */}
                        <div className="grid gap-2" style={{ gridTemplateColumns: `200px repeat(${indicatorData.length}, 1fr)` }}>
                          <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700 flex items-center">
                            <p className="text-sm font-semibold text-slate-200">Mức Vượt Trội ROE (%)</p>
                          </div>
                          {indicatorData.map((row) => {
                            const nam = row["Năm"];
                            const companyROE = toNumberSafe(row["ROE (%)"]);
                            const avgRow = averageIndicatorData.find(r => r["Năm"] === nam);
                            const sectorROE = avgRow ? toNumberSafe(avgRow["ROE (%)"]) : 0;
                            const delta = companyROE - sectorROE;
                            
                            // Color based on delta
                            let bgColor = "bg-slate-700/50";
                            let textColor = "text-slate-300";
                            let borderColor = "border-slate-600";
                            
                            if (delta > 5) {
                              bgColor = "bg-emerald-900/40";
                              textColor = "text-emerald-300";
                              borderColor = "border-emerald-700/50";
                            } else if (delta > 0) {
                              bgColor = "bg-green-900/30";
                              textColor = "text-green-300";
                              borderColor = "border-green-700/40";
                            } else if (delta > -5) {
                              bgColor = "bg-orange-900/30";
                              textColor = "text-orange-300";
                              borderColor = "border-orange-700/40";
                            } else {
                              bgColor = "bg-red-900/40";
                              textColor = "text-red-300";
                              borderColor = "border-red-700/50";
                            }
                            
                            return (
                              <div 
                                key={nam} 
                                className={`p-4 rounded-lg border ${bgColor} ${borderColor} transition-all hover:scale-105 cursor-pointer`}
                              >
                                <p className={`text-lg font-bold text-center ${textColor}`}>
                                  {delta > 0 ? "+" : ""}{delta.toFixed(2)}%
                                </p>
                                <p className="text-xs text-slate-400 text-center mt-1">
                                  {companyROE.toFixed(1)}% vs {sectorROE.toFixed(1)}%
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      
                      {/* Legend */}
                      <div className="mt-4 flex items-center justify-center gap-6 text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded bg-emerald-900/40 border border-emerald-700/50"></div>
                          <span className="text-slate-400">Rất tốt (&gt;5%)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded bg-green-900/30 border border-green-700/40"></div>
                          <span className="text-slate-400">Tốt (0-5%)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded bg-orange-900/30 border border-orange-700/40"></div>
                          <span className="text-slate-400">Kém (0 đến -5%)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded bg-red-900/40 border border-red-700/50"></div>
                          <span className="text-slate-400">Rất kém (&lt;-5%)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Biểu đồ 2: Chất lượng Lợi nhuận - Area + Line */}
                <div>
                  <h3 className="text-lg font-semibold text-slate-200 mb-4">
                    Chất lượng Lợi nhuận (5 năm gần nhất)
                  </h3>
                  <ResponsiveContainer width="100%" height={400}>
                    <ComposedChart 
                      data={(() => {
                        // Combine data from cash flow and income statement
                        const years = indicatorData.map(r => r["Năm"]).sort();
                        return years.map(nam => {
                          const cashFlowRow = cashFlowData.find(r => r["Mã"] === selectedSymbol && r["Năm"] === nam);
                          const incomeRow = incomeData.find(r => r["Mã"] === selectedSymbol && r["Năm"] === nam);
                          
                          const operatingCF = cashFlowRow 
                            ? toNumberSafe(cashFlowRow[" Lưu chuyển tiền tệ ròng từ các hoạt động sản xuất kinh doanh (TT)"])
                            : 0;
                          const netProfit = incomeRow 
                            ? toNumberSafe(incomeRow[" Cổ đông của Công ty mẹ"])
                            : 0;
                          
                          return {
                            nam,
                            dongTien: operatingCF,
                            loiNhuan: netProfit,
                          };
                        });
                      })()}
                    >
                      <defs>
                        <linearGradient id="colorCF" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={COLORS.cyan} stopOpacity={0.3}/>
                          <stop offset="95%" stopColor={COLORS.cyan} stopOpacity={0.05}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis 
                        dataKey="nam" 
                        stroke="#94a3b8" 
                        style={{ fontSize: '14px', fontWeight: 500 }}
                      />
                      <YAxis 
                        stroke="#94a3b8" 
                        style={{ fontSize: '12px' }}
                        label={{ value: 'Giá trị (VNĐ)', angle: -90, position: 'insideLeft', fill: '#94a3b8' }}
                        tickFormatter={(value) => {
                          if (Math.abs(value) >= 1e9) return `${(value / 1e9).toFixed(1)}B`;
                          if (Math.abs(value) >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
                          return value.toFixed(0);
                        }}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="square" />
                      <ReferenceLine y={0} stroke="#64748b" strokeDasharray="3 3" />
                      
                      {/* Area for Operating Cash Flow */}
                      <Area
                        type="monotone"
                        dataKey="dongTien"
                        fill="url(#colorCF)"
                        stroke={COLORS.cyan}
                        strokeWidth={2}
                        name="Dòng tiền từ HĐKD"
                      />
                      
                      {/* Line for Net Profit */}
                      <Line
                        type="monotone"
                        dataKey="loiNhuan"
                        stroke={COLORS.primary}
                        strokeWidth={3}
                        dot={{ r: 6, fill: COLORS.primary, strokeWidth: 2, stroke: '#fff' }}
                        activeDot={{ r: 8 }}
                        name="Lợi nhuận ròng"
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>

                {/* Insight Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg bg-gradient-to-br from-emerald-900/20 to-slate-800/50 border border-emerald-700/30">
                    <p className="text-xs text-emerald-400 uppercase tracking-wider mb-1 flex items-center gap-2">
                      <span>📈</span>
                      ROE Trung bình 5 năm
                    </p>
                    <p className="text-2xl font-bold text-slate-100">
                      {(() => {
                        const roeValues = indicatorData
                          .map(r => toNumberSafe(r["ROE (%)"]))
                          .filter(v => v > 0);
                        const avgROE = roeValues.length > 0
                          ? roeValues.reduce((a, b) => a + b, 0) / roeValues.length
                          : 0;
                        return avgROE.toFixed(2) + "%";
                      })()}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Hiệu quả sử dụng vốn chủ
                    </p>
                  </div>
                  
                  <div className="p-4 rounded-lg bg-gradient-to-br from-cyan-900/20 to-slate-800/50 border border-cyan-700/30">
                    <p className="text-xs text-cyan-400 uppercase tracking-wider mb-1 flex items-center gap-2">
                      <span>💰</span>
                      Tỷ lệ CF/Lợi nhuận
                    </p>
                    <p className="text-2xl font-bold text-slate-100">
                      {(() => {
                        const lastYear = indicatorData[indicatorData.length - 1]?.["Năm"];
                        const cashFlowRow = cashFlowData.find(r => r["Mã"] === selectedSymbol && r["Năm"] === lastYear);
                        const incomeRow = incomeData.find(r => r["Mã"] === selectedSymbol && r["Năm"] === lastYear);
                        
                        const operatingCF = cashFlowRow 
                          ? toNumberSafe(cashFlowRow[" Lưu chuyển tiền tệ ròng từ các hoạt động sản xuất kinh doanh (TT)"])
                          : 0;
                        const netProfit = incomeRow 
                          ? toNumberSafe(incomeRow[" Cổ đông của Công ty mẹ"])
                          : 0;
                        
                        if (netProfit === 0) return "N/A";
                        const ratio = (operatingCF / netProfit) * 100;
                        return (
                          <span className={ratio >= 100 ? "text-emerald-400" : ratio >= 70 ? "text-yellow-400" : "text-red-400"}>
                            {ratio.toFixed(0)}%
                          </span>
                        );
                      })()}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Năm {indicatorData[indicatorData.length - 1]?.["Năm"]}
                    </p>
                  </div>
                  
                  <div className="p-4 rounded-lg bg-gradient-to-br from-purple-900/20 to-slate-800/50 border border-purple-700/30">
                    <p className="text-xs text-purple-400 uppercase tracking-wider mb-1 flex items-center gap-2">
                      <span>🏆</span>
                      Số năm ROE &gt; Ngành
                    </p>
                    <p className="text-2xl font-bold text-slate-100">
                      {(() => {
                        let countBetter = 0;
                        indicatorData.forEach(row => {
                          const nam = row["Năm"];
                          const companyROE = toNumberSafe(row["ROE (%)"]);
                          const avgRow = averageIndicatorData.find(r => r["Năm"] === nam);
                          const sectorROE = avgRow ? toNumberSafe(avgRow["ROE (%)"]) : 0;
                          if (companyROE > sectorROE) countBetter++;
                        });
                        return `${countBetter}/${indicatorData.length}`;
                      })()} năm
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Vượt trội so với ngành
                    </p>
                  </div>
                </div>

                {/* Analysis Note */}
                <div className="p-4 rounded-lg bg-slate-800/30 border border-slate-700">
                  <p className="text-sm text-slate-300">
                    <span className="font-semibold text-emerald-400">💡 Phân tích Hiệu quả:</span>
                    {(() => {
                      // Calculate average ROE delta
                      const deltas = indicatorData.map(row => {
                        const nam = row["Năm"];
                        const companyROE = toNumberSafe(row["ROE (%)"]);
                        const avgRow = averageIndicatorData.find(r => r["Năm"] === nam);
                        const sectorROE = avgRow ? toNumberSafe(avgRow["ROE (%)"]) : 0;
                        return companyROE - sectorROE;
                      });
                      const avgDelta = deltas.reduce((a, b) => a + b, 0) / deltas.length;
                      
                      // Calculate CF/Profit ratio for last year
                      const lastYear = indicatorData[indicatorData.length - 1]?.["Năm"];
                      const cashFlowRow = cashFlowData.find(r => r["Mã"] === selectedSymbol && r["Năm"] === lastYear);
                      const incomeRow = incomeData.find(r => r["Mã"] === selectedSymbol && r["Năm"] === lastYear);
                      
                      const operatingCF = cashFlowRow 
                        ? toNumberSafe(cashFlowRow[" Lưu chuyển tiền tệ ròng từ các hoạt động sản xuất kinh doanh (TT)"])
                        : 0;
                      const netProfit = incomeRow 
                        ? toNumberSafe(incomeRow[" Cổ đông của Công ty mẹ"])
                        : 0;
                      
                      const cfRatio = netProfit !== 0 ? (operatingCF / netProfit) * 100 : 0;
                      
                      if (avgDelta > 3 && cfRatio >= 100) {
                        return " Công ty có hiệu suất vượt trội so với ngành và chất lượng lợi nhuận cao (dòng tiền tốt hơn lợi nhuận kế toán). Đây là dấu hiệu rất tích cực!";
                      } else if (avgDelta > 0 && cfRatio >= 70) {
                        return " ROE cao hơn ngành và chất lượng lợi nhuận ở mức chấp nhận được. Công ty đang hoạt động hiệu quả.";
                      } else if (avgDelta < 0 && cfRatio < 50) {
                        return " ROE thấp hơn ngành và chất lượng lợi nhuận yếu. Cần xem xét hiệu quả quản lý và chất lượng thu tiền.";
                      } else if (cfRatio < 70) {
                        return " Chất lượng lợi nhuận cần cải thiện - dòng tiền thấp hơn lợi nhuận kế toán đáng kể. Có thể công ty gặp vấn đề về thu hồi công nợ hoặc hàng tồn kho.";
                      } else {
                        return " Hiệu quả hoạt động ở mức trung bình, cần theo dõi xu hướng dài hạn để đánh giá.";
                      }
                    })()}
                  </p>
                </div>
              </>
            ) : (
              <div className="text-slate-400 text-center py-10">
                Không có đủ dữ liệu để hiển thị hiệu quả quá khứ
              </div>
            )}
          </CardContent>
        </Card>

        {/* Placeholder cho các phần còn lại */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 4. Sức khỏe Tài chính */}
          <Card className="bg-slate-900/50 border-slate-700 col-span-2">
            <CardHeader className="bg-slate-800/50 border-b border-slate-700">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-red-500 to-pink-500 rounded-lg">
                  <span className="text-2xl">💪</span>
                </div>
                <div>
                  <CardTitle className="text-xl font-bold text-slate-100">
                    4. Sức khỏe Tài chính
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Cân bằng giữa đòn bẩy và khả năng thanh toán
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-8">
              {indicatorData.length > 0 ? (
                <>
                  {/* Biểu đồ: Đòn bẩy vs. An toàn */}
                  <div>
                    <h3 className="text-lg font-semibold text-slate-200 mb-4">
                      Đòn bẩy vs. An toàn
                    </h3>
                    <ResponsiveContainer width="100%" height={400}>
                      <ComposedChart 
                        data={indicatorData.map(row => ({
                          nam: row["Năm"],
                          deRatio: toNumberSafe(row["Nợ / Vốn chủ sở hữu (DE)"]),
                          currentRatio: toNumberSafe(row["Thanh khoản hiện hành"]),
                        }))}
                      >
                        <defs>
                          <linearGradient id="colorDE" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={COLORS.danger} stopOpacity={0.8}/>
                            <stop offset="95%" stopColor={COLORS.danger} stopOpacity={0.3}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis 
                          dataKey="nam" 
                          stroke="#94a3b8" 
                          style={{ fontSize: '14px', fontWeight: 500 }}
                        />
                        <YAxis 
                          yAxisId="left"
                          stroke="#94a3b8" 
                          style={{ fontSize: '12px' }}
                          label={{ value: 'Nợ/VCSH (Lần)', angle: -90, position: 'insideLeft', fill: '#94a3b8' }}
                        />
                        <YAxis 
                          yAxisId="right"
                          orientation="right"
                          stroke="#94a3b8" 
                          style={{ fontSize: '12px' }}
                          label={{ value: 'Thanh khoản (Lần)', angle: 90, position: 'insideRight', fill: '#94a3b8' }}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="square" />
                        <ReferenceLine yAxisId="left" y={1} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'Ngưỡng an toàn DE=1', fill: '#ef4444', fontSize: 12 }} />
                        <ReferenceLine yAxisId="right" y={1.5} stroke="#10b981" strokeDasharray="3 3" label={{ value: 'Ngưỡng tốt CR=1.5', fill: '#10b981', fontSize: 12 }} />
                        
                        {/* Bar for D/E Ratio */}
                        <Bar
                          yAxisId="left"
                          dataKey="deRatio"
                          fill="url(#colorDE)"
                          name="Nợ/VCSH (DE)"
                          radius={[8, 8, 0, 0]}
                        />
                        
                        {/* Line for Current Ratio */}
                        <Line
                          yAxisId="right"
                          type="monotone"
                          dataKey="currentRatio"
                          stroke={COLORS.primary}
                          strokeWidth={3}
                          dot={{ r: 6, fill: COLORS.primary, strokeWidth: 2, stroke: '#fff' }}
                          activeDot={{ r: 8 }}
                          name="Thanh khoản hiện hành"
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Insight Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-lg bg-gradient-to-br from-red-900/20 to-slate-800/50 border border-red-700/30">
                      <p className="text-xs text-red-400 uppercase tracking-wider mb-1 flex items-center gap-2">
                        <span>⚖️</span>
                        Nợ/VCSH Hiện tại
                      </p>
                      <p className="text-2xl font-bold text-slate-100">
                        {(() => {
                          const latestDE = toNumberSafe(indicatorData[indicatorData.length - 1]["Nợ / Vốn chủ sở hữu (DE)"]);
                          return (
                            <span className={latestDE < 1 ? "text-emerald-400" : latestDE < 2 ? "text-yellow-400" : "text-red-400"}>
                              {latestDE.toFixed(2)}x
                            </span>
                          );
                        })()}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        {(() => {
                          const latestDE = toNumberSafe(indicatorData[indicatorData.length - 1]["Nợ / Vốn chủ sở hữu (DE)"]);
                          if (latestDE < 1) return "Rất an toàn";
                          if (latestDE < 2) return "Ở mức chấp nhận";
                          return "Cần cảnh giác";
                        })()}
                      </p>
                    </div>
                    
                    <div className="p-4 rounded-lg bg-gradient-to-br from-green-900/20 to-slate-800/50 border border-green-700/30">
                      <p className="text-xs text-green-400 uppercase tracking-wider mb-1 flex items-center gap-2">
                        <span>💧</span>
                        Thanh khoản Hiện hành
                      </p>
                      <p className="text-2xl font-bold text-slate-100">
                        {(() => {
                          const latestCR = toNumberSafe(indicatorData[indicatorData.length - 1]["Thanh khoản hiện hành"]);
                          return (
                            <span className={latestCR >= 2 ? "text-emerald-400" : latestCR >= 1.5 ? "text-yellow-400" : "text-red-400"}>
                              {latestCR.toFixed(2)}x
                            </span>
                          );
                        })()}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        {(() => {
                          const latestCR = toNumberSafe(indicatorData[indicatorData.length - 1]["Thanh khoản hiện hành"]);
                          if (latestCR >= 2) return "Rất tốt";
                          if (latestCR >= 1.5) return "Ổn định";
                          return "Cần theo dõi";
                        })()}
                      </p>
                    </div>
                    
                    <div className="p-4 rounded-lg bg-gradient-to-br from-blue-900/20 to-slate-800/50 border border-blue-700/30">
                      <p className="text-xs text-blue-400 uppercase tracking-wider mb-1 flex items-center gap-2">
                        <span>📊</span>
                        Xu hướng DE (5 năm)
                      </p>
                      <p className="text-2xl font-bold text-slate-100">
                        {(() => {
                          if (indicatorData.length < 2) return "N/A";
                          const firstDE = toNumberSafe(indicatorData[0]["Nợ / Vốn chủ sở hữu (DE)"]);
                          const lastDE = toNumberSafe(indicatorData[indicatorData.length - 1]["Nợ / Vốn chủ sở hữu (DE)"]);
                          const change = lastDE - firstDE;
                          return (
                            <span className={change < 0 ? "text-emerald-400" : "text-red-400"}>
                              {change > 0 ? "+" : ""}{change.toFixed(2)}x
                            </span>
                          );
                        })()}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        {(() => {
                          if (indicatorData.length < 2) return "Chưa đủ dữ liệu";
                          const firstDE = toNumberSafe(indicatorData[0]["Nợ / Vốn chủ sở hữu (DE)"]);
                          const lastDE = toNumberSafe(indicatorData[indicatorData.length - 1]["Nợ / Vốn chủ sở hữu (DE)"]);
                          return lastDE < firstDE ? "Giảm nợ tích cực" : "Nợ tăng";
                        })()}
                      </p>
                    </div>
                  </div>

                  {/* Analysis Note */}
                  <div className="p-4 rounded-lg bg-slate-800/30 border border-slate-700">
                    <p className="text-sm text-slate-300">
                      <span className="font-semibold text-blue-400">💡 Phân tích Sức khỏe:</span>
                      {(() => {
                        const latestDE = toNumberSafe(indicatorData[indicatorData.length - 1]["Nợ / Vốn chủ sở hữu (DE)"]);
                        const latestCR = toNumberSafe(indicatorData[indicatorData.length - 1]["Thanh khoản hiện hành"]);
                        
                        if (latestDE < 1 && latestCR >= 2) {
                          return " Sức khỏe tài chính xuất sắc! Đòn bẩy thấp và khả năng thanh toán mạnh. Công ty có thể dễ dàng đối phó với khó khăn tài chính.";
                        } else if (latestDE < 1.5 && latestCR >= 1.5) {
                          return " Sức khỏe tài chính tốt. Mức nợ hợp lý và khả năng thanh toán ổn định. Công ty đang duy trì cân bằng tốt giữa tận dụng đòn bẩy và an toàn tài chính.";
                        } else if (latestDE < 2 && latestCR >= 1) {
                          return " Sức khỏe tài chính ở mức chấp nhận được. Nợ đang tăng hoặc thanh khoản hơi thấp, cần theo dõi kỹ để đảm bảo không rơi vào rủi ro thanh toán.";
                        } else if (latestDE >= 2 || latestCR < 1) {
                          return " Cần cảnh giác về sức khỏe tài chính! Đòn bẩy cao hoặc thanh khoản yếu có thể gây khó khăn trong trả nợ ngắn hạn. Công ty nên ưu tiên giảm nợ và tăng tính thanh khoản.";
                        } else {
                          return " Sức khỏe tài chính ở mức trung bình, cần theo dõi xu hướng để đánh giá rủi ro.";
                        }
                      })()}
                    </p>
                  </div>
                </>
              ) : (
                <div className="text-slate-400 text-center py-10">
                  Không có đủ dữ liệu để hiển thị sức khỏe tài chính
                </div>
              )}
            </CardContent>
          </Card>

          {/* 5. Cổ tức & Cổ đông */}
          <Card className="bg-slate-900/50 border-slate-700 col-span-2">
            <CardHeader className="bg-slate-800/50 border-b border-slate-700">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-yellow-500 to-amber-500 rounded-lg">
                  <span className="text-2xl">💰</span>
                </div>
                <div>
                  <CardTitle className="text-xl font-bold text-slate-100">
                    5. Cổ tức & Cổ đông
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Chính sách phân phối lợi nhuận cho cổ đông
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-8">
              {incomeData.length > 0 && balanceData.length > 0 && cashFlowData.length > 0 ? (
                <>
                  {/* Biểu đồ: Bền vững Cổ tức - Stacked Bar Chart */}
                  <div>
                    <h3 className="text-lg font-semibold text-slate-200 mb-4">
                      Bền vững Cổ tức (Phân bổ Lợi nhuận)
                    </h3>
                    <ResponsiveContainer width="100%" height={400}>
                      <BarChart 
                        data={(() => {
                          const years = indicatorData.map(r => r["Năm"]).sort();
                          return years.map(nam => {
                            // Lấy dữ liệu từ các nguồn
                            const incomeRow = incomeData.find(r => r["Mã"] === selectedSymbol && r["Năm"] === nam);
                            const balanceRow = balanceData.find(r => r["Mã"] === selectedSymbol && r["Năm"] === nam);
                            const cashFlowRow = cashFlowData.find(r => r["Mã"] === selectedSymbol && r["Năm"] === nam);
                            
                            const netProfit = incomeRow 
                              ? toNumberSafe(incomeRow[" Cổ đông của Công ty mẹ"]) / 1e9  // Convert to tỷ
                              : 0;
                            
                            const retainedEarnings = balanceRow 
                              ? toNumberSafe(balanceRow[" Lãi chưa phân phối"]) / 1e9  // Convert to tỷ
                              : 0;
                            
                            const dividendsPaid = cashFlowRow 
                              ? Math.abs(toNumberSafe(cashFlowRow[" Cổ tức đã trả (TT)"])) / 1e9  // Convert to tỷ (lấy giá trị tuyệt đối vì thường là số âm)
                              : 0;
                            
                            return {
                              nam,
                              loiNhuanGiuLai: retainedEarnings,
                              coTucDaTra: dividendsPaid,
                              tongLoiNhuan: netProfit,
                            };
                          });
                        })()}
                      >
                        <defs>
                          <linearGradient id="colorRetained" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={COLORS.cyan} stopOpacity={0.8}/>
                            <stop offset="95%" stopColor={COLORS.cyan} stopOpacity={0.4}/>
                          </linearGradient>
                          <linearGradient id="colorDividend" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={COLORS.accent} stopOpacity={0.8}/>
                            <stop offset="95%" stopColor={COLORS.accent} stopOpacity={0.4}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis 
                          dataKey="nam" 
                          stroke="#94a3b8" 
                          style={{ fontSize: '14px', fontWeight: 500 }}
                        />
                        <YAxis 
                          stroke="#94a3b8" 
                          style={{ fontSize: '12px' }}
                          label={{ value: 'Giá trị (Tỷ VNĐ)', angle: -90, position: 'insideLeft', fill: '#94a3b8' }}
                        />
                        <Tooltip 
                          content={({ active, payload, label }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              return (
                                <div className="bg-slate-800/95 border border-slate-600 p-3 rounded-lg shadow-xl">
                                  <p className="text-slate-200 font-semibold mb-2">Năm {label}</p>
                                  <p className="text-sm text-slate-300">
                                    <span className="text-slate-400">Tổng lợi nhuận:</span>{" "}
                                    <span className="font-bold text-emerald-400">{data.tongLoiNhuan.toFixed(2)} tỷ</span>
                                  </p>
                                  <div className="mt-2 space-y-1">
                                    {payload.map((entry: any, index: number) => (
                                      <p key={index} className="text-sm" style={{ color: entry.color }}>
                                        {entry.name}: <span className="font-bold">{entry.value.toFixed(2)} tỷ</span>
                                        {" "}({((entry.value / data.tongLoiNhuan) * 100).toFixed(1)}%)
                                      </p>
                                    ))}
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="square" />
                        <ReferenceLine y={0} stroke="#64748b" strokeDasharray="3 3" />
                        
                        {/* Stacked Bars */}
                        <Bar 
                          dataKey="loiNhuanGiuLai" 
                          stackId="a"
                          fill="url(#colorRetained)" 
                          name="Lợi nhuận giữ lại"
                          radius={[0, 0, 0, 0]}
                        />
                        <Bar 
                          dataKey="coTucDaTra" 
                          stackId="a"
                          fill="url(#colorDividend)" 
                          name="Cổ tức đã trả"
                          radius={[8, 8, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Insight Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-lg bg-gradient-to-br from-amber-900/20 to-slate-800/50 border border-amber-700/30">
                      <p className="text-xs text-amber-400 uppercase tracking-wider mb-1 flex items-center gap-2">
                        <span>💵</span>
                        Cổ tức TB/năm
                      </p>
                      <p className="text-2xl font-bold text-slate-100">
                        {(() => {
                          const years = indicatorData.map(r => r["Năm"]);
                          const dividends = years.map(nam => {
                            const cashFlowRow = cashFlowData.find(r => r["Mã"] === selectedSymbol && r["Năm"] === nam);
                            return cashFlowRow 
                              ? Math.abs(toNumberSafe(cashFlowRow[" Cổ tức đã trả (TT)"])) / 1e9
                              : 0;
                          }).filter(v => v > 0);
                          
                          const avgDividend = dividends.length > 0
                            ? dividends.reduce((a, b) => a + b, 0) / dividends.length
                            : 0;
                          
                          return avgDividend.toFixed(2) + " tỷ";
                        })()}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        {(() => {
                          const years = indicatorData.map(r => r["Năm"]);
                          const dividends = years.map(nam => {
                            const cashFlowRow = cashFlowData.find(r => r["Mã"] === selectedSymbol && r["Năm"] === nam);
                            return cashFlowRow 
                              ? Math.abs(toNumberSafe(cashFlowRow[" Cổ tức đã trả (TT)"])) / 1e9
                              : 0;
                          }).filter(v => v > 0);
                          
                          return `${dividends.length}/${years.length} năm có trả cổ tức`;
                        })()}
                      </p>
                    </div>
                    
                    <div className="p-4 rounded-lg bg-gradient-to-br from-cyan-900/20 to-slate-800/50 border border-cyan-700/30">
                      <p className="text-xs text-cyan-400 uppercase tracking-wider mb-1 flex items-center gap-2">
                        <span>📊</span>
                        Tỷ lệ Chi trả
                      </p>
                      <p className="text-2xl font-bold text-slate-100">
                        {(() => {
                          const lastYear = indicatorData[indicatorData.length - 1]?.["Năm"];
                          const incomeRow = incomeData.find(r => r["Mã"] === selectedSymbol && r["Năm"] === lastYear);
                          const cashFlowRow = cashFlowData.find(r => r["Mã"] === selectedSymbol && r["Năm"] === lastYear);
                          
                          const netProfit = incomeRow 
                            ? toNumberSafe(incomeRow[" Cổ đông của Công ty mẹ"])
                            : 0;
                          const dividendsPaid = cashFlowRow 
                            ? Math.abs(toNumberSafe(cashFlowRow[" Cổ tức đã trả (TT)"]))
                            : 0;
                          
                          if (netProfit === 0) return "N/A";
                          const payoutRatio = (dividendsPaid / netProfit) * 100;
                          
                          return (
                            <span className={payoutRatio > 0 && payoutRatio <= 60 ? "text-emerald-400" : payoutRatio > 60 ? "text-yellow-400" : "text-slate-400"}>
                              {payoutRatio > 0 ? payoutRatio.toFixed(1) + "%" : "0%"}
                            </span>
                          );
                        })()}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        Năm {indicatorData[indicatorData.length - 1]?.["Năm"]}
                      </p>
                    </div>
                    
                    <div className="p-4 rounded-lg bg-gradient-to-br from-emerald-900/20 to-slate-800/50 border border-emerald-700/30">
                      <p className="text-xs text-emerald-400 uppercase tracking-wider mb-1 flex items-center gap-2">
                        <span>🌱</span>
                        Tăng trưởng Cổ tức
                      </p>
                      <p className="text-2xl font-bold text-slate-100">
                        {(() => {
                          const years = indicatorData.map(r => r["Năm"]).sort();
                          if (years.length < 2) return "N/A";
                          
                          const firstYear = years[0];
                          const lastYear = years[years.length - 1];
                          
                          const firstCF = cashFlowData.find(r => r["Mã"] === selectedSymbol && r["Năm"] === firstYear);
                          const lastCF = cashFlowData.find(r => r["Mã"] === selectedSymbol && r["Năm"] === lastYear);
                          
                          const firstDiv = firstCF ? Math.abs(toNumberSafe(firstCF[" Cổ tức đã trả (TT)"])) : 0;
                          const lastDiv = lastCF ? Math.abs(toNumberSafe(lastCF[" Cổ tức đã trả (TT)"])) : 0;
                          
                          if (firstDiv === 0 || lastDiv === 0) return "N/A";
                          
                          const cagr = (Math.pow(lastDiv / firstDiv, 1 / (years.length - 1)) - 1) * 100;
                          
                          return (
                            <span className={cagr > 0 ? "text-emerald-400" : "text-red-400"}>
                              {cagr > 0 ? "+" : ""}{cagr.toFixed(1)}%
                            </span>
                          );
                        })()}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        CAGR {indicatorData.length > 1 ? indicatorData.length - 1 : 0} năm
                      </p>
                    </div>
                  </div>

                  {/* Analysis Note */}
                  <div className="p-4 rounded-lg bg-slate-800/30 border border-slate-700">
                    <p className="text-sm text-slate-300">
                      <span className="font-semibold text-amber-400">💡 Phân tích Cổ tức:</span>
                      {(() => {
                        const lastYear = indicatorData[indicatorData.length - 1]?.["Năm"];
                        const incomeRow = incomeData.find(r => r["Mã"] === selectedSymbol && r["Năm"] === lastYear);
                        const cashFlowRow = cashFlowData.find(r => r["Mã"] === selectedSymbol && r["Năm"] === lastYear);
                        
                        const netProfit = incomeRow ? toNumberSafe(incomeRow[" Cổ đông của Công ty mẹ"]) : 0;
                        const dividendsPaid = cashFlowRow ? Math.abs(toNumberSafe(cashFlowRow[" Cổ tức đã trả (TT)"])) : 0;
                        const payoutRatio = netProfit !== 0 ? (dividendsPaid / netProfit) * 100 : 0;
                        
                        // Count years with dividends
                        const years = indicatorData.map(r => r["Năm"]);
                        const yearsWithDividends = years.filter(nam => {
                          const cf = cashFlowData.find(r => r["Mã"] === selectedSymbol && r["Năm"] === nam);
                          return cf && Math.abs(toNumberSafe(cf[" Cổ tức đã trả (TT)"])) > 0;
                        }).length;
                        
                        if (yearsWithDividends === 0) {
                          return " Công ty chưa trả cổ tức trong giai đoạn này. Đây có thể là dấu hiệu công ty đang tập trung tái đầu tư vào tăng trưởng, hoặc đang gặp khó khăn về dòng tiền.";
                        } else if (payoutRatio > 0 && payoutRatio <= 40 && yearsWithDividends >= years.length * 0.6) {
                          return " Chính sách cổ tức bền vững! Tỷ lệ chi trả hợp lý cho phép công ty vừa đền đáp cổ đông vừa giữ lại lợi nhuận để tái đầu tư tăng trưởng. Đây là dấu hiệu của quản lý tài chính khôn ngoan.";
                        } else if (payoutRatio > 40 && payoutRatio <= 60) {
                          return " Tỷ lệ chi trả cổ tức tương đối cao. Công ty đang ưu tiên đền đáp cổ đông, nhưng cần đảm bảo vẫn còn đủ vốn để duy trì và phát triển kinh doanh.";
                        } else if (payoutRatio > 60) {
                          return " Tỷ lệ chi trả cổ tức rất cao (>60%). Mặc dù tốt cho cổ đông ngắn hạn, nhưng có thể hạn chế khả năng tái đầu tư của công ty. Cần xem xét liệu đây có phải là chính sách bền vững.";
                        } else if (yearsWithDividends < years.length * 0.5) {
                          return " Chính sách cổ tức không ổn định - chỉ trả trong một số năm. Nhà đầu tư cần theo dõi để hiểu rõ chiến lược phân phối lợi nhuận của công ty.";
                        } else {
                          return " Chính sách cổ tức đang được duy trì, cần theo dõi xu hướng để đánh giá tính bền vững.";
                        }
                      })()}
                    </p>
                  </div>
                </>
              ) : (
                <div className="text-slate-400 text-center py-10">
                  Không có đủ dữ liệu để hiển thị thông tin cổ tức
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </TabsContent>
    </Tabs>
  );
}