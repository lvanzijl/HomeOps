#!/usr/bin/env node
import { spawn } from "node:child_process";

const args = process.argv.slice(2).filter((arg) => arg !== "--runInBand");
const child = spawn("vitest", ["run", ...args], {
  stdio: "inherit",
  shell: process.platform === "win32",
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 1);
});
