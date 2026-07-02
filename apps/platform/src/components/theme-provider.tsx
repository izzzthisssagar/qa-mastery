"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

/**
 * Class-strategy theme provider. Dark is the brand default; the light palette
 * lives in `:root` (globals.css) and ships behind the Phase 7 visual sweep.
 * next-themes handles the no-flash inline script + localStorage persistence.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      {children}
    </NextThemesProvider>
  );
}
