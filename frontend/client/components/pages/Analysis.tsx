// client/components/pages/Analysis.tsx
// VERSION 2.0 - Compact layout với sidebar, theme support

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  ChevronsUpDown,
  Check,
  BarChart3,
  Search as SearchIcon,
  TrendingUp,
  TrendingDown,
  Activity,
  DollarSign,
  Calendar,
  AlertTriangle,
  Star,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import ChartsTab from "@/components/pages/analysis/ChartsTab";
import AiTab from "@/components/pages/analysis/AiTab";
import AlertsTab from "@/components/pages/analysis/AlertsTab";
import MetricsTab from "@/components/pages/analysis/MetricsTab";

// ===== CSV helpers & types (GIỮ LOGIC)
function parseCSV(text: string): { headers: string[]; rows: string[][] } {
  const rows: string[][] = [];
  let current: string[] = [];
  let field = "";
  let inQuotes = false;
  const pushField = () => {
    current.push(field);
    field = "";
  };
  const pushRow = () => {
    rows.push(current);
    current = [];
  };

  for (let i = 0; i < text.length; i++) {
    const c = text[i],
      next = text[i + 1];
    if (inQuotes) {
      if (c === '"' && next === '"') {
        field += '"';
        i++;
      } else if (c === '"') {
        inQuotes = false;
      } else {
        field += c;
      }
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ",") pushField();
      else if (c === "\n") {
        pushField();
        pushRow();
      } else if (c !== "\r") field += c;
    }
  }
  pushField();
  if (current.length) pushRow();
  const headers = rows.shift() || [];
  return { headers, rows };
}

type RecordMap = Record<string, string>;
type BalanceRow = { item: string; values: Record<string, string> };

function normalize(str: string) {
  return (str || "").trim().toLowerCase();
}
function pickColumn(headers: string[], names: string[]): string | null {
  const idx = headers.findIndex((h) =>
    names.some((n) => normalize(h).includes(n))
  );
  return idx >= 0 ? headers[idx] : null;
}
function toObjects(headers: string[], rows: string[][]): RecordMap[] {
  return rows.map((r) => {
    const obj: RecordMap = {};
    headers.forEach((h, i) => {
      obj[h] = r[i] ?? "";
    });
    return obj;
  });
}

const COLUMN_TRANSLATIONS: Record<string, string> = {
  Name: "TÊN CÔNG TY",
  Symbol: "MÃ CỔ PHIẾU",
  "Start Date": "NGÀY CÔNG BỐ",
  Category: "PHÂN LOẠI",
  Exchange: "SÀN",
  Market: "THỊ TRƯỜNG",
  Currency: "ĐƠN VỊ TIỀN TỆ",
  Sector: "NGÀNH",
  Activity: "TÌNH TRẠNG HOẠT ĐỘNG",
};
const COLUMNS_TO_HIDE = ["", "RIC", "Hist.", "Full Name"];

function isYearHeader(h: string) {
  return /^\s*20\d{2}\s*$/.test(h || "");
}
function formatNumberLike(n: string) {
  const num = Number((n ?? "").toString().replace(/,/g, ""));
  if (Number.isNaN(num)) return n ?? "-";
  return num.toLocaleString("en-US");
}
function stripHeaders(arr: string[]) {
  return (arr || []).map((h) => (h ?? "").trim());
}
function isMetaColName(h: string) {
  const n = (h ?? "").trim().toLowerCase();
  return (
    !n ||
    n === "mã" ||
    n === "ma" ||
    n === "symbol" ||
    n === "ticker" ||
    n === "năm" ||
    n === "nam" ||
    n.startsWith("unnamed")
  );
}
function toNumberSafe(v: any): number {
  if (v == null) return 0;
  const s = String(v).trim().replace(/,/g, "").replace(/\s+/g, "");
  if (!s) return 0;
  const negMatch = s.match(/^\(([\d.]+)\)$/);
  if (negMatch) {
    const n = Number(negMatch[1].replace(/\./g, ""));
    return Number.isFinite(n) ? -n : 0;
  }
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}
function detectRowKind(label: string): "section" | "subsection" | "item" {
  const s = (label || "").trim();
  if (
    /^[A-ZĐĂÂÊÔƠƯ]\s*[\.\)]/.test(s) ||
    /^(?:I|II|III|IV|V|VI|VII|VIII|IX|X)\s*[\.\)]/.test(s)
  )
    return "section";
  const letters = s.replace(/[^A-Za-zÀ-ỹĐđ]/g, "");
  if (letters && s === s.toUpperCase()) return "section";
  if (/^\d+(?:\.\d+)*\s*[\.\)]?/.test(s)) return "subsection";
  return "item";
}

