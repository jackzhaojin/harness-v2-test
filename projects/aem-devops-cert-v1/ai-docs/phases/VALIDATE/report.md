# UI Validation Report

**Validated:** 2026-03-29T00:00:00Z
**Target:** /Users/jackjin/dev/harness-v2-test/projects/aem-devops-cert-v1
**Dev Server:** http://localhost:5173
**Playwright Version:** 1.58.2
**Run notes:** Stale PID on port 5173 killed before starting fresh dev server. Prior report overwritten.

## Summary

- **Total Checks:** 8
- **Passed:** 6
- **Failed:** 2
- **Overall:** FAIL

---

## Results

### Check 1: Home Page Renders with Topic Cards
- **Status:** PASS
- **Details:** Home page loaded at `/`. The "STUDY COMMAND CENTER" heading rendered with 4 navigation feature cards (Knowledge Graph, Reasoning Arena, Audio Lab, Teach Back), an Exam Info panel (52 topics, 6 domains), and an Exam Domains section below. The locator `[class*="card"]` matched multiple elements (count > 0). No crashes or blank pages.
- **Screenshot:** screenshots/home-check1.png

---

### Check 2: Navigation Between All 5 Routes
- **Status:** PASS
- **Details:** All 5 routes navigated successfully and returned visible content exceeding 10 characters:
  - `/` — Study Command Center / Dashboard
  - `/podcast` — Audio Lab (empty state, no episodes)
  - `/quiz` — Reasoning Arena with domain filter buttons and questions
  - `/teach-back` — Teaching Console with topic picker and textarea
  - `/research` — Knowledge Graph with article and topic tree
  URL changes were confirmed per route.

---

### Check 3: Podcast Page Lists Episodes with Audio Player
- **Status:** FAIL
- **Details:** The podcast page rendered correctly but showed the empty state: "No Podcasts Yet — Podcast episodes will appear here once the CONTENT phase generates them with the `--include-podcasts` flag." The right panel shows "Episodes: 0 — No episodes generated yet." No `<audio>` element, player component, episode list, or `[class*="card"]` elements were present. The Playwright locator returned 0 elements; the test expects > 0.

  This is a content-conditional state. The UI code is correct and handles the empty state gracefully. No podcast scripts were generated because the pipeline was run without `--include-podcasts`.
- **Screenshot:** screenshots/podcast-check3-fail-fresh.png
- **Root cause:** Pipeline run without `--include-podcasts`. No podcast content exists. UI code is not defective.
- **Fix:** Re-run from CONTENT with `--include-podcasts`:
  ```
  npm run regen -- --from CONTENT --target /Users/jackjin/dev/harness-v2-test/projects/aem-devops-cert-v1 --run -- --include-podcasts
  ```

---

### Check 4: Quiz Page Shows Question with 4 Options
- **Status:** PASS
- **Details:** The quiz page rendered the Reasoning Arena. The top area shows domain filter buttons (ALL DOMAINS, DISPATCHER CACHE INVALIDATION, CODE QUALITY GATES AND PIPELINE TYPES, etc.) which matched the test's broad button selector as "options." Count exceeded 4 required. The page has substantial visible content. The quiz loads questions successfully from `quizzes.json`.

  Note: The selector `button:not([class*="nav"]):not([class*="submit"])` matched domain-filter buttons rather than answer-option buttons — this is a selector granularity issue in the test spec that is documented in Check 5 below. The quiz loads and renders question content correctly.
- **Screenshot:** screenshots/quiz-check4-pass.png

---

### Check 5: Answer Selection Enables Submit
- **Status:** FAIL
- **Details:** This check failed on a fresh server. The failure is **real but the root cause is a test-spec selector defect, not application code**. Here is the exact failure chain:

  1. The test navigated to `/quiz` — the quiz page loaded correctly ("Reasoning Arena" active in sidebar).
  2. The test ran `options.first().click()` using selector `button:not([class*="nav"]):not([class*="submit"])`.
  3. This broad selector matches the sidebar "INITIATE TEACHING" button (`AppLayout.jsx` lines 62-67), which has no "nav" or "submit" in its CSS class names: `w-full py-3 gradient-cta text-on-primary-container rounded-xl font-headline font-bold text-xs tracking-widest uppercase ...`.
  4. Clicking "INITIATE TEACHING" called `navigate('/teach-back')`, navigating away from the quiz page.
  5. The test then searched for `button:has-text("Submit")` (case-insensitive, partial match).
  6. On the teach-back page, this matched `<button>SUBMIT LOGIC</button>` in `TeachBackInput.jsx` line 222.
  7. That button is disabled (requires text input: `disabled={!text.trim() || grading}`), so the assertion `toBeEnabled()` failed.

  Playwright error: `Expected: enabled / Received: disabled`. The resolved locator was confirmed: `<button disabled class="px-8 py-3 bg-secondary ...opacity-40 cursor-not-allowed">SUBMIT LOGIC</button>`.

  **Application code review confirms `QuizCard.jsx` is correct:**
  - Line 147: `SUBMIT ANSWER` (not "SUBMIT LOGIC")
  - Line 141: `disabled={!selected}` — correctly enables when an answer is selected
  - Answer option buttons have `data-testid="option-{letter}"` (A, B, C, D)
  - Submit button has `data-testid="submit-answer"`

  The quiz submit flow works as designed. The test spec selector is too broad.
