# Local Dispatcher Validation

**Topic ID:** web-proxy-infrastructure.aemaacs-dispatcher.local-validation
**Researched:** 2026-03-29T00:00:00Z

## Overview

Local Dispatcher Validation is the process of verifying AEM as a Cloud Service (AEMaaCS) Dispatcher configuration on a developer's machine before deployment to Cloud Manager pipelines. The AEM SDK ships with Dispatcher Tools — a collection of scripts, a `validator` CLI binary, and a Docker image — that replicate Cloud Manager's own validation environment locally [1][2]. This means developers can catch configuration errors (wrong directives, broken Apache syntax, security misconfigurations) before triggering a real deployment, dramatically reducing feedback loop times.

The core workflow has two complementary parts: running `validate.sh` (or the `validator` binary directly) to statically check configuration files, and launching a Docker container via `docker_run.sh` to actually serve traffic through Apache + Dispatcher locally [1][3]. Together these two steps mirror what Cloud Manager does during its Build Images step, with one important caveat: local validation is a close approximation but not a 100% identical replica of Cloud Manager checks, particularly around domain mapping and CDN header normalization [4].

Understanding this tooling is critical for the AEM DevOps Engineer exam because questions frequently present broken configuration scenarios and ask which validation command would catch the error, or whether a local-passing config would fail in Cloud Manager.

## Key Concepts

- **Dispatcher SDK** — A downloadable zip/sh package from Adobe Software Distribution that contains the `bin/validator`, `bin/validate.sh`, `bin/docker_run.sh`, `bin/docker_run_hot_reload.sh`, and `bin/update_maven.sh` scripts, plus a Docker image matching Cloud Manager's runtime [1][2]. Not to be confused with the AEM Quickstart JAR, which is also part of the SDK bundle but is a separate component.

- **`validator` CLI vs `validate.sh` script** — These are distinct tools that are commonly confused. The `validator` binary performs the low-level allowlist and security checks. The `validate.sh` script is a convenience wrapper that calls the `validator` binary across all three validation phases in sequence [1][3]. Exam questions often test whether you know which one to reach for.

- **Three-Phase Validation** — The validation process proceeds through three sequential phases [1][2]:
  - Phase 1: Allowlist check — verifies only permitted Apache/Dispatcher directives are used and scans for security issues (CVE-2016-0957 glob-based filter vulnerabilities, exposed `/crx/de` or `/system/console` admin paths).
  - Phase 2: Apache syntax check — starts Apache HTTPD in a Docker container and runs `httpd -t` to verify the configuration can actually start.
  - Phase 3: Immutability check — confirms that the SDK's immutable (Adobe-owned) configuration files have not been edited locally.

- **Flexible Mode** — The recommended Dispatcher configuration mode, default for AEM Archetype 28 and higher and for all Cloud Manager environments created after the 2021.7.0 release. Activated by the presence of the marker file `opt-in/USE_SOURCES_DIRECTLY` [2][5]. Removes file-count and file-size restrictions, and supports multiple site-specific rewrite rule files.

- **Legacy Mode** — The older mode, used when `opt-in/USE_SOURCES_DIRECTLY` is absent. Restricts customizable files to a single `rewrite.rules` file and caps the total size of customizable files at 1 MB [2][5]. Adobe recommends migrating to flexible mode.

- **`docker_run_hot_reload.sh`** — A preferred development-time variant of `docker_run.sh` that watches configuration files and automatically reloads the Dispatcher in the container when changes are detected, eliminating manual stop/restart cycles [1][3]. Available on macOS/Linux only; Windows uses `docker_run` only.

- **Immutable files** — A subset of SDK configuration files that Adobe manages and that must not be edited by customers. These represent Adobe-provided baselines. If they are modified locally, Phase 3 validation fails. The `update_maven.sh` script can be used to refresh these files to the current SDK version [1][3].

- **`allowlist` command** — A subcommand of the `validator` binary that lists all Apache/Dispatcher directives permitted for the current SDK version [1][2]. Running `./bin/validator allowlist` is the way to check what directives are safe to use.

## Technical Details

### Installation

The Dispatcher Tools are downloaded from the Adobe Software Distribution portal as part of the AEM SDK ZIP [2].

**macOS/Linux:**
```bash
chmod a+x aem-sdk-dispatcher-tools-x.x.x-unix.sh
./aem-sdk-dispatcher-tools-x.x.x-unix.sh
```

**Windows:** Unzip `aem-sdk-dispatcher-tools-x.x.x-windows.zip` to a path with no spaces or special characters (e.g., `C:\Users\<User>\aem-sdk\dispatcher`) [3].

### Validation Commands

