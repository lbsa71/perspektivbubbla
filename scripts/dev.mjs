import { spawn } from "node:child_process";

const children = [
  {
    name: "backend",
    command: process.platform === "win32" ? "npm.cmd" : "npm",
    args: ["run", "dev:backend"],
    env: process.env,
  },
  {
    name: "vite",
    command: process.platform === "win32" ? "npm.cmd" : "npm",
    args: ["run", "dev:client"],
    env: process.env,
  },
];

let shuttingDown = false;

for (const childConfig of children) {
  const child = spawn(childConfig.command, childConfig.args, {
    env: childConfig.env,
    stdio: ["inherit", "pipe", "pipe"],
  });
  childConfig.process = child;

  child.stdout.on("data", (chunk) => writePrefixed(childConfig.name, chunk));
  child.stderr.on("data", (chunk) => writePrefixed(childConfig.name, chunk, true));
  child.on("exit", (code, signal) => {
    if (shuttingDown) return;
    shuttingDown = true;
    stopChildren();
    const suffix = signal ? `signal ${signal}` : `code ${code}`;
    console.error(`[dev] ${childConfig.name} exited with ${suffix}`);
    process.exit(code ?? 1);
  });
}

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    shuttingDown = true;
    stopChildren();
    process.exit(0);
  });
}

function stopChildren() {
  for (const childConfig of children) {
    childConfig.process?.kill();
  }
}

function writePrefixed(name, chunk, error = false) {
  const stream = error ? process.stderr : process.stdout;
  for (const line of String(chunk).split(/\r?\n/)) {
    if (line.length > 0) {
      stream.write(`[${name}] ${line}\n`);
    }
  }
}
