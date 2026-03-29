# AEM Maven Plugins

**Topic ID:** build-deployments.maven.plugins
**Researched:** 2026-03-29T00:00:00Z

## Overview

AEM projects rely on three primary Maven plugins to manage content packaging, deployment, and frontend compilation: `filevault-package-maven-plugin` (Apache Jackrabbit), `content-package-maven-plugin` (Adobe/Day CQ), and `frontend-maven-plugin` (eirslett). Together these plugins form the build pipeline backbone that takes source code and assets and produces the structured artifacts needed to deploy to AEM [1][2].

The `filevault-package-maven-plugin` is the modern standard for building content packages. It replaced the older Adobe `content-package-maven-plugin` as the tool responsible for package creation, and is the only plugin officially supported for AEM as a Cloud Service [2]. The Adobe plugin was retained in a slimmed-down form specifically for deploying packages to AEM instances via CRX Package Manager — the two plugins now have non-overlapping responsibilities that can coexist in the same project [3].

The `frontend-maven-plugin` handles the integration of modern JavaScript build tooling (Node.js, npm, Webpack) into the Maven build lifecycle. AEM's `ui.frontend` module uses it to compile TypeScript, SCSS, and other frontend assets into AEM client libraries without requiring globally installed Node.js on the build host [4].

## Key Concepts

- **filevault-package-maven-plugin** — Apache Jackrabbit plugin (`org.apache.jackrabbit`) that creates content package ZIP artifacts from JCR source. It is the only package-build plugin supported on AEMaaCS. It adds validation capabilities and package type enforcement absent from the legacy Adobe plugin [2][3].

- **content-package-maven-plugin** — Adobe/Day CQ plugin (`com.day.jcr.vault`) that manages deployment to AEM via CRX Package Manager. Since version 1.0.2, all package creation functionality was removed; it now only handles goals such as `install`, `rm`, `ls`, `build`, and `uninstall` [5].

- **Package types** — The filevault plugin enforces three explicit types: `application` (immutable code under `/apps`), `content` (mutable data under `/content`, `/conf`), and `container` (holds sub-packages and OSGi bundles only). Setting `packageType` explicitly is required for AEMaaCS compatibility [1][6].

- **Container package (`all`)** — The singular deployment artifact that embeds all other packages. Cloud Manager deploys only this package; all others must carry `<cloudManagerTarget>none</cloudManagerTarget>` to be excluded from direct deployment [1][6].

- **`<embeddeds>` vs `<subPackages>`** — `<embeddeds>` explicitly targets packages to install at specific paths under `/apps/<app>-packages/(content|application|container)/install(.author|.publish)?`. The `<subPackages>` configuration is deprecated and must not be used [1].

- **`repositoryStructurePackage`** — Required only for `application`-type packages. It enforces structural dependency correctness to ensure code packages do not install over each other [1][6].

- **frontend-maven-plugin** — eirslett plugin (`com.github.eirslett`) that downloads and installs Node.js/npm locally within the project (not globally), then executes npm, webpack, or other tool goals. Used in the `ui.frontend` module of AEM archetype projects [4][7].

- **aem-clientlib-generator** — npm package used inside `ui.frontend` that transforms Webpack build output into AEM client libraries, placing them into the `ui.apps` module's clientlib directories [4].

## Technical Details

### filevault-package-maven-plugin Configuration

The plugin requires `<extensions>true</extensions>` to register its custom lifecycle bindings and content-package artifact handler [2]:

```xml
<plugin>
  <groupId>org.apache.jackrabbit</groupId>
  <artifactId>filevault-package-maven-plugin</artifactId>
  <version>1.4.0</version>
  <extensions>true</extensions>
  <configuration>
    <packageType>application</packageType>
  </configuration>
</plugin>
```

The lifecycle binds to these phases automatically for `content-package` packaging [2]:
- `generate-test-sources` → `generate-metadata`
- `process-test-sources` → `validate-files`
- `package` → `package`
- `verify` → `validate-package`

Package type rules enforced by the plugin [6]:

| Package Type | Allowed Paths | Sub-packages / Bundles |
|---|---|---|
| `application` | `/apps`, `/libs` only | Not allowed |
| `content` | `/content`, `/conf`, `/home`, etc. | Not allowed |
| `container` | N/A (wraps others) | Only type that allows them |

Embedding sub-packages in the `all` container with author/publish targeting [1]:

```xml
<configuration>
  <packageType>container</packageType>
  <embeddeds>
    <embedded>
      <groupId>com.example</groupId>
      <artifactId>myapp.ui.apps</artifactId>
      <type>zip</type>
      <target>/apps/myapp-packages/application/install</target>
    </embedded>
    <embedded>
      <groupId>com.example</groupId>
      <artifactId>myapp.ui.content</artifactId>
      <type>zip</type>
      <target>/apps/myapp-packages/content/install</target>
    </embedded>
  </embeddeds>
</configuration>
```

