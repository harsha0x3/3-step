import { createContext } from "react";

interface ThemeContextState {
  theme: string;
  setTheme: () => null | void;
}

const initialState: ThemeContextState = {
  theme: "light",
  setTheme: () => null,
};

export const ThemeContextProvider = createContext(initialState);
