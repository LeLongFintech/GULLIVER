// client/components/pages/Home.tsx
// VERSION 2.0 - Bố cục đầy đặn, không gian tối ưu

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Separator } from "../ui/separator";
import { 
  TrendingUp, 
  BarChart3, 
  Shield, 
  Zap, 
  Target, 
  LineChart, 
  Activity,
  CheckCircle2,
  Sparkles,
  Database,
  Brain,
  Bell,
  Users,
  Award,
  TrendingDown,
  Clock,
  ChevronRight,
  ArrowUpRight,
  Star,
  Newspaper,
  Calendar,
  DollarSign,
  PieChart
} from "lucide-react";
import { ThemeToggle } from "../common/ThemeToggle";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <ThemeToggle />
      <Hero />
      <StatsBar />
      <MainContent />
      <TrustSection />
      <CallToAction />
    </div>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Animated Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-20" />
      
      {/* Gradient Orbs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      
      <div className="container mx-auto px-4 py-16 md:py-20 relative z-10">
        <div className="grid lg:grid-cols-2 gap-8 items-center">
          {/* Left Content */}
          <div className="space-y-6">
            <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20">
              <Sparkles className="h-3 w-3 mr-1" />
              Nền tảng phân tích hàng đầu Việt Nam
            </Badge>
            
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-black leading-tight">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-400">
                GULLIVER
              </span>
            </h1>
            
            <h2 className="text-2xl md:text-3xl font-bold text-white">
              Phân Tích & Xếp Hạng Sức Khỏe Cổ Phiếu Toàn Diện
            </h2>
            
            <p className="text-lg text-slate-300">
              Nền tảng AI-powered giúp nhà đầu tư ra quyết định thông minh với dữ liệu real-time, 
              phân tích chuyên sâu và cảnh báo rủi ro tự động.
            </p>
            
            <div className="flex flex-wrap gap-3">
              <button className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-emerald-500/50 transition-all duration-300 hover:-translate-y-0.5 flex items-center space-x-2">
                <span>Bắt đầu miễn phí</span>
                <ArrowUpRight className="h-4 w-4" />
              </button>
              <button className="px-6 py-3 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-lg border border-white/20 hover:bg-white/20 transition-all duration-300 flex items-center space-x-2">
                <span>Xem Demo</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            
            {/* Trust Indicators */}
            <div className="flex items-center space-x-6 pt-4">
              <div className="flex items-center space-x-2">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-400 border-2 border-slate-900" />
                  ))}
                </div>
                <div className="text-sm text-slate-300">
                  <span className="font-semibold text-white">10,000+</span> nhà đầu tư
                </div>
              </div>
              <div className="flex items-center space-x-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                ))}
                <span className="text-sm text-slate-300 ml-2">4.9/5</span>
              </div>
            </div>
          </div>
          
          {/* Right Content - Live Dashboard Preview */}
          <div className="relative">
            <div className="relative bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-6 shadow-2xl">
              {/* Window Controls */}
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
              </div>
              
              {/* Mini Chart */}
              <svg viewBox="0 0 400 200" className="w-full h-32 mb-4">
                <defs>
                  <linearGradient id="heroGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.8" />
                  </linearGradient>
                </defs>
                <polyline
                  points="10,150 50,120 90,130 130,90 170,100 210,70 250,80 290,50 330,60 370,40"
                  fill="none"
                  stroke="url(#heroGradient)"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </svg>
              
              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "VN-INDEX", value: "1,234.56", change: "+2.45%", up: true },
                  { label: "VN30", value: "987.65", change: "-0.34%", up: false }
                ].map((stat, i) => (
                  <div key={i} className="bg-slate-700/50 rounded-lg p-3">
                    <div className="text-xs text-slate-400 mb-1">{stat.label}</div>
                    <div className="text-lg font-bold text-white">{stat.value}</div>
                    <div className={`text-sm font-semibold flex items-center ${stat.up ? 'text-emerald-400' : 'text-red-400'}`}>
                      {stat.up ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                      {stat.change}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Floating Cards */}
            <div className="absolute -top-4 -right-4 bg-emerald-500 text-white px-4 py-2 rounded-lg shadow-lg animate-pulse">
              <div className="text-xs font-semibold">Risk Warning</div>
              <div className="text-xs">Phát hiện cơ hội mua</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function StatsBar() {
  const stats = [
    { icon: Database, label: "Cổ phiếu", value: "700+", color: "emerald" },
    { icon: Brain, label: "Chỉ số phân tích", value: "50+", color: "cyan" },
    { icon: Users, label: "Người dùng", value: "10K+", color: "blue" },
    { icon: Target, label: "Độ chính xác", value: "90%", color: "purple" }
  ];

  return (
    <section className="relative -mt-10 z-20">
      <div className="container mx-auto px-4">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <div key={i} className="text-center">
                  <div className={`inline-flex p-3 rounded-xl bg-${stat.color}-500/10 mb-3`}>
                    <Icon className={`h-6 w-6 text-${stat.color}-600 dark:text-${stat.color}-400`} />
                  </div>
                  <div className="text-3xl font-black text-slate-800 dark:text-white mb-1">
                    {stat.value}
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    {stat.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

function MainContent() {
  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Features */}
          <div className="lg:col-span-2 space-y-8">
            <FeaturesSection />
            <ProblemSolutionSection />
          </div>
          
          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            <LiveFeedCard />
            <QuickStatsCard />
            <NewsCard />
          </div>
        </div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  const features = [
    {
      icon: Shield,
      title: "Bảo vệ khỏi thao túng",
      description: "AI phát hiện dấu hiệu bất thường, cảnh báo rủi ro thao túng giá real-time",
      gradient: "from-red-500 to-rose-600",
      stats: "Hơn 90% độ chính xác"
    },
    {
      icon: Zap,
      title: "Phân tích thời gian thực",
      description: "Dữ liệu cập nhật liên tục, phân tích tức thời với độ trễ < 100ms",
      gradient: "from-amber-500 to-orange-600",
      stats: "Cập nhật mỗi 5s"
    },
    {
      icon: LineChart,
      title: "Đánh giá toàn diện",
      description: "Đánh giá đa chiều từ tài chính, quản trị đến tiềm năng tăng trưởng",
      gradient: "from-emerald-500 to-green-600",
      stats: "15+ tiêu chí"
    },
    {
      icon: Activity,
      title: "Theo dõi 24/7",
      description: "Giám sát sức khỏe doanh nghiệp không ngừng với cảnh báo thông minh",
      gradient: "from-blue-500 to-indigo-600",
      stats: "24/7 monitoring"
    }
  ];

  return (
    <Card className="border-slate-200 dark:border-slate-700">
      <CardHeader>
        <div className="flex items-center justify-between mb-2">
          <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
            Tính năng nổi bật
          </Badge>
          <Sparkles className="h-5 w-5 text-emerald-500" />
        </div>
        <CardTitle className="text-2xl">Công nghệ AI tiên tiến</CardTitle>
        <CardDescription>
          Kết hợp Machine Learning và Big Data cho trải nghiệm phân tích vượt trội
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 gap-4">
          {features.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <div 
                key={i}
                className="group p-5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-lg transition-all duration-300"
              >
                <div className="flex items-start space-x-4">
                  <div className={`p-3 rounded-lg bg-gradient-to-br ${feature.gradient} shadow-lg group-hover:scale-110 transition-transform`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-800 dark:text-white mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                      {feature.description}
                    </p>
                    <Badge variant="outline" className="text-xs">
                      {feature.stats}
                    </Badge>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function ProblemSolutionSection() {
  const problems = [
    {
      icon: Database,
      title: "Thông tin phân mảnh",
      problem: "Phải mở 5+ nguồn khác nhau",
      solution: "Tập trung tất cả vào 1 nền tảng"
    },
    {
      icon: Brain,
      title: "Báo cáo khó hiểu",
      problem: "F0 không đọc được BCTC",
      solution: "AI giải thích đơn giản, trực quan"
    },
    {
      icon: Bell,
      title: "Nguy cơ thao túng",
      problem: "Dễ bị cuốn theo tin đồn",
      solution: "Cảnh báo tự động, phân tích khách quan"
    }
  ];

  return (
    <Card className="border-slate-200 dark:border-slate-700">
      <CardHeader>
        <CardTitle className="text-2xl">Giải quyết vấn đề thực tế</CardTitle>
        <CardDescription>
          Gulliver được xây dựng để giải quyết những khó khăn lớn nhất của nhà đầu tư Việt
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {problems.map((item, i) => {
            const Icon = item.icon;
            return (
              <div key={i} className="flex items-start space-x-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                <div className="flex-shrink-0 p-2 bg-red-500/10 rounded-lg">
                  <Icon className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-slate-800 dark:text-white mb-1">{item.title}</h4>
                  <div className="flex items-center space-x-3 text-sm">
                    <div className="flex items-center space-x-1 text-red-600 dark:text-red-400">
                      <span className="font-medium">Vấn đề:</span>
                      <span>{item.problem}</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                    <div className="flex items-center space-x-1 text-emerald-600 dark:text-emerald-400">
                      <span className="font-medium">Giải pháp:</span>
                      <span>{item.solution}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function LiveFeedCard() {
  const updates = [
    { type: "alert", message: "VPB phát hiện tín hiệu mua", time: "2 phút trước", color: "emerald" },
    { type: "news", message: "VNM công bố BCTC Q4", time: "15 phút trước", color: "blue" },
    { type: "warning", message: "FPT khối lượng giao dịch bất thường", time: "1 giờ trước", color: "amber" }
  ];

  return (
    <Card className="border-slate-200 dark:border-slate-700">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center space-x-2">
            <Activity className="h-5 w-5 text-emerald-500" />
            <span>Live Feed</span>
          </CardTitle>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-xs text-slate-500">Live</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {updates.map((update, i) => (
          <div key={i} className="flex items-start space-x-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
            <div className={`w-2 h-2 rounded-full bg-${update.color}-500 mt-2`} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-800 dark:text-white mb-1">
                {update.message}
              </p>
              <div className="flex items-center space-x-1 text-xs text-slate-500">
                <Clock className="h-3 w-3" />
                <span>{update.time}</span>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function QuickStatsCard() {
  return (
    <Card className="border-slate-200 dark:border-slate-700 bg-gradient-to-br from-emerald-500/10 to-cyan-500/10">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Thị trường hôm nay</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-600 dark:text-slate-400">VN-INDEX</span>
          <div className="text-right">
            <div className="font-bold text-slate-800 dark:text-white">1,234.56</div>
            <div className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center justify-end">
              <TrendingUp className="h-3 w-3 mr-1" />
              +2.45%
            </div>
          </div>
        </div>
        <Separator />
        <div className="grid grid-cols-2 gap-3 text-center">
          <div className="p-2 rounded-lg bg-white/50 dark:bg-slate-800/50">
            <div className="text-xs text-slate-500 mb-1">Tăng</div>
            <div className="text-lg font-bold text-emerald-600">234</div>
          </div>
          <div className="p-2 rounded-lg bg-white/50 dark:bg-slate-800/50">
            <div className="text-xs text-slate-500 mb-1">Giảm</div>
            <div className="text-lg font-bold text-red-600">156</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function NewsCard() {
  const news = [
    { title: "Thị trường tăng điểm mạnh trong phiên đầu tuần", time: "1h" },
    { title: "Dòng tiền đổ mạnh vào nhóm ngân hàng", time: "3h" }
  ];

  return (
    <Card className="border-slate-200 dark:border-slate-700">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center space-x-2">
          <Newspaper className="h-5 w-5" />
          <span>Tin tức nổi bật</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {news.map((item, i) => (
          <div key={i} className="group cursor-pointer p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
            <p className="text-sm font-medium text-slate-800 dark:text-white mb-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
              {item.title}
            </p>
            <span className="text-xs text-slate-500">{item.time}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function TrustSection() {
  return (
    <section className="py-12 bg-slate-100 dark:bg-slate-900/50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-black text-slate-800 dark:text-white mb-2">
            Được tin dùng bởi hàng nghìn nhà đầu tư
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            Nền tảng phân tích chứng khoán hàng đầu Việt Nam
          </p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { icon: Users, value: "10,000+", label: "Người dùng", color: "emerald" },
            { icon: PieChart, value: "500K+", label: "Phân tích/tháng", color: "cyan" },
            { icon: Award, value: "99.9%", label: "Uptime", color: "blue" },
            { icon: Clock, value: "24/7", label: "Hỗ trợ", color: "purple" }
          ].map((stat, i) => {
            const Icon = stat.icon;
            return (
              <Card key={i} className="text-center border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-lg transition-all duration-300">
                <CardContent className="pt-6">
                  <div className={`inline-flex p-3 rounded-xl bg-${stat.color}-500/10 mb-3`}>
                    <Icon className={`h-8 w-8 text-${stat.color}-600 dark:text-${stat.color}-400`} />
                  </div>
                  <div className="text-3xl font-black text-slate-800 dark:text-white mb-1">
                    {stat.value}
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    {stat.label}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function CallToAction() {
  return (
    <section className="py-16 bg-gradient-to-br from-emerald-600 via-cyan-600 to-blue-600 dark:from-emerald-700 dark:via-cyan-700 dark:to-blue-700">
      <div className="container mx-auto px-4 text-center">
        <div className="max-w-3xl mx-auto space-y-6">
          <h2 className="text-4xl md:text-5xl font-black text-white">
            Sẵn sàng đầu tư thông minh hơn?
          </h2>
          <p className="text-xl text-white/90">
            Tham gia cùng 10,000+ nhà đầu tư đang sử dụng Gulliver để ra quyết định tự tin hơn
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <button className="px-8 py-4 bg-white text-emerald-600 font-bold rounded-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 flex items-center space-x-2">
              <span>Bắt đầu miễn phí</span>
              <ArrowUpRight className="h-5 w-5" />
            </button>
            <button className="px-8 py-4 bg-white/10 backdrop-blur-sm text-white font-bold rounded-lg border-2 border-white/30 hover:bg-white/20 transition-all duration-300">
              Tìm hiểu thêm
            </button>
          </div>
          <div className="flex items-center justify-center space-x-8 pt-6 text-white/80">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="h-5 w-5" />
              <span>Miễn phí 30 ngày</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="h-5 w-5" />
              <span>Không cần thẻ tín dụng</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="h-5 w-5" />
              <span>Hủy bất cứ lúc nào</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}