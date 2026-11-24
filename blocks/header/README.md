# Header Block

## Overview

The AT&T Newsroom header: a fixed black bar with the AT&T logo on the left and the primary navigation on the right. On desktop (900px and up) each top-level item opens a black dropdown on hover or keyboard focus, with a 5px cyan bar under the active item. Below 900px a hamburger opens a 320px push drawer from the right, where each item's label navigates and a `+`/`-` button expands its links in place (several sections can be open at once).

## Integration

### Block Configuration

No block configuration is read via `readBlockConfig()`.

### Content (nav fragment)

The block fetches the nav fragment itself, independent of page metadata:
`/content/nav.plain.html` (local preview) first, then `/nav.plain.html` (Document Authoring / Edge Delivery).

| Section | Content |
|---------|---------|
| 1 | Brand: a link (normally `/`) containing the logo image |
| 2 | Navigation: a list; each top-level item is a link, optionally followed by a nested list of dropdown links |
| 3+ | Optional extra tool areas (rendered hidden as `.nav-tools`) |

Sections that only hold a page-settings (metadata) block are ignored. Relative image paths are resolved against wherever the fragment was served from. Links to other sites open in a new tab.

### URL Parameters

None.

### Local Storage

None.

### Events

No event-bus listeners or emitters. DOM events only (hover, focus, click, Escape) plus a `matchMedia('(width >= 900px)')` change listener.

## Behavior Patterns

### Page Context Detection

- **Desktop (900px+)**: horizontal bar, hover/focus dropdowns, one open at a time. Items in the second half of the bar open right-aligned.
- **Mobile (<900px)**: hamburger drawer; page content and the logo shift 320px left while the drawer is open; body scrolling is locked.

### User Interaction Flows

1. **Desktop dropdown**: hover or Tab onto an item, the dropdown opens; moving away or pressing Escape closes it.
2. **Mobile menu**: tap the hamburger (morphs into an X), tap `+` to expand a section, tap a label to navigate, tap X or press Escape to close.

### Error Handling

- **Fragment not found**: the header renders empty instead of throwing.
- **Breakpoint change**: crossing 900px closes any open dropdown and the mobile drawer.
