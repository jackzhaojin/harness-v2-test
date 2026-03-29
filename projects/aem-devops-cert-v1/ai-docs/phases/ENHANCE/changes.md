# Enhancement Changes — 2026-03-29

## Enhancements Applied

### teach-back-api-key: Teach-Back Real AI Grading via Client-Side Claude API

- **Files created:**
  - `src/lib/claude-client.js`
  - `src/components/ApiKeyModal.jsx`
- **Files modified:**
  - `src/components/TeachBackInput.jsx`
- **Dependencies added:** none

- **Description:**

  Replaced the hardcoded `setTimeout` mock in `TeachBackInput.jsx` with real AI-powered evaluation
  using the Claude API (`claude-haiku-4-5`). The user supplies their own API key, which is
  persisted in `localStorage` under the key `claude-api-key`.

  **`src/lib/claude-client.js`**
  A thin client-side wrapper that sends the learner's explanation plus source research content to
  `https://api.anthropic.com/v1/messages`. The system prompt instructs Claude to return a JSON
  object matching the existing grading schema:
  `{ logicAccuracy, depth, flow, suggestions, semanticGaps }`.
  Handles 401 (invalid key), 429 (rate limit), network failures, and malformed JSON responses with
  descriptive thrown errors.

  **`src/components/ApiKeyModal.jsx`**
  A centered overlay modal with backdrop blur following the glassmorphism design system. Features:
  - Password-type input with visibility toggle
  - Status badge (key stored / not stored)
  - Save / Cancel / Clear key actions
  - Closes on backdrop click

  **`src/components/TeachBackInput.jsx`**
  - `handleSubmit` is now `async`: checks `localStorage` for the key first (shows modal if absent),
    fetches the topic research file from `/public/research/{topicId}.md`, then calls
    `evaluateExplanation()`.
  - On `invalid-api-key` error the modal reopens automatically.
  - Other API errors are shown inline via a dismissible error banner above the textarea.
  - A `key` icon button added to the input header opens the API key modal at any time.
  - Existing loading overlay (`grading` state) is preserved and shown during the API call.
  - All existing result display (DotBar, MetricBar, Semantic Gaps, Neural Suggestions) is populated
    from the live API response.

## Build Status
- Build: PASS
- Errors fixed: 0
