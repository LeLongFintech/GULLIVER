"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  AlertTriangle,
  Activity,
  LineChart as LineChartIcon,
  TrendingUp,
  TrendingDown,
  Shield,
  DollarSign,
  BarChart3,
  Percent,
  Building2,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Info,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Area,
  AreaChart,
  CartesianGrid,
} from "recharts";

const API_ROOT = import.meta.env.VITE_API_BASE_URL;

type RiskScore = {
  ticker: string;
  date: string;
  risk_0_10: number;
  alert: boolean;
  context?: {
    close?: number;
    volume?: number;
    turnover?: number;
    mkt_cap?: number;
  };
  message?: string;
};

type HistoryPoint = { date: string; risk_0_10: number };

export default function AlertsTab({
  selectedSymbol,
}: {
  selectedSymbol?: string;
}) {
  const [symbol, setSymbol] = useState<string>(
    selectedSymbol?.toUpperCase().trim() || ""
  );
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string>("");
  const [score, setScore] = useState<RiskScore | null>(null);
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!selectedSymbol) {
      setSymbol("");
      setScore(null);
      setHistory([]);
      setErr("Vui lòng chọn mã ở tab Phân tích trước.");
      return;
    }

    const next = selectedSymbol.toUpperCase().trim();
    setSymbol(next);
    setErr("");
  }, [selectedSymbol]);

  useEffect(() => {
    if (!symbol) {
      setScore(null);
      setHistory([]);
      return;
    }

    let cancelled = false;
    const controller = new AbortController();

    async function fetchRiskData() {
      try {
        setLoading(true);
        setLoadingProgress(0);
        setErr("");

        // Simulate loading progress
        const progressInterval = setInterval(() => {
          setLoadingProgress((prev) => {
            if (prev >= 90) {
              clearInterval(progressInterval);
              return 90;
            }
            return prev + 10;
          });
        }, 200);

        const scoreRes = await fetch(
          `${API_ROOT}/risk/score?ticker=${encodeURIComponent(symbol)}`,
          {
            method: "GET",
            headers: { Accept: "application/json" },
            mode: "cors",
            signal: controller.signal,
          }
        ).catch(() => {
          clearInterval(progressInterval);
          throw new Error(
            "Không thể kết nối đến server. Vui lòng kiểm tra backend có đang chạy không."
          );
        });

        setLoadingProgress(50);

        if (!scoreRes.ok) {
          clearInterval(progressInterval);
          const errText = await scoreRes
            .text()
            .catch(() => `API /risk/score HTTP ${scoreRes.status}`);
          throw new Error(errText || `API /risk/score HTTP ${scoreRes.status}`);
        }

        const histRes = await fetch(
          `${API_ROOT}/risk/history?ticker=${encodeURIComponent(
            symbol
          )}&days=180`,
          {
            method: "GET",
            headers: { Accept: "application/json" },
            mode: "cors",
            signal: controller.signal,
          }
        ).catch(() => {
          clearInterval(progressInterval);
          throw new Error(
            "Không thể kết nối đến server. Vui lòng kiểm tra backend có đang chạy không."
          );
        });

        setLoadingProgress(75);

        if (!histRes.ok) {
          clearInterval(progressInterval);
          const errText = await histRes
            .text()
            .catch(() => `API /risk/history HTTP ${histRes.status}`);
          throw new Error(
            errText || `API /risk/history HTTP ${histRes.status}`
          );
        }

        const scoreJson = (await scoreRes.json()) as RiskScore;
        const histJson = (await histRes.json()) as {
          ticker: string;
          history: HistoryPoint[];
        };

        setLoadingProgress(100);
        clearInterval(progressInterval);

        if (!cancelled) {
          setScore(scoreJson?.ticker ? scoreJson : null);
          setHistory(Array.isArray(histJson?.history) ? histJson.history : []);
        }
      } catch (e: any) {
        if (!cancelled) {
          setScore(null);
          setHistory([]);
          setErr(e?.message || "Không thể tải dữ liệu cảnh báo.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          setLoadingProgress(0);
        }
      }
    }

    fetchRiskData();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [symbol]);

  // ===== CALCULATE AVERAGE RISK SCORE =====
  const averageRiskScore = useMemo(() => {
    if (!history || history.length === 0) return null;

    // Lấy 180 phiên gần nhất (toàn bộ history hiện tại) để tính trung bình
    const recentDays = history.slice(-180);
    const sum = recentDays.reduce((acc, h) => acc + h.risk_0_10, 0);
    const avg = sum / recentDays.length;

    return {
      value: avg,
      periodDays: recentDays.length,
      latest: history[history.length - 1]?.risk_0_10 ?? 0,
    };
  }, [history]);

  // Use average score for severity assessment
  const severity = useMemo(() => {
    const v = averageRiskScore?.value ?? score?.risk_0_10 ?? 0;
    if (v >= 9)
      return {
        label: "CỰC KỲ NGUY HIỂM",
        tone: "critical" as const,
        icon: AlertTriangle,
        desc: "Phát hiện dấu hiệu thao túng rõ ràng. Tránh giao dịch ngay!",
      };
    if (v >= 8)
      return {
        label: "RỦI RO CAO",
        tone: "danger" as const,
        icon: AlertCircle,
        desc: "Hành vi bất thường cao. Cần cảnh giác khi giao dịch.",
      };
    if (v >= 6)
      return {
        label: "RỦI RO TRUNG BÌNH",
        tone: "warning" as const,
        icon: Activity,
        desc: "Có một số dấu hiệu bất thường. Theo dõi chặt chẽ.",
      };
    if (v >= 4)
      return {
        label: "RỦI RO THẤP",
        tone: "caution" as const,
        icon: Shield,
        desc: "Giao dịch tương đối bình thường.",
      };
    return {
      label: "AN TOÀN",
      tone: "safe" as const,
      icon: CheckCircle2,
      desc: "Không phát hiện dấu hiệu thao túng.",
    };
  }, [averageRiskScore, score]);

  const toneColors = (
    tone: "critical" | "danger" | "warning" | "caution" | "safe"
  ) => {
    switch (tone) {
      case "critical":
        return {
          bg: "from-red-600/30 via-red-500/20 to-red-600/30",
          border: "border-red-500/50",
          text: "text-red-400",
          glow: "shadow-red-500/50",
          gradient: "bg-gradient-to-br from-red-500 to-red-700",
          chartColor: "#ef4444",
        };
      case "danger":
        return {
          bg: "from-orange-600/30 via-orange-500/20 to-orange-600/30",
          border: "border-orange-500/50",
          text: "text-orange-400",
          glow: "shadow-orange-500/50",
          gradient: "bg-gradient-to-br from-orange-500 to-orange-700",
          chartColor: "#f97316",
        };
      case "warning":
        return {
          bg: "from-yellow-600/30 via-yellow-500/20 to-yellow-600/30",
          border: "border-yellow-500/50",
          text: "text-yellow-400",
          glow: "shadow-yellow-500/50",
          gradient: "bg-gradient-to-br from-yellow-500 to-yellow-700",
          chartColor: "#eab308",
        };
      case "caution":
        return {
          bg: "from-blue-600/30 via-blue-500/20 to-blue-600/30",
          border: "border-blue-500/50",
          text: "text-blue-400",
          glow: "shadow-blue-500/50",
          gradient: "bg-gradient-to-br from-blue-500 to-blue-700",
          chartColor: "#3b82f6",
        };
      default:
        return {
          bg: "from-emerald-600/30 via-emerald-500/20 to-emerald-600/30",
          border: "border-emerald-500/50",
          text: "text-emerald-400",
          glow: "shadow-emerald-500/50",
          gradient: "bg-gradient-to-br from-emerald-500 to-emerald-700",
          chartColor: "#10b981",
        };
    }
  };

  const colors = toneColors(severity.tone);
  const SeverityIcon = severity.icon;

  const trend = useMemo(() => {
    if (history.length < 2) return { direction: "neutral", change: 0 };
    const recent = history.slice(-10);
    const last = recent[recent.length - 1]?.risk_0_10 ?? 0;
    const prev = recent[recent.length - 2]?.risk_0_10 ?? 0;
    const change = last - prev;
    return {
      direction: change > 0.5 ? "up" : change < -0.5 ? "down" : "neutral",
      change,
    };
  }, [history]);

  // Display value - use average if available (180 phiên)
  const displayRiskScore = averageRiskScore?.value ?? score?.risk_0_10 ?? 0;

  if (!isClient) {
    return (
      <Card className="border border-slate-700 bg-gradient-to-br from-slate-800/90 to-slate-900/90">
        <CardHeader className="bg-slate-800/50 border-b border-slate-700">
          <CardTitle className="text-lg font-bold text-slate-100">
            🛡️ Hệ thống Cảnh báo Thao túng
          </CardTitle>
          <CardDescription className="text-slate-400">
            Đang khởi tạo mô-đun cảnh báo…
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6 text-slate-400 text-sm">
          Đang tải…
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* HEADER CARD */}
      <Card className="border border-slate-700 bg-gradient-to-br from-slate-800/90 via-slate-850/90 to-slate-900/90 backdrop-blur-sm">
        <CardHeader className="bg-slate-800/50 border-b border-slate-700/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 shadow-lg">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold text-slate-100 flex items-center gap-2">
                  Hệ thống Cảnh báo Thao túng
                  <Badge
                    variant="outline"
                    className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-blue-500/50 text-blue-300 text-xs"
                  >
                    AI-Powered
                  </Badge>
                </CardTitle>
                <CardDescription className="text-slate-400 mt-1">
                  Phát hiện hành vi bất thường qua{" "}
                  <span className="font-semibold text-slate-300">
                    Random Forest ML Model
                  </span>
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {symbol && (
                <Badge className="bg-slate-700/80 text-slate-200 border border-slate-600 px-4 py-2 text-base font-mono">
                  {symbol}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          {!symbol ? (
            <EmptyState />
          ) : loading ? (
            <EnhancedLoadingState symbol={symbol} progress={loadingProgress} />
          ) : err ? (
            <ErrorState message={err} />
          ) : !score ? (
            <NoDataState symbol={symbol} />
          ) : (
            <div className="space-y-6">
              {/* HERO SECTION - RISK SCORE */}
              <div
                className={`relative overflow-hidden rounded-2xl border-2 ${colors.border} bg-gradient-to-br ${colors.bg} p-8 shadow-2xl ${colors.glow}`}
              >
                {/* Animated Background Pattern */}
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent animate-pulse" />
                  <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_50%)]" />
                </div>

                <div className="relative z-10 grid md:grid-cols-2 gap-8 items-center">
                  {/* Left: Score Display */}
                  <div className="text-center md:text-left space-y-4">
                    <div className="flex items-center justify-center md:justify-start gap-3">
                      <SeverityIcon className={`w-10 h-10 ${colors.text}`} />
                      <div>
                        <div className="text-sm font-medium text-slate-400 uppercase tracking-wider">
                          Mức độ Rủi ro
                        </div>
                        <div
                          className={`text-2xl font-black ${colors.text} tracking-tight`}
                        >
                          {severity.label}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-baseline justify-center md:justify-start gap-3">
                      <div className={`text-7xl font-black ${colors.text}`}>
                        {displayRiskScore.toFixed(1)}
                      </div>
                      <div className="text-3xl text-slate-400 font-light">
                        / 10
                      </div>
                      {trend.direction !== "neutral" && (
                        <Badge
                          variant="outline"
                          className={`ml-2 ${
                            trend.direction === "up"
                              ? "bg-red-500/20 border-red-500/50 text-red-300"
                              : "bg-green-500/20 border-green-500/50 text-green-300"
                          }`}
                        >
                          {trend.direction === "up" ? (
                            <TrendingUp className="w-4 h-4 mr-1" />
                          ) : (
                            <TrendingDown className="w-4 h-4 mr-1" />
                          )}
                          {Math.abs(trend.change).toFixed(1)}
                        </Badge>
                      )}
                    </div>

                    {/* AVERAGE INFO BADGE */}
                    {averageRiskScore && (
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-600/20 border border-blue-500/40">
                        <Info className="w-4 h-4 text-blue-300" />
                        <span className="text-xs text-blue-200">
                          Trung bình {averageRiskScore.periodDays} phiên gần
                          nhất
                        </span>
                      </div>
                    )}

                    <p className="text-slate-300 text-sm leading-relaxed max-w-md">
                      {severity.desc}
                    </p>

                    {/* Progress Bar */}
                    <div className="space-y-2 pt-2">
                      <div className="flex justify-between text-xs text-slate-400">
                        <span>An toàn</span>
                        <span>Nguy hiểm</span>
                      </div>
                      <div className="h-3 w-full rounded-full bg-slate-700/50 overflow-hidden shadow-inner">
                        <div
                          className={`h-full ${colors.gradient} transition-all duration-1000 ease-out shadow-lg`}
                          style={{
                            width: `${Math.min(
                              100,
                              Math.max(0, displayRiskScore * 10)
                            )}%`,
                          }}
                        />
                      </div>
                    </div>

                    {/* Alert Badge */}
                    {displayRiskScore >= 8.0 && (
                      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600/20 border border-red-500/50 animate-pulse">
                        <AlertTriangle className="w-5 h-5 text-red-400" />
                        <span className="text-red-300 font-semibold">
                          CẢNH BÁO NGUY HIỂM!
                        </span>
                      </div>
                    )}

                    {/* Latest vs Average Comparison */}
                    {averageRiskScore && (
                      <div className="pt-2 space-y-1.5">
                        <div className="flex items-center justify-between text-xs px-3 py-2 rounded-lg bg-slate-800/50 border border-slate-700">
                          <span className="text-slate-400">
                            Phiên mới nhất:
                          </span>
                          <span className="font-semibold text-slate-200">
                            {averageRiskScore.latest.toFixed(1)}/10
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs px-3 py-2 rounded-lg bg-blue-600/10 border border-blue-500/30">
                          <span className="text-slate-400">
                            Trung bình {averageRiskScore.periodDays} phiên:
                          </span>
                          <span className="font-bold text-blue-300">
                            {averageRiskScore.value.toFixed(1)}/10
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right: Circular Progress Ring */}
                  <div className="flex justify-center">
                    <CircularProgress
                      value={displayRiskScore}
                      max={10}
                      size={240}
                      strokeWidth={16}
                      color={colors.chartColor}
                    />
                  </div>
                </div>
              </div>

              {/* HISTORICAL CHART */}
              <Card className="border border-slate-700 bg-slate-800/40 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <LineChartIcon className="w-5 h-5 text-blue-400" />
                      <CardTitle className="text-base font-semibold text-slate-200">
                        Lịch sử Điểm Rủi ro
                      </CardTitle>
                      <Badge
                        variant="outline"
                        className="bg-slate-700/50 border-slate-600 text-slate-300"
                      >
                        180 phiên gần nhất
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={history}>
                        <defs>
                          <linearGradient
                            id="riskGradient"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="5%"
                              stopColor={colors.chartColor}
                              stopOpacity={0.3}
                            />
                            <stop
                              offset="95%"
                              stopColor={colors.chartColor}
                              stopOpacity={0}
                            />
                          </linearGradient>
                        </defs>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="#334155"
                          opacity={0.3}
                        />
                        <XAxis
                          dataKey="date"
                          stroke="#64748b"
                          tick={{ fontSize: 11, fill: "#94a3b8" }}
                          tickFormatter={(v) => {
                            const d = new Date(v);
                            return `${d.getMonth() + 1}/${d.getDate()}`;
                          }}
                        />
                        <YAxis
                          domain={[0, 10]}
                          stroke="#64748b"
                          tick={{ fontSize: 11, fill: "#94a3b8" }}
                          label={{
                            value: "Risk Score",
                            angle: -90,
                            position: "insideLeft",
                            style: { fill: "#94a3b8", fontSize: 12 },
                          }}
                        />
                        <Tooltip
                          labelFormatter={(v) => `Ngày: ${v}`}
                          formatter={(v: number) => [
                            `${v.toFixed(2)}/10`,
                            "Điểm Rủi ro",
                          ]}
                          contentStyle={{
                            background: "#0f172a",
                            border: "1px solid #334155",
                            borderRadius: 8,
                            color: "#e2e8f0",
                            boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="risk_0_10"
                          stroke={colors.chartColor}
                          strokeWidth={3}
                          fill="url(#riskGradient)"
                          animationDuration={1500}
                        />
                        {/* Danger threshold line */}
                        <Line
                          type="monotone"
                          dataKey={() => 8}
                          stroke="#ef4444"
                          strokeWidth={2}
                          strokeDasharray="5 5"
                          dot={false}
                        />
                        {/* Average line */}
                        {averageRiskScore && (
                          <Line
                            type="monotone"
                            dataKey={() => averageRiskScore.value}
                            stroke="#3b82f6"
                            strokeWidth={2}
                            strokeDasharray="3 3"
                            dot={false}
                          />
                        )}
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Legend */}
                  <div className="flex items-center justify-center gap-6 mt-4 text-xs text-slate-400">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: colors.chartColor }}
                      />
                      <span>Điểm Rủi ro</span>
                    </div>
                    {averageRiskScore && (
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-0.5 bg-blue-500" />
                        <span>
                          Trung bình {averageRiskScore.periodDays} phiên (
                          {averageRiskScore.value.toFixed(1)})
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-0.5 bg-red-500" />
                      <span>Ngưỡng Cảnh báo (8.0)</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Separator className="bg-slate-700/50" />

              {/* CONTEXT METRICS */}
              <div>
                <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-slate-400" />
                  Thông tin Chi tiết
                </h3>
                <div className="grid gap-4 md:grid-cols-4">
                  <MetricCard
                    icon={DollarSign}
                    label="Giá Đóng cửa"
                    value={fmtPrice(score?.context?.close)}
                    unit="VND"
                    color="blue"
                  />
                  <MetricCard
                    icon={Activity}
                    label="Khối lượng"
                    value={fmtVolume(score?.context?.volume)}
                    unit="CP"
                    color="purple"
                  />
                  <MetricCard
                    icon={Percent}
                    label="Tỷ lệ Luân chuyển"
                    value={fmtPercent(score?.context?.turnover)}
                    unit=""
                    color="green"
                  />
                  <MetricCard
                    icon={Building2}
                    label="Vốn hóa"
                    value={fmtMarketCap(score?.context?.mkt_cap)}
                    unit="VND"
                    color="orange"
                  />
                </div>
              </div>

              {/* METHODOLOGY INFO */}
              <Card className="border border-slate-700/50 bg-slate-800/30 backdrop-blur-sm">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/30">
                      <Activity className="w-5 h-5 text-blue-400" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <h4 className="font-semibold text-slate-200">
                        Phương pháp Phát hiện
                      </h4>
                      <p className="text-sm text-slate-400 leading-relaxed">
                        Hệ thống sử dụng mô hình{" "}
                        <span className="font-semibold text-slate-300">
                          Random Forest Classifier
                        </span>{" "}
                        với 18 behavior features bao gồm: returns (3d/5d),
                        volume z-scores, turnover rates, price ranges, market
                        cap percentiles để phát hiện các hành vi giao dịch bất
                        thường. Điểm rủi ro hiển thị là{" "}
                        <span className="font-semibold text-blue-300">
                          trung bình 180 phiên gần nhất
                        </span>{" "}
                        để đánh giá chính xác hơn.
                      </p>
                      <div className="flex flex-wrap gap-2 pt-2">
                        <Badge
                          variant="outline"
                          className="bg-slate-700/30 border-slate-600 text-slate-300 text-xs"
                        >
                          400 Trees
                        </Badge>
                        <Badge
                          variant="outline"
                          className="bg-slate-700/30 border-slate-600 text-slate-300 text-xs"
                        >
                          18 Features
                        </Badge>
                        <Badge
                          variant="outline"
                          className="bg-slate-700/30 border-slate-600 text-slate-300 text-xs"
                        >
                          Supervised Learning
                        </Badge>
                        <Badge
                          variant="outline"
                          className="bg-blue-600/20 border-blue-500/40 text-blue-300 text-xs"
                        >
                          180-Day Average
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ==================== COMPONENTS ====================

function CircularProgress({
  value,
  max,
  size,
  strokeWidth,
  color,
}: {
  value: number;
  max: number;
  size: number;
  strokeWidth: number;
  color: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#334155"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out drop-shadow-lg"
          style={{
            filter: `drop-shadow(0 0 8px ${color})`,
          }}
        />
      </svg>
      <div className="absolute text-center">
        <div className="text-4xl font-black text-slate-100">
          {value.toFixed(1)}
        </div>
        <div className="text-sm text-slate-400">/ {max}</div>
      </div>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  unit,
  color,
}: {
  icon: any;
  label: string;
  value: string;
  unit: string;
  color: "blue" | "purple" | "green" | "orange";
}) {
  const colorClasses = {
    blue: "from-blue-600/20 to-blue-500/10 border-blue-500/30 text-blue-400",
    purple:
      "from-purple-600/20 to-purple-500/10 border-purple-500/30 text-purple-400",
    green:
      "from-green-600/20 to-green-500/10 border-green-500/30 text-green-400",
    orange:
      "from-orange-600/20 to-orange-500/10 border-orange-500/30 text-orange-400",
  };

  return (
    <div
      className={`p-5 rounded-xl border bg-gradient-to-br ${colorClasses[color]} backdrop-blur-sm hover:scale-105 transition-transform duration-300`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className={`p-2 rounded-lg bg-slate-800/50`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="text-xs text-slate-400 uppercase tracking-wide font-medium mb-1">
        {label}
      </div>
      <div className="text-xl font-bold text-slate-100 flex items-baseline gap-1">
        {value}
        {unit && (
          <span className="text-sm text-slate-400 font-normal">{unit}</span>
        )}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-16 space-y-4">
      <div className="w-20 h-20 mx-auto rounded-full bg-slate-700/50 flex items-center justify-center">
        <Shield className="w-10 h-10 text-slate-400" />
      </div>
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-slate-300">
          Chưa chọn mã cổ phiếu
        </h3>
        <p className="text-sm text-slate-400 max-w-md mx-auto">
          Vui lòng chọn mã cổ phiếu ở tab{" "}
          <span className="font-semibold text-slate-300">Phân tích</span> để xem
          cảnh báo rủi ro thao túng.
        </p>
      </div>
    </div>
  );
}

function EnhancedLoadingState({
  symbol,
  progress,
}: {
  symbol: string;
  progress: number;
}) {
  return (
    <div className="space-y-8 py-12">
      {/* Main Loading Animation */}
      <div className="flex flex-col items-center justify-center space-y-6">
        {/* Spinning Icon */}
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-600/20 to-purple-600/20 border-2 border-blue-500/30 flex items-center justify-center animate-pulse">
            <Loader2 className="w-12 h-12 text-blue-400 animate-spin" />
          </div>
          {/* Orbiting dots */}
          <div
            className="absolute inset-0 animate-spin"
            style={{ animationDuration: "3s" }}
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-blue-500 rounded-full" />
          </div>
          <div
            className="absolute inset-0 animate-spin"
            style={{ animationDuration: "3s", animationDelay: "1s" }}
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-purple-500 rounded-full" />
          </div>
          <div
            className="absolute inset-0 animate-spin"
            style={{ animationDuration: "3s", animationDelay: "2s" }}
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-pink-500 rounded-full" />
          </div>
        </div>

        {/* Loading Text */}
        <div className="text-center space-y-3">
          <h3 className="text-xl font-bold text-slate-200 flex items-center justify-center gap-2">
            <span>Đang phân tích</span>
            <Badge className="bg-blue-600/20 border-blue-500/50 text-blue-300 font-mono">
              {symbol}
            </Badge>
          </h3>
          <p className="text-sm text-slate-400 animate-pulse">
            Đang xử lý dữ liệu qua Random Forest Model...
          </p>
        </div>

        {/* Progress Bar */}
        <div className="w-full max-w-md space-y-2">
          <div className="flex justify-between text-xs text-slate-400">
            <span>Đang tải</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-slate-700/50 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Loading Steps */}
        <div className="grid grid-cols-3 gap-4 w-full max-w-lg mt-8">
          <LoadingStep
            label="Kết nối API"
            active={progress >= 0}
            completed={progress >= 33}
          />
          <LoadingStep
            label="Tính toán Risk"
            active={progress >= 33}
            completed={progress >= 66}
          />
          <LoadingStep
            label="Tải lịch sử"
            active={progress >= 66}
            completed={progress >= 100}
          />
        </div>
      </div>

      {/* Skeleton Loading for Preview */}
      <div className="space-y-6 animate-pulse opacity-50">
        <div className="h-64 bg-slate-700/30 rounded-2xl" />
        <div className="h-80 bg-slate-700/30 rounded-xl" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-slate-700/30 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}

function LoadingStep({
  label,
  active,
  completed,
}: {
  label: string;
  active: boolean;
  completed: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
          completed
            ? "bg-green-500/20 border-green-500/50"
            : active
            ? "bg-blue-500/20 border-blue-500/50 animate-pulse"
            : "bg-slate-700/30 border-slate-600"
        }`}
      >
        {completed ? (
          <CheckCircle2 className="w-5 h-5 text-green-400" />
        ) : active ? (
          <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
        ) : (
          <div className="w-2 h-2 bg-slate-500 rounded-full" />
        )}
      </div>
      <span
        className={`text-xs font-medium ${
          completed
            ? "text-green-300"
            : active
            ? "text-blue-300"
            : "text-slate-500"
        }`}
      >
        {label}
      </span>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="text-center py-16 space-y-4">
      <div className="w-20 h-20 mx-auto rounded-full bg-red-500/10 border-2 border-red-500/30 flex items-center justify-center">
        <AlertTriangle className="w-10 h-10 text-red-400" />
      </div>
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-red-300">Lỗi tải dữ liệu</h3>
        <p className="text-sm text-slate-400 max-w-md mx-auto">{message}</p>
      </div>
    </div>
  );
}

function NoDataState({ symbol }: { symbol: string }) {
  return (
    <div className="text-center py-16 space-y-4">
      <div className="w-20 h-20 mx-auto rounded-full bg-slate-700/50 flex items-center justify-center">
        <AlertCircle className="w-10 h-10 text-slate-400" />
      </div>
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-slate-300">
          Không có dữ liệu
        </h3>
        <p className="text-sm text-slate-400 max-w-md mx-auto">
          Chưa có dữ liệu cảnh báo cho mã <strong>{symbol}</strong>.
        </p>
      </div>
    </div>
  );
}

// ==================== FORMATTERS ====================

function fmtPrice(p?: number | null) {
  if (typeof p !== "number" || !Number.isFinite(p)) return "—";

  // Fix: Nhân với 1000 nếu giá có vẻ nhỏ (< 1000)
  // Giả định: Backend lưu giá ở đơn vị nghìn VND
  const actualPrice = p < 1000 ? p * 1000 : p;

  return Intl.NumberFormat("vi-VN", {
    maximumFractionDigits: 0,
  }).format(actualPrice);
}

function fmtVolume(v?: number | null) {
  if (typeof v !== "number" || !Number.isFinite(v)) return "—";
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`;
  return v.toFixed(0);
}

function fmtMarketCap(m?: number | null) {
  if (typeof m !== "number" || !Number.isFinite(m)) return "—";
  if (m >= 1_000_000_000_000) return `${(m / 1_000_000_000_000).toFixed(1)}T`;
  if (m >= 1_000_000_000) return `${(m / 1_000_000_000).toFixed(1)}B`;
  if (m >= 1_000_000) return `${(m / 1_000_000).toFixed(1)}M`;
  return fmtPrice(m);
}

function fmtPercent(p?: number | null) {
  if (typeof p !== "number" || !Number.isFinite(p)) return "—";
  return `${(p * 100).toFixed(2)}%`;
}