Run the full three-phase validation against a `src/` folder [1][3]:

**macOS/Linux:**
```bash
./bin/validate.sh ./src
```

**Windows:**
```bash
bin\validate src
```

Alternatively, run the validator directly for more control [1]:
```bash
./bin/validator full -d ./out ./src
```

The `-d ./out` flag writes the transpiled (merged) configuration to an output directory, which is then used by `docker_run.sh`.

List allowed directives for this SDK version:
```bash
./bin/validator allowlist
```

### Running Dispatcher Locally with Docker

**Standard run (requires AEM Publish on port 4503):**
```bash
./bin/docker_run.sh ./src host.docker.internal:4503 8080
```

**Hot-reload variant (preferred for active development):**
```bash
./bin/docker_run_hot_reload.sh ./src host.docker.internal:4503 8080
```

The `host.docker.internal` hostname is a special Docker DNS name that resolves to the host machine's IP from inside the container [3]. If it does not resolve (older Docker versions), substitute the host machine's actual IP address.

### Debug Logging

Set environment variables before the Docker run command to increase log verbosity [1][3]:

```bash
DISP_LOG_LEVEL=Debug REWRITE_LOG_LEVEL=Debug ./bin/docker_run_hot_reload.sh ./src host.docker.internal:4503 8080
```

- `DISP_LOG_LEVEL` options: `error`, `warn`, `info`, `debug`, `trace1` (default: `warn`)
- `REWRITE_LOG_LEVEL` options: `error`, `warn`, `info`, `debug`, `trace1` through `trace8` (default: `warn`)
- `DISP_RUN_MODE`: overrides run mode (e.g., `stage`, `prod`) to load corresponding run-mode-specific Dispatcher farms [1]

Log variables can also be configured at rest in `conf.d/variables/global.vars` for persistent settings.

### Flexible vs Legacy Mode

| Feature | Flexible Mode | Legacy Mode |
|---|---|---|
| Activation | Marker file `opt-in/USE_SOURCES_DIRECTLY` present | Marker file absent |
| Default for | AEM Archetype 28+, Cloud Manager 2021.7.0+ | Older projects |
| Rewrite files | Multiple site-specific files allowed | Single `rewrite.rules` only |
| File size limit | None | Sum of customizable files < 1 MB |
| File includes | Relative paths supported | Absolute predefined paths required |

Migrating to flexible mode requires: creating `opt-in/USE_SOURCES_DIRECTLY`, restructuring configuration to flexible layout, splitting monolithic `rewrite.rules` into per-site files, and switching absolute include paths to relative paths [2][5].

### Updating Immutable Files

When Phase 3 fails due to a new SDK release changing immutable files [1][3]:
```bash
./bin/update_maven.sh ${YOUR-AEM-PROJECT}/dispatcher/src
```
Review the generated diff and fold changes into project-specific configuration files.

## Common Patterns

**Standard pre-deployment workflow** [1][2][3]:
1. Edit Dispatcher configuration files under `dispatcher/src/`.
2. Run `./bin/validate.sh ./src` to catch Phase 1 (allowlist) and Phase 3 (immutability) errors offline.
3. Run `./bin/docker_run_hot_reload.sh ./src host.docker.internal:4503 8080` to test against a live local AEM Publish instance.
4. Verify pages load correctly through `http://localhost:8080`.
5. Commit and push only after all three phases pass locally.

**Environment-type-specific configuration** [1]: Use `DISP_RUN_MODE=stage` or `DISP_RUN_MODE=prod` when running `docker_run.sh` to load the corresponding run-mode farms and test staging or production-specific rules locally before deploying to those environments.

**Inspecting the running container** [1]:
```bash
docker ps          # get container ID
docker exec [CONTAINER_ID] httpd -t   # verify live config inside container
```

**Enabling vhosts with symlinks (flexible mode)** [4]:
```bash
ln -s ../available_vhosts/default.vhost src/conf.d/enabled_vhosts/default.vhost
```
Enabled farms and vhosts are activated via symlinks from `available_*` to `enabled_*` directories — an Apache `a2ensite`-style pattern.

## Gotchas

- **`validator` vs `validate.sh` confusion** — The `validate.sh` script runs all three phases and is the typical entry point for developers. The `validator` binary is the underlying executable. Calling `validator full` directly gives more fine-grained control but is not the same as the `validate.sh` convenience wrapper [1]. Exam questions sometimes use both terms interchangeably but they are distinct.

- **Phase 2 requires Docker even when AEM is not running** — Docker Desktop must be installed and running for Phase 2 to execute, but AEM Publish does NOT need to be running for validation to pass. `docker_run.sh`, however, does require AEM Publish to be reachable because it actually proxies requests [1][3].

