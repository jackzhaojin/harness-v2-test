# OSGi Factory Configurations

**Topic ID:** aem-configuration.osgi.factory-configs
**Researched:** 2026-03-28T14:32:00Z

## Overview

OSGi factory configurations enable creating multiple instances of the same service, each with its own unique configuration. Unlike singleton configurations, which bind a single configuration to a single service instance, factory configurations allow the same OSGi component to be instantiated multiple times with different parameter sets [1][2]. This capability is fundamental in AEM for scenarios requiring per-site, per-tenant, or per-integration variations of the same underlying service.

Factory configurations are pervasive in AEM. The most commonly used out-of-the-box factory configurations include the Apache Sling Logging Logger Configuration (for custom log files) and the Service User Mapper Service Amendment (for mapping service users to bundles) [3]. Understanding factory configuration naming conventions, PID patterns, and runmode targeting is essential for AEM DevOps certification, as these patterns appear in deployment scenarios, troubleshooting questions, and Cloud Service migration contexts.

In AEM as a Cloud Service, factory configurations take on additional importance because runtime configuration via the Web Console is not available. All configurations must be committed to source control and deployed through Cloud Manager pipelines, making correct naming and structure critical for successful deployments [1][4].

## Key Concepts

- **Factory PID** - The base persistent identifier shared by all instances of a factory configuration. This typically matches the fully qualified Java class name of the OSGi component [2].

- **Subname (Instance Identifier)** - A unique string appended to the factory PID that distinguishes individual configuration instances. You define this identifier; it can be any meaningful text [2][5].

- **Tilde Separator (~)** - Since Apache Sling Configuration Installer Factory 1.2.0, the tilde is the preferred separator between factory PID and subname (e.g., `com.example.MyService~instance1.cfg.json`). This replaced the legacy dash separator [2].

- **Dash Separator (-)** - The legacy separator still supported for backward compatibility but not recommended for new configurations. Avoid in AEM as a Cloud Service projects [2][4].

- **Singleton Configuration** - A standard OSGi configuration with no subname, binding one configuration to one service instance (e.g., `com.example.MyService.cfg.json`) [2].

- **@Designate with factory=true** - The OSGi R6 annotation that marks a component as a factory configuration, enabling multiple instances to be created from the Felix console or configuration files [3].

- **ConfigurationPolicy.REQUIRE** - Ensures the component only activates when a configuration is present, commonly used with factory configurations to prevent instantiation without explicit configuration [3].

- **@ObjectClassDefinition** - The OSGi annotation that defines the configuration interface, specifying available properties, types, and default values [3][6].

## Technical Details

### File Naming Convention

Factory configuration files follow a strict naming pattern [2]:

```
<factoryPID> ( '-' | '~' ) <subname> ( '.cfg' | '.config' | '.cfg.json' )
```

Examples:
```
# Preferred format (tilde separator, .cfg.json extension)
com.adobe.granite.cors.impl.CORSPolicyImpl~mysite.cfg.json

# Legacy format (dash separator, still functional but deprecated)
org.apache.sling.commons.log.LogManager.factory.config-mylogger.config
```

### Configuration File Format

AEM as a Cloud Service requires `.cfg.json` format (OSGi R7 standard). Legacy formats (`.cfg`, `.config`, `sling:OsgiConfig` XML) are superseded [1][4]:

```json
{
    "org.apache.sling.commons.log.names": ["com.mysite.core"],
    "org.apache.sling.commons.log.level": "debug",
    "org.apache.sling.commons.log.file": "logs/mysite.log"
}
```

### Java Implementation Pattern

Creating a factory configuration requires two annotations on your component [3]:

```java
@Component(
    service = SiteConfigService.class,
    immediate = true,
    configurationPolicy = ConfigurationPolicy.REQUIRE
)
@Designate(ocd = SiteConfig.class, factory = true)
public class SiteConfigServiceImpl implements SiteConfigService {

    private String siteId;
    private String apiEndpoint;

    @Activate
    protected void activate(SiteConfig config) {
        this.siteId = config.siteId();
        this.apiEndpoint = config.apiEndpoint();
    }
}

@ObjectClassDefinition(
    name = "Site Configuration",
    description = "Per-site configuration for external API integration"
)
public @interface SiteConfig {

    @AttributeDefinition(name = "Site ID", description = "Unique site identifier")
    String siteId();

    @AttributeDefinition(name = "API Endpoint", description = "External API URL")
    String apiEndpoint() default "https://api.example.com";
}
```

### Consuming Multiple Factory Instances

To inject all instances of a factory configuration, use `ReferenceCardinality.MULTIPLE` [3]:

```java
@Reference(
    cardinality = ReferenceCardinality.MULTIPLE,
    policy = ReferencePolicy.DYNAMIC
)
private volatile List<SiteConfigService> siteConfigs;
```

### Runmode Targeting

Factory configurations follow the same runmode folder structure as singleton configurations [1][4]:

```
/apps/myproject/osgiconfig/
    config/                              # All environments
    config.author/                       # Author only
    config.publish/                      # Publish only
    config.author.dev/                   # Author + dev environment
    config.publish.prod/                 # Publish + production
```

AEM as a Cloud Service supports only these runmodes: `author`, `publish`, `dev`, `stage`, `prod` [4].

### Environment Variables in Factory Configs

Factory configurations support the same variable interpolation as singleton configs [1]:

```json
{
    "apiEndpoint": "$[env:API_ENDPOINT]",
    "apiSecret": "$[secret:API_SECRET]",
    "timeout": 30000
}
```

