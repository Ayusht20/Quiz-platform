import { Moon, Sun } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  const isDark = theme === "dark";

  return (
    <button
      onClick={toggleTheme}
      aria-label="Toggle theme"
      className="flex h-9 items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 text-[var(--muted)] transition hover:text-[var(--text)]"
    >
      {isDark ? (
        <Sun size={16} />
      ) : (
        <Moon size={16} />
      )}

      <span className="hidden text-xs font-bold sm:block">
        {isDark ? "Light" : "Dark"}
      </span>
    </button>
  );
}