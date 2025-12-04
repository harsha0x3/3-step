import { useEffect, useState } from "react";
import { ThemeContextProvider } from "./ThemeContext";

export function ThemeProvider({ children, defaultTheme = "light", ...props }) {
  const [theme, setTheme] = useState("light");
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light";
      root.classList.add(systemTheme);
      return;
    }

    root.classList.add(theme);
  }, [theme]);

  const value = {
    theme,
    setTheme: (theme: string) => {
      setTheme(theme);
    },
  };

  return (
    <ThemeContextProvider.Provider {...props} value={value}>
      {children}
    </ThemeContextProvider.Provider>
  );
}
