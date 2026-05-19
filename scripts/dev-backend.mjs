import { spawn } from "node:child_process";
import { watchFile as pollFile } from "node:fs";
import { readdir } from "node:fs/promises";
import { join } from "node:path";

const watchRoots = ["packages/core/src", "packages/server/src"];
const watchIntervalMs = 500;
let child;
let restarting = false;

start();
watchSourceFiles();

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    child?.kill();
    process.exit(0);
  });
}

function start() {
  child = spawn(process.execPath, ["--experimental-strip-types", "packages/server/src/server.ts"], {
    env: { ...process.env, PORT: process.env.PORT ?? "5174" },
    stdio: "inherit",
  });
  child.on("exit", (code, signal) => {
    if (restarting) return;
    const suffix = signal ? `signal ${signal}` : `code ${code}`;
    console.error(`[backend] exited with ${suffix}`);
    process.exit(code ?? 1);
  });
}

async function watchSourceFiles() {
  const files = (await Promise.all(watchRoots.map((root) => listTypeScriptFiles(root)))).flat();
  for (const file of files) {
    watchFile(file);
  }
}

async function listTypeScriptFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listTypeScriptFiles(path)));
    } else if (entry.isFile() && path.endsWith(".ts")) {
      files.push(path);
    }
  }
  return files;
}

function watchFile(file) {
  pollFile(file, { interval: watchIntervalMs }, (current, previous) => {
    if (current.mtimeMs !== previous.mtimeMs) {
      restart();
    }
  });
}

function restart() {
  if (restarting) return;
  restarting = true;
  child?.once("exit", () => {
    restarting = false;
    start();
  });
  child?.kill();
}
