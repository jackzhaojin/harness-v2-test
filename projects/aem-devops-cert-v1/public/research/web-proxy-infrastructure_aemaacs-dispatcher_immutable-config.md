# Immutable Dispatcher Configuration

**Topic ID:** web-proxy-infrastructure.aemaacs-dispatcher.immutable-config
**Researched:** 2026-03-29T00:00:00Z

## Overview

In AEM as a Cloud Service (AEMaaCS), the Dispatcher is an Apache HTTP Server-based caching and load-balancing layer that sits between the CDN and AEM publish/preview services. Unlike on-premise or AMS deployments where engineers could SSH into a Dispatcher server and edit files directly, AEMaaCS follows a strict code-as-configuration model: all Dispatcher configuration must be stored in Git and deployed through a Cloud Manager CI/CD pipeline [1][2].

A critical aspect of this model is the distinction between **immutable** and **mutable** Dispatcher configuration files. Immutable files are part of the base framework maintained by Adobe — they enforce security standards, performance best practices, and cloud-specific behaviors. Because these files are regenerated or supplied by the platform at runtime, any local modifications to them are silently discarded and have no effect on the deployed environment [1][3]. Mutable files, by contrast, are customer-owned and can be freely customized; these are the files that actually get transferred to Cloud instances during deployment.

Understanding which files are immutable vs. mutable, how validation enforces this boundary, and how to correctly update immutable files when Adobe releases changes is heavily tested on the AEM DevOps Engineer Expert certification. The exam frequently presents scenarios where a Cloud Manager pipeline is failing and asks what the correct remediation is. [1][4]

## Key Concepts

- **Immutable files** — Dispatcher configuration files managed by Adobe that enforce standards, security, and cloud-specific behaviors. Modifying or deleting them locally has no impact on deployment because they are not transferred to the Cloud instance [1][3]. Examples: `default.vhost`, `default_renders.any`, `default_filters.any`, `dispatcher.any`.

- **Mutable files** — Customer-owned configuration files that are fully customizable and are transferred to Cloud instances during deployment. Examples: custom `.vhost` files, `rules.any`, `filters.any`, `rewrite.rules`, custom `.farm` files [1][3].

- **Flexible mode** — The recommended Dispatcher configuration mode, activated by creating the marker file `opt-in/USE_SOURCES_DIRECTLY` in the Dispatcher configuration directory. Default for AEM archetype 28+. Removes file count/size restrictions imposed by legacy mode and enables improved SDK/runtime validation [2][4].

- **Legacy mode** — The older configuration approach, identified by the absence of `opt-in/USE_SOURCES_DIRECTLY`. Has hard restrictions: a single `rewrite.rules` file and the combined size of customizable files must be under 1 MB [2]. Migration to flexible mode is strongly recommended.

- **Three-phase validation** — The Dispatcher Tools `validate.sh` script (and the Cloud Manager build pipeline) runs three validation phases: Phase 1 = Dispatcher directive syntax and allowlist check; Phase 2 = Apache HTTP syntax check via Docker (`httpd -t`); Phase 3 = Immutability check that detects modified immutable files [4][5].

- **`update_maven.sh` script** — The tool used to refresh outdated immutable files in a project when Adobe ships new baseline configurations. Run as `bin/update_maven.sh src/dispatcher`. Also updates the checksum entries in `dispatcher/pom.xml` so that Maven's immutability check passes [4][5].

- **`default_renders.any`** — A special immutable file that is generated at container startup and contains environment-specific internal IP addresses for AEM publish/preview. It must never be copied or modified; instead, every farm must include it via `$include "../renders/default_renders.any"` [1][3].

- **`default_invalidate.any`** — Another file generated at startup, used in the `allowedClients` section of every farm. Must be included, not copied [1].

## Technical Details

### Directory Structure

The Dispatcher configuration lives under `dispatcher/src/` in the Maven project. Two top-level directories organize the configuration [1][3]:

```
dispatcher/src/
├── opt-in/
│   └── USE_SOURCES_DIRECTLY          # enables flexible mode
├── conf.d/                           # Apache HTTP server configuration
│   ├── available_vhosts/
│   │   ├── default.vhost             # IMMUTABLE — sample/template only
│   │   └── <custom>.vhost            # mutable — customer vhost definitions
│   ├── enabled_vhosts/
│   │   └── <custom>.vhost -> ...     # symlinks to enabled vhosts
│   ├── dispatcher_vhost.conf         # IMMUTABLE — framework include file
│   ├── rewrites/
│   │   ├── default_rewrite.rules     # IMMUTABLE
│   │   └── rewrite.rules             # mutable
│   └── variables/
│       └── custom.vars               # mutable
└── conf.dispatcher.d/               # Dispatcher module configuration
    ├── available_farms/
    │   ├── default.farm              # IMMUTABLE — sample/template only
    │   └── <custom>.farm             # mutable — customer farm definitions
    ├── enabled_farms/
    │   └── <custom>.farm -> ...      # symlinks to enabled farms
    ├── cache/
    │   ├── default_invalidate.any    # IMMUTABLE — generated at startup
    │   ├── default_rules.any         # IMMUTABLE
    │   └── rules.any                 # mutable
    ├── clientheaders/
    │   ├── default_clientheaders.any # IMMUTABLE
    │   └── clientheaders.any         # mutable
    ├── filters/
    │   ├── default_filters.any       # IMMUTABLE
    │   └── filters.any               # mutable
    ├── renders/
    │   └── default_renders.any       # IMMUTABLE — generated at startup
    ├── virtualhosts/
    │   ├── default_virtualhosts.any  # IMMUTABLE
    │   └── virtualhosts.any          # mutable
    └── dispatcher.any                # IMMUTABLE — core framework file
```

### Immutable File Enforcement in Maven

The `dispatcher/pom.xml` contains checksums for all immutable files. During the Maven build, a plugin verifies that local immutable files match the expected checksums. If an immutable file has been modified, the build fails. When Adobe ships new baseline configs (e.g., with a new SDK version), the checksums change and the project's `pom.xml` must be updated using `update_maven.sh` [4][5].

### Mandatory Farm Includes

Every customer `.farm` file must include the two startup-generated immutable files [1]:

```apache
# Inside <custom>.farm
/renders {
    $include "../renders/default_renders.any"
}
/cache {
    /allowedClients {
        $include "../cache/default_invalidate.any"
    }
}
```

### Validation Commands

```bash
# Run full three-phase validation locally
bin/validate.sh src/dispatcher

# Run only Phase 3 (immutability check) independently
bin/docker_immutability_check.sh src/dispatcher

# Update immutable files and pom.xml checksums when Adobe ships new versions
bin/update_maven.sh src/dispatcher
```

### Cloud Manager Deployment

Cloud Manager runs the same three-phase validation as part of the **Build Images** step of the pipeline. If validation fails (including an immutability check failure), errors appear in the Build Images step log. There is no direct SSH access to Dispatcher servers in AEMaaCS — all configuration changes must go through Cloud Manager pipelines [2][4].

## Common Patterns

**Pattern 1: Creating a custom vhost.** Copy `default.vhost` to `conf.d/available_vhosts/<site>.vhost`, make project-specific changes, then create a symlink in `enabled_vhosts/` to activate it. Never modify `default.vhost` itself — changes there will be ignored [1][3].

**Pattern 2: Adding custom cache rules.** Edit `conf.dispatcher.d/cache/rules.any` (mutable). Do not modify `default_rules.any`. In the farm file, ensure the include order is: immutable defaults first, then customer overrides [3]:

```apache
/rules {
    $include "../cache/default_rules.any"
    $include "../cache/rules.any"
}
```

**Pattern 3: Adding custom request filters.** Edit `conf.dispatcher.d/filters/filters.any` to add or override rules. The `default_filters.any` immutable file provides baseline security filtering that should remain referenced [1].

**Pattern 4: Handling a pipeline failure due to out-of-date immutable files.** Run `bin/update_maven.sh src/dispatcher`, review the diff carefully to incorporate any security or feature changes into your custom files, re-run `bin/validate.sh`, then commit and push [4][5].

**Pattern 5: Using environment variables for dynamic config.** When environment-specific values are needed (e.g., backend hostnames), use Apache variables defined in `conf.d/variables/custom.vars` and referenced with `${VAR_NAME}` syntax. AEMaaCS supports Cloud Manager environment variables that can be consumed in Dispatcher configs, enabling environment-specific behavior without modifying immutable files [2].

## Gotchas

**Gotcha 1 — Silent failure on modified immutable files.** If you modify an immutable file locally, your changes compile and may appear to work in a local Docker test. However, the changes will not be deployed to AEMaaCS. Phase 3 of the Cloud Manager build will also catch this as an error and fail the pipeline. Many engineers are confused when local behavior differs from Cloud behavior because they unknowingly edited an immutable file [1][4].

