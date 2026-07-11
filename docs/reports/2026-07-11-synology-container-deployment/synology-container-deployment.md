# Summary

Prepared a no-registry Synology Container Manager workflow for FamilyBoard/HomeOps using a locally produced linux/amd64 application image archive.

# Repository Findings

- The solution contains `HomeOps.Api`, `HomeOps.Contracts`, and API tests.
- The deployable ASP.NET Core project is `src/HomeOps.Api/HomeOps.Api.csproj`.
- The frontend is a separate Vite project at `src/HomeOps.Client` and is not currently hosted by the ASP.NET Core app in this repository slice.
- Existing Docker Compose only provides the local development PostgreSQL dependency.
- Runtime configuration uses `ConnectionStrings:HomeOps`; production containers override it with `ConnectionStrings__HomeOps`.
- `/health` exists for external checks; the SDK ASP.NET base image does not guarantee curl/wget, so Compose only adds a PostgreSQL health check in this slice.
- The application already runs EF Core migrations on startup outside Testing/VisualReview environments.

# Implemented

- Added SDK container publishing defaults for `familyboard-app:dev`.
- Added a Visual Studio publish profile that produces a local container archive.
- Added `build/deploy-synology.ps1` for restore/build/test/archive/copy/optional SSH deployment.
- Added example local JSON settings and ignored the real local settings file.
- Added Synology Compose, `.env.example`, and POSIX `deploy.sh`.
- Added deployment documentation and repository-state notes.

# Visual Studio Workflow

Use External Tools to run:

```powershell
powershell.exe -ExecutionPolicy Bypass -File "$(SolutionDir)build\deploy-synology.ps1" -SettingsPath "$(SolutionDir)build\synology-deploy.local.json"
```

Add `-DeployRemote` to invoke Synology `deploy.sh` through SSH.

Expected archive name: `familyboard-app-dev.tar.gz` locally and `images/familyboard-app.tar.gz` on the Synology share.

# Synology Workflow

Expected destination layout:

```text
/volume1/docker/familyboard/
├── compose.yaml
├── .env
├── deploy.sh
├── images/
│   └── familyboard-app.tar.gz
└── data/
    ├── app/
    └── postgres/
```

Run `sh ./deploy.sh` in the project directory to load the image and recreate the Compose project.

# Configuration

- Image repository defaults to `familyboard-app`.
- Image tag defaults to `dev` and can be overridden with `-SynologyImageTag 0.1.0`.
- PostgreSQL secrets and host-specific paths belong in Synology `.env` or local ignored settings.
- The Compose app service binds `/app/data` for application-owned writable files such as calendar restore snapshots.

# Validation

Validation performed:

- `sh -n deploy/synology/deploy.sh`
- PowerShell parser validation was attempted, but `pwsh` is not installed in this container.
- Docker Compose config validation was attempted, but Docker/Compose is not installed in this container.
- `dotnet restore HomeOps.sln`
- `dotnet build HomeOps.sln --configuration Release --no-restore`
- `dotnet test HomeOps.sln --configuration Release --no-build`
- `dotnet publish src/HomeOps.Api/HomeOps.Api.csproj --configuration Release --os linux --arch x64 /t:PublishContainer ...`
- Git status/diff review to ensure generated artifacts and caches are not part of the changeset.

Live SMB, SSH, Docker Compose, and Synology Container Manager operations were not executed in this environment.

# Manual Steps Still Required

- Create `/volume1/docker/familyboard` on the NAS and set permissions.
- Copy `compose.yaml`, `.env`, and `deploy.sh` to the NAS.
- Create a real `.env` with a strong PostgreSQL password.
- Create `build/synology-deploy.local.json` on each developer machine.
- Optionally configure a Windows SSH alias.

# Risks and Limitations

- The repository currently has separate API and Vite frontend deployables; this slice packages the ASP.NET Core deployable and does not redesign frontend hosting.
- `depends_on.condition: service_healthy` requires a Compose implementation that supports health conditions; Synology Container Manager versions should be verified during first live deployment.
- The app runs migrations on startup as already established by the application.
- Rollback is image-tag based only; database rollback remains an operational backup/restore concern.

# Modified Files

- `.gitignore`
- `build/deploy-synology.ps1`
- `build/synology-deploy.example.json`
- `deploy/synology/.env.example`
- `deploy/synology/compose.yaml`
- `deploy/synology/deploy.sh`
- `docs/deployment/synology-container-manager.md`
- `docs/reports/2026-07-11-synology-container-deployment/synology-container-deployment.md`
- `docs/roadmap/phase-2.md`
- `docs/state/current-state.md`
- `src/HomeOps.Api/HomeOps.Api.csproj`
- `src/HomeOps.Api/Properties/PublishProfiles/SynologyContainerArchive.pubxml`
