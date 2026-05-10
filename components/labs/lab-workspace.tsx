"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { saveLabSessionAction } from "@/app/actions/labs";
import { CodeEditor } from "@/components/labs/code-editor";
import { SimulatedTerminal } from "@/components/labs/simulated-terminal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { LabDefinition } from "@/lib/labs/registry";
import type { LabStarter } from "@/lib/types";

declare global {
  interface Window {
    loadPyodide?: (options?: { indexURL?: string }) => Promise<{
      runPythonAsync: (code: string) => Promise<unknown>;
    }>;
  }
}

async function loadBrowserPyodide() {
  if (!window.loadPyodide) {
    await new Promise<void>((resolve, reject) => {
      const existing = document.querySelector<HTMLScriptElement>("script[data-pyodide]");
      if (existing) {
        existing.addEventListener("load", () => resolve(), { once: true });
        existing.addEventListener("error", () => reject(new Error("Pyodide failed to load")), { once: true });
        return;
      }

      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/pyodide/v0.27.5/full/pyodide.js";
      script.async = true;
      script.dataset.pyodide = "true";
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Pyodide failed to load"));
      document.head.appendChild(script);
    });
  }

  if (!window.loadPyodide) throw new Error("Pyodide loader is unavailable");
  return window.loadPyodide({ indexURL: "https://cdn.jsdelivr.net/pyodide/v0.27.5/full/" });
}

function firstStarterFile(starter: LabStarter) {
  return Object.entries(starter.files ?? { "notes.md": "# Lab notes\n" })[0];
}

