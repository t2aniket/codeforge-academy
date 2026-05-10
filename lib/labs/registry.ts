import type { LabKind, LabStarter } from "@/lib/types";

export type LabLanguage = {
  id: string;
  label: string;
  versions: string[];
  runtime: "native" | "pyodide" | "sql" | "wasm" | "wasm-adapter" | "simulated";
};

export type LabDefinition = {
  id: LabKind;
  title: string;
  accent: string;
  defaultStarter: LabStarter;
  commands: Record<string, string>;
  languages: LabLanguage[];
};

export const browserLanguages: LabLanguage[] = [
  { id: "javascript", label: "JavaScript", versions: ["ES2024", "ES2023"], runtime: "native" },
  { id: "typescript", label: "TypeScript", versions: ["5.7", "5.6"], runtime: "native" },
  { id: "python", label: "Python", versions: ["3.12", "3.11", "3.10"], runtime: "pyodide" },
  { id: "sql", label: "SQL", versions: ["Postgres 16", "Postgres 15"], runtime: "sql" },
  { id: "wasm", label: "WebAssembly", versions: ["MVP", "WASI adapter-ready"], runtime: "wasm" },
  { id: "dockerfile", label: "Dockerfile", versions: ["Dockerfile v1"], runtime: "simulated" },
  { id: "yaml", label: "YAML", versions: ["1.2"], runtime: "simulated" },
  { id: "java", label: "Java", versions: ["Latest browser JVM adapter"], runtime: "simulated" },
  { id: "dart", label: "Dart", versions: ["3.x WASM adapter"], runtime: "simulated" },
  { id: "cpp", label: "C++", versions: ["Clang WASM adapter"], runtime: "wasm-adapter" },
  { id: "rust", label: "Rust", versions: ["Stable WASM adapter"], runtime: "wasm-adapter" },
  { id: "go", label: "Go", versions: ["1.23 WASM adapter"], runtime: "wasm-adapter" },
  { id: "ruby", label: "Ruby", versions: ["3.x WASM adapter"], runtime: "simulated" },
  { id: "php", label: "PHP", versions: ["8.x WASM adapter"], runtime: "simulated" },
  { id: "kotlin", label: "Kotlin", versions: ["JVM browser adapter"], runtime: "simulated" },
  { id: "swift", label: "Swift", versions: ["WASM adapter"], runtime: "simulated" }
];

