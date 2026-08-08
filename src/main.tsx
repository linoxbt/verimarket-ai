import { createRoot } from "react-dom/client";
import "./index.css";

const rootEl = document.getElementById("root")!;

// Static `import App from "./App"` runs (and can throw) before any of this file's own code does,
// since ES module imports are evaluated ahead of the importing module's body — a synchronous throw
// there happens before React, or an ErrorBoundary, ever gets a chance to run, and shows up as a
// silent blank page. A dynamic import turns that into a rejected promise we can actually catch and
// render a real fallback for.
import("./App.tsx")
  .then(async ({ default: App }) => {
    const { ErrorBoundary } = await import("./components/error-boundary.tsx");
    createRoot(rootEl).render(
      <ErrorBoundary>
        <App />
      </ErrorBoundary>,
    );
  })
  .catch((err: unknown) => {
    console.error("VeriMarket failed to load:", err);
    const message = err instanceof Error ? err.message : String(err);
    rootEl.innerHTML = `
      <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0e0d0b;padding:24px;font-family:monospace;">
        <div style="max-width:32rem;width:100%;border:1px solid rgba(192,82,74,0.4);background:rgba(192,82,74,0.1);border-radius:2px;padding:24px;">
          <p style="color:#c0524a;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;margin:0;">Failed to load</p>
          <h1 style="color:#f3efe6;font-size:20px;font-weight:700;margin:8px 0 0;">VeriMarket couldn't start</h1>
          <p style="color:#948c7a;font-size:12px;white-space:pre-wrap;word-break:break-word;margin:12px 0 0;">${message.replace(/</g, "&lt;")}</p>
          <button onclick="window.location.reload()" style="margin-top:16px;border:1px solid #2a2721;background:transparent;color:#f3efe6;padding:8px 16px;border-radius:2px;font-family:monospace;font-size:13px;cursor:pointer;">Reload</button>
        </div>
      </div>
    `;
  });