- **Missing vhost symlinks cause Phase 1 failure** — The most common Phase 1 error is "no .vhost files found in `conf.d/enabled_vhosts/`". This happens when the symlinks from `available_vhosts/` to `enabled_vhosts/` are absent, which can occur after cloning a repo without the `--recurse-submodules` flag or copying files without preserving symlinks [4].

- **`host.docker.internal` may not resolve on older Docker** — Requires Docker 18.03+. On older versions, use the host machine's actual IP address (`ifconfig` on macOS/Linux, `ipconfig` on Windows) [3].

- **Local SDK version vs Cloud Manager version mismatch** — Cloud Manager may use a newer SDK version than the one installed locally, meaning some configurations pass locally but fail in Cloud Manager. Always download the latest SDK from Software Distribution to minimize this gap [4][2].

- **Immutable files incorrectly edited locally before SDK v2021.1.4738** — Before this SDK version, there was no Phase 3 check. Teams would modify immutable files locally and expect those changes to deploy to Cloud environments, which they did not. Phase 3 was introduced specifically to surface this error at validation time rather than at deployment [1][5].

- **Legacy mode's 1 MB file size cap** — This limit applies to the total sum of customizable configuration files, not individual files. Large multi-site configurations can silently fail to deploy if the aggregate exceeds this threshold in legacy mode. Migrating to flexible mode eliminates this risk [2][5].

- **`docker_run_hot_reload.sh` is macOS/Linux only** — Windows developers must use the standard `docker_run` script and manually restart the container when configuration changes are made [3].

- **`-relaxed` flag on `validator`** — Running `validator full -relaxed` suppresses certain non-critical warnings. This can mask real issues if used routinely. Only use it when you understand which warnings you are suppressing [1].

- **Cloud Manager domain mapping difference** — In AEMaaCS production, Adobe's CDN normalizes the `Host` header before it reaches Dispatcher, so vhosts use `ServerAlias "*"`. In local Docker testing, you are the CDN, so you may need to set explicit `ServerName` values for multi-domain vhost testing. Configurations that work locally with explicit domain names may behave differently through the cloud CDN [4].

## Sources

[1] **Validating and Debugging using Dispatcher Tools — Adobe Experience Manager Documentation**
    URL: https://experienceleague.adobe.com/en/docs/experience-manager-cloud-service/content/implementing/content-delivery/validation-debug
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: Three-phase validation process details, validator vs validate.sh distinction, allowlist command, debug log levels, hot-reload behavior, environment variable options, immutable file check introduction timeline, `-relaxed` flag behavior, Docker container inspection commands.

[2] **Set up Dispatcher Tools for AEM as a Cloud Service Development — Adobe Experience League Tutorial**
    URL: https://experienceleague.adobe.com/en/docs/experience-manager-learn/cloud-service/local-development-environment-set-up/dispatcher-tools
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: Installation steps for macOS/Linux/Windows, validate.sh commands per platform, docker_run commands, Docker version requirements, flexible vs legacy mode table, update_maven.sh usage, Docker troubleshooting.

[3] **How to Validate AEM Dispatcher Locally the Same Way Cloud Manager Does — ShiftSaaS**
    URL: https://shiftsaas.com/adobe-experience-manager/validate-aem-dispatcher-locally-like-cloud-manager/
    Accessed: 2026-03-29
    Relevance: supplementary
    Extracted: Local vs Cloud Manager differences (domain mapping model), missing vhost symlink error details, SDK version mismatch gotcha, AEM Publish connectivity check, immutable file decision guidance, proxy vs redirect distinction in local testing.

[4] **Validating and Debugging using Dispatcher Tools (Legacy) — Adobe Experience Manager Documentation**
    URL: https://experienceleague.adobe.com/en/docs/experience-manager-cloud-service/content/implementing/content-delivery/validation-debug-legacy
    Accessed: 2026-03-29
    Relevance: supplementary
    Extracted: Legacy mode-specific validation command differences, file inclusion restrictions, single rewrite.rules requirement, 1 MB cap on customizable files, migration guidance from legacy to flexible mode.

[5] **Dispatcher in the Cloud — Adobe Experience Manager Documentation**
    URL: https://experienceleague.adobe.com/en/docs/experience-manager-cloud-service/content/implementing/content-delivery/disp-overview
    Accessed: 2026-03-29
    Relevance: background
    Extracted: Flexible mode activation via `opt-in/USE_SOURCES_DIRECTLY`, default mode for AEM Archetype 28+ and Cloud Manager 2021.7.0+, migration steps, relative vs absolute path requirement in flexible mode.
