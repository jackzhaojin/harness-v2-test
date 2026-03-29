# Run Modes and Configuration Resolution

**Topic ID:** aem-configuration.osgi.run-modes
**Researched:** 2026-03-29T00:00:00Z

## Overview

Run modes in AEM allow you to tune an instance for a specific purpose — such as `author` vs `publish`, or `dev` vs `prod` — by activating different sets of OSGi configurations. When AEM starts, it reads which run modes are active and applies matching config folders from the repository. This mechanism is the primary way teams manage environment-specific configurations (logging verbosity, service endpoints, cache settings, security toggles) without duplicating code [1][2].

There are two categories of run modes: **installation (fixed)** run modes (e.g., `author`, `publish`) that are set once at startup and cannot be changed, and **customized (secondary)** run modes (e.g., `dev`, `stage`, `prod`) that can be changed by restarting with different arguments [1]. Understanding which config folder "wins" when multiple folders match is one of the most commonly tested areas on the AEM DevOps certification exam — the core rule is that the folder with the most matching run modes takes precedence [2][3].

In AEM as a Cloud Service (AEMaaCS), custom run modes are not supported. Instead, Adobe provides a fixed, predefined set of run modes tied to environment type (`dev`, `stage`, `prod`) and service tier (`author`, `publish`). Environment differences that cannot be expressed via these run modes must use OSGi environment variable placeholders [4].

## Key Concepts

- **Installation Run Mode** — Set permanently at instance startup; cannot be changed after installation. Out-of-the-box values are `author`, `publish`, `samplecontent`, and `nosamplecontent` [1]. The `author`/`publish` pair and `samplecontent`/`nosamplecontent` pair are mutually exclusive.

- **Custom (Secondary) Run Mode** — User-defined run modes applied at startup via `-r` flag or system property; can be changed by restarting with different arguments [1]. Examples: `dev`, `stage`, `prod`, `emea`, `qa`.

- **Config Folder Naming Convention** — OSGi configurations are stored under `/apps/<project>/config.<runmode1>.<runmode2>/` in the JCR repository. A folder named `config` (no suffix) applies to all run modes; a folder named `config.author.dev` applies only when both `author` and `dev` are active [2][3].

- **Most-Specific Match Wins** — When multiple config folders match the active run modes for the same PID, the folder with the highest number of matching run modes is applied. For example, `config.author.dev` (2 matches) wins over `config.author` (1 match) or `config` (0 matches) [2][3].

- **No Property Merging** — Configuration resolution operates at the PID level. You cannot define partial properties for a PID in one folder and extend them in a more specific folder. The winning folder provides all properties for that PID; properties from less-specific folders are entirely ignored [2][3].

- **`/apps` overrides `/libs`** — Project-specific configurations in `/apps` take precedence over out-of-the-box configurations in `/libs`. This is how teams customize OOTB service behaviors [5].

- **Web Console override** — Changes saved directly from the Felix Web Console (`/system/console/configMgr`) create `.config` files that take highest runtime priority, overriding both `/apps` and `/libs` configurations [5]. These changes are not environment-safe and can cause drift.

- **Install Folders for Bundles** — Just as config folders control OSGi configurations per run mode, `install.<runmode>` folders control which OSGi bundles (JARs) are installed. For example, `/apps/<project>/install.author/` only installs its bundles when the instance runs in `author` mode [2].

- **AEMaaCS: No Custom Run Modes** — AEM as a Cloud Service does not allow custom run modes. Only the predefined set is supported (e.g., `config.author.dev`, `config.publish.prod`). Environment-specific values that can't be modeled with run modes use `$[env:VAR_NAME]` and `$[secret:VAR_NAME]` placeholders in `.cfg.json` files [4].

## Technical Details

### Run Mode Activation Methods (Precedence Highest to Lowest)

The following methods activate run modes at startup, in order of precedence [1]:

1. System property: `-Dsling.run.modes=author,dev,emea`
2. `-r` flag: `java -jar cq-quickstart.jar -r author,dev`
3. `sling.properties` file: `sling.run.modes=author` in `crx-quickstart/conf/sling.properties`
4. Jar file name encoding: `cq5-publish-p4503.jar` activates `publish`

