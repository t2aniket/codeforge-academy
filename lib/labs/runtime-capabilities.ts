import type { LabLanguage } from "@/lib/labs/registry";

export type RuntimeCapability = {
  label: string;
  description: string;
  executable: boolean;
};

export function getRuntimeCapability(language?: LabLanguage): RuntimeCapability {
  if (!language) {
    return {
      label: "Unknown runtime",
      description: "No runtime metadata is available for this language.",
      executable: false
    };
  }

  if (language.runtime === "native") {
    return {
      label: "Browser native",
      description: "Runs directly in the browser sandbox.",
      executable: true
    };
  }

  if (language.runtime === "pyodide") {
    return {
      label: "Pyodide runtime",
      description: "Runs Python in the browser through Pyodide.",
      executable: true
    };
  }

  if (language.runtime === "sql") {
    return {
      label: "SQL simulator",
      description: "Runs against CodeForge in-browser sample tables.",
      executable: true
    };
  }

  if (language.runtime === "wasm") {
    return {
      label: "WebAssembly runtime",
      description: "Instantiates base64-encoded WebAssembly modules directly in the browser and calls run or main when exported.",
      executable: true
    };
  }

  if (language.runtime === "wasm-adapter") {
    return {
      label: "WASM adapter-ready",
      description: "The UI and session model are ready; install a WASM compiler/runtime asset to execute this language.",
      executable: false
    };
  }

  return {
    label: "Simulated adapter",
    description: "This language is represented for curriculum flow until a browser runtime asset is installed.",
    executable: false
  };
}
