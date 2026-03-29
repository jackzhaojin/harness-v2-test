# Configuration Admin Service

**Topic ID:** aem-configuration.osgi.config-admin
**Researched:** 2026-03-29T00:00:00Z

## Overview

The OSGi Configuration Admin Service (`org.osgi.service.cm.ConfigurationAdmin`) is a compendium service that provides centralized, persistent configuration management for OSGi bundles [1]. It acts as a database of configuration objects, each identified by a Persistent Identity (PID) and containing a dictionary of key/value properties. When a bundle registers a service with a matching `service.pid`, the Configuration Admin service automatically delivers the stored configuration via a callback — no polling required [1][3].

In AEM, Configuration Admin underpins all OSGi component configuration, from OOTB services to custom components. Configurations can be delivered through JSON `.cfg.json` files in the repository, the Web Console (`/system/console/configMgr`), or programmatically via the `ConfigurationAdmin` API [2]. Understanding how Configuration Admin works — and when to use it directly versus through higher-level abstractions like Declarative Services — is critical for AEM DevOps and developer certification exams.

The modern best practice is to let Declarative Services (DS) manage configuration consumption on your behalf. Direct interaction with the `ConfigurationAdmin` API is reserved for rare scenarios: reading a third-party service's configuration, writing configurations programmatically for testing/automation, or building management tooling [4]. Knowing where each approach belongs is a key exam scenario.

## Key Concepts

- **Persistent Identity (PID)** — A string that uniquely identifies a configuration object. For DS components, the PID defaults to the fully-qualified class name. For factory configurations, the factory PID identifies the factory and each generated instance gets a unique child PID [1]. Exam tip: "service.pid" is the property key that a `ManagedService` registers with to signal interest in a given configuration.

- **ConfigurationAdmin API** — The central service interface. Key methods: `getConfiguration(String pid)` retrieves or creates a configuration bound to the calling bundle; `getConfiguration(String pid, String location)` with `null` location creates an unbound configuration consumable by any bundle; `createFactoryConfiguration(String factoryPid)` creates a new factory instance configuration; `listConfigurations(String filter)` queries existing configurations without side effects [1].

- **Configuration object** — Wraps a `Dictionary<String, Object>` of properties. Core methods include `update(Dictionary)` to persist and push new values, `getProperties()` to read raw stored values, `getProcessedProperties(ServiceReference)` to read values after Configuration Plugins have resolved them (e.g., env var placeholders), and `delete()` to remove the configuration [1][4].

- **ManagedService** — An interface a bundle implements to receive configuration callbacks. Must be registered as an OSGi service with a `service.pid` property. Configuration Admin calls `updated(Dictionary properties)` asynchronously whenever the configuration changes or when the service first registers. Called with `null` if no configuration exists or if it is deleted [1][3].

- **ManagedServiceFactory** — Handles multiple configuration instances (factory pattern). The factory's `updated(String pid, Dictionary properties)` is called for each instance; `deleted(String pid)` is called on removal. One factory PID, zero-to-n instance configurations. Analogous to DS factory components [1][3].

- **ConfigurationListener** — An alternative to `ManagedService` for code that needs to react to configuration changes on many PIDs (e.g., all PIDs with a given prefix). Receives `ConfigurationEvent` objects for any configuration lifecycle event [1].

- **Bundle location binding** — A security mechanism. A configuration created with `getConfiguration(pid)` (single arg) is bound to the calling bundle's location. Only that bundle can receive or modify it. Using `getConfiguration(pid, null)` creates an unbound configuration that binds to the first bundle that registers a matching `ManagedService` [3][4]. Exam gotcha: passing the wrong location parameter is a common source of "why isn't my configuration being delivered" bugs.

- **Configuration Plugins** — Interceptors that transform raw configuration values before they are delivered. Used in AEM to resolve environment variable placeholders (`$[env:VAR_NAME]`) and secrets (`$[secret:VAR_NAME]`). In OSGi R6 and earlier, DS bypassed Configuration Plugins — this was fixed in R7, where DS calls plugins before passing configs to components [4][5].

- **DS @Designate + @ObjectClassDefinition** — The recommended approach for component configuration in AEM. `@Designate` links a component to a metatype definition; `@ObjectClassDefinition` defines the config schema with typed fields and default values. DS then handles all Configuration Admin interaction automatically [5][6].

## Technical Details

### ConfigurationAdmin API — Core Methods

The `ConfigurationAdmin` interface provides these primary operations [1][3]:

```java
// Get or create a configuration bound to the calling bundle
Configuration config = configAdmin.getConfiguration("com.example.MyService");

// Get or create an UNBOUND configuration (preferred for cross-bundle use)
Configuration config = configAdmin.getConfiguration("com.example.MyService", null);

// Update properties and trigger callbacks
Dictionary<String, Object> props = new Hashtable<>();
props.put("host", "localhost");
props.put("port", 8080);
config.update(props);

// Query existing configurations (no side effects — preferred for reads)
Configuration[] configs = configAdmin.listConfigurations("(service.pid=com.example.*)");

// Create a new factory configuration instance
Configuration factoryConfig = configAdmin.createFactoryConfiguration("com.example.ConnectionFactory", null);
```

