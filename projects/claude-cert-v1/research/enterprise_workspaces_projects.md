# Projects and RAG

**Topic ID:** enterprise.workspaces.projects
**Researched:** 2026-03-01T14:32:00Z

## Overview

Claude Projects are self-contained workspaces that allow users to create dedicated environments with their own chat histories and knowledge bases [1]. Each project can store documents, code, and other files that Claude references across all conversations within that project, effectively giving Claude persistent context about specific domains or workflows. Projects are available to all Claude users, though free accounts are limited to five projects [2].

The defining feature for enterprise and team use is RAG (Retrieval-Augmented Generation), which automatically activates when project knowledge approaches or exceeds the base 200K token context window [3]. When RAG mode engages, project capacity expands by up to 10x while maintaining response quality [1]. This happens seamlessly without configuration, allowing teams to upload hundreds of documents without worrying about context limits. For Team and Enterprise plans, projects gain additional collaboration features including sharing permissions and organization-wide visibility [2].

Understanding when RAG activates versus when Claude uses direct in-context processing is critical for exam scenarios. The system chooses the optimal approach automatically: smaller knowledge bases load directly into context for fastest processing, while larger collections trigger intelligent retrieval that pulls only relevant chunks [3].

## Key Concepts

- **Project Knowledge Base** — The repository of files uploaded to a project that Claude references in all conversations within that project [2]. Content in the knowledge base persists across sessions and is available to all project chats, unlike regular conversation uploads which are ephemeral.

- **RAG Mode (Retrieval-Augmented Generation)** — An automatic mode that activates when project knowledge exceeds context limits [3]. Instead of loading all content into memory, Claude uses a "project knowledge search tool" to retrieve only the most relevant information for each query [1].

- **Context Window** — The maximum amount of information Claude can process in a single conversation: 200K tokens standard, 500K tokens for Enterprise users with Claude Sonnet 4.5 [4]. Projects with RAG can store up to 10x more content than the context window allows [1].

- **Project Instructions** — Custom directives set per-project that define Claude's behavior, tone, or role for all conversations within that project [2]. Instructions consume context tokens, so keeping them concise preserves space for actual content.

- **Sharing Permissions** — Team and Enterprise plans support two permission levels: "Can use" (view and chat only) and "Can edit" (modify instructions, knowledge, and member settings) [2]. Organization-wide sharing can be disabled by administrators.

- **Contextual Retrieval** — Anthropic's advanced RAG technique that prepends chunk-specific context before embedding, reducing retrieval failures by up to 67% when combined with reranking [5]. This powers the improved accuracy of project RAG mode.

## Technical Details

**File Upload Limits:**
- Maximum file size: 30MB per file [6]
- Claude Chat: 20 files per conversation [6]
- Claude Projects: Unlimited files in knowledge base [6]
- Supported formats: PDF, DOCX, CSV, TXT, HTML, ODT, RTF, EPUB, JSON, XLSX, plus images (JPEG, PNG, GIF, WEBP) and audio (MP3, WAV in projects only) [6]

**PDF Processing Thresholds [6]:**
```
Under 100 pages   → Full multimodal analysis (text + visuals)
100-1000 pages    → Text only, no visual analysis
Over 1000 pages   → Text extraction only
```

**Context Window Allocation [4]:**
```
Standard (Pro/Max/Team):     200,000 tokens (~500 pages)
Enterprise (Sonnet 4.5):     500,000 tokens
API Beta (eligible orgs):    1,000,000 tokens (2x input pricing)
```

**RAG Activation Logic:**
RAG engages automatically when project knowledge approaches the context window threshold [3]. If project content later drops below the limit, Claude automatically converts back to context-based processing [1]. Users see a visual indicator when RAG mode is active, and Claude explicitly shows when it uses the "project knowledge search tool" during retrieval [1].

## Common Patterns

**Enterprise Knowledge Management:**
Support teams centralize product documentation, FAQs, and solution databases in shared Projects [2]. Team members with "Can use" permissions query the knowledge base without risk of accidentally modifying it, while designated editors maintain content currency. This creates a self-service knowledge layer that reduces escalations.

**Research Corpus Analysis:**
Researchers upload collections of papers, survey data, and interview transcripts [2]. Project instructions enforce academic citation standards and analytical rigor. Claude synthesizes findings, identifies contradictions, and detects patterns across the entire research corpus, with RAG enabling corpora far larger than the 200K context limit.

**Multi-Department Collaboration:**
Enterprise organizations create domain-specific projects (legal, engineering, HR) with appropriate sharing permissions [2]. Each department maintains its own knowledge base while project-level isolation prevents cross-contamination of sensitive information.