export const labRegistry: Record<LabKind, LabDefinition> = {
  docker: {
    id: "docker",
    title: "Docker Lab",
    accent: "Container runtime",
    defaultStarter: {
      lab: "docker",
      title: "Containerize a Node API",
      description: "Build an image, inspect layers, run a container, and verify exposed ports.",
      files: {
        Dockerfile: "FROM node:20-alpine\nWORKDIR /app\nCOPY package.json .\nRUN npm install --omit=dev\nCOPY . .\nCMD [\"npm\", \"start\"]",
        "package.json": "{\"scripts\":{\"start\":\"node server.js\"},\"dependencies\":{\"fastify\":\"latest\"}}"
      },
      commands: ["docker build -t codeforge-api .", "docker run -p 8080:8080 codeforge-api", "docker ps"],
      challenge: "Run the image and confirm the API is listening on port 8080."
    },
    languages: browserLanguages.filter((language) => ["dockerfile", "yaml", "javascript", "typescript", "python"].includes(language.id)),
    commands: {
      "docker ps": "CONTAINER ID   IMAGE           STATUS          PORTS\ncf91a8d        codeforge-api   Up 12 seconds   0.0.0.0:8080->8080/tcp",
      "docker images": "REPOSITORY      TAG       SIZE\ncodeforge-api   latest    128MB\nnode            20-alpine 172MB",
      "docker build -t codeforge-api .": "Step 1/6 : FROM node:20-alpine\nStep 6/6 : CMD [\"npm\", \"start\"]\nSuccessfully tagged codeforge-api:latest",
      "docker run -p 8080:8080 codeforge-api": "Container started: cf91a8d\nServer listening on http://localhost:8080",
      "run checks": "PASS image has non-root runtime plan\nPASS port mapping configured\nPASS health endpoint reachable"
    }
  },
  testing: {
    id: "testing",
    title: "Automation Testing Lab",
    accent: "Test runner",
    defaultStarter: {
      lab: "testing",
      title: "Checkout flow test",
      description: "Practice assertion structure across Pytest and browser automation style tests.",
      language: "python",
      files: {
        "test_checkout.py": "def total(subtotal, tax):\n    return subtotal + tax\n\n\ndef test_total():\n    assert total(40, 4) == 44\n"
      },
      commands: ["pytest", "playwright test", "run checks"],
      challenge: "Add a second test for an empty cart total."
    },
    languages: browserLanguages.filter((language) => ["python", "javascript", "typescript"].includes(language.id)),
    commands: {
      pytest: "collected 2 items\n\ntest_checkout.py ..\n\n2 passed in 0.18s",
      "playwright test": "Running 3 tests using chromium\n✓ cart renders\n✓ checkout validates tax\n✓ confirmation page loads",
      "cypress run": "Spec: checkout.cy.ts\n3 passing (1s)",
      "run checks": "PASS assertions are explicit\nPASS failure messages are actionable"
    }
  },
  network: {
    id: "network",
    title: "Network & CCNA Lab",
    accent: "Topology simulator",
    defaultStarter: {
      lab: "network",
      title: "Configure an edge router",
      description: "Use Cisco-like commands and watch the topology state respond.",
      language: "text",
      files: {
        "topology.cfg": "R1 g0/0 192.168.1.1/24 up\nR1 g0/1 unassigned down\nSW1 vlan 10 STUDENTS active\nSW1 vlan 20 STAFF active\n\n# Goal\n# Configure R1 g0/1 as 10.0.0.1/24 and bring the interface up.\n"
      },
      commands: ["show ip interface brief", "conf t", "interface g0/1", "ip address 10.0.0.1 255.255.255.0"],
      challenge: "Bring G0/1 up and assign the correct gateway IP."
    },
    languages: browserLanguages.filter((language) => ["sql", "javascript", "python"].includes(language.id)),
    commands: {
      "show ip interface brief": "Interface     IP-Address      OK? Method Status Protocol\nG0/0          192.168.1.1     YES manual up     up\nG0/1          unassigned      YES unset  down   down",
      "conf t": "Enter configuration commands, one per line. End with CNTL/Z.",
      "interface g0/1": "Router(config-if)#",
      "ip address 10.0.0.1 255.255.255.0": "G0/1 assigned 10.0.0.1/24\nLine protocol changed to up",
      "show vlan brief": "VLAN Name     Status Ports\n10   STUDENTS active Fa0/1, Fa0/2\n20   STAFF    active Fa0/3",
      "run checks": "PASS gateway reachable\nPASS routing table contains connected network 10.0.0.0/24"
    }
  },
  linux: {
    id: "linux",
    title: "Linux Terminal Lab",
    accent: "Shell workspace",
    defaultStarter: {
      lab: "linux",
      title: "Navigate and inspect a service",
      description: "Practice common shell commands in a realistic project filesystem.",
      language: "shell",
      files: {
        "terminal-notes.sh": "# CodeForge Linux workspace\npwd\nls -la\ncat README.md\ncat logs/api.log\nsystemctl status api\n"
      },
      commands: ["pwd", "ls -la", "cat README.md", "systemctl status api"],
      challenge: "Find the service log and identify the failing environment variable."
    },
    languages: browserLanguages.filter((language) => ["javascript", "typescript", "python", "go", "rust"].includes(language.id)),
    commands: {
      pwd: "/home/codeforge/workspace",
      "ls -la": "drwxr-xr-x app\ndrwxr-xr-x logs\n-rw-r--r-- README.md\n-rw-r--r-- docker-compose.yml",
      "cat README.md": "CodeForge service workspace\n\nUse logs/api.log to inspect boot failures.",
      "cat logs/api.log": "ERROR Missing DATABASE_URL\nINFO Shutdown complete",
      "systemctl status api": "api.service loaded active running CodeForge API",
      "run checks": "PASS found README\nPASS inspected logs\nPASS identified DATABASE_URL"
    }
  },
  sql: {
    id: "sql",
    title: "SQL Database Lab",
    accent: "Postgres simulator",
    defaultStarter: {
      lab: "sql",
      title: "Find high-XP learners",
      description: "Query sample tables and compare the result to the expected output.",
      language: "sql",
      files: {
        "query.sql": "select name, xp from learners where xp >= 500 order by xp desc;"
      },
      commands: ["run query", "explain"],
      challenge: "Return learners with at least 500 XP ordered by XP descending."
    },
    languages: browserLanguages.filter((language) => language.id === "sql"),
    commands: {
      "run query": "name              xp\nMaya Chen         1840\nTheo Martins      970\nAva Singh         620",
      explain: "Seq Scan on learners -> Filter: xp >= 500 -> Sort: xp DESC",
      "run checks": "PASS selected expected columns\nPASS filter matches xp >= 500\nPASS sort order is descending"
    }
  },
  playground: {
    id: "playground",
    title: "General Code Playground",
    accent: "Monaco runtime",
    defaultStarter: {
      lab: "playground",
      title: "JavaScript warmup",
      description: "Run JavaScript immediately or switch to Python for Pyodide-powered execution.",
      language: "javascript",
      files: {
        "main.js": "function forge(value) {\n  return `CodeForge: ${value}`;\n}\n\nconsole.log(forge('ready'));\n"
      },
      commands: ["run"],
      challenge: "Change the function and run the output."
    },
    languages: browserLanguages,
    commands: {
      run: "Use the Run button to execute code in the browser.",
      "run checks": "PASS code executed\nPASS output captured"
    }
  }
};

export function getLabDefinition(id: string | undefined) {
  if (!id || !(id in labRegistry)) return null;
  return labRegistry[id as LabKind];
}
