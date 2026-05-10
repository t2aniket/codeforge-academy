"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { saveLabSessionAction } from "@/app/actions/labs";
import { CodeEditor } from "@/components/labs/code-editor";
import { SimulatedTerminal } from "@/components/labs/simulated-terminal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { executeLabCode, extractRuntimeVariables, getLanguageStarter } from "@/lib/labs/runtime-adapters";
import type { LabDefinition } from "@/lib/labs/registry";
import { getRuntimeCapability } from "@/lib/labs/runtime-capabilities";
import type { LabStarter } from "@/lib/types";

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
    const id = window.setInterval(() => {
      saveSession("active", true);
    }, 3000);
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
  const activeLanguage = definition.languages.find((item) => item.id === language);
  const runtimeCapability = getRuntimeCapability(activeLanguage);

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
      toast.success("Execution complete");
    } catch (error) {
      setStdout("");
      setStderr(error instanceof Error ? error.message : "Execution failed");
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
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Badge className="border-primary/30 bg-primary/10 text-primary">{definition.accent}</Badge>
            <h1 className="mt-3 text-4xl font-black">{starter.title}</h1>
            <p className="mt-2 max-w-3xl text-muted-foreground">{starter.description}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              className="h-10 rounded-md border bg-background px-3 text-sm"
              value={language}
              onChange={(event) => {
                const nextLanguage = event.target.value;
                setLanguage(nextLanguage);
                setVersion(definition.languages.find((item) => item.id === nextLanguage)?.versions[0] ?? "default");
              }}
            >
              {definition.languages.map((item) => (
                <option key={item.id} value={item.id}>{item.label}</option>
              ))}
            </select>
            <select
              className="h-10 rounded-md border bg-background px-3 text-sm"
              value={version}
              onChange={(event) => setVersion(event.target.value)}
            >
              {(definition.languages.find((item) => item.id === language)?.versions ?? [version]).map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
            <Button variant="outline" onClick={resetStarter}>Reset</Button>
            <Button variant="outline" onClick={loadLanguageStarter}>Load starter</Button>
            <Button variant="outline" onClick={() => saveSession("active")} disabled={isPending}>
              Save session
            </Button>
            <Button onClick={runCode}>Run</Button>
          </div>
        </div>
        <div className="rounded-md border bg-card px-3 py-2 text-sm text-muted-foreground">
          Editing <span className="font-mono text-foreground">{fileName}</span>
          {starterOverride && <span> from linked lesson starter</span>}
          <span className="ml-2 inline-flex rounded-sm border px-2 py-0.5 text-xs text-foreground">
            {runtimeCapability.label}
          </span>
        </div>
        <CodeEditor value={code} language={language} onChange={setCode} onMount={handleEditorMount} />
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
                {stdout}
              </pre>
              {stderr && (
                <pre className="mt-3 whitespace-pre-wrap rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                  {stderr}
                </pre>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      <aside className="space-y-4">
        <Card>
          <CardContent className="p-5">
            <h2 className="text-lg font-semibold">Runtime capability</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{runtimeCapability.description}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <h2 className="text-lg font-semibold">Debug toolbar</h2>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Button size="sm" onClick={runCode}>Run</Button>
              <Button size="sm" variant="outline" onClick={debugStart}>Debug</Button>
              <Button size="sm" variant="outline" onClick={() => debugStep("over")}>Step Over</Button>
              <Button size="sm" variant="outline" onClick={() => debugStep("into")}>Step Into</Button>
              <Button size="sm" variant="outline" onClick={() => debugStep("out")}>Step Out</Button>
              <Button size="sm" variant="outline" onClick={() => debugStep("continue")}>Continue</Button>
              <Button size="sm" variant="outline" onClick={() => debugStep("pause")}>Pause</Button>
              <Button size="sm" variant="outline" onClick={() => debugStep("restart")}>Restart</Button>
              <Button size="sm" variant="destructive" onClick={() => debugStep("stop")}>Stop</Button>
            </div>
            <div className="mt-3 text-sm text-muted-foreground">
              Current line: {currentLine ?? "not debugging"} | Breakpoints: {breakpoints.length ? breakpoints.join(", ") : "none"}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <h2 className="text-lg font-semibold">Variables and watch</h2>
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
            <div className="mt-3 rounded-md bg-muted p-3 text-sm">
              Watch: <span className="font-mono">{watchExpression}</span>
            </div>
          </CardContent>
        </Card>
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
            <div className="mt-4 space-y-1 text-xs text-muted-foreground">
              {executionLog.map((item) => (
                <div key={item}>{item}</div>
              ))}
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
