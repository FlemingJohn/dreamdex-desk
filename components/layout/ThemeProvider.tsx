"use client";

import { ThemeProvider as NextThemeProvider } from "next-themes";
import type { ReactNode } from "react";

/**
 * Applies the `dark` class shadcn's tokens are written against.
 *
 * Without this nothing ever sets that class, so the whole app is stuck in light
 * mode no matter what the tokens say. A trading desk is read for long stretches,
 * so dark is the default here and the toggle is there for anyone who disagrees.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </NextThemeProvider>
  );
}
