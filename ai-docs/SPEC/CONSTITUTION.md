# Project Constitution

## Mission
Provide a lightweight, distraction-free todo list that helps users track tasks instantly without setup or learning curve.

## Immutable Principles
1. **Zero dependencies** - Pure HTML/CSS/JS only, no frameworks, no build tools, no package managers
2. **Instant load** - Works immediately on file open, no server required, no initialization
3. **Memory-only storage** - No persistence layer, no localStorage, fresh start on every reload
4. **Single-file deployability** - Must function by simply opening index.html in any modern browser
5. **Accessible by default** - Semantic HTML, keyboard navigable, screen reader friendly

## Vibe / Style Guide
- Tone: Quiet, efficient, gets out of your way
- Complexity: Minimal - every feature must justify its existence
- UX Priority: Clarity and speed over visual polish
- Visual style: Clean, modern, generous whitespace
- Interaction feedback: Subtle but immediate (hover states, focus rings)

## Constraints
- No external libraries or CDN dependencies
- No build step or compilation required
- Must work in latest Chrome, Firefox, Safari, Edge
- No backend or API calls
- File size budget: under 50KB total (all three files combined)

## Out of Scope
- Data persistence across sessions
- Categories, tags, or project organization
- Due dates or reminders
- Drag-and-drop reordering
- Filtering or search
- Export/import functionality
- User accounts or multi-user support
- Progressive Web App features (service workers, offline manifest)
- Animations beyond basic CSS transitions
