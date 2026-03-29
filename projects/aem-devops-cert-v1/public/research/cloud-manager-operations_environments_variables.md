# Environment Variables Configuration

**Topic ID:** cloud-manager-operations.environments.variables
**Researched:** 2026-03-29T00:00:00Z

## Overview

Cloud Manager environment variables allow AEM as a Cloud Service applications to behave differently across development, stage, and production environments without modifying code or redeploying. Variables are stored in Cloud Manager rather than in Git, separating configuration from code and avoiding sensitive data exposure in version control [1]. Changes to environment variable values take effect immediately at runtime without requiring a pipeline run or code deployment [1].

There are two distinct categories of Cloud Manager variables: **environment-specific variables** (available at runtime within the deployed application) and **pipeline variables** (available only during the build phase) [2]. Each category supports a plain-text type and a secret type. OSGi configuration files can reference both environment-specific variables and secrets using a special placeholder syntax, allowing the same config files in Git to be used across all environments while values differ per environment [3].

Understanding which variable type to use and where it applies is critical for the exam. The key axis is: build-time vs. runtime, and the secondary axis is: plain value vs. secret. Misapplying these (e.g., using a pipeline variable when runtime access is needed) is a common mistake.

## Key Concepts

- **Environment-specific variables** — Runtime variables scoped to a specific AEM environment (dev/stage/prod). Accessible inside the running application (Author, Publish, Preview). Managed via the Environments > Configuration tab in Cloud Manager UI [1]. Values take effect immediately; no deployment required.

- **Pipeline variables** — Build-time variables scoped to a specific Cloud Manager pipeline. Available as environment variables during build execution (e.g., in Maven `pom.xml` or custom build scripts). Not accessible at runtime in the deployed application [2].

- **Secret type** — A sub-type of either environment or pipeline variable where the value is stored encrypted at rest. Secrets are write-only in the UI: you can set or update them but never read them back after saving [1]. Secrets cannot be used in Dispatcher configurations [4].

- **OSGi environment variable placeholder** — Syntax `$[env:VARIABLE_NAME]` used in `.cfg.json` OSGi config files to inject Cloud Manager environment variable values at runtime [3].

- **OSGi secret placeholder** — Syntax `$[secret:SECRET_NAME]` used in `.cfg.json` OSGi config files to inject secret values [3]. Neither value is stored in Git; AEM resolves them from Cloud Manager at startup.

- **Default values in OSGi** — The syntax `$[env:VARIABLE_NAME;default=<value>]` provides a fallback when the variable is not defined in the environment. Always provide defaults to avoid `null` or literal placeholder strings at runtime [3].

- **Service-level targeting** — Both environment variables and secrets can be scoped to All, Author, Publish, or Preview services. This allows the same variable name to carry different values for Author vs. Publish [1].

- **Reserved prefixes** — Variable names beginning with `INTERNAL_`, `ADOBE_`, or `CONST_` are reserved by Adobe and will be ignored if set by customers. Variables beginning with `AEM_` are product-defined public API; customers may use but not redefine them [3].

- **Deployment Manager role** — Only Cloud Manager users with the **Deployment Manager** role can add, update, or delete environment variables [1].

## Technical Details

### Environment Variable Limits

| Dimension | Limit |
|---|---|
| Variables per environment | 200 |
| Variable name length | 100 characters |
| Variable value length | 2,048 characters |
| Secret value length | 500 characters |
| Allowed name characters | Alphanumeric + underscore only |

### Pipeline Variable Limits

| Dimension | Limit |
|---|---|
| Variables per pipeline | 200 |
| Variable name length | 100 characters |
| String value length | 2,048 characters |
| Secret string value length | 500 characters |
| Name casing | Must be UPPERCASE |

### OSGi Configuration Syntax [3]

OSGi config files are stored in `.cfg.json` format under runmode-specific folders (e.g., `/apps/example/config.author/`) in the `ui.apps` module.

Inline (hard-coded, committed to Git):
```json
{
  "connection.timeout": 1000
}
```