### Config Folder Hierarchy (AEM 6.x On-Premise)

```
/apps/<project>/
  config/                          ← all run modes
  config.author/                   ← author only
  config.publish/                  ← publish only
  config.dev/                      ← dev only
  config.stage/                    ← stage only
  config.prod/                     ← prod only
  config.author.dev/               ← author AND dev
  config.author.prod/              ← author AND prod
  config.publish.dev/              ← publish AND dev
  config.publish.prod/             ← publish AND prod
  config.author.dev.emea/          ← author AND dev AND emea
```

Source: [2][3]

### Config Folder Hierarchy (AEM as a Cloud Service)

The supported run mode folders in AEMaaCS are a strict predefined set [4]:

```
config                   ← all services and environments
config.author            ← all author environments
config.publish           ← all publish environments
config.dev               ← dev tier (author + publish)
config.stage             ← stage tier
config.prod              ← production tier
config.author.dev        ← author in dev environment
config.author.rde        ← author in RDE (Rapid Dev Environment)
config.author.stage      ← author in staging
config.author.prod       ← author in production
config.publish.dev       ← publish in dev environment
config.publish.rde       ← publish in RDE
config.publish.stage     ← publish in staging
config.publish.prod      ← publish in production
```

### OSGi Config File Formats

```
Legacy (AEM 6.x, not preferred):
  com.example.MyService.xml         ← sling:OsgiConfig node type
  com.example.MyService.cfg         ← properties format
  com.example.MyService.config      ← Apache Felix format

Current/preferred (AEMaaCS and AEM 6.x):
  com.example.MyService.cfg.json    ← JSON format
```

Example `.cfg.json` with mixed value types (AEMaaCS) [4]:

```json
{
  "sling.auth.requirements": "$[env:SLING_AUTH_REQUIREMENTS;default=/]",
  "someSecret": "$[secret:API_KEY]",
  "environment": "$[env:AEM_ENV_TYPE;default=prod]"
}
```

### OSGi Config Source Priority at Runtime (AEM 6.x)

1. Felix Web Console changes (creates `.config` file, immediate effect, highest priority)
2. Repository nodes under `/apps/*/config.<runmode>/` (project configurations)
3. Repository nodes under `/libs/*/config.<runmode>/` (Adobe OOTB configurations)
4. Filesystem `.config` files in `crx-quickstart/launchpad/config/`

Source: [5]

## Common Patterns

**Pattern 1: Environment-specific logging**
Use `config.author.dev` for verbose logging on author instances in dev, while `config.author.prod` suppresses debug output. Because `config.author.dev` has two matching run modes, it wins over `config.author` when the dev secondary run mode is active [3].

**Pattern 2: Disable services in production**
Create an OSGi configuration in `config.prod` that disables services like CRXDE Lite or the WebDAV servlet. The `nosamplecontent` run mode also automatically disables several insecure defaults [1].

**Pattern 3: Combined run modes for matrix environments**
Enterprise setups often combine a service tier (`author`/`publish`) with an environment level (`dev`/`stage`/`prod`). The folder `config.author.stage` applies only to author instances in staging, enabling precise configuration targeting without duplicating properties [2].

**Pattern 4: Bundle deployment scoping**
Place author-only bundles (e.g., workflow or authoring tools) in `/apps/<project>/install.author/` so they are never installed on publish instances. This reduces publish instance attack surface and memory footprint [2].

**Pattern 5: AEMaaCS environment variables for sensitive values**
For API keys, tokens, or URLs that differ per environment on AEMaaCS, use `$[env:VAR_NAME]` in `.cfg.json` and set the actual values via the Cloud Manager UI or API. Never store secrets in Git [4].

## Gotchas

**No property-level merging between run mode folders.** This is the most critical and frequently confused behavior. If `config.author` defines 5 properties for PID `com.example.MyService`, and `config.author.dev` defines only 2 properties for the same PID, when running in `author+dev` mode only the 2 properties from `config.author.dev` are applied — the 3 properties from `config.author` are completely ignored for that PID. You must duplicate all required properties into the more-specific folder [2][3].

