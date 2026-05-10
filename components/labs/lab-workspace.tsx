"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { saveLabSessionAction } from "@/app/actions/labs";
import { CodeEditor } from "@/components/labs/code-editor";
import { SimulatedTerminal } from "@/components/labs/simulated-terminal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { executeLabCode, extractRuntimeVariables, getLanguageStarter } from "@/lib/labs/runtime-adapters";
import type { LabDefinition } from "@/lib/labs/registry";
import { getRuntimeCapability } from "@/lib/labs/runtime-capabilities";
import type { LabStarter } from "@/lib/types";

type PanelTab = "output" | "terminal" | "debug" | "guide";

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
  const defaultLanguage = starter.language ?? definition.languages[0]?.id ?? "javascript";
  const defaultVersion = definition.languages.find((item) => item.id === defaultLanguage)?.versions[0] ?? "default";
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);
  const decorationsRef = useRef<string[]>([]);
  const [fileName, setFileName] = useState(initialFile[0]);
  const [code, setCode] = useState(initialFile[1]);
  const [language, setLanguage] = useState(defaultLanguage);
  const [version, setVersion] = useState(defaultVersion);
  const [stdout, setStdout] = useState("Output appears here after you run code or checks.");
  const [stderr, setStderr] = useState("");
  const [executionLog, setExecutionLog] = useState<string[]>([]);
  const [steps, setSteps] = useState<string[]>([]);
  const [breakpoints, setBreakpoints] = useState<number[]>([]);
  const [currentLine, setCurrentLine] = useState<number | null>(null);
  const [variables, setVariables] = useState<Array<{ name: string; value: string; scope: string }>>([]);
  const [watchExpression, setWatchExpression] = useState("xp");
  const [panelTab, setPanelTab] = useState<PanelTab>("output");
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
          version?: string;
          stdout?: string;
          stderr?: string;
          executionLog?: string[];
          steps?: string[];
          breakpoints?: number[];
        };
        setFileName(parsed.fileName ?? nextFile[0]);
        setCode(parsed.code ?? nextFile[1]);
        setLanguage(parsed.language ?? defaultLanguage);
        setVersion(parsed.version ?? defaultVersion);
        setStdout(parsed.stdout ?? "Output appears here after you run code or checks.");
        setStderr(parsed.stderr ?? "");
        setExecutionLog(parsed.executionLog ?? []);
        setSteps(parsed.steps ?? []);
        setBreakpoints(parsed.breakpoints ?? []);
        return;
      } catch {
        localStorage.removeItem(storageKey);
      }
    }

    setFileName(nextFile[0]);
    setCode(nextFile[1]);
    setLanguage(defaultLanguage);
    setVersion(defaultVersion);
    setStdout("Output appears here after you run code or checks.");
    setStderr("");
    setExecutionLog([]);
    setSteps([]);
    setBreakpoints([]);
  }, [definition.id, starter, storageKey, defaultLanguage, defaultVersion]);

  useEffect(() => {
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    if (!editor || !monaco) return;

    const breakpointDecorations = breakpoints.map((line) => ({
      range: new monaco.Range(line, 1, line, 1),
      options: {
        isWholeLine: true,
        glyphMarginClassName: "bg-primary rounded-full",
        glyphMarginHoverMessage: { value: `Breakpoint on line ${line}` }
      }
    }));
    const lineDecoration = currentLine
      ? [{
          range: new monaco.Range(currentLine, 1, currentLine, 1),
          options: { isWholeLine: true, className: "bg-primary/15" }
        }]
      : [];

    decorationsRef.current = editor.deltaDecorations(decorationsRef.current, [
      ...breakpointDecorations,
      ...lineDecoration
    ]);
  }, [breakpoints, currentLine]);

  useEffect(() => {
    const id = window.setInterval(() => saveSession("active", true), 3000);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, language, version, steps, breakpoints]);

  const dashboard = useMemo(() => {
    if (definition.id === "network") return ["Router R1: online", "Switch SW1: online", "G0/1: pending"];
    if (definition.id === "docker") return ["Image: codeforge-api", "Port: 8080", "Health: pending"];
    if (definition.id === "sql") return ["Table learners: 5 rows", "Table courses: 12 rows", "Index xp_idx: ready"];
    if (definition.id === "testing") return ["Pytest: ready", "Playwright: ready", "Cypress: ready"];
    return ["Workspace mounted", "Runtime isolated", "Progress autosaved"];
  }, [definition.id]);
  const labScene = useMemo(() => getLabScene(definition.id), [definition.id]);

  const activeLanguage = definition.languages.find((item) => item.id === language);
  const runtimeCapability = getRuntimeCapability(activeLanguage);
  const nextStep = currentLine
    ? `Debugger paused on line ${currentLine}. Continue stepping or run the program.`
    : starter.challenge ?? "Run the starter, inspect the output, then complete the lab.";

  function changeLanguage(nextLanguage: string) {
    const nextVersion = definition.languages.find((item) => item.id === nextLanguage)?.versions[0] ?? "default";
    const starterSnippet = getLanguageStarter(nextLanguage);
    setLanguage(nextLanguage);
    setVersion(nextVersion);
    setFileName(starterSnippet.fileName);
    setCode(starterSnippet.code);
    setStdout("Output appears here after you run code or checks.");
    setStderr("");
    setExecutionLog((items) => [`switched to ${nextLanguage}`, ...items].slice(0, 8));
    setVariables([]);
    setCurrentLine(null);
    setPanelTab("output");
  }

  async function runCode() {
    try {
      if (!activeLanguage) throw new Error("No runtime is registered for this language.");
      if (language === "python") setStdout("Loading Pyodide runtime...");

      const result = await executeLabCode({
        language: activeLanguage,
        version,
        code,
        commands: definition.commands
      });
      setStdout(result.stdout);
      setStderr(result.stderr);
      setExecutionLog((items) => [...result.logs, ...items].slice(0, 8));
      setVariables(result.variables);
      setCurrentLine(null);
      setPanelTab("output");
      toast.success("Execution complete");
    } catch (error) {
      setStdout("");
      setStderr(error instanceof Error ? error.message : "Execution failed");
      setPanelTab("output");
      toast.error("Execution failed");
    }
  }

  function saveSession(status: "active" | "completed" = "active", silent = false) {
    const session = {
      fileName,
      code,
      language,
      version,
      stdout,
      stderr,
      executionLog,
      steps,
      breakpoints,
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
      if (!silent) {
        if (result.ok) toast.success(result.message);
        else toast.error(result.message);
      }
    });
  }

  function resetStarter() {
    const nextFile = firstStarterFile(starter);
    localStorage.removeItem(storageKey);
    setFileName(nextFile[0]);
    setCode(nextFile[1]);
    setLanguage(defaultLanguage);
    setVersion(defaultVersion);
    setStdout("Output appears here after you run code or checks.");
    setStderr("");
    setExecutionLog([]);
    setSteps([]);
    setBreakpoints([]);
    setCurrentLine(null);
    setPanelTab("output");
    toast.success("Starter restored.");
  }

  function loadLanguageStarter() {
    const starterSnippet = getLanguageStarter(language);
    setFileName(starterSnippet.fileName);
    setCode(starterSnippet.code);
    setStdout("Output appears here after you run code or checks.");
    setStderr("");
    setExecutionLog((items) => [`loaded ${language} starter`, ...items].slice(0, 8));
    setVariables([]);
    setCurrentLine(null);
    setPanelTab("output");
    toast.success(`${activeLanguage?.label ?? "Language"} starter loaded.`);
  }

  function handleEditorMount(editor: unknown, monaco: unknown) {
    editorRef.current = editor;
    monacoRef.current = monaco;
    const typedEditor = editor as {
      onMouseDown: (handler: (event: any) => void) => void;
    };
    typedEditor.onMouseDown((event) => {
      const line = event.target?.position?.lineNumber;
      const targetType = event.target?.type;
      if (!line || targetType !== 2) return;
      setBreakpoints((items) =>
        items.includes(line) ? items.filter((item) => item !== line) : [...items, line].sort((a, b) => a - b)
      );
    });
  }

  function debugStart() {
    const firstExecutableLine = code.split("\n").findIndex((line) => line.trim() && !line.trim().startsWith("//")) + 1;
    setCurrentLine(firstExecutableLine || 1);
    setVariables(extractRuntimeVariables(code));
    setPanelTab("debug");
    setExecutionLog((items) => ["debug start", ...items].slice(0, 8));
  }

  function debugStep(direction: "over" | "into" | "out" | "continue" | "pause" | "restart" | "stop") {
    if (direction === "stop") {
      setCurrentLine(null);
      setExecutionLog((items) => ["debug stop", ...items].slice(0, 8));
      return;
    }
    if (direction === "restart") {
      debugStart();
      return;
    }
    if (direction === "continue") {
      const nextBreakpoint = breakpoints.find((line) => line > (currentLine ?? 0));
      setCurrentLine(nextBreakpoint ?? null);
      setExecutionLog((items) => ["debug continue", ...items].slice(0, 8));
      return;
    }
    if (direction === "pause") {
      setExecutionLog((items) => ["debug pause", ...items].slice(0, 8));
      return;
    }
    setCurrentLine((line) => Math.min((line ?? 1) + 1, code.split("\n").length));
    setExecutionLog((items) => [`step ${direction}`, ...items].slice(0, 8));
  }

  return (
    <div>
      <section className="overflow-hidden rounded-md border bg-card shadow-sm">
        <div className="flex items-center gap-3 overflow-x-auto border-b bg-muted/50 px-3 py-2">
          <div className="flex min-w-0 shrink-0 items-center gap-2">
            <Badge className="border-primary/30 bg-primary/10 text-primary">{definition.accent}</Badge>
            <span className="max-w-[240px] truncate text-sm font-semibold">{starter.title}</span>
            <span className="rounded-sm border bg-background px-2 py-1 font-mono text-xs text-foreground">{fileName}</span>
            <span className="rounded-sm border px-2 py-1 text-xs text-muted-foreground">{runtimeCapability.label}</span>
          </div>
          <div className="ml-auto flex shrink-0 items-center gap-2">
            <select className="h-9 rounded-md border bg-background px-3 text-sm" value={language} onChange={(event) => changeLanguage(event.target.value)}>
              {definition.languages.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
            </select>
            <select className="h-9 rounded-md border bg-background px-3 text-sm" value={version} onChange={(event) => setVersion(event.target.value)}>
              {(definition.languages.find((item) => item.id === language)?.versions ?? [version]).map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
            <Button size="sm" variant="outline" onClick={resetStarter}>Reset</Button>
            <Button size="sm" variant="outline" onClick={loadLanguageStarter}>Starter</Button>
            <Button size="sm" variant="outline" onClick={() => saveSession("active")} disabled={isPending}>Save</Button>
            <Button size="sm" variant="outline" onClick={() => saveSession("completed")} disabled={isPending}>Complete</Button>
            <Button size="sm" onClick={runCode}>Run</Button>
          </div>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto border-b bg-background px-3 py-2">
          <span className="shrink-0 max-w-[360px] truncate text-xs text-muted-foreground">{nextStep}</span>
          <Button className="shrink-0" size="sm" variant="outline" onClick={debugStart}>Debug</Button>
          <Button className="shrink-0" size="sm" variant="outline" onClick={() => debugStep("over")}>Step Over</Button>
          <Button className="shrink-0" size="sm" variant="outline" onClick={() => debugStep("into")}>Step Into</Button>
          <Button className="shrink-0" size="sm" variant="outline" onClick={() => debugStep("out")}>Step Out</Button>
          <Button className="shrink-0" size="sm" variant="outline" onClick={() => debugStep("continue")}>Continue</Button>
          <Button className="shrink-0" size="sm" variant="outline" onClick={() => debugStep("restart")}>Restart</Button>
          <Button className="shrink-0" size="sm" variant="destructive" onClick={() => debugStep("stop")}>Stop</Button>
          <span className="ml-auto shrink-0 text-xs text-muted-foreground">
            Line {currentLine ?? "-"} · Breakpoints {breakpoints.length ? breakpoints.join(", ") : "none"}
          </span>
        </div>

        <div className="grid min-h-[720px] lg:h-[calc(100vh-260px)] lg:min-h-[620px] lg:grid-cols-[220px_minmax(0,1fr)_390px]">
          <aside className="order-3 border-b bg-muted/30 lg:order-1 lg:border-b-0 lg:border-r">
            <div className="border-b p-3">
              <div className="text-xs font-semibold uppercase text-muted-foreground">Workspace</div>
              <button className="mt-3 flex w-full items-center justify-between rounded-md border bg-background px-3 py-2 text-left text-sm">
                <span className="truncate font-mono">{fileName}</span>
                <span className="h-2 w-2 rounded-full bg-primary" />
              </button>
            </div>
            <div className="border-b p-3">
              <div className="text-xs font-semibold uppercase text-muted-foreground">Next step</div>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{nextStep}</p>
            </div>
            <div className="border-b p-3">
              <div className="text-xs font-semibold uppercase text-muted-foreground">{labScene.title}</div>
              <div className="mt-3 space-y-2">
                {labScene.items.map((item) => (
                  <div key={item} className="rounded-md border bg-background px-3 py-2 text-xs text-muted-foreground">
                    {item}
                  </div>
                ))}
              </div>
            </div>
            <div className="p-3">
              <div className="text-xs font-semibold uppercase text-muted-foreground">Guide</div>
              <div className="mt-3 space-y-2">
                {(starter.commands ?? ["help", "run checks"]).slice(0, 5).map((command) => (
                  <button
                    key={command}
                    onClick={() => setPanelTab("terminal")}
                    className="block w-full rounded-md border bg-background p-2 text-left font-mono text-xs hover:bg-muted"
                  >
                    {command}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          <main className="order-1 h-[240px] min-w-0 border-b lg:order-2 lg:h-auto lg:border-b-0 lg:border-r">
            <CodeEditor value={code} language={language} onChange={setCode} onMount={handleEditorMount} height="100%" />
          </main>

          <aside className="order-2 flex min-h-[360px] flex-col bg-background lg:order-3 lg:min-h-0">
            <div className="grid grid-cols-4 border-b text-sm">
              {(["output", "terminal", "debug", "guide"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setPanelTab(tab)}
                  className={`px-3 py-2 capitalize transition ${panelTab === tab ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                >
                  {tab}
                </button>
              ))}
            </div>
            <div className="min-h-0 flex-1 overflow-auto p-3">
              {panelTab === "output" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="font-semibold">Runtime output</h2>
                    <Button size="sm" onClick={runCode}>Run</Button>
                  </div>
                  <pre className="min-h-[280px] whitespace-pre-wrap rounded-md bg-slate-950 p-4 text-sm text-slate-100">{stdout}</pre>
                  {stderr && <pre className="whitespace-pre-wrap rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{stderr}</pre>}
                </div>
              )}

              {panelTab === "terminal" && (
                <SimulatedTerminal
                  commands={definition.commands}
                  prompt={definition.id}
                  className="h-[460px]"
                  onCommand={(command) => setSteps((items) => [...items, command])}
                />
              )}

              {panelTab === "debug" && (
                <div className="space-y-4">
                  <section className="rounded-md border p-3">
                    <h2 className="font-semibold">Debugger</h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Current line: {currentLine ?? "not debugging"} · Breakpoints: {breakpoints.length ? breakpoints.join(", ") : "none"}
                    </p>
                  </section>
                  <section className="rounded-md border p-3">
                    <h2 className="font-semibold">Variables and watch</h2>
                    <input
                      className="mt-3 h-10 w-full rounded-md border bg-background px-3 text-sm"
                      value={watchExpression}
                      onChange={(event) => setWatchExpression(event.target.value)}
                      placeholder="Watch expression"
                    />
                    <div className="mt-4 space-y-2">
                      {variables.length ? variables.map((variable) => (
                        <div key={variable.name} className="rounded-md border p-3 text-sm">
                          <div className="font-mono">{variable.name}</div>
                          <div className="text-muted-foreground">{variable.value}</div>
                        </div>
                      )) : <p className="text-sm text-muted-foreground">Run or debug to inspect simple variables.</p>}
                    </div>
                  </section>
                  <section className="rounded-md border p-3">
                    <h2 className="font-semibold">Session trace</h2>
                    <div className="mt-2 text-sm text-muted-foreground">{steps.length ? steps.join(" -> ") : "Terminal commands will appear here."}</div>
                    <div className="mt-3 space-y-1 text-xs text-muted-foreground">{executionLog.map((item) => <div key={item}>{item}</div>)}</div>
                  </section>
                </div>
              )}

              {panelTab === "guide" && (
                <div className="space-y-4">
                  <section className="rounded-md border p-3">
                    <h2 className="font-semibold">Challenge</h2>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{starter.challenge}</p>
                  </section>
                  <section className="rounded-md border p-3">
                    <h2 className="font-semibold">Runtime capability</h2>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{runtimeCapability.description}</p>
                  </section>
                  <section className="rounded-md border p-3">
                    <h2 className="font-semibold">Live dashboard</h2>
                    <div className="mt-3 space-y-2">
                      {dashboard.map((item) => (
                        <div key={item} className="flex items-center justify-between rounded-md border p-2 text-sm">
                          <span>{item}</span>
                          <span className="h-2 w-2 rounded-full bg-primary" />
                        </div>
                      ))}
                    </div>
                  </section>
                  <section className="rounded-md border p-3">
                    <h2 className="font-semibold">{labScene.title}</h2>
                    <div className="mt-3 space-y-2">
                      {labScene.items.map((item) => (
                        <div key={item} className="rounded-md bg-muted p-2 text-sm text-muted-foreground">{item}</div>
                      ))}
                    </div>
                  </section>
                </div>
              )}
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}

function getLabScene(id: string) {
  if (id === "docker") {
    return {
      title: "Container view",
      items: ["Dockerfile -> image layers", "Image: codeforge-api:latest", "Port map: 8080 -> 8080", "Health check pending"]
    };
  }
  if (id === "network") {
    return {
      title: "Topology",
      items: ["PC-A -> SW1 -> R1", "R1 G0/0 up 192.168.1.1/24", "R1 G0/1 down unassigned", "Goal: 10.0.0.1/24"]
    };
  }
  if (id === "linux") {
    return {
      title: "Filesystem",
      items: ["/home/codeforge/workspace", "app/", "logs/api.log", "api.service"]
    };
  }
  if (id === "testing") {
    return {
      title: "Test suite",
      items: ["Pytest unit checks", "Playwright browser flow", "Cypress regression path", "Goal: add coverage"]
    };
  }
  if (id === "sql") {
    return {
      title: "Database",
      items: ["learners(name, xp)", "courses(title, category)", "progress(lesson_id, xp_earned)", "Goal: query precisely"]
    };
  }
  return {
    title: "Playground",
    items: ["Free editor", "Run code", "Inspect output", "Save session"]
  };
}
