# Sling Models Configuration

**Topic ID:** aem-configuration.sling.models
**Researched:** 2026-03-29T00:00:00Z

## Overview

Sling Models are annotation-driven Java POJOs that are automatically mapped from Sling objects — typically `Resource` or `SlingHttpServletRequest` — and provide a structured way to access JCR node properties and inject OSGi services into component backing beans [1]. Rather than writing verbose adaptTo chains or manual property lookups, developers annotate a class with `@Model` and declare injected fields using injector-specific annotations, and the Sling Models framework handles instantiation and injection automatically [1][2].

Sling Models are the standard mechanism for backing AEM components. They replace older patterns like WCMUsePojo and serve as the Java layer between an HTL script and the JCR content repository. Because they are OSGi-aware and annotation-driven, they integrate cleanly into the AEM bundle model without requiring servlet registration or request handling boilerplate [1]. Since Sling Models 1.3.0 (AEM 6.3+), models can also be exported directly as JSON via the `@Exporter` annotation, eliminating the need to write a separate servlet for structured data endpoints [3][6].

Understanding how adaptables, injectors, and injection strategies interact is critical for the AEM Developer exam. Exam questions frequently test the distinction between `Resource` and `SlingHttpServletRequest` adaptables, the correct injector annotation for a given scenario, and when to use `defaultInjectionStrategy = OPTIONAL` versus `REQUIRED`.

## Key Concepts

- **`@Model` annotation** — Marks a class as a Sling Model. Requires at minimum the `adaptables` parameter specifying which Sling type(s) the model can be adapted from (`Resource.class`, `SlingHttpServletRequest.class`, or both) [1].

- **`adaptables` parameter** — Defines the source object for adaptation. Choosing `Resource` maximizes reusability (works in both request and non-request contexts). Choosing `SlingHttpServletRequest` is required when using request-specific injectors like `@RequestAttribute` [1][2].

- **`adapters` parameter** — Registers the model implementation under one or more interface types, enabling HTL scripts to adapt to an interface rather than the concrete class [4]. This is the foundation of the interface + implementation pattern.

- **`resourceType` attribute** — Associates the model with one or more component resource types. Used to disambiguate between multiple implementations of the same interface, and required for `@Exporter`-based servlet auto-registration [1][4].

- **Injector-specific annotations** — Preferred over `@Inject`. Each annotation targets exactly one injector (e.g., `@ValueMapValue` for content properties, `@OSGiService` for services). Using `@Inject` causes the framework to iterate all injectors in order, which is both unpredictable and a performance bottleneck [1][2].

- **`defaultInjectionStrategy`** — Controls whether missing injections fail silently (`OPTIONAL`) or throw an error and prevent model creation (`REQUIRED`, the default). Set at the `@Model` level to apply to all fields [1].

- **`@PostConstruct`** — Annotates a method that runs after all injections complete. Used for derived properties, validation, and defaults. A `@PostConstruct` method can return `false` to signal model creation failure without exception logging [1].

- **`@Exporter`** — Enables automatic servlet registration for a model, allowing it to serve structured data (JSON) at a URL like `/content/.../jcr:content.model.json` without writing a dedicated servlet [3][6]. Requires `resourceType` to be set on `@Model`.

- **`ImplementationPicker`** — An OSGi SPI interface that determines which model implementation to select when multiple implementations exist for the same interface. Queried by service ranking order [4].

- **Bundle registration** — Models must be declared via either a `Sling-Model-Packages` manifest header or the `ModelsScannerPlugin` bnd plugin in the Maven build. Missing this step prevents models from being discovered [1].

## Technical Details

### @Model Annotation Parameters

```java
@Model(
    adaptables = { Resource.class, SlingHttpServletRequest.class },
    adapters = { MyComponentModel.class },
    resourceType = { "myapp/components/content/mycomponent" },
    defaultInjectionStrategy = DefaultInjectionStrategy.OPTIONAL
)
public class MyComponentModelImpl implements MyComponentModel {
    // ...
}
```

Key parameters [1]:
- `adaptables` — One or more adaptable types
- `adapters` — Interface(s) this model registers under (required for interface-based usage)
- `resourceType` — String or String[] of component resource types
- `cache` — If `true`, caches adaptation result on the adaptable (use with caution for request objects)
- `defaultInjectionStrategy` — `DefaultInjectionStrategy.REQUIRED` (default) or `DefaultInjectionStrategy.OPTIONAL`
- `validation` — `ValidationStrategy.DISABLED` (default), `REQUIRED`, or `OPTIONAL`

### Injector Annotations (by Service Ranking)

Service ranking determines injection order when `@Inject` is used. With injector-specific annotations, only the targeted injector is invoked [2]:

