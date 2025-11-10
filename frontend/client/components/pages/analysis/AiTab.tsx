// components/pages/analysis/AiTab.tsx
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Loader2, TrendingUp, AlertCircle, CheckCircle2, Sparkles } from "lucide-react";

const parseMarkdown = (text: string) => {
  if (!text) return [];
  
  const lines = text.split('\n');
  const sections: Array<{
    type: 'heading' | 'subheading' | 'bullet' | 'text' | 'conclusion';
    content: string;
    level?: number;
    style?: 'positive' | 'negative' | 'neutral' | 'warning';
  }> = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Remove markdown asterisks and clean up
    const cleaned = line.replace(/\*\*/g, '');
    
    // Detect section types
    if (cleaned.match(/^\d+\.\s+[A-Za-zÀ-ỹ]/)) {
      // Main sections: "1. Định giá:"
      sections.push({
        type: 'heading',
        content: cleaned,
        level: 1
      });
    } else if (cleaned.startsWith('•') || cleaned.startsWith('-')) {
      // Bullet points
      const content = cleaned.replace(/^[•-]\s*/, '');
      
      // Detect style based on keywords
      let style: 'positive' | 'negative' | 'neutral' | 'warning' = 'neutral';
      if (content.match(/điểm mạnh|tích cực|tốt|tăng trưởng|cải thiện/i)) {
        style = 'positive';
      } else if (content.match(/điểm yếu|tiêu cực|rủi ro|cảnh báo|giảm|thấp|âm/i)) {
        style = 'negative';
      } else if (content.match(/cần|nên|khuyến nghị/i)) {
        style = 'warning';
      }
      
      sections.push({
        type: 'bullet',
        content,
        style
      });
    } else if (cleaned.match(/^(Đánh giá|Kết luận|Khuyến nghị)/i)) {
      // Special conclusion sections
      sections.push({
        type: 'conclusion',
        content: cleaned
      });
    } else if (cleaned.length > 0) {
      // Regular text
      sections.push({
        type: 'text',
        content: cleaned
      });
    }
  }
  
  return sections;
};

