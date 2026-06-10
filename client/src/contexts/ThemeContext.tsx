import React, { createContext, useContext, useEffect } from "react";

type Theme = "light";

interface ThemeContextType {
  theme: Theme;
  toggleTheme?: () => void;
  switchable: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  switchable?: boolean;
}

export function ThemeProvider({
  children,
}: ThemeProviderProps) {
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("dark");
  }, []);

  return (
    <ThemeContext.Provider value={{ theme: "light", toggleTheme: () => {}, switchable: false }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
