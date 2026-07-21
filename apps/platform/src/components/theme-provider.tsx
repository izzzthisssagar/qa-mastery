"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

/**
 * Class-strategy theme provider. Dark is the brand default and the fallback when
 * a visitor has no OS preference; the light palette (globals.css `:root`) is now
 * fully swept, so `enableSystem` lets a light-preferring OS get light on first
 * paint. The avatar-menu toggle overrides and persists to localStorage.
 * next-themes handles the no-flash inline script + persistence.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="dark" enableSystem>
      {children}
    </NextThemesProvider>
  );
}