// Bold text parser for inline formatting
const renderTextWithBold = (text: string) => {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={idx} className="font-bold text-slate-100">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <span key={idx}>{part}</span>;
  });
};
interface AiTabProps {
  selectedSymbol?: string;
  cachedAnalysis?: {
    symbol: string;
    answer: string;
    timestamp: number;
  } | null;
  onAnalysisComplete?: (symbol: string, answer: string) => void;
}
export default function AiTab({ selectedSymbol }: { selectedSymbol?: string }) {
  const [symbol, setSymbol] = useState<string>(selectedSymbol || "");
  const [answer, setAnswer] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string>("");

  useEffect(() => {
    if (selectedSymbol) {
      setSymbol(selectedSymbol.toUpperCase().trim());
      // Auto-run analysis when symbol is provided
      if (selectedSymbol && !answer) {
        runDiagnosis();
      }
    }
  }, [selectedSymbol]);

  async function runDiagnosis() {
    try {
      setErr("");
      setAnswer("");
      if (!symbol) { 
        setErr("Vui lòng nhập mã cổ phiếu."); 
        return; 
      }

      setLoading(true);
      const res = await fetch("http://localhost:8000/api/ai/diagnose", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({ symbol }),
        mode: "cors",
      }).catch(error => {
        throw new Error("Không thể kết nối đến server. Vui lòng kiểm tra backend có đang chạy không.");
      });
      
      if (!res.ok) {
        const errorText = await res.text().catch(() => `API Error ${res.status}`);
        throw new Error(errorText);
      }
      
      const json = await res.json();
      setAnswer(json?.answer || "Không nhận được câu trả lời từ AI.");
    } catch (e: any) {
      setErr(e?.message || "Lỗi khi gọi AI.");
    } finally {
      setLoading(false);
    }
  }

  // Parse sections from AI response
  const parseSections = (text: string) => {
    if (!text) return null;
    
    const sections = [];
    const lines = text.split('\n');
    let currentSection = { title: '', content: [] as string[] };
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      
      // Detect section headers (lines ending with : or numbered sections)
      if (trimmed.match(/^\d+\.|^[A-Z][^:]*:$/) || trimmed.match(/^#+\s/)) {
        if (currentSection.content.length > 0) {
          sections.push(currentSection);
        }
        currentSection = { 
          title: trimmed.replace(/^#+\s/, '').replace(/:$/, ''), 
          content: [] 
        };
      } else {
        currentSection.content.push(trimmed);
      }
    }
    
    if (currentSection.content.length > 0) {
      sections.push(currentSection);
    }
    
    return sections.length > 0 ? sections : null;
  };

  const sections = parseSections(answer);

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="border border-slate-700 bg-gradient-to-br from-slate-800/90 to-slate-900/90">
        <CardHeader className="bg-slate-800/50 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold text-slate-100 flex items-center gap-2">
                Phân tích Toàn diện
              </CardTitle>
              <CardDescription className="text-slate-400">
                Đánh giá chuyên sâu dựa trên 5 trụ cột tài chính
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pt-6">
          {/* Input Section */}
          <div className="grid gap-4 md:grid-cols-[1fr_auto] items-end">
            <div className="space-y-2">
              <label htmlFor="ai-symbol" className="text-sm font-medium text-slate-300">
                Mã cổ phiếu
              </label>
              <input
                id="ai-symbol"
                placeholder="Nhập mã (VD: FPT, VNM, VCB...)"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                disabled={!!selectedSymbol || loading}
                className="w-full h-11 rounded-lg bg-slate-800/60 border border-slate-700 px-4 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all"
              />
            </div>
            
            <Button
              type="button"
              onClick={runDiagnosis}
              disabled={!symbol || loading}
              className="h-11 px-6 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium transition-all shadow-lg shadow-purple-500/25"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Đang phân tích...
                </>
              ) : (
                <>
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Phân tích ngay
                </>
              )}
            </Button>
          </div>

          {/* Error Alert */}
          {err && (
            <Alert className="mt-4 bg-red-900/20 border-red-700/50">
              <AlertCircle className="h-4 w-4 text-red-400" />
              <AlertDescription className="text-red-300">
                {err}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Loading State */}
      {loading && (
        <Card className="border border-slate-700 bg-slate-900/50">
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="relative">
                <Loader2 className="h-12 w-12 text-purple-500 animate-spin" />
                <div className="absolute inset-0 h-12 w-12 rounded-full bg-purple-500/20 animate-ping" />
              </div>
              <div className="text-center">
                <p className="text-lg font-medium text-slate-200">
                  Đang phân tích cổ phiếu {symbol}...
                </p>
                <p className="text-sm text-slate-400 mt-1">
                  AI đang xử lý dữ liệu từ 5 báo cáo tài chính
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Empty State */}
      {/* Results - Professional Markdown Layout */}
      {!loading && answer && (
        <div className="space-y-6">
          {/* Summary Card */}
          <Card className="border border-emerald-700/50 bg-gradient-to-br from-slate-800/90 to-slate-900/90">
            <CardHeader className="bg-emerald-900/20 border-b border-emerald-700/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                  <div>
                    <CardTitle className="text-lg font-bold text-slate-100">
                      Báo cáo Phân tích - {symbol}
                    </CardTitle>
                    <CardDescription className="text-slate-400">
                      Đánh giá toàn diện từ AI dựa trên dữ liệu tài chính thực tế
                    </CardDescription>
                  </div>
                </div>
                <Badge variant="outline" className="bg-purple-500/10 border-purple-500/30 text-purple-400 px-3 py-1">
                  Phân tích
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="pt-6">
              <div className="space-y-6">
                {parseMarkdown(answer).map((item, idx) => {
                  // Heading - Main Sections
                  if (item.type === 'heading') {
                    return (
                      <div key={idx} className="space-y-3">
                        <div className="flex items-center gap-3 pt-4">
                          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 text-white font-bold text-sm">
                            {item.content.match(/^\d+/)?.[0] || '•'}
                          </div>
                          <h3 className="text-lg font-bold text-slate-100">
                            {item.content.replace(/^\d+\.\s*/, '')}
                          </h3>
                          <div className="flex-1 h-px bg-gradient-to-r from-slate-700 to-transparent" />
                        </div>
                      </div>
                    );
                  }
                  
                  // Bullet Points with Icons
                  if (item.type === 'bullet') {
                    const icons = {
                      positive: '✓',
                      negative: '✗',
                      warning: '!',
                      neutral: '•'
                    };
                    
                    const colors = {
                      positive: 'text-emerald-400 bg-emerald-900/20 border-emerald-700/30',
                      negative: 'text-red-400 bg-red-900/20 border-red-700/30',
                      warning: 'text-amber-400 bg-amber-900/20 border-amber-700/30',
                      neutral: 'text-slate-400 bg-slate-800/30 border-slate-700/30'
                    };
                    
                    const style = item.style || 'neutral';
                    
                    return (
                      <div key={idx} className={`flex gap-3 p-3 rounded-lg border ${colors[style]} transition-all hover:scale-[1.01]`}>
                        <span className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                          style === 'positive' ? 'bg-emerald-500/20' :
                          style === 'negative' ? 'bg-red-500/20' :
                          style === 'warning' ? 'bg-amber-500/20' :
                          'bg-slate-700/20'
                        }`}>
                          {icons[style]}
                        </span>
                        <p className="text-sm text-slate-200 leading-relaxed flex-1">
                          {renderTextWithBold(item.content)}
                        </p>
                      </div>
                    );
                  }
                  
                  // Conclusion Sections (Đánh giá tổng quan, Kết luận, etc.)
                  if (item.type === 'conclusion') {
                    return (
                      <div key={idx} className="mt-6 p-4 rounded-xl bg-gradient-to-br from-purple-900/30 to-pink-900/30 border border-purple-700/50">
                        <h4 className="text-base font-bold text-purple-300 mb-2 flex items-center gap-2">
                          <TrendingUp className="h-4 w-4" />
                          {item.content}
                        </h4>
                      </div>
                    );
                  }
                  
                  // Regular Text
                  if (item.type === 'text') {
                    return (
                      <p key={idx} className="text-sm text-slate-300 leading-relaxed pl-11">
                        {renderTextWithBold(item.content)}
                      </p>
                    );
                  }
                  
                  return null;
                })}
              </div>
            </CardContent>
          </Card>

          {/* Quick Summary Card */}
          <Card className="border border-slate-700 bg-slate-900/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Tóm tắt nhanh
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Extract key metrics from answer */}
                {(() => {
                  const positiveMatches = answer.match(/điểm mạnh/gi)?.length || 0;
                  const negativeMatches = answer.match(/điểm yếu|rủi ro/gi)?.length || 0;
                  const hasRecommendation = answer.match(/không nên đầu tư|nên đầu tư|có thể cân nhắc/i);
                  
                  return (
                    <>
                      <div className="p-3 rounded-lg bg-emerald-900/20 border border-emerald-700/30">
                        <p className="text-xs text-emerald-400 font-semibold mb-1">Điểm mạnh</p>
                        <p className="text-2xl font-bold text-emerald-300">{positiveMatches}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-red-900/20 border border-red-700/30">
                        <p className="text-xs text-red-400 font-semibold mb-1">Điểm yếu & Rủi ro</p>
                        <p className="text-2xl font-bold text-red-300">{negativeMatches}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-purple-900/20 border border-purple-700/30">
                        <p className="text-xs text-purple-400 font-semibold mb-1">Khuyến nghị</p>
                        <p className="text-sm font-bold text-purple-300 truncate">
                          {hasRecommendation ? hasRecommendation[0] : 'Xem chi tiết'}
                        </p>
                      </div>
                    </>
                  );
                })()}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}