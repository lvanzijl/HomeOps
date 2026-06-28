# PostgreSQL Environment Check

## Summary

PostgreSQL was verified without using Docker as the first test. The current Codex environment does not have the PostgreSQL client tools (`psql`, `pg_isready`) available, no service manager reports a PostgreSQL service, and direct TCP checks to `localhost:5432` / `127.0.0.1:5432` were refused. The repository configuration expects PostgreSQL on `localhost:5432` with the `homeops` database and `homeops` user.

## Preflight result

Required instruction files were read before environment checks:

- `.github/copilot-instructions.md`
- `AGENTS.md`

Command:

```bash
export DOTNET_CLI_HOME=/tmp/dotnet
export PATH="$PATH:$HOME/.dotnet/tools"
dotnet --version
```

Result:

```text
10.0.301
```

## PostgreSQL discovery results

Commands were run without assuming Docker was required. Unavailable commands were allowed to fail.

```text
$ which psql || true
(no output)

$ psql --version || true
/bin/bash: line 5: psql: command not found

$ pg_isready || true
/bin/bash: line 6: pg_isready: command not found

$ pg_isready -h localhost -p 5432 || true
/bin/bash: line 7: pg_isready: command not found

$ pg_isready -h 127.0.0.1 -p 5432 || true
/bin/bash: line 8: pg_isready: command not found

$ ss -ltnp | grep 5432 || true
/bin/bash: line 9: ss: command not found

$ netstat -ltnp 2>/dev/null | grep 5432 || true
(no output)

$ systemctl status postgresql || true
System has not been booted with systemd as init system (PID 1). Can't operate.
Failed to connect to bus: Host is down

$ service postgresql status || true
postgresql: unrecognized service
```

Additional direct TCP checks were used because PostgreSQL client tools were not installed:

```text
$ timeout 5 bash -c '</dev/tcp/localhost/5432'
bash: connect: Connection refused
bash: line 1: /dev/tcp/localhost/5432: Connection refused
not_reachable

$ timeout 5 bash -c '</dev/tcp/127.0.0.1/5432'
bash: connect: Connection refused
bash: line 1: /dev/tcp/127.0.0.1/5432: Connection refused
not_reachable
```

## Repository connection configuration

Discovered connection string name:

- `HomeOps`

Discovered default connection string:

```text
Host=localhost;Port=5432;Database=homeops;Username=homeops;Password=homeops_dev_password
```

Connection details visible in committed development configuration:

| Field | Value/source |
| --- | --- |
| Host | `localhost` from `appsettings.json`, `appsettings.Development.json`, `.env.example`, `Program.cs` fallback, and `HomeOpsDbContextFactory.cs` |
| Port | `5432` from the same files and `docker-compose.yml` port mapping |
| Database | `homeops` from appsettings, `.env.example`, `docker-compose.yml`, and design-time DbContext factory |
| Username | `homeops` from appsettings, `.env.example`, `docker-compose.yml`, and design-time DbContext factory |
| Password/source | `homeops_dev_password`, plainly committed in development config and compose example files |
| Environment variables | `.env.example` defines `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_HOST`, `POSTGRES_PORT`, and `ConnectionStrings__HomeOps` |

Files inspected for repository configuration:

- `src/HomeOps.Api/appsettings.json`
- `src/HomeOps.Api/appsettings.Development.json`
- `src/HomeOps.Api/Properties/launchSettings.json`
- `.env.example`
- `docker-compose.yml`
- `src/HomeOps.Api/Program.cs`
- `src/HomeOps.Api/Data/HomeOpsDbContextFactory.cs`
- `.github/copilot-instructions.md`
- `AGENTS.md`
- README/developer docs discovered by repository search where relevant

## Database connectivity result

Database connectivity using the repository connection information could not be completed with `psql` because `psql` is not installed in the environment.

Direct TCP checks to the configured host and port were attempted instead and both were refused:

- `localhost:5432` refused the connection.
- `127.0.0.1:5432` refused the connection.

Result: the configured PostgreSQL endpoint is not reachable in this environment.

## API startup result

Not attempted because PostgreSQL was unavailable. The API runs Entity Framework migrations at startup for non-Testing environments and the discovered Development connection target was not reachable.

## Fixture endpoint result

Not attempted because PostgreSQL was unavailable and the API startup test was therefore not attempted.

## Final decision

### PostgreSQL availability

Not installed

### API fixture readiness

Not attempted because PostgreSQL was unavailable

## Exact blocker if any

The exact blocker is that PostgreSQL is not available on the repository-configured endpoint (`localhost:5432` / `127.0.0.1:5432`), and PostgreSQL client utilities are not installed:

- `psql`: command not found
- `pg_isready`: command not found
- TCP connection to port `5432`: connection refused
- `service postgresql status`: `postgresql: unrecognized service`

## Recommended next step

Provide a reachable PostgreSQL instance matching the repository's Development configuration, or document and export an alternate `ConnectionStrings__HomeOps` value before rerunning the API startup and fixture reset validation.

## Modified files

- `docs/reports/2026-06-28-postgresql-environment-check/postgresql-environment-check.md`

## Binary artifact confirmation

No binary artifacts, screenshots, or temporary files were created. The only intended repository change is this markdown report.
