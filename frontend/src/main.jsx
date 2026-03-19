import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";

// Global styles
const style = document.createElement("style");
style.textContent = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: #080c14; color: #e2e8f0; font-family: 'Segoe UI', system-ui, sans-serif; }
  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: #080c14; }
  ::-webkit-scrollbar-thumb { background: #1e2d45; border-radius: 99px; }
  ::-webkit-scrollbar-thumb:hover { background: #243350; }
  button { font-family: inherit; }
  @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
`;
document.head.appendChild(style);

createRoot(document.getElementById("root")).render(
  <StrictMode><App /></StrictMode>
);
