//src/main.tsx;
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import rootStore from "./store/rootStore.ts";
import { BrowserRouter as Router } from "react-router-dom";
import "./index.css";
import App from "./App.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Provider store={rootStore}>
      <Router>
        <App />
      </Router>
    </Provider>
  </StrictMode>
);