For `application` packages, reference the repository structure package to enforce structural dependencies [1]:

```xml
<configuration>
  <packageType>application</packageType>
  <repositoryStructurePackages>
    <repositoryStructurePackage>
      <groupId>com.example</groupId>
      <artifactId>myapp.ui.apps.structure</artifactId>
    </repositoryStructurePackage>
  </repositoryStructurePackages>
</configuration>
```

Mark all non-container packages to prevent Cloud Manager from deploying them directly [1]:

```xml
<configuration>
  <properties>
    <cloudManagerTarget>none</cloudManagerTarget>
  </properties>
</configuration>
```

### content-package-maven-plugin Configuration

The plugin manages deployment goals. It no longer requires `<extensions>true</extensions>` since v1.0.2 [3][5]:

```xml
<plugin>
  <groupId>com.day.jcr.vault</groupId>
  <artifactId>content-package-maven-plugin</artifactId>
  <version>1.0.4</version>
  <configuration>
    <userId>admin</userId>
    <password>admin</password>
    <targetURL>http://localhost:4502/crx/packmgr/service.jsp</targetURL>
    <failOnError>false</failOnError>
    <timeout>5</timeout>
  </configuration>
</plugin>
```

Goals available via `mvn content-package:[goal]` [5]:
- `install` — deploys package to AEM (bound to Maven install phase)
- `build` — builds content packages already defined on an AEM instance
- `ls` — lists packages deployed to Package Manager
- `rm` — removes packages from Package Manager
- `uninstall` — removes installed packages while retaining them server-side

### frontend-maven-plugin Configuration

Correct coordinates are `com.github.eirslett:frontend-maven-plugin`. The plugin installs Node/npm locally under the project `node` directory [4][7]:

```xml
<plugin>
  <groupId>com.github.eirslett</groupId>
  <artifactId>frontend-maven-plugin</artifactId>
  <version>1.15.1</version>
  <configuration>
    <nodeVersion>v21.5.0</nodeVersion>
    <npmVersion>10.2.4</npmVersion>
    <workingDirectory>src/main/frontend</workingDirectory>
  </configuration>
  <executions>
    <execution>
      <id>install node and npm</id>
      <goals>
        <goal>install-node-and-npm</goal>
      </goals>
    </execution>
    <execution>
      <id>npm install</id>
      <goals>
        <goal>npm</goal>
      </goals>
      <configuration>
        <arguments>install</arguments>
      </configuration>
    </execution>
    <execution>
      <id>npm run build</id>
      <goals>
        <goal>npm</goal>
      </goals>
      <configuration>
        <arguments>run build:production</arguments>
      </configuration>
    </execution>
  </executions>
</plugin>
```

Full list of supported goals [7]:
- `install-node-and-npm`, `install-node-and-yarn`, `install-node-and-corepack`, `install-bun`
- `npm`, `yarn`, `corepack`, `bun`, `npx`
- `bower`, `grunt`, `gulp`, `jspm`, `webpack`, `karma`

## Common Patterns

**Single `all` container deployment pattern**: The `all` module's `pom.xml` uses filevault to embed all sub-packages. Cloud Manager deploys only `all.zip`. Every other package's pom carries `cloudManagerTarget=none`. This pattern is mandatory for AEMaaCS and best practice for AEM 6.5+ [1][6].

**Dual-plugin coexistence for local development**: Teams targeting AEM 6.5 on-premises often run filevault to build packages and the Adobe content-package plugin to auto-install them to a local instance during development. Both plugins coexist in the same POM without conflict since filevault v1.0.2 dropped its build functionality from Adobe's plugin [3].

**`ui.frontend` build chain**: The frontend-maven-plugin installs the correct Node.js version locally, runs `npm install`, then `npm run build`. The Webpack build compiles assets; `aem-clientlib-generator` then writes the output as clientlibs into `ui.apps/src/main/content/jcr_root/apps/<app>/clientlibs/`. This whole chain is triggered as part of `mvn clean install` on the `ui.frontend` module [4].

**Environment-specific embedding with author/publish targeting**: Sub-packages intended only for AEM Author use the install path `.../install.author`; those for Publish use `.../install.publish`. This avoids deploying author-only configs to publish and vice versa [1].

**Project archetype module layout**:
- `ui.apps` — `application` package, holds `/apps` content
- `ui.content` — `content` package, holds `/content`, `/conf`
- `ui.config` — `application` or `container`, holds OSGi configs
- `ui.frontend` — produces clientlibs via Webpack/npm
- `all` — `container` package, embeds all of the above [6]