**Gotcha 2 — `default_renders.any` and `default_invalidate.any` are generated at startup.** These two files do not exist in the SDK source — they are produced at container startup with environment-specific values (internal IP addresses, allowed invalidation clients). You must use `$include` to reference them, not copy them. Copying them will include stale or wrong IP addresses [1][3].

**Gotcha 3 — Flexible mode vs. legacy mode detection.** The presence or absence of `opt-in/USE_SOURCES_DIRECTLY` determines the mode. In legacy mode, having more than one rewrite file or exceeding the 1 MB combined-size limit causes a build failure. Projects generated before archetype 28 are in legacy mode by default. Migrating requires adding the marker file and potentially restructuring the config — not just adding the file [2][4].

**Gotcha 4 — Archetype version vs. SDK version mismatch.** Even a freshly-generated project from the latest AEM archetype version can fail Dispatcher validation if the archetype template hasn't yet incorporated the latest SDK baseline. The fix is the same: run `update_maven.sh` [5]. This means a brand-new project is not guaranteed to pass validation out of the box.

**Gotcha 5 — `update_maven.sh` updates checksums but does not merge changes.** The script syncs immutable files and updates `pom.xml` checksums, but any security or behavioral changes in the new default files (e.g., new default cache rules) are not automatically reflected in your custom files. You must manually review `default_rules.any`, `default_filters.any`, etc., and incorporate relevant changes into your mutable counterparts [4][5].

**Gotcha 6 — No SSH access means no quick hotfixes.** Unlike on-premise AEM, there is no way to SSH into a Dispatcher in AEMaaCS and make a temporary fix. All changes go through Cloud Manager. This means validating config locally with `validate.sh` before pushing is essential to avoid slow pipeline feedback loops [2].

**Gotcha 7 — `default.vhost` and `default.farm` are templates, not active configs.** These files exist as reference/sample configurations. They are not automatically active — only files symlinked in `enabled_vhosts/` and `enabled_farms/` are loaded. Editing `default.vhost` does nothing because (a) it's immutable and (b) it's not in `enabled_vhosts/` [1][3].

## Sources

[1] **Read Only or Immutable Files in AEM | Adobe Experience Manager**
    URL: https://experienceleague.adobe.com/en/docs/experience-cloud-kcs/kbarticles/ka-17483
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: Which files are immutable, why they are immutable (AMS/Adobe maintains them), impact of modifying them (no effect), overlay and variable patterns as workarounds, `lsattr` command to identify immutable files.

[2] **Dispatcher in the Cloud | Adobe Experience Manager**
    URL: https://experienceleague.adobe.com/en/docs/experience-manager-cloud-service/content/implementing/content-delivery/disp-overview
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: Flexible mode vs. legacy mode, the `opt-in/USE_SOURCES_DIRECTLY` marker file, recommended migration path, archetype 28 as cutoff for flexible mode default, no SSH access to Dispatcher servers.

[3] **Validating and Debugging using Dispatcher Tools | Adobe Experience Manager**
    URL: https://experienceleague.adobe.com/en/docs/experience-manager-cloud-service/content/implementing/content-delivery/validation-debug
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: Full directory structure of mutable and immutable files, three-phase validation process, mandatory farm includes for `default_renders.any` and `default_invalidate.any`, flexible mode file organization, migration strategy.

[4] **Set up Dispatcher Tools for AEM as a Cloud Service Development | Adobe Experience Manager**
    URL: https://experienceleague.adobe.com/en/docs/experience-manager-learn/cloud-service/local-development-environment-set-up/dispatcher-tools
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: `update_maven.sh` script usage and workflow, `validate.sh` three-phase validation, Docker image for local testing, immutable file baseline update process, best practice for reviewing and incorporating changes from updated defaults.

[5] **AEM as a Cloud Service Developer Recertification Study Guide | JimFrenette.com**
    URL: https://jimfrenette.com/aem/exams/aem-cloud-service-dev-exam-guide/
    Accessed: 2026-03-29
    Relevance: supplementary
    Extracted: Exam-oriented summary of immutable default files, correct pattern for virtual host configuration changes, validation command syntax, Cloud Manager single-repo requirement and push workflow.

[6] **Dispatcher Configurations | Adobe Experience Manager Cloud Manager**
    URL: https://experienceleague.adobe.com/en/docs/experience-manager-cloud-manager/content/getting-started/dispatcher-configurations
    Accessed: 2026-03-29
    Relevance: supplementary
    Extracted: Cloud Manager deployment mechanism (full directory replacement from Git), required package structure (conf, conf.d, conf.dispatcher.d, conf.modules.d), environment-specific variable injection approach.
