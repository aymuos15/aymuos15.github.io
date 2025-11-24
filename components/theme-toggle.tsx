"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check initial theme
    const isDarkMode = document.documentElement.classList.contains("dark");
    setIsDark(isDarkMode);
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    const html = document.documentElement;
    const newIsDark = !isDark;

    if (newIsDark) {
      html.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      html.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }

    setIsDark(newIsDark);
  };

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" disabled className="rounded-full h-10 w-10">
        <div className="h-5 w-5 rounded-full border-2 border-current" />
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      aria-label="Toggle theme"
      className="rounded-full h-10 w-10 shadow-sm hover:bg-muted/50 hover:shadow-md transition-shadow dark:shadow-[0_1px_3px_0_rgba(255,255,255,0.25)] dark:hover:shadow-[0_4px_6px_-1px_rgba(255,255,255,0.3)]"
    >
      <div className="relative h-5 w-5">
        {isDark ? (
          <div className="h-5 w-5 rounded-full bg-current" />
        ) : (
          <div className="h-5 w-5 rounded-full border-2 border-current" />
        )}
      </div>
    </Button>
  );
}