## Gotchas

**`<subPackages>` is deprecated — use `<embeddeds>` instead.** Using `<subPackages>` causes the target path to be computed from the artifact's vault property file rather than explicitly declared, which breaks AEMaaCS validation. The exam is very likely to test this distinction [1].

**`<extensions>true</extensions>` must be set on filevault, not Adobe's plugin.** Since content-package-maven-plugin v1.0.2, the Adobe plugin no longer uses extensions. Adding `<extensions>true</extensions>` to it causes errors. Only the Jackrabbit filevault plugin needs this [3].

**filevault creates packages from source directory only.** The old Adobe plugin could package from both source and target folders. The Jackrabbit plugin strictly uses the source directory. Code relying on generated content appearing in target during packaging will fail [3].

**Container packages cannot have install hooks in AEMaaCS.** Install hooks are allowed in AEM 6.x but are explicitly prohibited in container packages for AEM as a Cloud Service. Build validation will fail [1][6].

**`repositoryStructurePackage` is only required for `application` packages, not `content` or `container`.** Misconfiguring this on the wrong package type is a common mistake [1].

**Cloud Manager deploys ALL packages by default.** Without `<cloudManagerTarget>none</cloudManagerTarget>` on every non-`all` package, Cloud Manager will attempt to deploy them individually, potentially causing conflicts. The `all` container is the only package that should deploy [1][6].

**frontend-maven-plugin groupId confusion.** The correct groupId is `com.github.eirslett`, not `com.tutorials.aem` or other variants seen in older tutorials. Using the wrong groupId results in artifact resolution failures [4][7].

**`install-node-and-npm` only runs on a full project build.** Incremental builds skip it to avoid redundant downloads. This can cause issues if Node/npm is missing from the local install directory and you skip the install phase [7].

**Apple Silicon (M1/M2/M3) build failures.** Older `nodeVersion` values pinned in `ui.frontend/pom.xml` may reference x64 binaries incompatible with ARM architecture. The fix is updating to an LTS Node.js version that ships with universal or ARM binaries [4].

**`mixed` packageType is strongly discouraged.** While the plugin supports `mixed` as a packageType, using it disables most validation and produces packages that fail AEMaaCS build analysis. Always explicitly specify one of the three valid types [6].

## Sources

[1] **AEM Project Structure — Adobe Experience Manager**
    URL: https://experienceleague.adobe.com/en/docs/experience-manager-cloud-service/content/implementing/developing/aem-project-content-package-structure
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: Package type rules, `embeddeds` vs `subPackages`, Cloud Manager deployment target, container package restrictions, `repositoryStructurePackage` usage, author/publish install paths

[2] **Jackrabbit FileVault Package Maven Plugin — Introduction**
    URL: https://jackrabbit.apache.org/filevault-package-maven-plugin/
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: Plugin overview, basic configuration with `<extensions>true</extensions>`, lifecycle phase bindings, latest version (1.4.0), plugin goals

[3] **Jackrabbit FileVault Package Maven Plugin — Migrating from Adobe's Content Package Maven Plugin**
    URL: https://jackrabbit.apache.org/filevault-package-maven-plugin/migrating.html
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: Migration steps, what was removed from Adobe's plugin, dual-plugin coexistence, source-directory-only limitation, extensions flag clarification

[4] **Front-End Development with the AEM Project Archetype — Adobe Experience Manager**
    URL: https://experienceleague.adobe.com/en/docs/experience-manager-core-components/using/developing/archetype/front-end
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: frontend-maven-plugin role in ui.frontend, Webpack build chain, aem-clientlib-generator, npm scripts, Apple Silicon gotcha

[5] **Adobe Content Package Maven Plugin — Adobe Experience Manager**
    URL: https://experienceleague.adobe.com/en/docs/experience-manager-cloud-service/content/implementing/developer-tools/maven-plugin
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: Goals (install, build, ls, rm, uninstall), key parameters (userId, password, targetURL, timeout, failOnError), plugin coordinates

[6] **Content Package Type Validation Forces Rethink of Standard Project Structure — Bounteous**
    URL: https://www.bounteous.com/insights/2021/06/17/content-package-type-validation-forces-rethink-standard-project-structure-adobe/
    Accessed: 2026-03-29
    Relevance: supplementary
    Extracted: Before/after project restructuring examples, package type enforcement impact, OSGi bundle separation, workspace filter conflict gotcha

[7] **GitHub — eirslett/frontend-maven-plugin**
    URL: https://github.com/eirslett/frontend-maven-plugin
    Accessed: 2026-03-29
    Relevance: primary
    Extracted: Correct groupId/artifactId, complete list of supported goals, configuration parameters (nodeVersion, npmVersion, workingDirectory, installDirectory), incremental build behavior