**Optimizing for Speed:**
When response latency matters most, keep project knowledge under the RAG threshold (~200K tokens) to use faster in-context processing [3]. For comprehensive coverage where latency is acceptable, leverage RAG's 10x capacity expansion.

## Gotchas

**Context vs. Knowledge Storage Confusion:**
Projects support unlimited file storage, but Claude can only pull up to 200K or 500K tokens into any single response, depending on plan [4]. RAG does not increase the per-response limit; it increases how much content can be searched. Exam questions may test understanding of this distinction.

**Chat Context Is Not Shared:**
Context is not shared across chats within a project unless the information is added to the project knowledge base [2]. Starting a new chat in the same project does not carry forward conversation history from previous chats.

**Project Instructions Are Invisible to Claude:**
When creating projects, the name and description you provide are for your organization only; Claude does not have access to these details [2]. All guidance must go in project instructions, which Claude does see.

**RAG Does Not Provide Inline Citations:**
A current limitation of the built-in RAG feature is that output does not provide claim-specific source citations [7]. For use cases requiring explicit citations or precise control over retrieval logic, custom RAG implementations may be necessary.

**Tools and Connectors Consume Context:**
Tools and connectors are token-intensive and directly impact available context space [4]. When using projects with MCP connectors, web search, or extended thinking, the effective knowledge capacity is reduced.

**Archived Projects Lose Sharing:**
When you archive a project, sharing permissions reset to private [2]. If you later unarchive the project, you must re-share it with team members.

**Free Plan RAG Limitations:**
While RAG is listed as available on all plans [1], the most robust capacity expansion (10x) and enhanced retrieval accuracy are primarily benefits for paid plans (Pro, Max, Team, Enterprise) [3]. Free users get basic functionality without the same scaling.

## Sources

[1] **Retrieval augmented generation (RAG) for projects | Claude Help Center**
    URL: https://support.claude.com/en/articles/11473015-retrieval-augmented-generation-rag-for-projects
    Accessed: 2026-03-01
    Relevance: primary
    Extracted: RAG activation mechanism, 10x capacity expansion, project knowledge search tool behavior, best practices for file naming and grouping, automatic conversion back to context-based processing.

[2] **What are projects? | Claude Help Center + How can I create and manage projects?**
    URL: https://support.claude.com/en/articles/9517075-what-are-projects
    URL: https://support.claude.com/en/articles/9519177-how-can-i-create-and-manage-projects
    Accessed: 2026-03-01
    Relevance: primary
    Extracted: Project definition and structure, knowledge base functionality, free account 5-project limit, sharing permissions (Can use/Can edit), project instructions, context not shared across chats, archive behavior.

[3] **Retrieval augmented generation (RAG) for projects (search results synthesis)**
    URL: https://support.claude.com/en/articles/11473015-retrieval-augmented-generation-rag-for-projects
    Accessed: 2026-03-01
    Relevance: primary
    Extracted: RAG availability across all plans, automatic activation when approaching context limits, seamless transition, maintained response quality.

[4] **Understanding usage and length limits | Claude Help Center**
    URL: https://support.claude.com/en/articles/11647753-understanding-usage-and-length-limits
    Accessed: 2026-03-01
    Relevance: primary
    Extracted: 200K standard context window, 500K for Enterprise with Sonnet 4.5, usage limits apply across all Claude surfaces, tools and connectors are token-intensive, automatic summarization for long conversations.

[5] **Contextual Retrieval | Anthropic**
    URL: https://www.anthropic.com/news/contextual-retrieval
    Accessed: 2026-03-01
    Relevance: supplementary
    Extracted: Contextual Embeddings and Contextual BM25 techniques, 35-67% reduction in retrieval failures, prepending chunk-specific context before embedding, implementation costs with prompt caching.

[6] **Uploading files to Claude | Claude Help Center + Claude file upload limits**
    URL: https://support.claude.com/en/articles/8241126-uploading-files-to-claude
    Accessed: 2026-03-01
    Relevance: supplementary
    Extracted: 30MB per file limit, 20 files per chat vs unlimited in projects, supported file types (10 document types, 4 image types, audio in projects), PDF processing tiers based on page count.

[7] **Testing Claude Projects' New RAG Feature | PromptRevolution**
    URL: https://promptrevolution.poltextlab.com/testing-claude-projects-new-rag-feature-fast-setup-accurate-retrieval-across-113-articles/
    Accessed: 2026-03-01
    Relevance: supplementary
    Extracted: Limitation that RAG output does not provide claim-specific source citations, custom RAG may be preferable for citation-heavy use cases.
