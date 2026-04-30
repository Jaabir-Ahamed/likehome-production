import { createRoot } from "react-dom/client";
import App from "./app/App.tsx";
import "./styles/index.css";

const isDark = localStorage.getItem("darkMode") === "true";

if (isDark) {
  document.documentElement.classList.add("dark");
}

createRoot(document.getElementById("root")!).render(<App />);
