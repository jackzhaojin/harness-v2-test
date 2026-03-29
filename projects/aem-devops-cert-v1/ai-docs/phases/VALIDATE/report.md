# UI Validation Report

**Validated:** 2026-03-29T00:00:00Z
**Target:** /Users/jackjin/dev/harness-v2-test/projects/aem-devops-cert-v1
**Dev Server:** http://localhost:5173

## Summary

- **Total Checks:** 8
- **Passed:** 6
- **Failed:** 2
- **Overall:** FAIL

## Results

### Check 1: Home Page Renders with Topic Cards
- **Status:** PASS
- **Details:** Home page loaded successfully. The locator `[class*="card"], [class*="topic"], [data-testid*="topic"], a[href*="research"]` matched at least 1 element on the page.
- **Screenshot:** screenshots/home.png

### Check 2: Navigation Between All Pages
- **Status:** PASS
- **Details:** All 5 routes responded with visible content: `/` (Home), `/podcast` (Podcast), `/quiz` (Quiz), `/teach-back` (Teach-Back), `/research` (Research). Each page URL matched the expected path and body text exceeded 10 characters.
- **Screenshot:** screenshots/nav.png

### Check 3: Podcast Page Lists Episodes with Audio Player
- **Status:** FAIL
- **Details:** The podcast page rendered a "No Podcasts Yet" empty state with zero episode items and zero audio elements. The locator `[class*="episode"], [class*="podcast"], [data-testid*="episode"], li, [class*="card"]` returned 0 matches. Root cause: `manifest.json` has `podcastEpisodes: []` — the pipeline was run without the `--include-podcasts` flag, so no podcast scripts or audio files were generated.
- **Screenshot:** screenshots/podcast-fail.png

### Check 4: Quiz Page Shows Question with 4 Options
- **Status:** PASS
- **Details:** Quiz page loaded a question from `quizzes.json` with body text well over 20 characters. The option locator `button:not([class*="nav"]):not([class*="submit"]), [role="radio"], [class*="option"], [class*="answer"], label, [data-testid*="option"]` returned 4 or more matches.
- **Screenshot:** screenshots/quiz.png

### Check 5: Answer Selection Enables Submit
- **Status:** FAIL
- **Details:** After clicking the first answer option button (which calls `setSelected(letter)` in QuizCard), the submit button labeled "SUBMIT LOGIC" remained `disabled`. Playwright found `<button disabled class="... opacity-40 cursor-not-allowed">SUBMIT LOGIC</button>`. The button text expected by the test spec is "Submit", "Check", or "Next", but the actual button text in the component is "SUBMIT ANSWER". The test clicked the option button (one of the answer buttons) but since the option buttons are matched by `button:not([class*="nav"]):not([class*="submit"])`, and the submit button itself has class `gradient-cta` (not `submit`), the submit button itself was matched as an option and clicked first — it was already disabled before any answer was selected. The submit button remains `disabled={!selected}` until a valid answer letter is chosen via one of the option letter buttons.
- **Screenshot:** screenshots/quiz-submit-fail.png

### Check 6: Teach-Back Page Has Textarea
- **Status:** PASS
- **Details:** The teach-back page rendered with a `textarea` or `[contenteditable]` element that was enabled and interactive.
- **Screenshot:** screenshots/teach-back.png

### Check 7: Research Page Renders Markdown Content
- **Status:** PASS
- **Details:** The research page rendered with `h1`, `h2`, `h3`, `p`, or content-class elements present and visible.
- **Screenshot:** screenshots/research.png

### Check 8: No JS Console Errors Across Pages
- **Status:** PASS
- **Details:** No JavaScript console errors were collected while visiting all 5 routes. React DevTools notices, HMR messages, and `Warning:` prefixed messages were filtered out per spec.

## Console Errors

No console errors detected.

## Failure Analysis

### Check 3: Podcast Page — Expected Behavior (Content Dependency)

This is a **content-driven failure**, not a code bug. The podcast feature is intentionally gated behind `--include-podcasts`. The page correctly renders an empty state when `manifest.podcastEpisodes` is empty. However, the test spec expects at least one episode item, so the check fails.

- `public/manifest.json` → `podcastEpisodes: []`
- `podcasts/scripts/` → empty directory
- `podcasts/audio/` → empty directory

**Resolution:** Re-run the pipeline with `--include-podcasts` flag to generate podcast scripts and TTS audio. Once `podcastEpisodes` is populated in `manifest.json`, this check will pass automatically.

### Check 5: Quiz Submit Button — Test Spec / Component Mismatch

This is a **test spec sensitivity issue** combined with a button labeling discrepancy. Two sub-issues:

1. **Button text mismatch:** The Playwright spec looks for `button:has-text("Submit")` but the actual button text in `QuizCard.jsx` (line 145) is `"SUBMIT ANSWER"`. The spec does not include `"SUBMIT ANSWER"` as a recognized submit button text — only "Submit", "Check", "Next", and `[type="submit"]`.

2. **Option selector over-matches the submit button:** The disabled submit button has `class="... gradient-cta ..."` with no `nav` or `submit` substring, so it is matched by the option selector `button:not([class*="nav"]):not([class*="submit"])`. When `options.first()` is clicked, it targets the disabled submit button (the last button in DOM order, or first depending on layout), not an answer letter button. Since the submit button is `disabled`, the click has no effect, and `selected` remains `null`, keeping the submit button disabled.

**Resolution (recommended):** Update `QuizCard.jsx` to add `data-testid="submit-answer"` to the submit button and add a class substring like `btn-submit` to its className, so the option selector excludes it. Alternatively, add "SUBMIT ANSWER" to the spec's submit locator string. The submit-enable logic itself (`disabled={!selected}`) is correct — it's the test's selectors that need tightening.

## Recommendations

1. **Podcasts (Check 3):** Re-run the CONTENT and TTS phases with `--include-podcasts` to populate episodes. No code changes needed.

2. **Quiz Submit (Check 5):** Add `data-testid="submit-answer"` to the submit button in `QuizCard.jsx` and update the test spec to include `button:has-text("SUBMIT ANSWER")` or `[data-testid="submit-answer"]` in its submit locator. Also add a distinguishing class (e.g., `btn-submit`) to the submit button to prevent the option selector from matching it.