| Annotation | Ranking | Use Case |
|---|---|---|
| `@ScriptVariable` | 1000 | Sling bindings (`currentPage`, `resource`, etc.) |
| `@ValueMapValue` | 2000 | JCR node properties from ValueMap |
| `@ResourcePath` | 2500 | Inject resource by absolute path |
| `@ChildResource` | 3000 | Inject child resource by name |
| `@RequestAttribute` | 4000 | Request attributes (HTL `data-sly-use` values) |
| `@OSGiService` | 5000 | OSGi services by type |
| `@Self` | MAX_VALUE | The adaptable itself, or adapted to target type |
| `@SlingObject` | MAX_VALUE | Sling framework objects (request, response, resolver) |

### @ValueMapValue with @Via and @Named

```java
@ValueMapValue(name = "jcr:title")
private String title;

// Inject from a child node's ValueMap
@ValueMapValue
@Via("childNode")
private String childProperty;
```

`@Named` overrides the field name for property lookup. `@Via` changes the source object [1][2].

### @Default for Fallback Values

```java
@ValueMapValue
@Default(values = "Default Title")
private String title;
```

Provides a fallback when the property is absent. Can also be used with `@Default(intValues = 0)` for primitive types [1].

### Injection Strategy — OPTIONAL vs REQUIRED

```java
@Model(
    adaptables = Resource.class,
    defaultInjectionStrategy = DefaultInjectionStrategy.OPTIONAL
)
public class MyModel {
    @ValueMapValue
    private String optionalTitle;  // null if absent, no error

    @PostConstruct
    protected void init() {
        if (optionalTitle == null) {
            optionalTitle = "Default";
        }
    }
}
```

With `REQUIRED` (default), if any injected field cannot be satisfied, model adaptation returns `null` and logs an error [1].

### @Exporter — Jackson JSON Registration

```java
@Model(
    adaptables = SlingHttpServletRequest.class,
    resourceType = "myapp/components/content/mycomponent",
    defaultInjectionStrategy = DefaultInjectionStrategy.OPTIONAL
)
@Exporter(
    name = "jackson",
    extensions = "json",
    selector = "model",  // default; results in .model.json URL
    options = {
        @ExporterOption(name = "MapperFeature.SORT_PROPERTIES_ALPHABETICALLY", value = "true")
    }
)
public class MyComponentExporter {
    @ValueMapValue
    private String title;

    public String getTitle() { return title; }
}
```

URL pattern: `http://localhost:4502/content/path/jcr:content.model.json` [3][6].

The Jackson exporter serializes by calling all public getter methods — fields without a corresponding getter are not included in JSON output [3].

### Bundle Registration

Two options [1]:

**Option 1 — Manual manifest header in `bnd.bnd`:**
```
Sling-Model-Packages: com.myapp.core.models
```

**Option 2 — bnd ModelsScannerPlugin (auto-discovery):**
```xml
<plugin>
    <groupId>biz.aQute.bnd</groupId>
    <artifactId>bnd-maven-plugin</artifactId>
    <configuration>
        <bnd><![CDATA[
            -plugin.slingmodels: org.apache.sling.bnd.models.ModelsScannerPlugin
        ]]></bnd>
    </configuration>
</plugin>
```

If `Sling-Model-Packages` is already defined manually, the bnd plugin does nothing [1].

### ModelFactory vs. adaptTo()

```java
// adaptTo() — returns null silently on failure
MyModel model = resource.adaptTo(MyModel.class);

// ModelFactory — throws specific exceptions
@OSGiService
private ModelFactory modelFactory;

MyModel model = modelFactory.createModel(resource, MyModel.class);
// Throws: MissingElementsException, InvalidAdaptableException
```

`ModelFactory` is preferred in production code because errors are surfaced explicitly [2][5].

## Common Patterns

**Interface + Implementation pattern** — The recommended approach for AEM components. Define an interface with getter methods, implement it in a class annotated with `@Model(adapters = MyInterface.class)`. HTL scripts use `data-sly-use.model="${'com.myapp.MyInterface' @ adaptTo='resource'}"` and call `model.title` etc. This enables multiple implementations behind a single contract [4].

**Resource-preferred adaptables** — Default to `adaptables = Resource.class` unless request-specific injection is needed. Resource-based models can be used in contexts outside HTTP requests (background processing, workflow steps, unit tests) [1][4].

**@PostConstruct for derived data** — Use `@PostConstruct` for any computation that depends on multiple injected values, such as building a URL from a path, processing a multi-value property, or setting default values [1][2].

**Multiple implementations with resourceType** — When two components share the same interface but differ in behavior, use `resourceType` on each implementation. The closest matching resource type wins. Custom `ImplementationPicker` OSGi services can override this selection logic for multi-tenant scenarios [4].

**@Exporter for headless/SPA use cases** — When a component needs to expose its data as JSON (for SPA editor, Content Services, or REST APIs), adding `@Exporter(name = "jackson", extensions = "json")` with a `resourceType` on `@Model` auto-registers a servlet. No additional servlet class is required [3][6].

**Constructor injection** — Since Sling Models 1.1.0, injection can happen via constructor parameters instead of field injection. Requires either `@Named` annotations or compiler `-parameters` flag. Preferred by some teams for immutability [1].

