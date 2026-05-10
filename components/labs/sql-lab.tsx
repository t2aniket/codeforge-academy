"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { saveLabSessionAction } from "@/app/actions/labs";
import { CodeEditor } from "@/components/labs/code-editor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { LabDefinition } from "@/lib/labs/registry";
import type { LabStarter } from "@/lib/types";

type TableRow = Record<string, string | number | boolean | null>;

const tables: Record<string, TableRow[]> = {
  learners: [
    { id: 1, name: "Maya Chen", xp: 1840, streak: 14, track: "Full Stack" },
    { id: 2, name: "Theo Martins", xp: 970, streak: 5, track: "DevOps" },
    { id: 3, name: "Ava Singh", xp: 620, streak: 3, track: "Databases" },
    { id: 4, name: "Noah Reed", xp: 240, streak: 1, track: "Frontend" },
    { id: 5, name: "Iris Okafor", xp: 510, streak: 8, track: "Testing" }
  ],
  courses: [
    { id: 1, slug: "full-stack-product-engineering", title: "Full-Stack Product Engineering", published: true, xp: 3600 },
    { id: 2, slug: "docker-real-teams", title: "Docker for Real Development Teams", published: true, xp: 1260 },
    { id: 3, slug: "sql-query-schema", title: "SQL Databases from Query to Schema", published: true, xp: 1500 }
  ],
  user_progress: [
    { learner_id: 1, lesson_id: "product-slice-thinking", completed: true, xp_earned: 120 },
    { learner_id: 1, lesson_id: "data-modeling-for-features", completed: true, xp_earned: 120 },
    { learner_id: 2, lesson_id: "container-runtime-thinking", completed: true, xp_earned: 120 },
    { learner_id: 3, lesson_id: "sql-performance-basics", completed: false, xp_earned: 0 }
  ]
};

function normalizeSql(sql: string) {
  return sql.trim().replace(/;$/, "").replace(/\s+/g, " ").toLowerCase();
}

function parseColumns(sql: string, tableName: string) {
  const match = sql.match(/^select\s+(.+?)\s+from\s+/i);
  const raw = match?.[1]?.trim() ?? "*";
  if (raw === "*") return Object.keys(tables[tableName]?.[0] ?? {});
  return raw.split(",").map((column) => column.trim()).filter(Boolean);
}

function executeSql(sql: string) {
  const normalized = normalizeSql(sql);
  const tableName = Object.keys(tables).find((name) => normalized.includes(` from ${name}`));
  if (!normalized.startsWith("select ")) throw new Error("Only SELECT queries are supported in this browser lab.");
  if (!tableName) throw new Error("Unknown table. Try learners, courses, or user_progress.");

  let rows = [...tables[tableName]];
  if (/where\s+xp\s*>=\s*(\d+)/i.test(normalized)) {
    const value = Number(normalized.match(/where\s+xp\s*>=\s*(\d+)/i)?.[1] ?? 0);
    rows = rows.filter((row) => Number(row.xp ?? 0) >= value);
  }
  if (/where\s+completed\s*=\s*true/i.test(normalized)) {
    rows = rows.filter((row) => row.completed === true);
  }
  if (/where\s+published\s*=\s*true/i.test(normalized)) {
    rows = rows.filter((row) => row.published === true);
  }
  if (/order by xp desc/i.test(normalized)) {
    rows.sort((a, b) => Number(b.xp ?? 0) - Number(a.xp ?? 0));
  }
  if (/order by xp_earned desc/i.test(normalized)) {
    rows.sort((a, b) => Number(b.xp_earned ?? 0) - Number(a.xp_earned ?? 0));
  }

  const columns = parseColumns(sql, tableName);
  return rows.map((row) =>
    Object.fromEntries(columns.map((column) => [column, row[column] ?? null]))
  );
}

function validateSql(sql: string) {
  const normalized = normalizeSql(sql);
  const checks = [
    {
      label: "Uses SELECT",
      pass: normalized.startsWith("select ")
    },
    {
      label: "Targets a known table",
      pass: Object.keys(tables).some((name) => normalized.includes(` from ${name}`))
    },
    {
      label: "Filters high-XP learners when applicable",
      pass: !normalized.includes("learners") || /where\s+xp\s*>=\s*500/i.test(normalized)
    },
    {
      label: "Orders XP descending when applicable",
      pass: !normalized.includes("learners") || /order by xp desc/i.test(normalized)
    }
  ];
  return checks;
}