Environment-specific value (resolved at runtime from Cloud Manager):
```json
{
  "service.url": "$[env:SERVICE_URL]"
}
```

Secret value (never stored in Git, resolved from Cloud Manager secrets):
```json
{
  "api.key": "$[secret:API_KEY]"
}
```

With default fallback:
```json
{
  "service.url": "$[env:SERVICE_URL;default=https://default.example.com]"
}
```

### Cloud Manager API for Bulk Variable Management [3]

```
PATCH /program/{programId}/environment/{environmentId}/variables
```

The `service` field in the request body targets `author`, `publish`, or `preview`. Note: quality gates are not run when variables are updated via API alone (no pipeline execution occurs).

### Pipeline Variable CLI Commands [2]

```bash
# Set a pipeline variable
aio cloudmanager:set-pipeline-variables PIPELINEID --variable MY_VAR myvalue

# List pipeline variables
aio cloudmanager:list-pipeline-variables PIPELINEID
```

### Run Mode Configuration vs. Cloud Manager Variables

OSGi run mode folders (`config.dev`, `config.stage`, `config.prod`) are an alternative approach baked into the code bundle. They are suitable for non-secret, predictable values that differ by tier but are known at build time. Cloud Manager environment variables are preferred when [1][4]:
1. The value is a secret
2. The value must be changeable without redeployment
3. The value differs between multiple dev environments within the same program

## Common Patterns

**Pattern 1: API key / password integration**
Store a third-party API key as a Cloud Manager secret. In the OSGi config, reference it with `$[secret:THIRD_PARTY_API_KEY]`. Set different secret values per environment via the Cloud Manager UI. The code is identical across environments; only the Cloud Manager value differs [1][3].

**Pattern 2: Integration endpoint URL per environment**
A service URL that differs between dev and prod but is not secret. Use `$[env:INTEGRATION_URL;default=https://dev.example.com]` in the OSGi config, then set `INTEGRATION_URL` only in stage and prod environments. Dev environments fall back to the default [3].

**Pattern 3: Build-time feature flags via pipeline variables**
A Maven build needs to include/exclude a feature based on the target environment. Define a pipeline variable `FEATURE_TOGGLE=enabled` scoped to the Build step. Reference it in `pom.xml` as a Maven property. This is invisible to the runtime application [2].

**Pattern 4: Service-scoped differentiation**
Author-specific OSGI service needs a different timeout than Publish. Set the same variable `REQUEST_TIMEOUT` twice in Cloud Manager: once targeting Author (value `5000`), once targeting Publish (value `2000`). Both are resolved correctly at runtime [1].

**Pattern 5: Secrets for local development**
For local SDK development, secrets referenced via `$[secret:MY_SECRET]` in OSGi configs need corresponding text files. Create a `secretsdir/` folder, add a file named `MY_SECRET` containing the value, and configure `org.apache.felix.configadmin.plugin.interpolation.secretsdir` in `sling.properties` to point to it [3].

## Gotchas

**Gotcha 1: Environment variables vs. pipeline variables — scope confusion**
The most commonly confused distinction. Pipeline variables exist ONLY during the build phase; they are not available in the running AEM instance. If you need a value accessible to running OSGi components, you must use an environment-specific variable, not a pipeline variable [2][4].

**Gotcha 2: Secrets are not readable after creation**
Once a secret is saved in Cloud Manager, its value cannot be retrieved through the UI or API — only overwritten. This matters operationally: teams must maintain their own record of secret values outside Cloud Manager [1].

**Gotcha 3: Dispatcher cannot use secrets**
Secret-type variables are not available in Dispatcher configurations. Only plain environment variables can be used in Dispatcher, and even then they cannot be used inside `IfDefine` directives [1][4].

**Gotcha 4: Preview tier OSGi config inheritance**
Preview does not have its own runmode config folder. It inherits OSGi configuration from the publish tier. However, Cloud Manager environment variables CAN be scoped to Preview independently, which allows Preview-specific overrides without runmode folder changes [3].

