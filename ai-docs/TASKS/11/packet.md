# Task 11: Project CRUD operations with modals

## Goal
Implement Create, Edit, and Delete functionality for projects including the New Project modal form, Edit modal with pre-filled data, and Delete confirmation modal. Implements Stories 11 and 12.

## Acceptance Criteria
- [ ] New Project button visible above projects table
- [ ] Clicking New Project opens modal with form
- [ ] Form fields: Name (required), Status dropdown, Team Lead dropdown, Due Date picker
- [ ] Status options: Active, On Hold, Completed
- [ ] Team Lead options populated from team members data
- [ ] Submit button disabled until Name field is filled
- [ ] Submitting adds project to DataContext and closes modal
- [ ] New project appears in table after creation
- [ ] Cancel button closes modal without saving
- [ ] Actions dropdown contains: Edit, Archive, Delete options
- [ ] Clicking Edit opens modal pre-filled with project data
- [ ] Saving Edit updates project in DataContext
- [ ] Clicking Archive updates project status to Archived
- [ ] Clicking Delete opens confirmation modal
- [ ] Confirmation shows project name and permanent warning
- [ ] Confirming delete removes project from DataContext
- [ ] Cancel in confirmation returns without deleting
- [ ] Toast notifications show on successful create/edit/delete

## Required Checks
- [ ] Smoke: App loads without errors


## Constraints
- Follow patterns from SPEC/HOW.md
