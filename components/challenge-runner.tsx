"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { saveChallengeSubmissionAction } from "@/app/actions/challenges";
import { CodeEditor } from "@/components/labs/code-editor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  const defaultLanguage = selected?.language ?? "javascript";
  const [language, setLanguage] = useState(defaultLanguage);
  const [code, setCode] = useState(selected?.starterCode ?? "");
  const [result, setResult] = useState("Run tests to see feedback.");
  const [isPending, startTransition] = useTransition();

  const activeLanguage = browserLanguages.find((item) => item.id === language) ?? browserLanguages[0];
  const availableLanguages = browserLanguages.filter((item) =>
    ["javascript", "typescript", "python", "sql", "java", "cpp", "rust", "go"].includes(item.id)
  );

  function choose(challenge: Challenge) {
    const nextLanguage = challenge.language ?? "javascript";
    setSelectedId(challenge.id);
    setLanguage(nextLanguage);
    setCode(getChallengeStarter(challenge, nextLanguage));
    setResult("Run tests to see feedback.");
  }

  function changeLanguage(nextLanguage: string) {
    setLanguage(nextLanguage);
    setCode(getChallengeStarter(selected, nextLanguage));
    setResult(runnableLanguages.has(nextLanguage) ? "Run tests to see feedback." : "This language is ready for editor practice; test execution needs its browser compiler adapter.");
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
      persist(output.startsWith("PASS"), output);
    } catch (error) {
      const output = error instanceof Error ? `FAIL ${error.message}` : "FAIL tests did not pass";
      setResult(output);
      persist(false, output);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {languageTabs.map((item) => (
          <Button
            key={item}
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

      <div className="grid gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
        <div className="space-y-3 lg:max-h-[calc(100vh-180px)] lg:overflow-auto lg:pr-2">
          {filtered.map((challenge) => (
            <button
              key={challenge.id}
              onClick={() => choose(challenge)}
              className={`w-full rounded-md border p-4 text-left transition hover:bg-muted ${selected.id === challenge.id ? "border-primary bg-primary/10" : "bg-card"}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="font-semibold">{challenge.title}</div>
                <Badge>{challenge.language ?? "js"}</Badge>
              </div>
              <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{challenge.prompt}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge className="bg-muted text-foreground">{challenge.difficulty}</Badge>
                <Badge className="bg-muted text-foreground">{challenge.track ?? challenge.category}</Badge>
                {challenge.kind === "interview" && <Badge>Interview</Badge>}
              </div>
            </button>
          ))}
        </div>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          <Card>
            <CardContent className="space-y-5 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap gap-2">
                    <Badge className="border-primary/30 bg-primary/10 text-primary">{selected.track ?? selected.category}</Badge>
                    <Badge>{selected.difficulty}</Badge>
                  </div>
                  <h2 className="mt-3 text-2xl font-semibold">{selected.title}</h2>
                  <p className="mt-2 text-muted-foreground">{selected.prompt}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <select
                    className="h-10 rounded-md border bg-background px-3 text-sm"
                    value={language}
                    onChange={(event) => changeLanguage(event.target.value)}
                  >
                    {availableLanguages.map((item) => (
                      <option key={item.id} value={item.id}>{item.label}</option>
                    ))}
                  </select>
                  <Button onClick={runTests} disabled={isPending}>{isPending ? "Saving..." : "Run tests"}</Button>
                </div>
              </div>
              <CodeEditor value={code} language={language} onChange={setCode} />
            </CardContent>
          </Card>

          <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-semibold">Test result</h3>
                  <Button size="sm" onClick={runTests} disabled={isPending}>Run</Button>
                </div>
                <pre className="mt-4 max-h-[260px] min-h-[180px] overflow-auto whitespace-pre-wrap rounded-md bg-slate-950 p-4 text-sm text-slate-100">{result}</pre>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <h3 className="font-semibold">Visible tests</h3>
                <pre className="mt-4 max-h-[260px] overflow-auto whitespace-pre-wrap rounded-md border bg-muted p-4 text-sm">{selected.tests}</pre>
              </CardContent>
            </Card>
          </aside>
        </div>
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

  if (language === "javascript") {
    return `function ${name}(...args) {\n  // write your solution\n  return null;\n}\n\nmodule.exports = ${name};`;
  }
  if (language === "typescript") {
    return `function ${name}(...args: unknown[]): unknown {\n  // write your solution\n  return null;\n}\n\nmodule.exports = ${name};`;
  }
  if (language === "python") {
    return `def ${name}(*args):\n    # write your solution\n    return None\n`;
  }
  if (language === "sql") {
    return challenge.category === "SQL" ? challenge.starterCode : "-- SQL practice is best for database challenges.\nselect 1;";
  }
  if (language === "java") {
    return `class Solution {\n  public static Object ${name}(Object... args) {\n    return null;\n  }\n}`;
  }
  if (language === "cpp") {
    return "#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n  return 0;\n}\n";
  }
  if (language === "rust") {
    return "fn main() {\n    println!(\"Implement solve here\");\n}\n";
  }
  if (language === "go") {
    return "package main\n\nimport \"fmt\"\n\nfunc main() {\n  fmt.Println(\"Implement solve here\")\n}\n";
  }
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
