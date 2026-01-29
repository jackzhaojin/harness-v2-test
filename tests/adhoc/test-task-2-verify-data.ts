// Test script to verify type definitions and mock data
import { projects, tasks, teamMembers, activities } from '../../src/data/mockData';
import type { Project, Task, TeamMember, Activity, TaskStatus, ProjectStatus, Priority, TeamRole } from '../../src/types';

// Verify counts
console.log('✓ Projects count:', projects.length, '(expected: 10)');
console.log('✓ Tasks count:', tasks.length, '(expected: 15+)');
console.log('✓ Team members count:', teamMembers.length, '(expected: 8)');
console.log('✓ Activities count:', activities.length, '(expected: 10)');

// Verify project statuses are represented
const projectStatuses = new Set(projects.map(p => p.status));
console.log('✓ Project statuses:', Array.from(projectStatuses).join(', '));

// Verify task statuses are represented
const taskStatuses = new Set(tasks.map(t => t.status));
console.log('✓ Task statuses:', Array.from(taskStatuses).join(', '));

// Verify priorities are represented
const priorities = new Set(tasks.map(t => t.priority));
console.log('✓ Task priorities:', Array.from(priorities).join(', '));

// Verify team roles are represented
const roles = new Set(teamMembers.map(tm => tm.role));
console.log('✓ Team roles:', Array.from(roles).join(', '));

// Verify task status distribution
const todoCount = tasks.filter(t => t.status === 'todo').length;
const inProgressCount = tasks.filter(t => t.status === 'in-progress').length;
const doneCount = tasks.filter(t => t.status === 'done').length;
console.log(`✓ Task distribution: todo=${todoCount}, in-progress=${inProgressCount}, done=${doneCount}`);

// Verify cross-references
const projectIds = new Set(projects.map(p => p.id));
const teamMemberIds = new Set(teamMembers.map(tm => tm.id));
const invalidTaskRefs = tasks.filter(t => !projectIds.has(t.projectId) || !teamMemberIds.has(t.assignee));
const invalidProjectRefs = projects.filter(p => !teamMemberIds.has(p.teamLead));
const invalidActivityRefs = activities.filter(a => !teamMemberIds.has(a.userId));

console.log('✓ Invalid task references:', invalidTaskRefs.length, '(expected: 0)');
console.log('✓ Invalid project references:', invalidProjectRefs.length, '(expected: 0)');
console.log('✓ Invalid activity references:', invalidActivityRefs.length, '(expected: 0)');

// Summary
if (
  projects.length === 10 &&
  tasks.length >= 15 &&
  teamMembers.length === 8 &&
  activities.length === 10 &&
  taskStatuses.size === 3 &&
  projectStatuses.size === 4 &&
  priorities.size === 3 &&
  roles.size === 3 &&
  invalidTaskRefs.length === 0 &&
  invalidProjectRefs.length === 0 &&
  invalidActivityRefs.length === 0
) {
  console.log('\n✅ ALL CHECKS PASSED');
} else {
  console.log('\n❌ SOME CHECKS FAILED');
  process.exit(1);
}
