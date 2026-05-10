"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { saveChallengeSubmissionAction } from "@/app/actions/challenges";
import { CodeEditor } from "@/components/labs/code-editor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { executeLabCode } from "@/lib/labs/runtime-adapters";
import { browserLanguages, type LabLanguage } from "@/lib/labs/registry";
import type { Challenge } from "@/lib/types";

const runnableLanguages = new Set(["javascript", "typescript", "python", "sql"]);
const languageTabs = ["All", "JavaScript", "TypeScript", "Python", "SQL", "Interview"];

export function ChallengeRunner({ challenges }: { challenges: Challenge[] }) {
  const [track, setTrack] = useState("All");
  const filtered = useMemo(() => filterChallenges(challenges, track), [challenges, track]);
  const [selectedId, setSelectedId] = useState(challenges[0]?.id);
  const selected = filtered.find((challenge) => challenge.id === selectedId) ?? filtered[0] ?? challenges[0];
  const [language, setLanguage] = useState(selected?.language ?? "javascript");
  const [code, setCode] = useState(selected?.starterCode ?? "");
  const [result, setResult] = useState("Run sample tests to see feedback.");
  const [resultTab, setResultTab] = useState<"cases" | "output">("cases");
  const [isPending, startTransition] = useTransition();

  const activeLanguage = browserLanguages.find((item) => item.id === language) ?? browserLanguages[0];
  const availableLanguages = browserLanguages.filter((item) =>
    ["javascript", "typescript", "python", "sql", "java", "cpp", "rust", "go"].includes(item.id)
  );
  const cases = selected.testCases ?? [];

  function choose(challenge: Challenge) {
    const nextLanguage = challenge.language ?? "javascript";
    setSelectedId(challenge.id);
    setLanguage(nextLanguage);
    setCode(getChallengeStarter(challenge, nextLanguage));
    setResult("Run sample tests to see feedback.");
    setResultTab("cases");
  }

  function changeLanguage(nextLanguage: string) {
    setLanguage(nextLanguage);
    setCode(getChallengeStarter(selected, nextLanguage));
    setResult(runnableLanguages.has(nextLanguage) ? "Run sample tests to see feedback." : "This language is editor-ready; live tests need its browser compiler adapter.");
    setResultTab("cases");
  }

  function persist(passed: boolean, output: string) {
    startTransition(async () => {
      const response = await saveChallengeSubmissionAction({
        challengeId: selected.id,
        code,
        passed,
        output,
        xp: selected.difficulty === "Advanced" ? 220 : selected.difficulty === "Intermediate" ? 160 : 100
      });
      if (response.ok) toast.success(response.message);
      else toast.error(response.message);
    });
  }

  async function runTests() {
    if (!runnableLanguages.has(language)) {
      const output = `${activeLanguage.label} test runner is adapter-ready. Use JavaScript, TypeScript, Python, or SQL for live browser tests right now.`;
      setResult(output);
      setResultTab("output");
      persist(false, output);
      return;
    }

    try {
      const output = language === "sql"
        ? runSqlChecks(selected, code)
        : language === "python"
          ? await runPythonCases(selected, code, activeLanguage)
          : runJavaScriptCases(selected, code, language);

      setResult(output);
      setResultTab("output");
      persist(output.startsWith("PASS"), output);
    } catch (error) {
      const output = error instanceof Error ? `FAIL ${error.message}` : "FAIL tests did not pass";
      setResult(output);
      setResultTab("output");
      persist(false, output);
    }
  }

  return (
    <div className="overflow-hidden rounded-md border bg-card">
      <div className="flex items-center gap-2 overflow-x-auto border-b bg-muted/50 px-3 py-2">
        {languageTabs.map((item) => (
          <Button
            key={item}
            size="sm"
            variant={track === item ? "default" : "outline"}
            onClick={() => {
              const nextFiltered = filterChallenges(challenges, item);
              setTrack(item);
              if (nextFiltered[0]) choose(nextFiltered[0]);
            }}
          >
            {item}
          </Button>
        ))}
      </div>

      <div className="grid min-h-[760px] lg:h-[calc(100vh-185px)] lg:min-h-[640px] lg:grid-cols-[280px_minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <aside className="border-b bg-muted/20 lg:border-b-0 lg:border-r">
          <div className="border-b p-3">
            <div className="text-xs font-semibold uppercase text-muted-foreground">Question list</div>
          </div>
          <div className="max-h-[260px] space-y-2 overflow-auto p-3 lg:max-h-none">
            {filtered.map((challenge, index) => (
              <button
                key={challenge.id}
                onClick={() => choose(challenge)}
                className={`w-full rounded-md border p-3 text-left transition hover:bg-muted ${selected.id === challenge.id ? "border-primary bg-primary/10" : "bg-background"}`}
              >
                <div className="flex items-start gap-2">
                  <span className="text-xs text-muted-foreground">Q{index + 1}</span>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold">{challenge.title}</div>
                    <div className="mt-2 flex flex-wrap gap-1">
                      <Badge className="text-[10px]">{challenge.language ?? "js"}</Badge>
                      <Badge className="bg-muted text-[10px] text-foreground">{challenge.difficulty}</Badge>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </aside>

        <section className="border-b lg:border-b-0 lg:border-r">
          <div className="h-full overflow-auto p-5">
            <div className="flex flex-wrap gap-2">
              <Badge className="border-primary/30 bg-primary/10 text-primary">{selected.track ?? selected.category}</Badge>
              <Badge>{selected.kind === "interview" ? "Interview" : "Practice"}</Badge>
              <Badge className="bg-muted text-foreground">{selected.difficulty}</Badge>
            </div>
            <h2 className="mt-4 text-2xl font-bold">{selected.title}</h2>
            <p className="mt-4 leading-7 text-muted-foreground">{selected.prompt}</p>

            <div className="mt-6 space-y-3">
              <h3 className="font-semibold">Examples</h3>
              {cases.length ? cases.slice(0, 3).map((testCase, index) => (
                <div key={index} className="rounded-md border bg-background p-3 text-sm">
                  <div className="font-mono text-xs text-muted-foreground">Example {index + 1}</div>
                  <div className="mt-2 font-mono">Input: {format(testCase.input)}</div>
                  <div className="mt-1 font-mono">Expected: {format(testCase.expected)}</div>
                </div>
              )) : (
                <pre className="rounded-md border bg-background p-3 text-sm">{selected.tests}</pre>
              )}
            </div>

            <div className="mt-6 rounded-md border bg-muted/30 p-3">
              <h3 className="font-semibold">Code contract</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Implement <span className="font-mono text-foreground">{selected.functionName ?? "solve"}</span>. Run sample tests first, then submit to save XP.
              </p>
            </div>
          </div>
        </section>

        <section className="flex min-h-[620px] flex-col lg:min-h-0">
          <div className="flex items-center gap-2 overflow-x-auto border-b bg-background px-3 py-2">
            <select className="h-9 rounded-md border bg-background px-3 text-sm" value={language} onChange={(event) => changeLanguage(event.target.value)}>
              {availableLanguages.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
            </select>
            <Button size="sm" variant="outline" onClick={() => setCode(getChallengeStarter(selected, language))}>Reset</Button>
            <Button size="sm" onClick={runTests} disabled={isPending}>{isPending ? "Saving..." : "Run"}</Button>
            <Button size="sm" onClick={runTests} disabled={isPending}>Submit</Button>
          </div>

          <div className="h-[360px] min-h-0 border-b lg:flex-1">
            <CodeEditor value={code} language={language} onChange={setCode} height="100%" />
          </div>

          <div className="min-h-[250px] bg-background">
            <div className="grid grid-cols-2 border-b text-sm">
              <button className={`px-3 py-2 ${resultTab === "cases" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`} onClick={() => setResultTab("cases")}>Test cases</button>
              <button className={`px-3 py-2 ${resultTab === "output" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`} onClick={() => setResultTab("output")}>Output</button>
            </div>
            <div className="max-h-[260px] overflow-auto p-3">
              {resultTab === "cases" ? (
                <div className="space-y-2">
                  {(cases.length ? cases : [{ input: [selected.tests], expected: "See prompt" }]).map((testCase, index) => (
                    <div key={index} className="rounded-md border bg-muted/30 p-3 text-sm">
                      <div className="font-semibold">Case {index + 1}</div>
                      <div className="mt-2 font-mono text-xs">Input: {format(testCase.input)}</div>
                      <div className="mt-1 font-mono text-xs">Expected: {format(testCase.expected)}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <pre className="min-h-[180px] whitespace-pre-wrap rounded-md bg-slate-950 p-4 text-sm text-slate-100">{result}</pre>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function filterChallenges(challenges: Challenge[], track: string) {
  if (track === "All") return challenges;
  if (track === "Interview") return challenges.filter((challenge) => challenge.kind === "interview" || challenge.track === "Interview");
  return challenges.filter((challenge) => (challenge.track ?? challenge.category).toLowerCase().includes(track.toLowerCase()) || challenge.language === track.toLowerCase());
}

function getChallengeStarter(challenge: Challenge, language: string) {
  if (language === (challenge.language ?? "javascript")) return challenge.starterCode;
  const name = challenge.functionName ?? "solve";

  if (language === "javascript") return `function ${name}(...args) {\n  // write your solution\n  return null;\n}\n\nmodule.exports = ${name};`;
  if (language === "typescript") return `function ${name}(...args: unknown[]): unknown {\n  // write your solution\n  return null;\n}\n\nmodule.exports = ${name};`;
  if (language === "python") return `def ${name}(*args):\n    # write your solution\n    return None\n`;
  if (language === "sql") return challenge.category === "SQL" ? challenge.starterCode : "-- SQL practice is best for database challenges.\nselect 1;";
  if (language === "java") return `class Solution {\n  public static Object ${name}(Object... args) {\n    return null;\n  }\n}`;
  if (language === "cpp") return "#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n  return 0;\n}\n";
  if (language === "rust") return "fn main() {\n    println!(\"Implement solve here\");\n}\n";
  if (language === "go") return "package main\n\nimport \"fmt\"\n\nfunc main() {\n  fmt.Println(\"Implement solve here\")\n}\n";
  return challenge.starterCode;
}

function runJavaScriptCases(challenge: Challenge, code: string, language: string) {
  const module = { exports: undefined as unknown };
  const executable = language === "typescript" ? stripTypeScriptSyntax(code) : code;
  new Function("module", executable)(module);
  const fn = module.exports as (...args: unknown[]) => unknown;
  if (typeof fn !== "function") throw new Error("Export your solution with module.exports = solve;");

  const lines = (challenge.testCases ?? []).map((testCase, index) => {
    const received = fn(...testCase.input);
    const pass = deepEqual(received, testCase.expected);
    return `${pass ? "PASS" : "FAIL"} case ${index + 1}: expected ${format(testCase.expected)}, received ${format(received)}`;
  });
  return lines.every((line) => line.startsWith("PASS")) ? `PASS all tests\n${lines.join("\n")}` : `FAIL some tests\n${lines.join("\n")}`;
}

async function runPythonCases(challenge: Challenge, code: string, language: LabLanguage) {
  const cases = JSON.stringify(challenge.testCases ?? []);
  const runner = `${code}\n\nimport json\n_cases = json.loads(${JSON.stringify(cases)})\n_lines = []\nfor index, case in enumerate(_cases):\n    received = ${challenge.functionName ?? "solve"}(*case['input'])\n    expected = case['expected']\n    ok = received == expected\n    _lines.append(('PASS' if ok else 'FAIL') + f\" case {index + 1}: expected {expected!r}, received {received!r}\")\nprint(('PASS all tests' if all(line.startswith('PASS') for line in _lines) else 'FAIL some tests'))\nprint('\\n'.join(_lines))\n`;
  const result = await executeLabCode({ language, version: language.versions[0], code: runner });
  return result.stdout.trim();
}

function runSqlChecks(challenge: Challenge, code: string) {
  const normalized = code.replace(/\s+/g, " ").toLowerCase();
  const isTopLearners = challenge.slug === "top-sql-learners";
  const pass = isTopLearners
    ? normalized.includes("name") && normalized.includes("xp") && /where .*xp\s*>=\s*500/.test(normalized) && /order by .*xp\s+desc/.test(normalized)
    : normalized.includes("lesson_id") && normalized.includes("xp_earned") && /where .*completed\s*=\s*true/.test(normalized) && /order by .*completed_at\s+desc/.test(normalized);
  return pass ? "PASS all SQL checks" : `FAIL SQL checks\n${challenge.tests}`;
}

function stripTypeScriptSyntax(code: string) {
  return code
    .replace(/:\s*[A-Za-z0-9_<>\[\]\|'" ]+(?=\s*[=,)])/g, "")
    .replace(/\s+as\s+[A-Za-z0-9_<>\[\]\|'" ]+/g, "");
}

function deepEqual(left: unknown, right: unknown) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function format(value: unknown) {
  return JSON.stringify(value);
}
