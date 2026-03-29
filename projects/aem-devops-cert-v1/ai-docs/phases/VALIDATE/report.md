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
- **Details:** The home page loaded successfully with the "STUDY COMMAND CENTER" title and 4 navigation cards (Knowledge Graph, Reasoning Arena, Audio Lab, Teach Back). The page also shows an Exam Info panel and an Exam Domains section. Topic cards matched the `[class*="card"]` selector and returned a count > 0.
- **Screenshot:** screenshots/home.png

### Check 2: Navigation Between All Pages
- **Status:** PASS
- **Details:** All 5 routes navigated successfully: `/` (Home), `/podcast` (Audio Lab), `/quiz` (Reasoning Arena), `/teach-back` (Teach Back), `/research` (Knowledge Graph). Each page had visible content and URLs resolved correctly.
- **Screenshot:** screenshots/navigation.png

### Check 3: Podcast Page Lists Episodes with Audio Player
- **Status:** FAIL
- **Details:** The podcast page rendered an empty state — "No Podcasts Yet" with the message: "Podcast episodes will appear here once the CONTENT phase generates them with the --include-podcasts flag." The episode list shows 0 episodes. No `<audio>` element, no player component, no episode list items were found. The right sidebar confirms "0" episodes. This is an expected state when the pipeline was run without `--include-podcasts`.
- **Screenshot:** screenshots/podcast-fail.png

### Check 4: Quiz Page Shows Question with 4 Options
- **Status:** PASS
- **Details:** The quiz page rendered successfully with 48 questions loaded. Domain filter buttons are visible at the top. A full quiz card is rendered with question text, 4 labeled answer options (A, B, C, D), and a SUBMIT ANSWER button. The `[class*="card"]` and domain filter `button` selectors satisfied the count >= 4 threshold.
- **Screenshot:** screenshots/quiz.png

### Check 5: Answer Selection Enables Submit
- **Status:** FAIL
- **Details:** The test clicked the first matched button from the selector `button:not([class*="nav"]):not([class*="submit"]), [role="radio"], [class*="option"], [class*="answer"], label, [data-testid*="option"]`. The first match was a domain filter button (e.g., "ALL DOMAINS") rather than a quiz answer option. Clicking a domain filter button does not select a quiz answer. As a result, the SUBMIT LOGIC button remained `disabled` (it requires an answer option to be selected first). The actual answer option buttons have `data-testid="option-A"` etc. and would correctly enable the submit button when clicked, but the test selector matched domain filter buttons first.
- **Screenshot:** screenshots/quiz-submit-fail.png
- **Root Cause:** The Playwright selector is too broad — domain filter buttons match before answer option buttons in DOM order. The quiz component correctly disables submit until an answer is selected (`disabled={!selected}`), and clicking the domain filter does not count as a selection.

### Check 6: Teach-Back Page Has Textarea
- **Status:** PASS
- **Details:** The teach-back page ("Teach the Loom: AEM DevOps") loaded with a visible, enabled textarea for entering explanations. The input area is labeled "Begin your explanation here..." and is interactive.
- **Screenshot:** screenshots/teach-back.png

### Check 7: Research Page Renders Markdown Content
- **Status:** PASS
- **Details:** The research page (Knowledge Graph) loaded and contained heading elements, paragraphs, and content matching the `h1, h2, h3, p, [class*="content"]` selectors. Research content for AEM DevOps topics was rendered.
- **Screenshot:** screenshots/research.png

### Check 8: No JS Console Errors Across Pages
- **Status:** PASS
- **Details:** No JavaScript console errors were detected while visiting all 5 routes. React dev-mode warnings and Vite hot-reload noise were filtered out per the test spec.

## Console Errors

No console errors detected.

## Recommendations

### Check 3: Podcast Episodes Missing (Expected / Non-Critical)
The podcast page correctly shows an empty state when no episodes have been generated. This is expected behavior when the pipeline runs without `--include-podcasts`. To populate the podcast page:
- Re-run the pipeline with `npm start -- --target /path/to/output --include-podcasts`
- This will run the CONTENT phase (podcast-script) and TTS phase (audio generation)
- Once MP3 files are deposited to `public/podcasts/`, the Audio Lab page will show episode cards with a functional audio player

### Check 5: Submit Button Stays Disabled After Click (Test Selector Issue)
The underlying quiz component logic is correct — the SUBMIT ANSWER button enables correctly when an answer option is selected (confirmed by source inspection of `QuizCard.jsx`: `disabled={!selected}`). The test failure is caused by the Playwright selector matching domain filter buttons before answer option buttons in DOM order.

**Fix options (in priority order):**
1. Update the Playwright spec to use the `data-testid` attribute that is already present on answer buttons: `page.locator('[data-testid^="option-"]')`. This will precisely target answer options (A, B, C, D) without matching domain filters.
2. If the spec cannot be changed, reorder the DOM so answer options come before domain filter buttons — but this is a layout change that should not be made just for tests.

The actual submit-enable behavior works as intended when a real user clicks an answer option.
