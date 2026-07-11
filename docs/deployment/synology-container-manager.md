# Synology Container Manager Deployment

This workflow creates one Linux AMD64 FamilyBoard application image archive locally and deploys it to Synology Container Manager without a registry.

## Prerequisites on Windows

- Visual Studio 2026 or later with the ASP.NET and web development workload.
- The .NET SDK required by `src/HomeOps.Api/HomeOps.Api.csproj` (`net10.0`).
- SMB write access to the Synology project share.
- Optional OpenSSH client if you want the local script to invoke `deploy.sh` remotely.

## Initial Synology preparation

Create the project layout on the DS918+:

```sh
mkdir -p /volume1/docker/familyboard/images \
  /volume1/docker/familyboard/data/app \
  /volume1/docker/familyboard/data/postgres
```

Install Synology Container Manager, grant the deployment user access to `/volume1/docker/familyboard`, and optionally enable SSH. Copy these repository files to `/volume1/docker/familyboard`:

- `deploy/synology/compose.yaml` as `compose.yaml`
- `deploy/synology/.env.example` as `.env`
- `deploy/synology/deploy.sh` as `deploy.sh`

Edit `.env` on the Synology and set a strong `FAMILYBOARD_DB_PASSWORD`. Keep `.env` out of Git.

## Local developer configuration

Copy `build/synology-deploy.example.json` to `build/synology-deploy.local.json` and set your SMB path and optional SSH host. The local file is ignored by Git.

```json
{
  "SynologySharePath": "\\\\your-nas\\docker\\familyboard",
  "SynologySshHost": "familyboard-nas",
  "SynologyProjectPath": "/volume1/docker/familyboard",
  "SynologyImageRepository": "familyboard-app",
  "SynologyImageTag": "dev"
}
```

Credentials, SSH keys, and passwords stay outside the repository.

## Visual Studio usage

Recommended External Tools command:

- Command: `powershell.exe`
- Arguments: `-ExecutionPolicy Bypass -File "$(SolutionDir)build\deploy-synology.ps1" -SettingsPath "$(SolutionDir)build\synology-deploy.local.json"`
- Initial directory: `$(SolutionDir)`

To also invoke the Synology deploy script after copying the archive, add `-DeployRemote` to the arguments.

The API project also includes the `SynologyContainerArchive` publish profile. It builds `artifacts/container/familyboard-app-dev.tar.gz` locally, but the PowerShell workflow remains the supported full build/test/copy/deploy path.

## PowerShell workflow

From the repository root:

```powershell
pwsh -File build/deploy-synology.ps1 -SettingsPath build/synology-deploy.local.json
```

Use a versioned image tag when needed:

```powershell
pwsh -File build/deploy-synology.ps1 -SynologyImageTag 0.1.0 -SettingsPath build/synology-deploy.local.json -DeployRemote
```

The script restores, builds, tests, publishes a linux/amd64 image archive, validates the archive, copies it first as `images/familyboard-app.tar.gz.uploading`, then renames it to `images/familyboard-app.tar.gz` so deployments do not see a partially written final archive.

## Synology Container Manager usage

Container Manager can create/import a project from `/volume1/docker/familyboard/compose.yaml`. The command-line `deploy.sh` uses the same Compose file and `.env`, so Container Manager and shell deployment manage the same project. Inspect application logs and container state in Container Manager or with `docker compose logs` from the project directory.

## Manual fallback

If the SSH step is not used:

```sh
cd /volume1/docker/familyboard
docker load -i images/familyboard-app.tar.gz
docker compose --env-file .env -f compose.yaml config
docker compose --env-file .env -f compose.yaml up -d --remove-orphans
```

## Updating

Build and copy a new archive with the PowerShell script, then run `deploy.sh`. Set `FAMILYBOARD_IMAGE_TAG` in `.env` or pass it to the script/remote environment when using a versioned tag.

## Rollback

Keep previous loaded image tags for rollback. To roll back, set `FAMILYBOARD_IMAGE_TAG` in `.env` to a previously loaded tag and run `docker compose up -d`. Do not blindly roll back PostgreSQL files; database rollback requires a deliberate backup/restore plan.

## Troubleshooting

- SMB copy fails: verify share permissions and that the `images` directory exists or can be created.
- Bind mounts fail: verify Synology filesystem permissions on `data/app` and `data/postgres`.
- Wrong architecture: ensure the publish command uses `--os linux --arch x64` for DS918+ linux/amd64.
- Image tag mismatch: make sure `.env` `FAMILYBOARD_IMAGE_REPOSITORY` and `FAMILYBOARD_IMAGE_TAG` match the archive contents.
- SSH disabled: omit `-DeployRemote` and run `deploy.sh` manually.
- Host port occupied: change `FAMILYBOARD_HOST_PORT` in `.env`.
- PostgreSQL health/connection problems: verify `FAMILYBOARD_DB_*` values and that the app connection string uses service host `postgres`.
