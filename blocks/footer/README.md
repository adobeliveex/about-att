# Footer Block

## Overview

The AT&T Newsroom footer: a dark (#191919) band with an inline, wrapping row of small grey legal links (underlined on hover), an optional icon before a link (the CCPA "Your Privacy Choices" icon), and a copyright line. Content is centred to the site content width (1220px) on desktop and inset 20px on mobile.

## Integration

### Block Configuration

No block configuration is read via `readBlockConfig()`.

### Content (footer fragment)

The block fetches the footer fragment itself, independent of page metadata:
`/content/footer.plain.html` (local preview) first, then `/footer.plain.html` (Document Authoring / Edge Delivery).

| Section | Renders as |
|---------|------------|
| A section containing a list | Inline link row (`nav.footer-links`); images inside list items become small inline icons |
| Any other section | Legal text (`.footer-legal`), e.g. the copyright paragraph |

Sections that only hold a page-settings (metadata) block, and empty sections Edge Delivery leaves behind, are skipped. Relative image paths are resolved against wherever the fragment was served from. Links to other sites open in a new tab.

### URL Parameters

None.

### Local Storage

None.

### Events

None.

## Behavior Patterns

### Page Context Detection

- **Desktop (900px+)**: 20px top / 50px bottom padding inside the centred content box.
- **Mobile (<900px)**: 20px padding; links wrap onto several lines.

### User Interaction Flows

1. **Legal links**: hover underlines the link; click navigates (other sites in a new tab).

### Error Handling

- **Fragment not found**: the footer renders empty instead of throwing.