### ManagedService Implementation

Implementing `ManagedService` directly is the low-level alternative to DS [1][3]:

```java
@Component(
    service = ManagedService.class,
    property = { "service.pid=com.example.MyService" }
)
public class MyManagedService implements ManagedService {

    @Override
    public void updated(Dictionary<String, ?> properties) throws ConfigurationException {
        if (properties == null) {
            // No configuration exists — use defaults or mark unconfigured
            return;
        }
        String host = (String) properties.get("host");
        if (host == null) {
            throw new ConfigurationException("host", "Property 'host' must be set");
        }
        // Apply configuration
    }
}
```

Key behaviors [1]:
- `updated()` is always called at least once on registration (with `null` if no config exists)
- Callbacks are asynchronous — never block inside `updated()`
- Throw `ConfigurationException` to signal invalid properties (not generic `Exception`)

### Reading Another Service's Configuration via ConfigurationAdmin

In AEM, the common use case for direct `ConfigurationAdmin` access is inspecting OOTB or third-party component configurations [6]:

```java
@Component(service = MyReader.class)
public class MyReader {

    @Reference
    private ConfigurationAdmin configAdmin;

    public String readRootMapping() throws IOException {
        Configuration config = configAdmin.getConfiguration(
            "com.day.cq.commons.servlets.RootMappingServlet"
        );
        Dictionary<String, Object> props = config.getProperties();
        if (props == null) {
            return null; // No configuration stored
        }
        return PropertiesUtil.toString(props.get("rootmapping.target"), "");
    }
}
```

To get resolved values (after plugins process placeholders), use `getProcessedProperties(serviceRef)` instead of `getProperties()` [4].

### DS with @Designate (Preferred Pattern)

The recommended approach for AEM custom components [5][6]:

```java
@ObjectClassDefinition(name = "My Service Configuration")
public @interface MyConfig {
    String host() default "localhost";
    int port() default 8080;
    boolean enabled() default true;
}

@Component(service = MyService.class)
@Designate(ocd = MyConfig.class)
public class MyServiceImpl implements MyService {

    private MyConfig config;

    @Activate
    @Modified
    protected void activate(MyConfig config) {
        this.config = config;
    }
}
```

DS automatically handles Configuration Admin interaction, delivers resolved values (in R7+), and manages component lifecycle based on `configurationPolicy`.

### Configuration Policies

DS components support three configuration policies [5]:

| Policy | Behavior |
|---|---|
| `OPTIONAL` (default) | Component activates with or without a matching configuration |
| `REQUIRE` | Component only activates when a matching configuration exists |
| `IGNORE` | Configuration Admin values are never delivered |

### AEM-Specific: Configuration Value Types

AEM as a Cloud Service recognizes three value types in `.cfg.json` files [2]:

| Type | Syntax | Use Case |
|---|---|---|
| Inline | `"host": "localhost"` | Hardcoded, stored in Git |
| Environment-specific | `"host": "$[env:HOST_VAR]"` | Varies per environment |
| Secret | `"password": "$[secret:DB_PASSWORD]"` | Sensitive data, not in Git |

## Common Patterns

**Pattern 1: DS component with typed configuration (recommended)**
Use `@Designate` + `@ObjectClassDefinition` for all custom components. Add `@Modified` alongside `@Activate` to handle live configuration updates without restart. Set `configurationPolicy = ConfigurationPolicy.REQUIRE` when a component must not run without configuration [5].

**Pattern 2: Factory configurations for multi-tenant/multi-site**
When the same service needs different settings per site or tenant, use a factory component in DS or `ManagedServiceFactory` directly. AEM's logger configuration is a classic example — one factory, N loggers with different categories. The factory PID identifies the type; each instance gets a unique generated PID [3][6].

**Pattern 3: Programmatic config write for automation/testing**
Integration tests and provisioning scripts use `ConfigurationAdmin.getConfiguration(pid, null)` + `config.update(props)` to seed configurations programmatically. Always pass `null` for location to prevent bundle binding that would prevent delivery [3][4].

**Pattern 4: ConfigurationListener for auditing/diagnostics**
Register a `ConfigurationListener` service to monitor all configuration changes across many PIDs without coupling to individual `ManagedService` registrations. Useful for logging or invalidating cross-cutting caches [1].

**Pattern 5: Reading OOTB service configs**
Inject `ConfigurationAdmin`, call `getConfiguration(pid)` on the target service's PID, then read `getProperties()`. Use `PropertiesUtil` for safe type-coerced property extraction with fallback defaults. Only use this for reading — do not modify OOTB configurations programmatically in production [6].

## Gotchas

