---
name: webflow-accessibility
description: Audit and implement WCAG 2.1 AA accessibility on Webflow sites. Use this checklist to guide every build and review. Covers animation, appearance, code, color, content, controls, forms, headings, images, interactions, keyboard, lists, media, and tables.
---

# Webflow Accessibility Checklist (WCAG 2.1 AA)

Source: Webflow brand studio web team. Use this as a running audit on every page build and CSS change.

---

## How to use

When building or reviewing a Webflow page:
1. Run through the relevant sections below
2. Flag any failing items to the user before calling the work done
3. Fix what can be fixed via MCP tools; note what requires manual Designer action

---

## Animation
- [ ] Avoid excessive motion behind text
- [ ] Include motion warnings (for pages with scroll-triggered or auto-playing animations)
- [ ] Use subtle animations that don't flash more than 3 times per second (WCAG 2.3.1)

## Appearance
- [ ] Add descriptions to sensory-based instructions (not "click the red button" — describe the action)
- [ ] Allow zoom without forcing horizontal scrolling (no `overflow-x: hidden` on body at small sizes)
- [ ] Check legibility on landscape and portrait viewport sizes
- [ ] Ensure content has appropriate structure and relationships (headings, lists, tables)
- [ ] Ensure target sizes are at least 44×44px (buttons, links, icons)
- [ ] Ensure text can be resized up to 200% without loss of content or functionality
- [ ] Layout is simple, straightforward, and consistent across pages
- [ ] Make sure color isn't the only way information is conveyed (add icons, labels, patterns)
- [ ] Optimize text styling for legibility (line-height ≥ 1.5, no justified text, adequate letter-spacing)

## Code
- [ ] Don't disable zoom (`user-scalable=no` is forbidden)
- [ ] Hide decorative elements with `aria-hidden="true"` (icons, textures, dividers)
- [ ] Include a "skip to main content" link as the first focusable element on every page
- [ ] Provide a unique `<title>` for each page (set in Webflow Page Settings)
- [ ] Set the site's language code (`<html lang="en">` — set in Webflow Site Settings)
- [ ] Use landmark elements: `<header>`, `<main>`, `<nav>`, `<footer>`, `<section>`, `<article>`, `<aside>`

## Color
- [ ] Check contrast for all borders (minimum 3:1 against adjacent color)
- [ ] Check contrast for all icons (minimum 3:1)
- [ ] Check contrast for all text (minimum 4.5:1 for normal text, 3:1 for large text ≥18px/14px bold)
- [ ] Check contrast for text that overlaps images or videos

**Audit method:** For each color pair in the project palette, compute contrast ratio (WebAIM contrast checker, or browser dev tools). Flag any text below 4.5:1 — restrict that pairing to large-text only or change one of the colors.

## Content
- [ ] Use inclusive language (avoid idioms, ableist language, gendered defaults)
- [ ] Use plain language (aim for 8th grade reading level where possible)
- [ ] Use unique and descriptive link labels ("Read the full study" not "Click here" or "Learn more")

## Controls
- [ ] Ensure controls have all styled states: default, hover, focus, active, disabled
- [ ] Find and fix empty links (links with no text content or aria-label)

**Button states to define for any Client-First site:**
- `button` (primary) → hover fill change, active state, visible focus ring
- `button is-secondary` → distinct hover, active, focus
- `button is-text` → hover underline, focus visible
- All buttons need visible `:focus-visible` ring — use the Client-First global embed snippet

## Forms
- [ ] Avoid using autofocus attribute (disorienting for screen reader users)
- [ ] Ensure forms are GDPR compliant (consent checkboxes, privacy notice)

## Headings
- [ ] Use clear, descriptive, sequential headings (one H1 per page — the page title)
- [ ] Use logical heading order — never skip levels (H1 → H2 → H3, not H1 → H3)

## Images
- [ ] Avoid using meaningful text images (text in images cannot be resized or translated)
- [ ] Include alt text for every important image (decorative images get `alt=""` + `aria-hidden="true"`)

## Interactions
- [ ] Avoid harmful animation patterns (no rapid flashing, no motion that can't be paused)
- [ ] Avoid parallax effects (causes nausea/vestibular disorders)
- [ ] Avoid scrolljacking (overriding native scroll behavior)
- [ ] Set anchor scroll animation to instant for users who prefer reduced motion (`@media (prefers-reduced-motion: reduce)`)

## Keyboard
- [ ] Clearly style focus states (visible `:focus-visible` ring on ALL interactive elements)
- [ ] Ensure accordions are keyboard navigable (Enter/Space to open, Escape to close)
- [ ] Ensure focus order is logical (follows DOM order, not visual order when they differ)
- [ ] Ensure modals are keyboard navigable (focus trap inside modal, Escape to close)
- [ ] Remove focus from hidden elements (`display: none` or `visibility: hidden` removes from tab order; `opacity: 0` does NOT)

**Client-First global embed focus snippet (must be on every page):**
```css
*[tabindex]:focus-visible, input[type="file"]:focus-visible {
  outline: 0.125rem solid var(--base-color-system--focus-state);
  outline-offset: 0.125rem;
}
```

## Lists
- [ ] Use semantic lists (`<ul>`, `<ol>`, `<dl>`) for all grouped items — not divs styled to look like lists

## Media
- [ ] Avoid autoplaying media (or provide a pause control)
- [ ] Include audio descriptions for videos that convey visual information
- [ ] Include captions in all videos
- [ ] Provide controls to pause all media

## Tables
- [ ] Ensure table columns, rows, and cells have proper ARIA labels (`scope`, `aria-label`, `<caption>`)

---

## Quick audit command

When asked to audit a page for accessibility, check these in order:
1. Heading structure — one H1, no skipped levels
2. Alt text — every `<img>` has alt attribute
3. Focus states — `:focus-visible` styles visible on buttons and links
4. Color contrast — text meets 4.5:1 minimum
5. Target sizes — all clickable elements ≥ 44px
6. Landmark elements — page uses `<main>`, `<nav>`, `<header>`, `<footer>`
7. Empty links — no `<a>` with empty or missing label
8. Language set — `<html lang="en">` in site settings
9. Page title — unique `<title>` per page
10. Decorative elements — icons/textures have `aria-hidden="true"`
