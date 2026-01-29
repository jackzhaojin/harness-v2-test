# Task 10: Projects table with display, filtering, sorting, and pagination

## Goal
Build the Projects page with a full-featured data table including columns display, search filtering (debounced), column sorting with indicators, and pagination. Implements Stories 8, 9, and 10.

## Acceptance Criteria
- [ ] Projects page renders at /projects route
- [ ] Table displays columns: Name, Status, Progress, Team Lead, Due Date, Actions
- [ ] Status shows as colored badge (Active=green, On Hold=yellow, Completed=blue)
- [ ] Progress column shows percentage with visual ProgressBar component
- [ ] Due Date formatted as readable date (e.g., Feb 15, 2026)
- [ ] Actions column has dropdown menu icon (kebab/three dots)
- [ ] Table has alternating row backgrounds for readability
- [ ] Table is horizontally scrollable on mobile viewports
- [ ] Search input above table filters projects by name (case-insensitive)
- [ ] Search is debounced (300ms delay before filtering)
- [ ] Clicking column header sorts by that column
- [ ] Sort indicator arrow shows current sort column and direction
- [ ] Clicking same header toggles ascending/descending
- [ ] Default sort by name ascending
- [ ] Empty state message when search returns no results
- [ ] Pagination: 5 projects per page
- [ ] Pagination controls: Previous, page numbers, Next
- [ ] Current page number highlighted
- [ ] Previous disabled on first page, Next disabled on last
- [ ] Page info text shows Showing X-Y of Z projects
- [ ] Changing search resets to page 1

## Required Checks
- [ ] Smoke: App loads without errors


## Constraints
- Follow patterns from SPEC/HOW.md