**`getConfiguration()` has a side effect — it creates if absent.** Calling `configAdmin.getConfiguration("some.pid")` will create a new empty `Configuration` object in the store if one does not already exist. For safe reads, use `listConfigurations("(service.pid=some.pid)")` and check for `null` return [4].

**Single-arg `getConfiguration(pid)` binds to the calling bundle.** If you call `getConfiguration("my.pid")` without a location argument from bundle A, the configuration becomes bound to bundle A. Bundle B's `ManagedService` registered with the same PID will never receive it. Always pass `null` as the second argument when creating configurations that other bundles will consume [3][4].

**`getProperties()` returns unresolved placeholder strings.** In AEM Cloud Service, configuration values can contain `$[env:VAR]` or `$[secret:VAR]` placeholders. `config.getProperties()` returns the raw placeholder text. Use `config.getProcessedProperties(serviceReference)` to get the resolved values [4].

**DS bypassed Configuration Plugins before OSGi R7.** In R6 and earlier, if you used DS annotations, Configuration Plugin interceptors (used for encryption, env var resolution) were not called before your component's `@Activate` method received properties. `ManagedService` DID invoke plugins. OSGi R7 closed this gap — DS now calls plugins before delivering configs. Exam trap: if a question involves pre-R7 behavior, `ManagedService` was the only way to guarantee plugin invocation [4][5].

**`updated()` is always called on registration, even with no configuration.** A `ManagedService` will receive `updated(null)` at registration time if no matching configuration exists. Implementations must handle `null` gracefully and not throw `NullPointerException` [1][3].

**`ManagedService` is a singleton; `ManagedServiceFactory` is not.** There can only be one instance of a service registered with a given `service.pid`. If you need multiple instances with different configurations, you must use `ManagedServiceFactory` (or DS factory components). Using `ManagedService` for a multi-instance scenario will cause only one instance to receive configuration [1][3].

**DS `configurationPolicy = OPTIONAL` can hide missing configurations.** The default policy allows a DS component to activate even when no matching OSGi configuration exists. Properties will be empty/null. For services that must be configured before use, always set `ConfigurationPolicy.REQUIRE` [5].

**`ConfigurationAdmin` is a bundle-level security boundary.** Without `ConfigurationPermission[*, CONFIGURE]`, a bundle can only access configurations bound to itself. In AEM, this is mostly transparent, but in OSGi R7 security-enabled frameworks this restriction can cause silent configuration delivery failures [1].

## Sources

[1] **OSGi Compendium 7 — 104 Configuration Admin Service Specification**
    URL: https://docs.osgi.org/specification/osgi.cmpn/7.0.0/service.cm.html
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: Complete specification for ConfigurationAdmin API, ManagedService, ManagedServiceFactory, PID semantics, bundle location binding rules, ConfigurationListener, security model, and asynchronous callback requirements.

[2] **Configuring OSGi for AEM as a Cloud Service — Adobe Experience League**
    URL: https://experienceleague.adobe.com/en/docs/experience-manager-cloud-service/content/implementing/deploying/configuring-osgi
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: AEM Cloud Service configuration file format (.cfg.json), inline/secret/environment-specific value types, runmode-based configuration targeting, and Cloud Manager API-driven configuration.

[3] **Configuration Admin — mnlipp OSGi Getting Started**
    URL: https://mnlipp.github.io/osgi-getting-started/ConfigurationAdmin.html
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: Explanation of bundle location binding gotchas, ManagedService updated() always-called-on-registration behavior, programmatic configuration management patterns, and the recommendation to always set location to "?" or null.

[4] **Guide on Using OSGi Configurations — blog.osoco.de**
    URL: https://blog.osoco.de/2020/07/guide-on-using-osgi-configurations/
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: Best practice hierarchy (DS > ManagedService > direct ConfigAdmin), getConfiguration() side-effect gotcha, getProcessedProperties() vs getProperties() for placeholder resolution, configuration binding problem, and Configuration Plugin behavior in pre-R7 vs R7.

[5] **Configuring OSGi Declarative Services (2024 Edition) — vogella Blog**
    URL: https://vogella.com/blog/configuring-osgi-declarative-services-2024/
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: DS 1.3+ Component Property Types, @Designate + @ObjectClassDefinition pattern, configurationPolicy (OPTIONAL/REQUIRE/IGNORE), @Modified for live updates, multi-location binding with "?", and DS factory component configuration.

[6] **ConfigurationAdmin — Access OSGi Configuration of Other Services (Adobe Experience League Community)**
    URL: https://experienceleaguecommunities.adobe.com/t5/adobe-experience-manager/configurationadmin-access-osgi-configuration-of-other-services/m-p/379975
    Accessed: 2026-03-29
    Relevance: supplementary
    Extracted: AEM-specific code pattern for injecting ConfigurationAdmin via @Reference, reading third-party service configurations by PID, using PropertiesUtil for safe value extraction, and dynamic update behavior of configurations read via ConfigurationAdmin.
