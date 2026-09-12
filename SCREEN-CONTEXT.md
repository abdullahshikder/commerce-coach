# Commerce Coach screen context

Implemented 2026-09-09. This is a host integration contract, not automatic screen capture.

All three chat surfaces accept an optional `screenContext` prop: CommerceCoachPage, SidebarChatPanel, and PathaoCoachChatBot. The standalone AppShell has no merchant forms and intentionally supplies none. The separate parent dashboard currently uses its own older Coach implementation; it has not been migrated or connected by this change.

A host rendering this workspace's chat component can supply a fresh observation:

```tsx
<SidebarChatPanel
  isOpen={coachOpen}
  onClose={closeCoach}
  screenContext={{
    page: 'Product editor',
    currentStep: 'Variants',
    completedSteps: ['Basic details'],
    visibleErrors: ['Option name is required'],
    observedAt: Date.now(),
  }}
/>
```

Derive these fields from actual rendered host state. Refresh the timestamp only after observing that state; clear context on navigation or when the screen is unavailable. Use predefined validation messages with customer values removed. Do not send raw form objects, customer information, URLs, or credentials. Fields are limited to page, currentStep, selectedTab, completedSteps, visibleErrors, and observedAt. Strings have a 300-character limit and lists a 10-item limit. Unknown fields are rejected by the API. Observations older than five minutes or over 30 seconds in the future are omitted.

The observation travels separately from conversation history through the generation API. Both providers receive it during request understanding, drafting, answer review, and screenshot review, even if request understanding fails. User corrections take precedence. Screen state is not evidence for product behavior or authorization to access accounts. These are model instructions; offline tests verify transport and validation, not guaranteed model compliance.

Retrieved source passages now preserve human-reviewed and machine-confirmed labels. Missing or unknown labels are unverified. These labels describe the source review process, not proof that every claim is correct. No documentation was newly verified, and no missing Pixel implementation details were invented.

Remaining integration work: migrate or connect the parent dashboard's separate Coach implementation, supply actual page state, and run real browser/live-answer cases (vague variants question, correction to Orders, navigation, and expired context). No parent dashboard files were changed. Live account lookup is outside this phase.

Rollback: original source and package.json are in /tmp/coach-screen-before. Restore only files listed in /tmp/coach-screen.diff and remove the two new screenContext files if reverting; preserve later unrelated edits. No database or environment changes.