**Tie-breaking uses lexicographic ordering.** If two folders have the same number of matching run modes (e.g., `config.author` and `config.dev` both match one run mode on an `author+dev` instance), the folder name is compared lexicographically. `config.author` wins over `config.dev` because "author" comes before "dev" alphabetically. This is non-obvious and can cause unexpected config application. The safe fix is to create a combined folder `config.author.dev` to remove ambiguity [3].

**Installation run modes are permanent.** Once AEM is started with `author` (or `publish`), that is fixed for the lifetime of that installation. You cannot switch an author instance to publish mode by changing a config file. This affects backup/restore scenarios and instance provisioning [1].

**Custom run modes are not supported in AEMaaCS.** If you attempt to use `config.author.qa` or `config.publish.uat` in an AEMaaCS deployment, those folders will be silently ignored. Teams migrating from AEM 6.x must refactor their config folder structure to use only the predefined run modes and use environment variables for further differentiation [4].

**Web Console changes cause configuration drift.** Any value changed via `/system/console/configMgr` creates a `.config` file that takes highest priority, overriding repository-based configs. These changes do not flow through Git and break the declarative configuration model. In production, Felix Web Console access should be restricted or disabled [5].

**Preview tier inherits from publish.** In AEMaaCS, the preview service tier inherits OSGi configurations from the publish tier. There is no `config.preview` folder — you cannot target preview independently with run mode configs [4].

**`samplecontent` vs `nosamplecontent`:** These are mutually exclusive installation run modes. `nosamplecontent` is strongly recommended for production as it disables CRXDE Lite, WebDAV, and other developer-oriented endpoints. `samplecontent` installs Geometrixx demo content and should never be used in production [1].

**The `-r` flag only sets secondary run modes for jar-based quickstart.** Application server deployments use `web.xml` configuration. The jar filename trick (`cq5-publish-p4503.jar`) works for primary run modes only [1].

## Sources

[1] **AEM 6.5 – Run Modes**
    URL: https://experienceleague.adobe.com/en/docs/experience-manager-65/content/implementing/deploying/configuring/configure-runmodes
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: Types of run modes (installation vs customized), activation methods and their precedence, config folder naming conventions, `samplecontent` vs `nosamplecontent`, and the permanence of installation run modes.

[2] **AEM 6.5 – Configuring OSGi**
    URL: https://experienceleague.adobe.com/en/docs/experience-manager-65/content/implementing/deploying/configuring/configuring-osgi
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: Config folder hierarchy for run modes, install folder usage for bundle deployment, most-specific-match rule for PID resolution, and `/apps` vs `/libs` precedence.

[3] **AEM OSGi Config Resolution Order – AEM Tutorials for Beginners**
    URL: https://aem4beginner.blogspot.com/2020/05/aem-osgi-config-resolution-order.html
    Accessed: 2026-03-29
    Relevance: supplementary
    Extracted: PID-level granularity (no property merging), lexicographic tie-breaking between equal-specificity run mode folders, practical folder structure examples including `config.author.dev`.

[4] **Configuring OSGi for AEM as a Cloud Service**
    URL: https://experienceleague.adobe.com/en/docs/experience-manager-cloud-service/content/implementing/deploying/configuring-osgi
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: Predefined run mode set for AEMaaCS, no support for custom run modes, inline/env/secret value types, `$[env:VAR]` and `$[secret:VAR]` placeholder syntax, `.cfg.json` as required format, preview tier inheriting from publish.

[5] **AEM 6.5 – OSGi Configuration Precedence (Community + Documentation)**
    URL: https://aem4beginner.blogspot.com/2020/05/aem-osgi-config-resolution-order.html
    Accessed: 2026-03-29
    Relevance: supplementary
    Extracted: Felix Web Console changes creating `.config` overrides, runtime vs startup precedence, `/apps` masking `/libs` behavior, and risk of configuration drift from console edits.
