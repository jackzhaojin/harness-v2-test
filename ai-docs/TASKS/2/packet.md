# Task 2: Type definitions and mock data setup

## Goal
Create all TypeScript interfaces and types for the application data model, plus comprehensive mock data for projects, tasks, team members, and activities. This establishes the data foundation that all features will build upon.

## Acceptance Criteria
- [ ] types/index.ts exports Project interface with id, name, status, progress, teamLead, dueDate, createdAt
- [ ] types/index.ts exports Task interface with id, title, description, status, priority, assignee, dueDate, projectId
- [ ] types/index.ts exports TeamMember interface with id, name, email, role, avatar, isOnline
- [ ] types/index.ts exports Activity interface with id, userId, action, target, timestamp
- [ ] TaskStatus type defined as union: 'todo' | 'in-progress' | 'done'
- [ ] ProjectStatus type defined as union: 'active' | 'on-hold' | 'completed' | 'archived'
- [ ] Priority type defined as union: 'low' | 'medium' | 'high'
- [ ] TeamRole type defined as union: 'developer' | 'designer' | 'manager'
- [ ] mockData.ts exports 10 project items with varied statuses and progress values
- [ ] mockData.ts exports 15+ task items distributed across all three statuses
- [ ] mockData.ts exports 8 team members with varied roles and online states
- [ ] mockData.ts exports 10 activity items covering different action types
- [ ] All mock data uses consistent IDs and valid cross-references between entities
- [ ] TypeScript compiles without errors (npx tsc --noEmit passes)

## Required Checks
- [ ] Smoke: App loads without errors


## Constraints
- Follow patterns from SPEC/HOW.md
