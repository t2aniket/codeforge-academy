"use client";

import { FitAddon } from "@xterm/addon-fit";
import { Terminal } from "@xterm/xterm";
import { useEffect, useRef } from "react";

export function SimulatedTerminal({
  commands,
  prompt = "codeforge",
  onCommand,
  className = "h-[360px]"
}: {
  commands: Record<string, string>;
  prompt?: string;
  onCommand?: (command: string) => void;
  className?: string;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<Terminal | null>(null);

  useEffect(() => {
    if (!hostRef.current) return;
    const terminal = new Terminal({
      cursorBlink: true,
      theme: { background: "#020617", foreground: "#dbeafe", cursor: "#2dd4bf" },
      fontFamily: "Consolas, 'Fira Code', monospace",
      fontSize: 14
    });
    const fit = new FitAddon();
    terminal.loadAddon(fit);
    terminal.open(hostRef.current);
    termRef.current = terminal;

    const safeFit = () => {
      window.requestAnimationFrame(() => {
        try {
          fit.fit();
        } catch {
          // xterm can report missing dimensions before the host receives layout.
        }
      });
    };
    safeFit();

    let buffer = "";
    const writePrompt = () => terminal.write(`\r\n${prompt}$ `);
    terminal.writeln("CodeForge Academy lab terminal");
    terminal.writeln("Type help for commands. Try run checks when ready.");
    terminal.write(`${prompt}$ `);
    const disposable = terminal.onData((data) => {
      if (data === "\r") {
        const command = buffer.trim();
        terminal.write("\r\n");
        const output =
          command === "help"
            ? Object.keys(commands).join("  ")
            : commands[command] ?? `Command not available in this guided lab: ${command}`;
        terminal.writeln(output);
        onCommand?.(command);
        buffer = "";
        writePrompt();
      } else if (data === "\u007f") {
        if (buffer.length > 0) {
          buffer = buffer.slice(0, -1);
          terminal.write("\b \b");
        }
      } else {
        buffer += data;
        terminal.write(data);
      }
    });

    const onResize = () => safeFit();
    const resizeObserver = new ResizeObserver(onResize);
    resizeObserver.observe(hostRef.current);
    window.addEventListener("resize", onResize);
    return () => {
      disposable.dispose();
      resizeObserver.disconnect();
      window.removeEventListener("resize", onResize);
      terminal.dispose();
    };
  }, [commands, onCommand, prompt]);

  return <div ref={hostRef} className={`terminal-frame overflow-hidden rounded-md border bg-slate-950 ${className}`} />;
}