export function LabWorkspace({
  definition,
  starterOverride,
  courseId,
  lessonId
}: {
  definition: LabDefinition;
  starterOverride?: LabStarter;
  courseId?: string;
  lessonId?: string;
}) {
  const starter = starterOverride ?? definition.defaultStarter;
  const initialFile = firstStarterFile(starter);
  const storageKey = `lab-session:${definition.id}:${courseId ?? "standalone"}:${lessonId ?? "standalone"}`;
  const [fileName, setFileName] = useState(initialFile[0]);
  const [code, setCode] = useState(initialFile[1]);
  const [language, setLanguage] = useState(starter.language ?? (definition.id === "sql" ? "sql" : "javascript"));
  const [output, setOutput] = useState("Output appears here after you run code or checks.");
  const [steps, setSteps] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const nextFile = firstStarterFile(starter);
    const saved = localStorage.getItem(storageKey);

    if (saved) {
      try {
        const parsed = JSON.parse(saved) as {
          fileName?: string;
          code?: string;
          language?: string;
          output?: string;
          steps?: string[];
        };
        setFileName(parsed.fileName ?? nextFile[0]);
        setCode(parsed.code ?? nextFile[1]);
        setLanguage(parsed.language ?? starter.language ?? (definition.id === "sql" ? "sql" : "javascript"));
        setOutput(parsed.output ?? "Output appears here after you run code or checks.");
        setSteps(parsed.steps ?? []);
        return;
      } catch {
        localStorage.removeItem(storageKey);
      }
    }

    setFileName(nextFile[0]);
    setCode(nextFile[1]);
    setLanguage(starter.language ?? (definition.id === "sql" ? "sql" : "javascript"));
    setOutput("Output appears here after you run code or checks.");
    setSteps([]);
  }, [definition.id, starter, storageKey]);

  const dashboard = useMemo(() => {
    if (definition.id === "network") return ["Router R1: online", "Switch SW1: online", "G0/1: pending"];
    if (definition.id === "docker") return ["Image: codeforge-api", "Port: 8080", "Health: pending"];
    if (definition.id === "sql") return ["Table learners: 5 rows", "Table courses: 12 rows", "Index xp_idx: ready"];
    if (definition.id === "testing") return ["Pytest: ready", "Playwright: ready", "Cypress: ready"];
    return ["Workspace mounted", "Runtime isolated", "Progress autosaved"];
  }, [definition.id]);

  async function runCode() {
    try {
      if (language === "python") {
        setOutput("Loading Pyodide runtime...");
        const pyodide = await loadBrowserPyodide();
        const result = await pyodide.runPythonAsync(code);
        setOutput(String(result ?? "Python executed successfully."));
      } else if (language === "sql") {
        setOutput(definition.commands["run query"] ?? "Query executed.");
      } else {
        const logs: string[] = [];
        const fn = new Function("console", code);
        fn({ log: (...args: unknown[]) => logs.push(args.map(String).join(" ")) });
        setOutput(logs.join("\n") || "JavaScript executed successfully.");
      }
      toast.success("Execution complete");
    } catch (error) {
      setOutput(error instanceof Error ? error.message : "Execution failed");
      toast.error("Execution failed");
    }
  }

  function saveSession(status: "active" | "completed" = "active") {
    const session = {
      fileName,
      code,
      language,
      output,
      steps,
      savedAt: new Date().toISOString()
    };
    localStorage.setItem(storageKey, JSON.stringify(session));

    startTransition(async () => {
      const result = await saveLabSessionAction({
        lab: definition.id,
        courseId,
        lessonId,
        files: { [fileName]: code },
        terminalHistory: steps,
        status
      });
      if (result.ok) toast.success(result.message);
      else toast.error(result.message);
    });
  }

  function resetStarter() {
    const nextFile = firstStarterFile(starter);
    localStorage.removeItem(storageKey);
    setFileName(nextFile[0]);
    setCode(nextFile[1]);
    setLanguage(starter.language ?? (definition.id === "sql" ? "sql" : "javascript"));
    setOutput("Output appears here after you run code or checks.");
    setSteps([]);
    toast.success("Starter restored.");
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Badge className="border-primary/30 bg-primary/10 text-primary">{definition.accent}</Badge>
            <h1 className="mt-3 text-4xl font-black">{starter.title}</h1>
            <p className="mt-2 max-w-3xl text-muted-foreground">{starter.description}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setLanguage(language === "python" ? "javascript" : "python")}>
              {language === "python" ? "Use JS" : "Use Python"}
            </Button>
            <Button variant="outline" onClick={resetStarter}>Reset</Button>
            <Button variant="outline" onClick={() => saveSession("active")} disabled={isPending}>
              Save session
            </Button>
            <Button onClick={runCode}>Run</Button>
          </div>
        </div>
        <div className="rounded-md border bg-card px-3 py-2 text-sm text-muted-foreground">
          Editing <span className="font-mono text-foreground">{fileName}</span>
          {starterOverride && <span> from linked lesson starter</span>}
        </div>
        <CodeEditor value={code} language={language} onChange={setCode} />
        <div className="grid gap-4 xl:grid-cols-2">
          <SimulatedTerminal
            commands={definition.commands}
            prompt={definition.id}
            onCommand={(command) => setSteps((items) => [...items, command])}
          />
          <Card>
            <CardContent className="p-5">
              <h2 className="text-lg font-semibold">Runtime output</h2>
              <pre className="mt-4 min-h-[280px] whitespace-pre-wrap rounded-md bg-slate-950 p-4 text-sm text-slate-100">
                {output}
              </pre>
            </CardContent>
          </Card>
        </div>
      </div>
      <aside className="space-y-4">
        <Card>
          <CardContent className="p-5">
            <h2 className="text-lg font-semibold">Guided challenge</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{starter.challenge}</p>
            <div className="mt-4 space-y-2">
              {(starter.commands ?? ["help", "run checks"]).map((command) => (
                <div key={command} className="rounded-md border bg-background p-3 font-mono text-xs">
                  {command}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <h2 className="text-lg font-semibold">Live dashboard</h2>
            <div className="mt-4 space-y-3">
              {dashboard.map((item) => (
                <div key={item} className="flex items-center justify-between rounded-md border p-3 text-sm">
                  <span>{item}</span>
                  <span className="h-2 w-2 rounded-full bg-primary" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <h2 className="text-lg font-semibold">Session trace</h2>
            <div className="mt-3 text-sm text-muted-foreground">
              {steps.length ? steps.join(" -> ") : "Terminal commands will appear here."}
            </div>
            <Button className="mt-4 w-full" onClick={() => saveSession("completed")} disabled={isPending}>
              Mark lab practiced
            </Button>
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}
