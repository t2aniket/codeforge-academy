"use client";

import type { LabLanguage } from "@/lib/labs/registry";

type PyodideRuntime = {
  runPythonAsync: (code: string) => Promise<unknown>;
};

type RuntimeAdapterInput = {
  language: LabLanguage;
  version: string;
  code: string;
  commands?: Record<string, string>;
};

export type RuntimeVariable = {
  name: string;
  value: string;
  scope: string;
};

export type RuntimeAdapterResult = {
  stdout: string;
  stderr: string;
  logs: string[];
  variables: RuntimeVariable[];
  mode: "native" | "pyodide" | "sql" | "wasm" | "adapter";
};

declare global {
  interface Window {
    loadPyodide?: (options?: { indexURL?: string }) => Promise<PyodideRuntime>;
  }
}

const starterSnippets: Record<string, { fileName: string; code: string }> = {
  javascript: {
    fileName: "main.js",
    code: "const learner = 'CodeForge';\nconst xp = 120;\n\nfunction level(points) {\n  return points >= 100 ? 'builder' : 'starter';\n}\n\nconsole.log(`${learner} is a ${level(xp)}`);\n"
  },
  typescript: {
    fileName: "main.ts",
    code: "type Rank = 'starter' | 'builder';\n\nconst learner: string = 'CodeForge';\nconst xp: number = 120;\nconst rank: Rank = xp >= 100 ? 'builder' : 'starter';\n\nconsole.log(`${learner} rank: ${rank}`);\n"
  },
  python: {
    fileName: "main.py",
    code: "learner = 'CodeForge'\nxp = 120\nrank = 'builder' if xp >= 100 else 'starter'\nprint(f'{learner} rank: {rank}')\n"
  },
  sql: {
    fileName: "query.sql",
    code: "select name, xp\nfrom learners\nwhere xp >= 500\norder by xp desc;\n"
  },
  wasm: {
    fileName: "module.wasm.base64",
    code: "AGFzbQEAAAABBQFgAAF/AwIBAAcHAQNydW4AAAoGAQQAQQcrCw=="
  },
  java: {
    fileName: "Main.java",
    code: "class Main {\n  public static void main(String[] args) {\n    System.out.println(\"CodeForge Java adapter ready\");\n  }\n}\n"
  },
  dart: {
    fileName: "main.dart",
    code: "void main() {\n  final xp = 120;\n  print('CodeForge Dart adapter ready: $xp XP');\n}\n"
  },
  cpp: {
    fileName: "main.cpp",
    code: "#include <iostream>\n\nint main() {\n  std::cout << \"CodeForge C++ WASM adapter ready\" << std::endl;\n  return 0;\n}\n"
  },
  rust: {
    fileName: "main.rs",
    code: "fn main() {\n    println!(\"CodeForge Rust WASM adapter ready\");\n}\n"
  },
  go: {
    fileName: "main.go",
    code: "package main\n\nimport \"fmt\"\n\nfunc main() {\n  fmt.Println(\"CodeForge Go WASM adapter ready\")\n}\n"
  },
  ruby: {
    fileName: "main.rb",
    code: "learner = 'CodeForge'\nxp = 120\nputs \"#{learner} Ruby adapter ready: #{xp} XP\"\n"
  },
  php: {
    fileName: "index.php",
    code: "<?php\n$xp = 120;\necho \"CodeForge PHP adapter ready: {$xp} XP\\n\";\n"
  },
  kotlin: {
    fileName: "Main.kt",
    code: "fun main() {\n  println(\"CodeForge Kotlin adapter ready\")\n}\n"
  },
  swift: {
    fileName: "main.swift",
    code: "let xp = 120\nprint(\"CodeForge Swift adapter ready: \\(xp) XP\")\n"
  },
  dockerfile: {
    fileName: "Dockerfile",
    code: "FROM node:20-alpine\nWORKDIR /app\nCOPY package.json .\nRUN npm install --omit=dev\nCOPY . .\nCMD [\"npm\", \"start\"]\n"
  },
  yaml: {
    fileName: "compose.yaml",
    code: "services:\n  api:\n    image: codeforge-api\n    ports:\n      - \"8080:8080\"\n"
  }
};

let pyodidePromise: Promise<PyodideRuntime> | null = null;

export function getLanguageStarter(languageId: string) {
  return starterSnippets[languageId] ?? starterSnippets.javascript;
}