## Gotchas

**`@Inject` is discouraged** — Despite appearing in many tutorials, `@Inject` iterates all injectors in ranking order and injects the first non-null value. This causes unpredictable behavior when multiple injectors can satisfy the same type, and has measurable performance costs at scale. Always use injector-specific annotations [1][2].

**`Resource` vs `SlingHttpServletRequest` adaptable selection is critical** — If a model uses `@RequestAttribute`, the adaptable MUST be `SlingHttpServletRequest`. If only `@ValueMapValue` or `@ChildResource` are used, prefer `Resource` for reusability. Declaring both adaptables simultaneously "can lead to complex injection scenarios that are hard to predict" [1][4].

**`adapters` vs `resourceType` confusion** — `adapters` is about what type the model registers under for `adaptTo()` calls (interface polymorphism). `resourceType` is about which component resource the model corresponds to (used for disambiguation and `@Exporter` servlet mapping). These are orthogonal and often both are needed [4].

**Missing bundle registration means invisible models** — If `Sling-Model-Packages` is not configured and the bnd plugin is absent, models are silently ignored. This is a frequent cause of NullPointerException in `adaptTo()` calls during development [1].

**`cache = true` with `@Self` can exhaust heap** — Storing a reference to the original adaptable (e.g., `SlingHttpServletRequest`) in a `@Self`-injected field, combined with `cache = true`, keeps the entire request object alive. Sling's official docs warn: "it is strongly discouraged to store a reference to the original adaptable using the `self` injector." If needed, null the reference in `@PostConstruct` [1].

**Request objects do not cache by default** — Unlike `Resource` (which extends `SlingAdaptable`), `SlingHttpServletRequest` does not extend `SlingAdaptable`, so `adaptTo()` on a request creates a new model instance every time unless `cache = true` is explicitly set [1].

**`@Exporter` requires `resourceType` on `@Model`** — Without `resourceType`, the exporter servlet cannot be registered. This is a silent failure — no error, just no auto-registered servlet [3].

**`@PostConstruct` returning `false` vs throwing exception** — Returning `false` signals model creation failure without logging an exception stack trace. Throwing an exception triggers full logging. Choose based on whether the failure is expected/normal or truly exceptional [1].

**Default selector for `@Exporter` is `"model"`** — The resulting URL pattern is `.model.json`. This selector can conflict with other servlet registrations. Use the `selector` attribute on `@Exporter` to customize it if needed [3][6].

**Multiple implementations default ordering is alphabetical** — If two classes implement the same interface with the same `resourceType`, Sling selects alphabetically by class name. This is rarely desired; use `ImplementationPicker` or distinct `resourceType` values to control selection explicitly [4].

## Sources

[1] **Apache Sling :: Sling Models (Official Documentation)**
    URL: https://sling.apache.org/documentation/bundles/models.html
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: @Model annotation parameters, all injector types and rankings, injection strategy defaults, constructor injection, bundle registration options, @PostConstruct behavior, cache/self hazard warning, @Exporter overview.

[2] **AEM Sling Model Injectors Annotations Cheat Sheet Reference Guide — Sourced Code**
    URL: https://sourcedcode.com/blog/aem/aem-sling-model-injectors-annotations-cheat-sheet-reference-guide
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: Service rankings for each injector annotation, detailed use cases for @ScriptVariable, @ValueMapValue, @ResourcePath, @ChildResource, @RequestAttribute, @OSGiService, @Self, @SlingObject; key distinctions between similar injectors.

[3] **Understand Sling Model Exporter in AEM — Adobe Experience League**
    URL: https://experienceleague.adobe.com/en/docs/experience-manager-learn/foundation/development/understand-sling-model-exporter
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: @Exporter HTTP request flow, Jackson exporter behavior (getter-based serialization), when to use exporter vs. servlet, selector defaults, ExporterOption parameters.

[4] **Apache Sling Models — resourceType, adapters, interface and multiple implementations (Experience League Communities)**
    URL: https://sling.apache.org/documentation/bundles/models.html
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: adapters vs resourceType distinction, ImplementationPicker SPI, multiple implementations resolution order, interface+implementation best practice, adaptable selection guidance.

[5] **Sling Model Best Practices — techrevel.blog**
    URL: https://techrevel.blog/2023/10/11/sling-model-annotations-best-practices/
    Accessed: 2026-03-29
    Relevance: supplementary
    Extracted: ModelFactory vs adaptTo() comparison, @Inject discouraged rationale, mixed adaptables warning, abstract class patterns, @PostConstruct performance guidance.

[6] **Sling Model Exporters in AEM: An Overview — aem-blog.com**
    URL: https://www.aem-blog.com/post/sling-model-exporter-in-aem
    Accessed: 2026-03-29
    Relevance: supplementary
    Extracted: @Exporter annotation attributes (name, selector, extensions, options), Jackson annotation integration (@JsonIgnore, @JsonProperty), URL pattern for exported models, OSGi console verification path.
