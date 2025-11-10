import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./contexts/ThemeContext"; // ← THÊM DÒNG NÀY
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppRoot = () => {
  // ❌ XÓA useEffect này - ThemeProvider sẽ tự động quản lý dark mode
  // useEffect(() => {
  //   document.documentElement.classList.add("dark");
  // }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark"> {/* ← THÊM DÒNG NÀY */}
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider> {/* ← THÊM DÒNG NÀY */}
    </QueryClientProvider>
  );
};

createRoot(document.getElementById("root")!).render(<AppRoot />);
