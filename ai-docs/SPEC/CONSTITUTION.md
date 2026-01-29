# Project Constitution

## Mission
Deliver a polished, production-quality project management dashboard that demonstrates modern React best practices while providing an intuitive, responsive user experience for managing projects, tasks, and team collaboration.

## Immutable Principles
1. **Type safety is non-negotiable** - TypeScript strict mode, no `any` types, all data structures explicitly typed
2. **Mobile-first responsive design** - Every component must work flawlessly from 320px to 4K screens
3. **Zero runtime errors** - No console errors, no unhandled exceptions, graceful degradation for edge cases
4. **Accessibility by default** - Semantic HTML, keyboard navigation, focus states on all interactive elements
5. **Component isolation** - Each component is self-contained, testable, and reusable without prop drilling
6. **Performance matters** - No unnecessary re-renders, lazy loading where appropriate, smooth 60fps interactions

## Vibe / Style Guide
- **Tone**: Professional and polished, feels like a real SaaS product you'd pay for
- **Complexity**: Sophisticated UI, simple implementation - leverage Tailwind's utility classes over custom CSS
- **UX Priority**: Clarity and responsiveness - users should never wait or wonder what happened
- **Visual Language**: Clean lines, generous whitespace, subtle shadows and transitions
- **Interactions**: Micro-animations for feedback (hover states, transitions), but never gratuitous
- **Dark Mode**: First-class citizen, not an afterthought - both themes must feel intentional

## Constraints
- **React 18 + TypeScript + Vite** - No framework substitutions
- **Tailwind CSS only** - No CSS-in-JS, no styled-components, no external CSS files beyond index.css
- **No external state management** - React Context + useState/useReducer only
- **No backend/API** - Static mock data, localStorage for persistence
- **No drag-and-drop libraries** - HTML5 native drag API for Kanban
- **Lucide React for icons** - No mixing icon libraries
- **Recharts for data visualization** - No other charting libraries
- **Playwright for E2E testing** - Tests must cover all critical user flows

## Out of Scope
- Backend API integration or database connections
- User authentication or authorization
- Real-time collaboration or WebSocket features
- Data export/import functionality
- Internationalization (i18n) or multi-language support
- Offline-first/PWA capabilities
- Unit testing (Playwright E2E only for this MVP)
- CI/CD pipeline configuration
- Deployment or hosting setup
- Analytics or tracking integration
- Email notifications or external integrations
