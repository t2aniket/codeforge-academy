"use client";

import dynamic from "next/dynamic";

const Monaco = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => <div className="flex h-[420px] items-center justify-center rounded-md border bg-muted">Loading editor...</div>
});

export function CodeEditor({
  value,
  language,
  onChange,
  onMount
}: {
  value: string;
  language: string;
  onChange: (value: string) => void;
  onMount?: (editor: unknown, monaco: unknown) => void;
}) {
  return (
    <div className="overflow-hidden rounded-md border">
      <Monaco
        height="420px"
        language={language}
        theme="vs-dark"
        value={value}
        options={{ minimap: { enabled: false }, fontSize: 14, padding: { top: 16 } }}
        onChange={(next) => onChange(next ?? "")}
        onMount={onMount}
      />
    </div>
  );
}