**Gotcha 5: Missing default values cause literal placeholder strings**
If a Cloud Manager environment variable is not defined for an environment AND no default is specified, the literal string `$[env:VARIABLE_NAME]` appears at runtime rather than an empty value or null. This can cause unexpected application behavior. Always provide defaults [3].

**Gotcha 6: Reserved prefix silently drops values**
Variables starting with `INTERNAL_`, `ADOBE_`, or `CONST_` set by customers are silently ignored — no error is thrown. If a variable is not resolving, check whether the name accidentally matches a reserved prefix [3].

**Gotcha 7: Variable management blocked during pipeline execution**
Cloud Manager prevents adding or updating environment/pipeline variables while a pipeline is actively running. This can cause operational issues if an emergency variable update is needed during a deployment [2].

**Gotcha 8: Run mode configs commit to Git; Cloud Manager variables do not**
Run mode-specific OSGi configs (e.g., `config.prod`) are part of the code package and thus visible in Git, making them unsuitable for secrets. Cloud Manager variables live entirely outside Git. Use run mode configs only for non-sensitive, environment-class-level configuration that all dev/stage/prod environments of that type should share [1][3].

**Gotcha 9: 200-variable limit applies per environment AND per pipeline**
Large enterprise setups with many integrations can hit this limit. There is no documented way to request an increase. Architect variable naming to be efficient (e.g., combine related values using delimiters rather than separate variables where possible) [1][2].

## Sources

[1] **Environment Variables in Cloud Manager | Adobe Experience Manager**
    URL: https://experienceleague.adobe.com/en/docs/experience-manager-cloud-service/content/implementing/using-cloud-manager/environment-variables
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: Variable types (normal vs. secret), service-level targeting, limits (200 per environment, 100-char names), Deployment Manager role requirement, Dispatcher limitations, immediate-effect update behavior, dispatcher `IfDefine` restriction.

[2] **Pipeline Variables in Cloud Manager | Adobe Experience Manager**
    URL: https://experienceleague.adobe.com/en/docs/experience-manager-cloud-service/content/implementing/using-cloud-manager/cicd-pipelines/pipeline-variables
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: Pipeline variable scope (build-phase only), variable types (plain vs. encrypted), limits (200 per pipeline, 2048-char values, 500-char secret values), CLI commands, management blocked during pipeline runs, steps (build/functional testing/UI testing/deploy).

[3] **Configuring OSGi for Adobe Experience Manager as a Cloud Service | Adobe Experience Manager**
    URL: https://experienceleague.adobe.com/en/docs/experience-manager-cloud-service/content/implementing/deploying/configuring-osgi
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: OSGi config file format (.cfg.json), placeholder syntax ($[env:VAR], $[secret:VAR], default values), reserved prefixes (INTERNAL_, ADOBE_, CONST_, AEM_), run mode folder specifics, Preview tier inheriting from publish, local development secrets setup with secretsdir, API endpoint for variable management.

[4] **Demystifying Adobe Cloud Manager Variables | Oshyn**
    URL: https://www.oshyn.com/blog/adobe-cloud-manager-variables
    Accessed: 2026-03-29
    Relevance: supplementary
    Extracted: Exam-relevant distinction table between environment variables, pipeline variables, and OSGi run mode configs; confirmation that secrets cannot be used in Dispatcher; the three scenarios for needing Cloud Manager variables vs. run mode configs; Deployment Manager role requirement.

[5] **Manage Secrets in AEM as a Cloud Service | Adobe Experience Manager**
    URL: https://experienceleague.adobe.com/en/docs/experience-manager-learn/cloud-service/developing/advanced/secrets
    Accessed: 2026-03-29
    Relevance: supplementary
    Extracted: SecretsManager OSGi service pattern, @OsgiService and @Reference injection approaches for consuming secrets in Sling Models and OSGi services, Cloud Manager UI steps for setting secrets, security benefits (rotation without redeployment, access isolation).