/* ================================
   Main Analysis Page
================================== */
type PanelState = {
  loading: boolean;
  error: string;
  years: string[];
  rows: BalanceRow[] | null;
};

export default function AnalysisPage() {
  // Stock_info search state
  const [csvObjects, setCsvObjects] = useState<RecordMap[] | null>(null);
  const [headers, setHeaders] = useState<string[] | null>(null);
  const [exchange, setExchange] = useState<string>("");
  const [query, setQuery] = useState<string>("");
  const [comboText, setComboText] = useState<string>("");
  const [comboOpen, setComboOpen] = useState<boolean>(false);
  const [result, setResult] = useState<RecordMap | null>(null);
  const [error, setError] = useState<string>("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Financial data state
  const [balanceState, setBalanceState] = useState<PanelState>({
    loading: false,
    error: "",
    years: [],
    rows: null,
  });
  const [incomeState, setIncomeState] = useState<PanelState>({
    loading: false,
    error: "",
    years: [],
    rows: null,
  });
  const [cashState, setCashState] = useState<PanelState>({
    loading: false,
    error: "",
    years: [],
    rows: null,
  });

  // Load Stock_info.csv
  const STOCK_INFO_URL = "/Stock_info.csv";
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(STOCK_INFO_URL, { cache: "no-store" });
        const text = await res.text();
        const { headers, rows } = parseCSV(text);
        setHeaders(headers);
        setCsvObjects(toObjects(headers, rows));
        setResult(null);
        setError("");
      } catch {
        setError(
          "Không thể tải Stock_info.csv từ /public. Hãy kiểm tra đường dẫn hoặc quyền truy cập."
        );
      }
    };
    load();
  }, []);

  const columnHints = useMemo(() => {
    const hs = headers || [];
    const exchangeCol = pickColumn(hs, ["exchange", "sàn", "san"]);
    const symbolCol = pickColumn(hs, ["symbol", "ticker", "mã", "ma"]);
    const nameCol = pickColumn(hs, ["name", "full name", "tên", "ten"]);
    return { exchangeCol, symbolCol, nameCol };
  }, [headers]);

  const exchanges = useMemo(() => {
    const { exchangeCol } = columnHints;
    if (!csvObjects || !exchangeCol) return [];
    const s = new Set(
      csvObjects
        .map((r) => (r[exchangeCol] || "").trim())
        .filter((v) => !!v)
    );
    return Array.from(s).sort();
  }, [csvObjects, columnHints]);

  const suggestions = useMemo(() => {
    const { symbolCol, exchangeCol } = columnHints;
    if (!csvObjects || !symbolCol || !exchange) return [];
    const rowsInEx = exchangeCol
      ? csvObjects.filter(
          (r) => normalize(r[exchangeCol]) === normalize(exchange)
        )
      : csvObjects;

    const set = new Set<string>();
    rowsInEx.forEach((r) => {
      const sym = (r[symbolCol] || "").trim();
      if (sym) set.add(sym);
    });
    return Array.from(set).sort();
  }, [csvObjects, columnHints, exchange]);

  useEffect(() => {
    setError("");
  }, [exchange, query, comboText]);

  useEffect(() => {
    if (inputRef.current && document.activeElement === inputRef.current)
      inputRef.current.focus({ preventScroll: true });
  }, [comboText]);

  function handleSearch() {
    setResult(null);
    setError("");

    if (!exchange?.trim()) {
      setError("⚠ Vui lòng chọn Sàn trước!");
      return;
    }
    if (!query?.trim()) {
      setError("⚠ Vui lòng nhập Mã cổ phiếu!");
      return;
    }

    const { symbolCol, exchangeCol } = columnHints;
    if (!csvObjects || !symbolCol) {
      setError("⚠ Dữ liệu chưa sẵn sàng!");
      return;
    }

    const rowsInEx = exchangeCol
      ? csvObjects.filter(
          (r) => normalize(r[exchangeCol]) === normalize(exchange)
        )
      : csvObjects;

    const found = rowsInEx.find(
      (r) => normalize(r[symbolCol]) === normalize(query)
    );
    if (!found) {
      setError(`⚠ Không tìm thấy mã "${query}" trên sàn "${exchange}"`);
      return;
    }

    setResult(found);
  }

  // ====== Financial tables (3 bảng)
  const BALANCE_SHEET_URL = "/Balance_sheet.csv";
  const INCOME_STATEMENT_URL = "/Income_statement.csv";
  const CASH_FLOW_URL = "/Cash_flow.csv";

  // generic loader dùng lại logic từ file gốc
  async function loadFinancialTable(url: string, chosenSymbol: string): Promise<PanelState> {
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error("Không thể tải " + url.split("/").pop());
      const text = await res.text();
      const { headers: rawHeaders, rows: rawRows } = parseCSV(text);
      if (!rawHeaders?.length || !rawRows?.length) throw new Error("File trống hoặc sai định dạng: " + url);

      const bsHeaders = stripHeaders(rawHeaders);
      const symbolCol = pickColumn(bsHeaders, ["mã", "symbol", "ticker", "ma"]);
      const yearCol   = pickColumn(bsHeaders, ["năm", "year", "nam"]);
      const valueCol  = pickColumn(bsHeaders, ["value", "amount", "giá trị", "gia tri", "số tiền", "so tien", "vnd", "đồng", "dong"]);
      const itemCol   = pickColumn(bsHeaders, ["item", "line item", "account", "chỉ tiêu", "chi tieu", "khoản mục", "khoan muc"]);
      if (!yearCol) throw new Error("Không tìm thấy cột năm.");

      const wideYearHeaders = bsHeaders.filter(isYearHeader);
      const wantSymbol = chosenSymbol.toUpperCase();

      // WIDE
      if (wideYearHeaders.length > 0) {
        let years = wideYearHeaders.map((h) => h.trim()).filter((y) => Number(y) >= 2020).sort((a,b)=>Number(a)-Number(b));
        if (years.length > 5) years = years.slice(-5);
        const symIdx = symbolCol ? bsHeaders.indexOf(symbolCol) : -1;
        const filtered = rawRows.filter((r) => symIdx < 0 ? true : ((r[symIdx] || "").toUpperCase().trim() === wantSymbol));
        if (!filtered.length) throw new Error("Không tìm thấy dữ liệu cho mã đã chọn.");

        const guessItemHeader = itemCol || bsHeaders.find((h) => !isYearHeader(h) && h !== symbolCol) || "Item";
        const guessItemIdx = bsHeaders.indexOf(guessItemHeader);
        const table = filtered.map((r) => {
          const itemLabel = (r[guessItemIdx] || "").trim() || "(Khoản mục)";
          const values: Record<string, string> = {};
          years.forEach((y) => { const yi = bsHeaders.indexOf(y); values[y] = r[yi] ?? ""; });
          return { item: itemLabel, values };
        });

        const labeled = table.map(row => ({ ...row, kind: detectRowKind(row.item) as "section" | "subsection" | "item" }));
        const pruned = labeled.filter(row => row.kind !== "item" ? true : !years.every(y => toNumberSafe(row.values[y]) === 0));
        return { loading: false, error: "", years, rows: pruned };
      }

      // LONG
      if (valueCol && itemCol) {
        const yearIdx  = bsHeaders.indexOf(yearCol);
        const valueIdx = bsHeaders.indexOf(valueCol);
        const itemIdx  = bsHeaders.indexOf(itemCol);
        const symIdx   = symbolCol ? bsHeaders.indexOf(symbolCol) : -1;

        const filtered = rawRows.filter((r) => symIdx < 0 ? true : ((r[symIdx] || "").toUpperCase().trim() === wantSymbol));
        if (!filtered.length) throw new Error("Không tìm thấy dữ liệu cho mã đã chọn.");

        const map: Record<string, Record<string, string>> = {};
        const yearSet = new Set<string>();
        filtered.forEach((r) => {
          const y  = (r[yearIdx] || "").toString().trim();
          const it = (r[itemIdx] || "").toString().trim() || "(Khoản mục)";
          const v  = r[valueIdx] ?? "";
          const yn = Number(y);
          if (!Number.isNaN(yn) && yn >= 2020) { yearSet.add(y); (map[it] ||= {})[y] = v; }
        });

        let years = Array.from(yearSet).sort((a,b)=>Number(a)-Number(b));
        if (years.length > 5) years = years.slice(-5);

        const table = Object.keys(map).map((k) => ({ item: k, values: map[k] }));
        const labeled = table.map(row => ({ ...row, kind: detectRowKind(row.item) as "section" | "subsection" | "item" }));
        const pruned = labeled.filter(row => row.kind !== "item" ? true : !years.every(y => toNumberSafe(row.values[y]) === 0));

        if (!years.length || !table.length) throw new Error("Không có dữ liệu năm từ 2020 trở đi.");
        return { loading: false, error: "", years, rows: pruned };
      }

      // MATRIX
      {
        const yearIdx = bsHeaders.indexOf(yearCol);
        const symIdx  = symbolCol ? bsHeaders.indexOf(symbolCol) : -1;

        const filtered = rawRows.filter((r) => symIdx < 0 ? true : ((r[symIdx] || "").toUpperCase().trim() === wantSymbol));
        if (!filtered.length) throw new Error("Không tìm thấy dữ liệu cho mã đã chọn.");

        let yearsNum = Array.from(new Set(
          filtered.map((r) => Number((r[yearIdx] || "").toString().trim())).filter((n) => !Number.isNaN(n) && n >= 2020)
        )).sort((a,b)=>a-b);
        if (!yearsNum.length) throw new Error("Không có dữ liệu năm từ 2020 trở đi.");
        if (yearsNum.length > 5) yearsNum = yearsNum.slice(-5);
        const years = yearsNum.map(String);

        const itemCols = bsHeaders.filter((h) => !isMetaColName(h));
        const table = itemCols.map((colName) => {
          const colIdx = bsHeaders.indexOf(colName);
          const values: Record<string, string> = {};
          years.forEach((y) => {
            const row = filtered.find((r) => String(r[yearIdx]).trim() === y);
            values[y] = row ? (row[colIdx] ?? "") : "";
          });
          return { item: colName.trim(), values };
        });

        const labeled = table.map(row => ({ ...row, kind: detectRowKind(row.item) as "section" | "subsection" | "item" }));
        const pruned = labeled.filter(row => row.kind !== "item" ? true : !years.every(y => toNumberSafe(row.values[y]) === 0));

        return { loading: false, error: "", years, rows: pruned };
      }
    } catch (e: any) {
      return { loading: false, error: e?.message || "Có lỗi khi tải dữ liệu.", years: [], rows: null };
    }
  }

  // tự tải 3 bảng khi đã có result
  useEffect(() => {
    const run = async () => {
      if (!result) { 
        setBalanceState({ loading: false, error: "", years: [], rows: null }); 
        setIncomeState({ loading: false, error: "", years: [], rows: null }); 
        setCashState({ loading: false, error: "", years: [], rows: null }); 
        return; 
      }
      const sym = (columnHints.symbolCol && result[columnHints.symbolCol]) || (query || comboText)?.trim() || "";
      if (!sym) return;

      setBalanceState((s) => ({ ...s, loading: true, error: "" }));
      setIncomeState((s) => ({ ...s, loading: true, error: "" }));
      setCashState((s) => ({ ...s, loading: true, error: "" }));

      const [bsRes, isRes, cfRes] = await Promise.all([
        loadFinancialTable(BALANCE_SHEET_URL, sym).catch((e) => ({ loading:false, error:String(e?.message||"Lỗi"), years:[], rows:null })),
        loadFinancialTable(INCOME_STATEMENT_URL, sym).catch((e) => ({ loading:false, error:String(e?.message||"Chưa có file KQKD"), years:[], rows:null })),
        loadFinancialTable(CASH_FLOW_URL, sym).catch((e) => ({ loading:false, error:String(e?.message||"Chưa có file LCTT"), years:[], rows:null })),
      ]);
      setBalanceState(bsRes); 
      setIncomeState(isRes); 
      setCashState(cfRes);
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result]);

  // selectedSymbol: giống logic file backup
  const selectedSymbol =
    (columnHints.symbolCol && result?.[columnHints.symbolCol]) ||
    (query || comboText)?.trim() ||
    "";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <ThemeToggle />

      {/* Header với gradient */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 border-b border-slate-700 dark:border-slate-800">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-3 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-xl shadow-lg">
              <BarChart3 className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-white">
                Phân tích Cổ phiếu
              </h1>
              <p className="text-slate-400">
                Tra cứu và phân tích chi tiết doanh nghiệp
              </p>
            </div>
          </div>

          {/* Search Section - Compact */}
          <Card className="border-slate-700 dark:border-slate-700 bg-slate-800/50 dark:bg-slate-800/50 backdrop-blur">
            <CardContent className="pt-6">
              <div className="grid md:grid-cols-3 gap-4">
                {/* Exchange Select */}
                <div className="space-y-2">
                  <Label className="text-slate-300 font-semibold">
                    Sàn giao dịch
                  </Label>
                  <Select value={exchange} onValueChange={setExchange}>
                    <SelectTrigger className="h-12 bg-slate-700/50 dark:bg-slate-700/50 border-slate-600 dark:border-slate-600 text-slate-200">
                      <SelectValue placeholder="Chọn sàn..." />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 dark:bg-slate-800 border-slate-700">
                      <SelectGroup>
                        {exchanges.map((ex) => (
                          <SelectItem
                            key={ex}
                            value={ex}
                            className="text-slate-200 focus:bg-slate-700"
                          >
                            {ex}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>

                {/* Symbol Combobox */}
                <div className="space-y-2">
                  <Label className="text-slate-300 font-semibold">
                    Mã cổ phiếu
                  </Label>
                  <StockCombobox
                    query={query}
                    setQuery={setQuery}
                    comboText={comboText}
                    setComboText={setComboText}
                    open={comboOpen}
                    setOpen={setComboOpen}
                    suggestions={suggestions}
                    disabled={!exchange}
                    inputRef={inputRef}
                  />
                </div>

                {/* Search Button */}
                <div className="space-y-2">
                  <Label className="text-transparent">.</Label>
                  <Button
                    onClick={handleSearch}
                    disabled={!exchange || !query}
                    className="w-full h-12 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <SearchIcon className="h-5 w-5 mr-2" />
                    Tìm kiếm
                  </Button>
                </div>
              </div>

              {error && (
                <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        {result ? (
          <div className="grid lg:grid-cols-4 gap-6">
            {/* Main Content - 3 columns */}
            <div className="lg:col-span-3 space-y-6">
              <ResultCard
                rec={result}
                columnHints={columnHints}
                headers={headers}
              />

              {/* Tabs */}
              <Tabs defaultValue="data" className="w-full">
                <TabsList className="grid w-full grid-cols-5 bg-slate-200 dark:bg-slate-800 p-1">
                  <TabsTrigger
                    value="data"
                    className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700"
                  >
                    Dữ liệu
                  </TabsTrigger>
                  <TabsTrigger
                    value="charts"
                    className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700"
                  >
                    Biểu đồ
                  </TabsTrigger>
                  <TabsTrigger
                    value="metrics"
                    className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700"
                  >
                    Chỉ số
                  </TabsTrigger>
                  <TabsTrigger
                    value="ai"
                    className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700"
                  >
                    Phân tích
                  </TabsTrigger>
                  <TabsTrigger
                    value="alerts"
                    className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700"
                  >
                    Cảnh báo
                  </TabsTrigger>
                </TabsList>

                {/* Tab Dữ liệu: 3 bảng */}
                <TabsContent value="data" className="mt-6 space-y-6">
                  <FinancialTablePanel
                    title="Bảng cân đối kế toán"
                    state={balanceState}
                  />
                  <FinancialTablePanel
                    title="Báo cáo kết quả kinh doanh"
                    state={incomeState}
                  />
                  <FinancialTablePanel
                    title="Báo cáo lưu chuyển tiền tệ"
                    state={cashState}
                  />
                </TabsContent>

                {/* Tab Biểu đồ */}
                <TabsContent value="charts" className="mt-6">
                  <ChartsTab selectedSymbol={selectedSymbol} />
                </TabsContent>

                {/* Tab Chỉ số */}
                <TabsContent value="metrics" className="mt-6">
                  <MetricsTab selectedSymbol={selectedSymbol} />
                </TabsContent>

                {/* Tab AI */}
                <TabsContent value="ai" className="mt-6">
                  <AiTab selectedSymbol={selectedSymbol} />
                </TabsContent>

                {/* Tab Cảnh báo */}
                <TabsContent value="alerts" className="mt-6">
                  <AlertsTab selectedSymbol={selectedSymbol} />
                </TabsContent>
              </Tabs>
            </div>

            {/* Sidebar - 1 column */}
            <div className="lg:col-span-1 space-y-6">
              <QuickInfoCard rec={result} columnHints={columnHints} />
              <PriceCard />
              <NewsCard />
            </div>
          </div>
        ) : (
          <EmptyState />
        )}
      </div>
    </div>
  );
}

/* ================================
   Components
================================== */

function StockCombobox({
  query,
  setQuery,
  comboText,
  setComboText,
  open,
  setOpen,
  suggestions,
  disabled,
  inputRef,
}: any) {
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          className="w-full h-12 justify-between bg-slate-700/50 dark:bg-slate-700/50 border-slate-600 dark:border-slate-600 text-slate-200 hover:bg-slate-600/50"
          disabled={disabled}
          onClick={() => setOpen((o: boolean) => !o)}
        >
          <span className="truncate">
            {query?.trim()
              ? query
              : disabled
              ? "Vui lòng chọn Sàn trước"
              : "Chọn hoặc gõ mã (VD: FPT)"}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50 flex-shrink-0" />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className="p-0 w-[--radix-popover-trigger-width] bg-slate-800 dark:bg-slate-800 border-slate-700"
        align="start"
      >
        <Command shouldFilter={false} className="bg-slate-800 dark:bg-slate-800">
          <CommandInput
            placeholder="Gõ mã cổ phiếu (VD: FPT)"
            value={comboText}
            onValueChange={setComboText}
            autoFocus
            className="h-12 text-slate-200"
            ref={inputRef}
          />
          <CommandEmpty className="text-slate-400">
            Không tìm thấy mã phù hợp
          </CommandEmpty>
          <CommandGroup className="max-h-64 overflow-auto">
            {suggestions
              .filter((s: string) =>
                s.toLowerCase().includes((comboText || "").toLowerCase())
              )
              .map((s: string) => (
                <CommandItem
                  key={s}
                  value={s}
                  onSelect={(cur) => {
                    setQuery(cur);
                    setComboText(cur);
                    setOpen(false);
                  }}
                  className="cursor-pointer text-slate-200 hover:bg-slate-700 dark:hover:bg-slate-700"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      query === s ? "opacity-100 text-emerald-400" : "opacity-0"
                    )}
                  />
                  <span className="font-medium">{s}</span>
                </CommandItem>
              ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function ResultCard({ rec, columnHints, headers }: any) {
  const { exchangeCol, symbolCol, nameCol } = columnHints;
  const exchange = exchangeCol ? rec[exchangeCol] : "-";
  const symbol = symbolCol ? rec[symbolCol] : "-";
  const name = nameCol ? rec[nameCol] : "-";
  const filteredHeaders = (headers || Object.keys(rec)).filter(
    (h: string) => !COLUMNS_TO_HIDE.includes(h.trim())
  );
  const translateHeader = (header: string): string =>
    COLUMN_TRANSLATIONS[header] || header;

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="border-2 border-emerald-500/30 dark:border-emerald-500/30 bg-gradient-to-br from-white to-slate-50 dark:from-slate-800/90 dark:to-slate-900/90 shadow-xl">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-xl shadow-lg">
                <BarChart3 className="h-8 w-8 text-white" />
              </div>
              <div>
                <CardTitle className="text-3xl font-black text-slate-800 dark:text-slate-100 flex items-center space-x-3">
                  <span>{symbol}</span>
                  <Badge className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-white border-0 text-base px-3 py-1">
                    {exchange}
                  </Badge>
                </CardTitle>
                <p className="text-slate-600 dark:text-slate-400 mt-1 font-medium">
                  {name}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star
                  key={i}
                  className="h-4 w-4 fill-yellow-400 text-yellow-400"
                />
              ))}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Detail Card */}
      <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/90 shadow-xl">
        <CardHeader className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
          <CardTitle className="text-lg font-bold text-slate-800 dark:text-slate-100">
            Thông tin chi tiết
          </CardTitle>
          <CardDescription className="text-slate-600 dark:text-slate-400">
            Dữ liệu đầy đủ về cổ phiếu {symbol}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredHeaders.map((h: string) => (
              <div
                key={h}
                className="flex flex-col p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700"
              >
                <span className="text-xs font-bold text-slate-500 dark:text-slate-500 uppercase tracking-wider mb-2">
                  {translateHeader(h)}
                </span>
                <span className="text-base font-semibold text-slate-800 dark:text-slate-200 break-words">
                  {rec[h] || "-"}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function QuickInfoCard({ rec, columnHints }: any) {
  const { symbolCol, nameCol } = columnHints;
  const symbol = symbolCol ? rec[symbolCol] : "-";
  const name = nameCol ? rec[nameCol] : "-";

  return (
    <Card className="border-slate-200 dark:border-slate-700 bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 dark:from-emerald-500/20 dark:to-cyan-500/20 sticky top-6">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center space-x-2">
          <Info className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          <span>Thông tin nhanh</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <div className="text-xs text-slate-500 dark:text-slate-500 mb-1">
            Mã
          </div>
          <div className="text-2xl font-black text-slate-800 dark:text-white">
            {symbol}
          </div>
        </div>
        <Separator className="bg-slate-200 dark:bg-slate-700" />
        <div>
          <div className="text-xs text-slate-500 dark:text-slate-500 mb-1">
            Công ty
          </div>
          <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            {name}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function PriceCard() {
  return (
    <Card className="border-slate-200 dark:border-slate-700">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center space-x-2">
          <DollarSign className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          <span>Giá hiện tại</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-center">
          <div className="text-3xl font-black text-slate-800 dark:text-white mb-1">
            45,500
          </div>
          <div className="flex items=center justify-center space-x-1 text-emerald-600 dark:text-emerald-400">
            <TrendingUp className="h-4 w-4" />
            <span className="text-sm font-semibold">+2.25%</span>
          </div>
        </div>
        <Separator className="bg-slate-200 dark:bg-slate-700" />
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <div className="text-slate-500 mb-1">Trần</div>
            <div className="font-bold text-purple-600 dark:text-purple-400">
              48,000
            </div>
          </div>
          <div>
            <div className="text-slate-500 mb-1">Sàn</div>
            <div className="font-bold text-blue-600 dark:text-blue-400">
              43,000
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function NewsCard() {
  const news = [
    { title: "Công bố BCTC Q4/2024", time: "2h" },
    { title: "Kế hoạch tăng vốn điều lệ", time: "1 ngày" },
  ];

  return (
    <Card className="border-slate-200 dark:border-slate-700">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center space-x-2">
          <Activity className="h-5 w-5" />
          <span>Tin tức</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {news.map((item, i) => (
          <div
            key={i}
            className="group cursor-pointer p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border border-slate-200 dark:border-slate-700"
          >
            <p className="text-sm font-medium text-slate-800 dark:text-white mb-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
              {item.title}
            </p>
            <div className="flex items-center space-x-1 text-xs text-slate-500">
              <Calendar className="h-3 w-3" />
              <span>{item.time}</span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-20">
      <div className="inline-flex p-6 bg-slate-100 dark:bg-slate-800 rounded-full mb-6">
        <SearchIcon className="h-12 w-12 text-slate-400" />
      </div>
      <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
        Chưa có dữ liệu
      </h3>
      <p className="text-slate-600 dark:text-slate-400">
        Vui lòng chọn sàn và nhập mã cổ phiếu để bắt đầu phân tích
      </p>
    </div>
  );
}

function FinancialTablePanel({
  title,
  state,
}: {
  title: string;
  state: PanelState;
}) {
  const { loading, error, years, rows } = state;
  return (
    <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/90 shadow-xl">
      <CardHeader className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
        <CardTitle className="text-lg font-bold text-slate-800 dark:text-slate-100">
          {title}
        </CardTitle>
        <CardDescription className="text-slate-600 dark:text-slate-400">
          {loading
            ? "Đang tải dữ liệu..."
            : years?.length
            ? `Giai đoạn ${years[0]} – ${years[years.length - 1]}`
            : "Chưa có dữ liệu"}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        {error ? (
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400 flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4" />
              <span>{error}</span>
            </p>
          </div>
        ) : loading ? (
          <div className="py-10 text-center text-slate-600 dark:text-slate-400">
            Đang xử lý dữ liệu…
          </div>
        ) : !rows || !years?.length ? (
          <div className="py-4 text-slate-600 dark:text-slate-400">
            Chưa có dữ liệu hiển thị.
          </div>
        ) : (
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800/70 backdrop-blur">
                  <tr className="[&>th]:px-3 [&>th]:py-2 [&>th]:text-left [&>th]:font-semibold [&>th]:text-slate-700 dark:[&>th]:text-slate-200 [&>th]:text-xs">
                    <th className="w-[220px] min-w-[220px] max-w-[220px] sticky left-0 bg-slate-100 dark:bg-slate-800/70 backdrop-blur border-r border-slate-200 dark:border-slate-700 z-10">
                      CHỈ TIÊU
                    </th>
                    {years.map((y) => (
                      <th
                        key={y}
                        className="w-[110px] min-w-[110px] max-w-[110px] text-right"
                      >
                        {y}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {rows.map((r: any, i: number) => {
                    const kind = r.kind || detectRowKind(r.item);
                    const firstTdBase =
                      "px-3 py-2 font-medium sticky left-0 bg-white dark:bg-slate-900/50 border-r border-slate-200 dark:border-slate-700 z-10";

                    let level =
                      kind === "section" ? 0 : kind === "subsection" ? 1 : 2;

                    const s = (r.item || "").toLowerCase().trim();
                    if (
                      /(^|\s)(gtcl|giá trị còn lại)\b/.test(s) &&
                      /(tscđ|tscd|tài sản cố định)/i.test(s)
                    )
                      level = 3;
                    if (/^lnst chưa phân phối\b/i.test(s)) level = 3;

                    const indentClasses = [
                      "pl-2 uppercase tracking-wide text-slate-800 dark:text-slate-100",
                      "pl-4 text-slate-700 dark:text-slate-100",
                      "pl-6 text-slate-600 dark:text-slate-200",
                      "pl-8 text-slate-600 dark:text-slate-200",
                    ];
                    const rowBg =
                      kind === "section" ? "bg-slate-50 dark:bg-slate-900/60" : "";

                    return (
                      <tr
                        key={i}
                        className={`hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors ${rowBg}`}
                      >
                        <td
                          className={`${firstTdBase} ${
                            indentClasses[Math.min(level, 3)]
                          } w-[220px] min-w-[220px] max-w-[220px] break-words`}
                        >
                          {r.item || "-"}
                        </td>
                        {years.map((y) => (
                          <td
                            key={y}
                            className="px-3 py-2 text-right tabular-nums text-slate-700 dark:text-slate-200 w-[110px] min-w-[110px] max-w-[110px]"
                          >
                            {formatNumberLike(r.values[y] ?? "")}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}