## Common Patterns

**Per-Site Integration Configurations**: Multi-tenant AEM implementations use factory configurations to store site-specific API credentials, endpoints, and feature flags. Each site gets its own configuration instance, identified by a site code in the subname [3]:

```
com.myproject.integrations.SiteApiConfig~site-us.cfg.json
com.myproject.integrations.SiteApiConfig~site-emea.cfg.json
com.myproject.integrations.SiteApiConfig~site-apac.cfg.json
```

**Custom Logger Configurations**: The Apache Sling Logging Logger factory is universally used to create package-specific log files [5]:

```
org.apache.sling.commons.log.LogManager.factory.config~myproject-core.cfg.json
```

**Service User Mapper Amendments**: Mapping service users to bundles requires factory configurations [3]:

```
org.apache.sling.serviceusermapping.impl.ServiceUserMapperImpl.amended~myproject.cfg.json
```

**CORS Policy Configurations**: When multiple origins require different CORS rules [4]:

```
com.adobe.granite.cors.impl.CORSPolicyImpl~api-partners.cfg.json
com.adobe.granite.cors.impl.CORSPolicyImpl~api-internal.cfg.json
```

## Gotchas

**Tilde vs Dash Matters for Cloud Service**: While both separators work on AEM 6.5, the dash separator can cause issues in AEM as a Cloud Service deployments. Always use the tilde separator for new projects targeting Cloud Service [2][4].

**Duplicate PID Errors in Cloud Manager**: Having multiple configurations with the same full PID (including subname) across different content packages causes Cloud Manager build failures. The error message mentions `mergeConfigurations` flag, but the actual fix is removing duplicates [4]. Unlike AEM 6.x where OSGi resolved conflicts at runtime, Cloud Service resolves them at build time.

**PID Mismatch Prevents Configuration Binding**: If your configuration filename does not match the component's PID, OSGi silently ignores the configuration. When using a separate `@ObjectClassDefinition` interface, either name the config file after the implementation class or use `configurationPid` in the `@Component` annotation to explicitly specify the binding [6].

**Runmode Granularity is PID-Level**: You cannot split properties for the same PID across runmode folders. If `config.author/` and `config.author.dev/` both contain the same PID, the folder with more matching runmodes wins entirely - properties do not merge [4].

**No Custom Runmodes in Cloud Service**: AEM 6.x supports custom runmodes (e.g., `config.myrunmode`), but Cloud Service does not. Use environment variables for environment-specific variations beyond the standard runmodes [1][4].

**Configuration Interface PID Default**: When defining a separate `@ObjectClassDefinition` interface, the default PID becomes the interface's fully qualified name, not the implementing class name. This trips up developers who name the config file after the implementation class [6].

**Web Console Changes Do Not Persist in Cloud**: Unlike AEM 6.x where Web Console changes create `.config` files under `/apps`, AEM as a Cloud Service does not allow runtime configuration changes. All configs must be in the code repository [1][4].

**Reserved Variable Prefixes**: Environment variable names starting with `INTERNAL_`, `ADOBE_`, or `CONST_` are reserved by Adobe and will be ignored if set by customers [1].

## Sources

[1] **Configuring OSGi for Adobe Experience Manager as a Cloud Service**
    URL: https://experienceleague.adobe.com/en/docs/experience-manager-cloud-service/content/implementing/deploying/configuring-osgi
    Accessed: 2026-03-28
    Relevance: primary
    Extracted: Cloud Service configuration formats, runmode restrictions, environment variables, deployment requirements, and Cloud-specific constraints.

[2] **Apache Sling Configuration Installer Factory**
    URL: https://sling.apache.org/documentation/bundles/configuration-installer-factory.html
    Accessed: 2026-03-28
    Relevance: primary
    Extracted: Canonical file naming conventions, tilde vs dash separator history (SLING-7786), factory PID patterns, and parsing details.

[3] **OSGi Factory Configuration Implementation (AEM Learning Blogs)**
    URL: https://aem4beginner.blogspot.com/2021/01/osgi-factory-configuration.html
    Accessed: 2026-03-28
    Relevance: primary
    Extracted: Java implementation patterns using R6 annotations, @Designate factory=true, @ObjectClassDefinition examples, and ReferenceCardinality.MULTIPLE consumption pattern.

[4] **AEM Cloud Manager Build Issues and Common Mistakes (Experience League Community)**
    URL: https://experienceleaguecommunities.adobe.com/t5/adobe-experience-manager/cloud-manager-build-issue-aem-as-cloud-service/m-p/368480
    Accessed: 2026-03-28
    Relevance: supplementary
    Extracted: Duplicate PID error scenarios, runmode support limitations, build-time vs runtime configuration resolution differences.

[5] **Configuring OSGi for AEM 6.5**
    URL: https://experienceleague.adobe.com/en/docs/experience-manager-65/content/implementing/deploying/configuring/configuring-osgi
    Accessed: 2026-03-28
    Relevance: supplementary
    Extracted: AEM 6.5 factory configuration creation via CRXDE, identifier requirements, and Web Console persistence behavior.

[6] **Understanding configurationPid and @Designate in OSGi Configurations**
    URL: https://abdulmunim.com/2025/02/understanding-configurationpid-and-designate-in-aem-osgi-configuration/
    Accessed: 2026-03-28
    Relevance: supplementary
    Extracted: Difference between configurationPid and @Designate, PID binding rules, and common configuration binding mistakes.
