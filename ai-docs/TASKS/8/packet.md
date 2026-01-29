# Task 8: Dashboard page with stats cards and activity feed

## Goal
Build the Dashboard page with four clickable stat cards (Total Projects, Active Tasks, Team Members, Completed This Week), the Recent Activity feed, and responsive grid layout. Implements Stories 5 and 7.

## Acceptance Criteria
- [ ] Dashboard page renders at / route
- [ ] Four stat cards in responsive grid: 1 col mobile, 2 col tablet, 4 col desktop
- [ ] Card 1: Total Projects with count from DataContext
- [ ] Card 2: Active Tasks showing count of non-done tasks
- [ ] Card 3: Team Members with count from DataContext
- [ ] Card 4: Completed This Week showing done tasks count
- [ ] Each card displays icon, label text, and large number
- [ ] Cards have hover effect (shadow/scale transition)
- [ ] Clicking stat card navigates to relevant page (Projects, Tasks, Team)
- [ ] Activity feed section with Recent Activity header
- [ ] Displays last 5 activities from mock data
- [ ] Each activity shows: user avatar, formatted action text, relative timestamp
- [ ] Action format: [User] [action] [target] (e.g., Alice completed Homepage design)
- [ ] Timestamps show relative time (e.g., 2 hours ago, yesterday)
- [ ] Feed items have subtle dividers between them
- [ ] View all link at bottom navigates to Tasks page

## Required Checks
- [ ] Smoke: App loads without errors


## Constraints
- Follow patterns from SPEC/HOW.md
