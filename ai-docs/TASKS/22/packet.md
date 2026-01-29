# Task 22: Full tour demo script with voice-over document

## Goal
Build the comprehensive ~5-7 minute full tour Playwright demo that walks through every dashboard feature, plus the companion voice-over narration document. Extends the highlights demo to cover all pages in depth: dashboard deep-dive, projects CRUD with pagination, Kanban task CRUD with detail panel, team search/filter/invite, settings with all sections, and responsive showcase at tablet and mobile breakpoints. Covers Stories 33 and 34.

## Acceptance Criteria
- [ ] demo/full-tour.spec.ts created as a Playwright test file using shared helpers from demo/helpers.ts
- [ ] Script opens app at localhost at 1280x800 desktop resolution with test timeout of at least 600000ms (10 minutes)
- [ ] Demo covers Dashboard deep-dive: clicks stat cards showing navigation, interacts with activity feed, hovers chart tooltips for exact values
- [ ] Demo covers Projects extended: search/filter/sort, pagination (navigate multiple pages), create new project via modal, edit an existing project (open edit modal, change fields, save), delete a project with confirmation modal
- [ ] Demo covers Kanban extended: drag tasks between columns, add a new task via Add Task button (fill form, submit), click task card to open SlideOver detail panel, edit task details in panel, close panel
- [ ] Demo covers Team page: search members by name, filter by role dropdown, click Invite Member button (fill email, submit, show toast notification)
- [ ] Demo covers Settings page: change profile name, toggle notification switches (email/push/slack), change theme in appearance section, select an accent color, click Save Changes (show success toast)
- [ ] Demo covers responsive showcase: resize to tablet breakpoint (~900px, sidebar collapses to icons), resize to mobile breakpoint (~375px, hamburger menu appears), open hamburger menu, navigate via mobile menu, resize back to desktop
- [ ] Longer pauses (2000-3000ms) at transition points between major page sections
- [ ] Total demo runtime is approximately 5-7 minutes
- [ ] Script runs end-to-end without errors or timeouts via: npm run demo:full
- [ ] Script uses stable selectors consistent with highlights script patterns
- [ ] demo/full-tour-voiceover.md created with timestamped narration sections in format ## [M:SS] Section Title
- [ ] Voice-over covers every feature with detailed explanations of user benefit, interaction model, and UX touches
- [ ] Voice-over sections grouped by page/feature area with clear headers for easy navigation during live presentation
- [ ] Voice-over includes detailed intro setting context for full tour and comprehensive outro summarizing all features
- [ ] Voice-over includes [pause] cues for scenic moments and page transitions
- [ ] Total voice-over timestamps span 5-7 minutes matching demo runtime

## Required Checks
- [ ] Smoke: App loads without errors


## Constraints
- Follow patterns from SPEC/HOW.md
