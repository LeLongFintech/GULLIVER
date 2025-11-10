// client/components/common/ThemeToggle.tsx
import { Moon, Sun } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="fixed top-6 right-6 z-50 p-3 rounded-full bg-white/90 dark:bg-slate-800/90 backdrop-blur-lg border border-slate-200 dark:border-slate-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 group"
      aria-label="Toggle theme"
      title={theme === 'dark' ? 'Chuyển sang chế độ sáng' : 'Chuyển sang chế độ tối'}
    >
      <Sun className="h-5 w-5 text-amber-500 dark:text-slate-400 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-5 w-5 text-slate-400 dark:text-blue-400 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
    </button>
  );
}