- **Screenshot:** screenshots/quiz-check5-fail.png (shows teach-back page rendered at the time of failure — "Teach Back" active in sidebar, "Teach the Loom: AEM DevOps" heading visible)
- **Root cause:** Test selector `button:not([class*="nav"]):not([class*="submit"])` inadvertently matches the sidebar "INITIATE TEACHING" button, navigating to `/teach-back`. The teach-back "SUBMIT LOGIC" button is then found disabled.
- **Fix (test spec — Priority 1):** Use the existing `data-testid` attributes in Check 5:
  ```javascript
  const options = page.locator('[data-testid^="option-"]');
  await options.first().click();
  const submit = page.locator('[data-testid="submit-answer"]');
  await expect(submit).toBeEnabled();
  ```
- **Fix (app hardening — optional):** Add `data-testid="initiate-teaching"` to the "INITIATE TEACHING" button in `AppLayout.jsx` line 62. This doesn't change behavior but makes the sidebar button more identifiable to test tooling.

---

### Check 6: Teach-Back Page Has Textarea
- **Status:** PASS
- **Details:** The `/teach-back` Teaching Console rendered with a `<textarea>` input and a full topic picker grid (20+ AEM concept buttons). The textarea is enabled and has placeholder text: "Begin your explanation here... Select a topic above or start teaching the AI your understanding." The page includes the Logic Fidelity status panel and Grading Dashboard sidebar. The "SUBMIT LOGIC" button is present but correctly disabled until text is entered.
- **Screenshot:** screenshots/teachback-check6-pass.png

---

### Check 7: Research Page Renders Markdown Content
- **Status:** PASS
- **Details:** The `/research` Knowledge Graph page rendered a full research article for "OSGi Factory Configurations" with `h2` header ("Overview"), multiple paragraphs of technical content, topic ID metadata, Researched timestamp, and a Synthesis Links sidebar. The left panel shows a hierarchical domain/topic tree. Content is rich, complete, and well-structured. Multiple `h1`, `h2`, `p`, and structured elements were found by the locator.
- **Screenshot:** screenshots/research-check7-pass.png

---

### Check 8: No JS Console Errors Across Pages
- **Status:** PASS
- **Details:** No JavaScript console errors were detected across all 5 routes. React DevTools warnings, HMR/vite noise, and `Warning:` strings were filtered per the test spec configuration. All pages loaded cleanly without runtime errors.

---

## Console Errors

No console errors detected.

---

## Prior Run Comparison

The prior validation report (before this run) incorrectly stated Check 5 failed because "the button showed text 'SUBMIT LOGIC' and remained disabled" and attributed this to a quiz component defect. The prior report speculated the button text in the DOM was "SUBMIT LOGIC" (vs visual "SUBMIT ANSWER") and called it a "functional bug" in quiz state wiring.

**This fresh run clarifies:**
- `QuizCard.jsx` line 147 correctly renders `SUBMIT ANSWER`. There is no "SUBMIT LOGIC" text in QuizCard.
- "SUBMIT LOGIC" is exclusively from `TeachBackInput.jsx` line 222.
- The test inadvertently navigated to `/teach-back` (by clicking the "INITIATE TEACHING" sidebar button), then found the teach-back submit button disabled.
- The prior report's recommended fix (check `Quiz.jsx` for state wiring) was incorrect. No fix is needed in quiz code.
- The correct fix is to update the test spec selector as described in Check 5 above.

---

## Recommendations

### Priority 1 — Fix Test Spec Selector for Check 5

In `/Users/jackjin/dev/harness-v2-test/projects/aem-devops-cert-v1/tests/e2e/playwright-validate.spec.js`, update Check 5 to use `data-testid` attributes that already exist in `QuizCard.jsx`:

```javascript
test('Check 5: Answer selection enables submit', async ({ page }) => {
  await page.goto('/quiz');
  await page.waitForLoadState('networkidle');

  // Use data-testid to target actual answer option buttons
  const options = page.locator('[data-testid^="option-"]');
  const count = await options.count();
  expect(count).toBeGreaterThan(0);
  await options.first().click();

  await page.screenshot({ path: 'test-results/screenshots/quiz-selected.png', fullPage: true });

  // Use data-testid to target the submit button
  const submit = page.locator('[data-testid="submit-answer"]');
  await expect(submit).toBeEnabled();
});
```

Also consider tightening Check 4's option selector to use `[data-testid^="option-"]` for consistency.

### Priority 2 — Generate Podcast Content for Check 3

Re-run the pipeline with `--include-podcasts` to generate podcast scripts and audio:

```bash
npm run regen -- --from CONTENT --target /Users/jackjin/dev/harness-v2-test/projects/aem-devops-cert-v1 --run -- --include-podcasts
```

This will resolve Check 3 without any code changes.

### Priority 3 — App Hardening (Optional)

Add `data-testid="initiate-teaching"` to the "INITIATE TEACHING" button in `AppLayout.jsx` (line 62) to make sidebar action buttons explicitly identifiable in tests and prevent future broad-selector collisions.

---

## Evidence Files

| File | Description |
|------|-------------|
| `screenshots/home-check1.png` | Check 1 PASS — home page with Study Command Center and topic cards |
| `screenshots/podcast-check3-fail-fresh.png` | Check 3 FAIL — no episodes (pipeline run without --include-podcasts) |
| `screenshots/quiz-check4-pass.png` | Check 4 PASS — quiz page with domain filter buttons visible |
| `screenshots/quiz-check5-fail.png` | Check 5 FAIL — teach-back page rendered after sidebar nav clicked |
| `screenshots/teachback-check6-pass.png` | Check 6 PASS — teach-back textarea and topic picker visible |
| `screenshots/research-check7-pass.png` | Check 7 PASS — research article with markdown content rendered |
