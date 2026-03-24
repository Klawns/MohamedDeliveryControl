"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  // Evita hidratação incorreta
  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-10 h-10 rounded-xl bg-secondary/20 border border-border/50 animate-pulse" />
    );
  }

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className={cn(
        "relative w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300",
        "bg-secondary/40 border border-border/50 hover:border-primary/50 group active:scale-95 shadow-sm",
        "hover:bg-secondary/60"
      )}
      aria-label="Alternar tema"
    >
      <div className="relative w-5 h-5">
        <Sun 
          className={cn(
            "absolute inset-0 h-5 w-5 transition-all duration-300 transform",
            theme === "dark" 
              ? "-rotate-90 scale-0 opacity-0" 
              : "rotate-0 scale-100 opacity-100 text-amber-500"
          )} 
        />
        <Moon 
          className={cn(
            "absolute inset-0 h-5 w-5 transition-all duration-300 transform",
            theme === "dark" 
              ? "rotate-0 scale-100 opacity-100 text-blue-400" 
              : "rotate-90 scale-0 opacity-0"
          )} 
        />
      </div>
      
      {/* Glow effect on hover */}
      <div className={cn(
        "absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity blur-md -z-10",
        theme === "dark" ? "bg-blue-500/10" : "bg-amber-500/10"
      )} />
    </button>
  );
}
