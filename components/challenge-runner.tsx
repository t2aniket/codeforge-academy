"use client";

import { useState } from "react";
import { CodeEditor } from "@/components/labs/code-editor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Challenge } from "@/lib/types";

export function ChallengeRunner({ challenges }: { challenges: Challenge[] }) {
  const [selected, setSelected] = useState(challenges[0]);
  const [code, setCode] = useState(challenges[0]?.starterCode ?? "");
  const [result, setResult] = useState("Run tests to see feedback.");

  function choose(challenge: Challenge) {
    setSelected(challenge);
    setCode(challenge.starterCode);
    setResult("Run tests to see feedback.");
  }

  function runTests() {
    try {
      if (selected.category === "SQL") {
        const pass = /where\s+xp\s*>=\s*500/i.test(code) && /order\s+by\s+xp\s+desc/i.test(code);
        setResult(pass ? "PASS all SQL checks" : "FAIL expected xp filter and descending order");
        return;
      }
      const module = { exports: undefined as unknown };
      new Function("module", code)(module);
      const fn = module.exports as (...args: unknown[]) => unknown;
      const expect = (received: unknown) => ({
        toBe(expected: unknown) {
          if (received !== expected) throw new Error(`Expected ${expected}, received ${received}`);
        }
      });
      new Function("fn", "expect", selected.tests)(fn, expect);
      setResult("PASS all tests");
    } catch (error) {
      setResult(error instanceof Error ? `FAIL ${error.message}` : "FAIL tests did not pass");
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      <div className="space-y-3">
        {challenges.map((challenge) => (
          <button
            key={challenge.id}
            onClick={() => choose(challenge)}
            className={`w-full rounded-md border p-4 text-left transition hover:bg-muted ${selected.id === challenge.id ? "border-primary bg-primary/10" : "bg-card"}`}
          >
            <div className="font-semibold">{challenge.title}</div>
            <div className="mt-2 flex gap-2">
              <Badge>{challenge.difficulty}</Badge>
              <Badge>{challenge.category}</Badge>
            </div>
          </button>
        ))}
      </div>
      <Card>
        <CardContent className="space-y-5 p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-2xl font-semibold">{selected.title}</h2>
              <p className="mt-2 text-muted-foreground">{selected.prompt}</p>
            </div>
            <Button onClick={runTests}>Run tests</Button>
          </div>
          <CodeEditor value={code} language={selected.category === "SQL" ? "sql" : "javascript"} onChange={setCode} />
          <div className="grid gap-4 md:grid-cols-2">
            <pre className="min-h-[140px] whitespace-pre-wrap rounded-md border bg-muted p-4 text-sm">{selected.tests}</pre>
            <pre className="min-h-[140px] whitespace-pre-wrap rounded-md bg-slate-950 p-4 text-sm text-slate-100">{result}</pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