export function SqlLab({
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
  const starterSql = Object.values(starter.files ?? {})[0] ?? "select name, xp from learners where xp >= 500 order by xp desc;";
  const [sql, setSql] = useState(starterSql);
  const [rows, setRows] = useState<TableRow[]>([]);
  const [error, setError] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();
  const checks = useMemo(() => validateSql(sql), [sql]);
  const columns = rows.length ? Object.keys(rows[0]) : [];

  function runQuery() {
    try {
      const result = executeSql(sql);
      setRows(result);
      setError("");
      setHistory((items) => [sql, ...items.filter((item) => item !== sql)].slice(0, 6));
      toast.success(`${result.length} rows returned`);
    } catch (queryError) {
      setRows([]);
      setError(queryError instanceof Error ? queryError.message : "Query failed");
      toast.error("Query failed");
    }
  }

  function saveSession(status: "active" | "completed" = "active") {
    localStorage.setItem(
      `lab-session:sql:${courseId ?? "standalone"}:${lessonId ?? "standalone"}`,
      JSON.stringify({ sql, rows, history, savedAt: new Date().toISOString() })
    );
    startTransition(async () => {
      const result = await saveLabSessionAction({
        lab: "sql",
        courseId,
        lessonId,
        files: { "query.sql": sql },
        terminalHistory: history,
        status
      });
      if (result.ok) toast.success(result.message);
      else toast.error(result.message);
    });
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
            <Button variant="outline" onClick={() => setSql(starterSql)}>Reset</Button>
            <Button variant="outline" onClick={() => saveSession("active")} disabled={isPending}>Save session</Button>
            <Button onClick={runQuery}>Run query</Button>
          </div>
        </div>
        <CodeEditor value={sql} language="sql" onChange={setSql} />
        <Card>
          <CardContent className="p-5">
            <h2 className="text-lg font-semibold">Query result</h2>
            {error ? (
              <div className="mt-4 rounded-md border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
                {error}
              </div>
            ) : rows.length ? (
              <div className="mt-4 overflow-x-auto rounded-md border">
                <table className="w-full text-left text-sm">
                  <thead className="bg-muted">
                    <tr>
                      {columns.map((column) => (
                        <th key={column} className="px-3 py-2 font-semibold">{column}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, index) => (
                      <tr key={index} className="border-t">
                        {columns.map((column) => (
                          <td key={column} className="px-3 py-2">{String(row[column])}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">Run a query to see table results.</p>
            )}
          </CardContent>
        </Card>
      </div>
      <aside className="space-y-4">
        <Card>
          <CardContent className="p-5">
            <h2 className="text-lg font-semibold">Available tables</h2>
            <div className="mt-4 space-y-3">
              {Object.entries(tables).map(([name, tableRows]) => (
                <div key={name} className="rounded-md border p-3">
                  <div className="font-mono text-sm">{name}</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {Object.keys(tableRows[0]).join(", ")}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <h2 className="text-lg font-semibold">Validation checks</h2>
            <div className="mt-4 space-y-2">
              {checks.map((check) => (
                <div key={check.label} className="flex items-center justify-between rounded-md border p-3 text-sm">
                  <span>{check.label}</span>
                  <Badge className={check.pass ? "border-primary/30 bg-primary/10 text-primary" : "border-destructive/30 bg-destructive/10 text-destructive"}>
                    {check.pass ? "pass" : "fix"}
                  </Badge>
                </div>
              ))}
            </div>
            <Button className="mt-4 w-full" onClick={() => saveSession("completed")} disabled={isPending}>
              Mark lab practiced
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <h2 className="text-lg font-semibold">Query history</h2>
            <div className="mt-4 space-y-2">
              {history.length ? history.map((item) => (
                <button
                  key={item}
                  onClick={() => setSql(item)}
                  className="w-full rounded-md border p-3 text-left font-mono text-xs hover:bg-muted"
                >
                  {item}
                </button>
              )) : <p className="text-sm text-muted-foreground">Executed queries appear here.</p>}
            </div>
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}
