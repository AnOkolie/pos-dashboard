import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";

// DEV workaround: Tambo Cloud /generate-name sometimes 500s.
// Don't let thread naming failures block chat UI.
const realFetch = window.fetch.bind(window);

window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  let url: string;

  if (typeof input === "string") url = input;
  else if (input instanceof URL) url = input.toString();
  else url = input.url; // input is Request here

  if (url.includes("/generate-name")) {
    try {
      const res = await realFetch(input as any, init);
      if (!res.ok) return new Response("{}", { status: 204 });
      return res;
    } catch {
      return new Response("{}", { status: 204 });
    }
  }

  return realFetch(input as any, init);
};
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
