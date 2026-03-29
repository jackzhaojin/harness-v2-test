---
name: reference-lookup
description: Look up relevant research content to support coaching during quiz or teach-back sessions
---

# Research Reference Lookup

Find and extract relevant research content for a given concept or question. Used during interactive coaching sessions to ground feedback in source material.

## Input

- `{{QUERY}}` -- the concept, term, or question to look up
- `{{RESEARCH_DIR}}` -- path to the directory containing research markdown files

## Procedure

1. **Extract key terms.** Parse `{{QUERY}}` to identify the most important search terms. Consider synonyms and related terms (e.g., "caching" might also appear as "cache", "cached", "memoization").

2. **Search across research files.** Use Grep to find mentions of the key terms across all markdown files in `{{RESEARCH_DIR}}`. Search broadly first, then narrow down.

3. **Rank results by relevance.** Prioritize files and sections where:
   - Multiple key terms appear in close proximity
   - The term appears in a heading (indicating a dedicated section)
   - The content provides explanations, not just passing mentions

4. **Read the most relevant files.** Read the top 1-3 files identified by the search. Do not read every file in the directory.

5. **Extract focused excerpts.** Pull out the specific paragraphs or sections that directly address `{{QUERY}}`. Do not return entire files. Each excerpt should be self-contained and useful for coaching.

6. **Identify related topics.** Note any other topics or concepts referenced in the excerpts that the learner might want to explore next.

## Output Format

Return a single JSON object:

```json
{
  "found": true,
  "excerpts": [
    {
      "source": "research/03-caching-strategies.md",
      "content": "The relevant paragraph or section text extracted from the file..."
    },
    {
      "source": "research/07-performance.md",
      "content": "Another relevant section from a different file..."
    }
  ],
  "relatedTopics": [
    "cache invalidation",
    "CDN configuration",
    "TTL strategies"
  ]
}
```

- `found`: boolean, whether any relevant content was located
- `excerpts`: array of source-attributed content snippets (aim for 1-3)
- `relatedTopics`: array of related concept names found in or near the excerpts

## When Nothing Is Found

If no relevant research content is found, return:

```json
{
  "found": false,
  "excerpts": [],
  "relatedTopics": []
}
```

## Notes

- Keep excerpts concise. A few paragraphs per excerpt is ideal. Do not dump entire files.
- Preserve the original wording from the research files. Do not paraphrase or summarize.
- If the query is ambiguous, search for multiple interpretations and include the most relevant results.
- This skill is a support function called by other skills (evaluate-rationale, score-explanation). Speed matters.
