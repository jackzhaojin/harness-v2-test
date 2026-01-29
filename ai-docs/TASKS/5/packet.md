# Task 5: Modal and Toast notification systems

## Goal
Implement the Modal dialog component with compound pattern (Header, Body, Footer) and the Toast notification system with stacking, auto-dismiss, and animations. These are critical shared components used throughout the application.

## Acceptance Criteria
- [ ] Modal renders centered with semi-transparent backdrop overlay
- [ ] Modal has compound components: Modal.Header, Modal.Body, Modal.Footer
- [ ] Modal.Header includes close button (X) in corner
- [ ] Clicking backdrop closes modal (unless prevented)
- [ ] Pressing Escape key closes modal
- [ ] Focus is trapped inside modal when open (Tab cycles through modal elements)
- [ ] Modal has smooth fade-in/out animation (200-300ms)
- [ ] Modal body scrolls if content overflows viewport
- [ ] Toast component appears in bottom-right corner of viewport
- [ ] Toast shows message, type icon (success=green, error=red, info=blue)
- [ ] Toast has close button (X) for manual dismiss
- [ ] Toast auto-dismisses after 3 seconds
- [ ] Multiple toasts stack vertically with newest at bottom
- [ ] Toast has enter animation (slide up) and exit animation (fade out)
- [ ] Both components render via React Portal to document.body

## Required Checks
- [ ] Smoke: App loads without errors


## Constraints
- Follow patterns from SPEC/HOW.md