export function extractRuntimeVariables(code: string): RuntimeVariable[] {
  const jsMatches = Array.from(code.matchAll(/\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*([^;\n]+)/g));
  const pythonMatches = Array.from(code.matchAll(/^\s*([A-Za-z_]\w*)\s*=\s*([^\n#]+)/gm));
  const merged = [
    ...jsMatches.map((match) => ({ name: match[1], value: match[2].trim(), scope: "local" })),
    ...pythonMatches.map((match) => ({ name: match[1], value: match[2].trim(), scope: "local" }))
  ];

  return Array.from(new Map(merged.map((item) => [item.name, item])).values()).slice(0, 12);
}

export async function executeLabCode(input: RuntimeAdapterInput): Promise<RuntimeAdapterResult> {
  const { language, version, code, commands } = input;

  if (language.id === "python") {
    const pyodide = await loadBrowserPyodide();
    const output = await capturePythonOutput(pyodide, code);
    return {
      stdout: output || "Python executed successfully.",
      stderr: "",
      logs: [`python@${version} executed in Pyodide`],
      variables: extractRuntimeVariables(code),
      mode: "pyodide"
    };
  }

  if (language.id === "sql") {
    return {
      stdout: commands?.["run query"] ?? "Query executed in the CodeForge SQL simulator.",
      stderr: "",
      logs: [`sql@${version} executed against sample tables`],
      variables: extractRuntimeVariables(code),
      mode: "sql"
    };
  }

  if (language.id === "wasm") {
    const result = await executeWasmBase64(code);
    return {
      stdout: result,
      stderr: "",
      logs: [`wasm@${version} instantiated in browser WebAssembly`],
      variables: extractRuntimeVariables(code),
      mode: "wasm"
    };
  }

  if (language.id === "javascript" || language.id === "typescript") {
    const logs: string[] = [];
    const executable = language.id === "typescript" ? stripTypeScriptSyntax(code) : code;
    const fn = new Function("console", executable);
    fn({
      log: (...args: unknown[]) => logs.push(args.map(formatValue).join(" ")),
      error: (...args: unknown[]) => logs.push(args.map(formatValue).join(" ")),
      warn: (...args: unknown[]) => logs.push(args.map(formatValue).join(" "))
    });

    return {
      stdout: logs.join("\n") || `${language.label} executed successfully.`,
      stderr: "",
      logs: [`${language.id}@${version} executed in browser sandbox`],
      variables: extractRuntimeVariables(code),
      mode: "native"
    };
  }

  return {
    stdout: [
      `${language.label} ${version}`,
      "This workspace is adapter-ready for browser execution.",
      getAdapterInstallHint(language.id)
    ].join("\n"),
    stderr: "",
    logs: [`${language.id}@${version} waiting for runtime asset`],
    variables: extractRuntimeVariables(code),
    mode: "adapter"
  };
}

async function loadBrowserPyodide() {
  if (pyodidePromise) return pyodidePromise;

  pyodidePromise = new Promise<PyodideRuntime>((resolve, reject) => {
    const finish = () => {
      if (!window.loadPyodide) {
        reject(new Error("Pyodide loader is unavailable"));
        return;
      }
      window.loadPyodide({ indexURL: "https://cdn.jsdelivr.net/pyodide/v0.27.5/full/" }).then(resolve).catch(reject);
    };

    if (window.loadPyodide) {
      finish();
      return;
    }

    const existing = document.querySelector<HTMLScriptElement>("script[data-pyodide]");
    if (existing) {
      existing.addEventListener("load", finish, { once: true });
      existing.addEventListener("error", () => reject(new Error("Pyodide failed to load")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/pyodide/v0.27.5/full/pyodide.js";
    script.async = true;
    script.dataset.pyodide = "true";
    script.onload = finish;
    script.onerror = () => reject(new Error("Pyodide failed to load"));
    document.head.appendChild(script);
  });

  return pyodidePromise;
}

async function capturePythonOutput(pyodide: PyodideRuntime, code: string) {
  const escaped = JSON.stringify(code);
  const wrapper = [
    "import contextlib, io",
    "_codeforge_stdout = io.StringIO()",
    "_codeforge_stderr = io.StringIO()",
    "with contextlib.redirect_stdout(_codeforge_stdout), contextlib.redirect_stderr(_codeforge_stderr):",
    `    exec(${escaped})`,
    "_codeforge_stdout.getvalue() + _codeforge_stderr.getvalue()"
  ].join("\n");

  const result = await pyodide.runPythonAsync(wrapper);
  return String(result ?? "");
}

async function executeWasmBase64(code: string) {
  const clean = code.replace(/\s/g, "");
  const binary = Uint8Array.from(atob(clean), (char) => char.charCodeAt(0));
  const instance = await WebAssembly.instantiate(binary, {});
  const exports = instance.instance.exports as Record<string, unknown>;
  const callable = exports.main ?? exports.run;

  if (typeof callable === "function") {
    const result = callable();
    return `WASM module executed.\nReturn value: ${String(result ?? "void")}`;
  }

  return `WASM module loaded.\nExports: ${Object.keys(exports).join(", ") || "none"}`;
}

function stripTypeScriptSyntax(code: string) {
  return code
    .replace(/^\s*type\s+\w+\s*=\s*[^;]+;?\s*$/gm, "")
    .replace(/:\s*[A-Za-z0-9_<>\[\]\|'" ]+(?=\s*[=,)])/g, "")
    .replace(/\s+as\s+[A-Za-z0-9_<>\[\]\|'" ]+/g, "");
}

function formatValue(value: unknown) {
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function getAdapterInstallHint(languageId: string) {
  const hints: Record<string, string> = {
    java: "Next adapter: CheerpJ or a prebuilt JVM/WebAssembly bundle loaded as a static asset.",
    dart: "Next adapter: compile DartPad-style worker assets and connect stdout to this runtime contract.",
    cpp: "Next adapter: Clang/Emscripten worker that returns a WebAssembly module.",
    rust: "Next adapter: rustc/WASI worker or precompiled wasm-pack pipeline.",
    go: "Next adapter: Go WASM runtime with wasm_exec.js and an isolated worker.",
    ruby: "Next adapter: ruby.wasm with stdout bridged into the terminal.",
    php: "Next adapter: php-wasm package with filesystem mounts.",
    kotlin: "Next adapter: Kotlin/JVM browser runtime or Kotlin/WASM worker.",
    swift: "Next adapter: Swift WASM worker runtime."
  };

  return hints[languageId] ?? "Add an adapter that implements executeLabCode and returns stdout, stderr, logs, and variables.";
}
