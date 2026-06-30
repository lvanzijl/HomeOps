import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import { resolve } from 'node:path';

function appendTail(lines, chunk) {
  const next = `${chunk}`.split(/\r?\n/).filter(Boolean);
  lines.push(...next);
  if (lines.length > 20) lines.splice(0, lines.length - 20);
}

function createManagedProcess({ name, command, args, cwd, env }) {
  const output = [];
  const child = spawn(command, args, { cwd, env: { ...process.env, ...env }, detached: true, stdio: ['ignore', 'pipe', 'pipe'] });
  child.stdout.on('data', (chunk) => appendTail(output, chunk));
  child.stderr.on('data', (chunk) => appendTail(output, chunk));
  return { name, command, args, cwd, child, output };
}

async function checkUrl(url) {
  try {
    const response = await fetch(url, { redirect: 'manual' });
    return Object.freeze({ reachable: response.status >= 200 && response.status < 500, status: response.status, url });
  } catch (error) {
    return Object.freeze({ reachable: false, status: undefined, url, error: error.message });
  }
}

async function waitForUrl(url, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  let last = await checkUrl(url);
  while (!last.reachable && Date.now() < deadline) {
    await delay(500);
    last = await checkUrl(url);
  }
  return last;
}

async function terminateProcess(managed, timeoutMs) {
  if (!managed || managed.child.exitCode !== null || managed.child.signalCode !== null) {
    return Object.freeze({ name: managed?.name, stopped: true, alreadyExited: true });
  }

  const exited = new Promise((resolveExited) => {
    managed.child.once('exit', (code, signal) => resolveExited({ code, signal }));
  });
  process.kill(-managed.child.pid, 'SIGTERM');
  const result = await Promise.race([exited, delay(timeoutMs).then(() => undefined)]);
  if (result) return Object.freeze({ name: managed.name, stopped: true, signal: 'SIGTERM', exit: result });
  process.kill(-managed.child.pid, 'SIGKILL');
  const forced = await exited;
  return Object.freeze({ name: managed.name, stopped: true, signal: 'SIGKILL', exit: forced });
}

export async function startRuntimeStage(config, { repoRoot = process.cwd() } = {}) {
  const runtime = config.runtime;
  const apiHealthUrl = new URL(runtime.apiHealthPath, runtime.apiUrl).href;
  const processes = [];
  const status = {
    phase: 'runtime',
    started: false,
    api: { started: false, health: undefined },
    frontend: { started: false, health: undefined },
    failure: undefined,
  };

  try {
    const apiProcess = createManagedProcess({
      name: 'api',
      command: 'dotnet',
      args: ['run', '--project', runtime.apiProject, '--no-launch-profile', '-p:UseSharedCompilation=false'],
      cwd: repoRoot,
      env: {
        ASPNETCORE_ENVIRONMENT: runtime.environment,
        ASPNETCORE_URLS: runtime.apiUrl,
        DOTNET_ENVIRONMENT: runtime.environment,
        DOTNET_CLI_USE_MSBUILD_SERVER: '0',
      },
    });
    processes.push(apiProcess);
    status.api.started = true;

    status.api.health = await waitForUrl(apiHealthUrl, runtime.startupTimeoutMs);
    if (!status.api.health.reachable) throw new Error(`API health check failed for ${apiHealthUrl}.`);

    const frontendProcess = createManagedProcess({
      name: 'frontend',
      command: 'npm',
      args: ['run', 'dev', '--', '--host', runtime.frontendHost, '--port', `${runtime.frontendPort}`, '--strictPort'],
      cwd: resolve(repoRoot, runtime.frontendDirectory),
      env: { VITE_HOMEOPS_API_BASE_URL: runtime.apiUrl },
    });
    processes.push(frontendProcess);
    status.frontend.started = true;

    status.frontend.health = await waitForUrl(runtime.appUrl, runtime.startupTimeoutMs);
    if (!status.frontend.health.reachable) throw new Error(`Frontend health check failed for ${runtime.appUrl}.`);

    status.started = true;
    return Object.freeze({
      status: Object.freeze(status),
      async shutdown() {
        const shutdown = [];
        for (const managed of [...processes].reverse()) {
          shutdown.push(await terminateProcess(managed, runtime.shutdownTimeoutMs));
        }
        return Object.freeze({ phase: 'runtime', stopped: true, processes: Object.freeze(shutdown) });
      },
    });
  } catch (error) {
    status.failure = Object.freeze({ message: error.message, processes: processes.map((managed) => Object.freeze({ name: managed.name, outputTail: Object.freeze([...managed.output]) })) });
    const shutdown = [];
    for (const managed of [...processes].reverse()) {
      shutdown.push(await terminateProcess(managed, runtime.shutdownTimeoutMs));
    }
    return Object.freeze({ status: Object.freeze(status), shutdown: Object.freeze({ phase: 'runtime', stopped: true, processes: Object.freeze(shutdown) }) });
  }
}
