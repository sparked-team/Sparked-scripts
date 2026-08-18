---
name: webflow-custom-js
description: Add GSAP, ScrollTrigger, Lenis smooth scroll, custom carousels, and other third-party JS to Webflow sites. Covers page-level vs site-level custom code placement, CDN script loading, prefers-reduced-motion handling, accessibility for custom interactions, and the GSAP-on-CMS-list pattern for replacing the native Webflow Slider.
---

# Webflow Custom JS — GSAP, ScrollTrigger, Carousels, Smooth Scroll

Universal patterns for adding JavaScript to Webflow sites without breaking IX2, accessibility, or page performance.

**GSAP API reference — use the official GreenSock skills:**

| For | Use skill |
|---|---|
| Tweens, easing, stagger, `gsap.matchMedia()` for reduced-motion | `gsap-core` |
| Sequencing, position parameter, nesting | `gsap-timeline` |
| Scroll-linked animations, pinning, scrub | `gsap-scrolltrigger` |
| Draggable, ScrollSmoother, Flip, SplitText, MorphSVG, CustomEase | `gsap-plugins` |
| `useGSAP` hook + cleanup in React | `gsap-react` |
| Helpers: clamp, mapRange, toArray, etc. | `gsap-utils` |
| FPS, will-change, layout thrash, profiling | `gsap-performance` |
| Vue, Svelte integration | `gsap-frameworks` |

This skill covers the **Webflow-specific** concerns on top of those: where to put scripts, IX2 interop, Designer MCP timeouts, page-level vs site-level code, the GSAP-on-CMS-list carousel pattern, retiring the native Slider, Lenis vs Webflow's anchor scroll. Always pair with the relevant `gsap-*` skill above.

**GSAP is fully free** including every plugin (post-2024 Webflow acquisition). No business license needed for client work.

---

## ⚠️ THE 4 NON-NEGOTIABLE RULES

1. **Page-specific scripts go in PAGE-level custom code, never Site Settings** — site-level loads on every page even when not needed
2. **Always wrap in DOMContentLoaded or wait for Webflow ready** — Webflow injects its own DOM after initial parse; running selectors too early misses elements
3. **Always handle `prefers-reduced-motion`** — every animation must have a "no animation" fallback that still leaves content usable
4. **Custom interactions must remain keyboard-accessible** — focus management, ARIA, keyboard nav are on you, not Webflow

---

## ⚠️ Custom code does NOT run in Designer preview

Page-level Custom Code (Pages → ⚙ → Custom Code) is only injected when the site is **published** to staging (`*.webflow.io`) or production. The Designer's preview mode renders the canvas without executing your custom code.

**To test custom JS:**
1. Publish to staging subdomain (free, instant, separate from production)
2. Open the `*.webflow.io` URL in a new tab
3. Hard refresh (`⌘⇧R`) to bypass cache
4. Open the browser console (⌥⌘I → Console tab)

**Implication:** Don't tell the user "test in preview" for any custom-JS feature. Always say "publish to staging + hard refresh + check console."

---

## ⚠️ When a custom animation "jumps" — debug order

Before changing any code, check in this order:

1. **OS Reduce Motion is enabled** — by far the most common cause. macOS: System Settings → Accessibility → Display → Reduce motion. Windows: Settings → Accessibility → Visual effects → Animation. If on, your `prefers-reduced-motion` check correctly skips animations → looks like jump. Verify via `window.matchMedia('(prefers-reduced-motion: reduce)').matches` in console
2. **Script didn't actually load** — check `console.log` at the top of your init function fires. If not, the `<script>` tag isn't in the published HTML
3. **GSAP/library didn't load** — `typeof window.gsap !== 'undefined'`. Could be CDN blocked by ad-blocker or slow network
4. **The `-50%` math doesn't land where you think** — applies to any percentage-based translate. See the marquee section below: `width: max-content` is what makes `-50%` resolve to half the actual content width, not half the parent
5. **You put the animation on the children instead of the parent** — for marquees especially, each child animating independently breaks the seamless loop

**Console debugging tip:** Browsers collapse object logs as `Object` — you have to click to expand. Prefer inline string logs for instant readability:

```js
// Good — values inline, instantly readable
console.log(`[carousel] hasGSAP=${hasGSAP} slides=${total} reducedMotion=${reducedMotion}`);

// Less good — values hidden behind a click
console.log('[carousel]', { hasGSAP, slides: total, reducedMotion });
```

---

## Where to put custom JS in Webflow

### Decision table

| Script scope | Where | Why |
|---|---|---|
| Global, every page (analytics, font loaders, GTM) | Site Settings → Custom Code → Footer Code | One source for site-wide concerns |
| One page only (page-specific carousel, hero animation) | Pages panel → page gear → Custom Code → Before `</body>` | Avoids loading on pages that don't use it |
| 2–3 pages | Repeat page-level on each | Easier than guarding site-level by URL |
| Reusable across many pages with shared logic | Site-level shared library + page-level invocation | Library loads once, page decides what runs |

### Plan-gating

`data_scripts_tool` (custom code injection via MCP) returns **404 on non-enterprise plans**. On non-enterprise plans, custom code must be pasted manually:

1. Designer → Pages panel → gear icon
2. Custom Code tab
3. Paste into **Before `</body>` tag** field
4. Save + publish — page-level custom code only takes effect on published pages

### 10,000 character limit

Page-level custom code is capped at 10,000 characters. For larger scripts:

- Host externally (GitHub raw, jsDelivr, your CDN) and `<script src="…">` from custom code
- Or split logic into a library script (site-level) + minimal invocation (page-level)

---

## Loading third-party libraries

### Get the canonical CDN URL from official docs — never guess

Common libraries and their CDNs (verify against the official docs before pasting; versions and paths change):

```html
<!-- GSAP core -->
<script src="https://cdn.jsdelivr.net/npm/gsap@3/dist/gsap.min.js"></script>

<!-- GSAP ScrollTrigger -->
<script src="https://cdn.jsdelivr.net/npm/gsap@3/dist/ScrollTrigger.min.js"></script>

<!-- GSAP Draggable + InertiaPlugin -->
<script src="https://cdn.jsdelivr.net/npm/gsap@3/dist/Draggable.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/gsap@3/dist/InertiaPlugin.min.js"></script>

<!-- GSAP ScrollSmoother (Lenis alternative, official GSAP) -->
<script src="https://cdn.jsdelivr.net/npm/gsap@3/dist/ScrollSmoother.min.js"></script>

<!-- Lenis smooth scroll -->
<script src="https://cdn.jsdelivr.net/npm/lenis@1/dist/lenis.min.js"></script>
```

For plugin selection (`gsap-plugins` skill has the full list), prefer ScrollSmoother over Lenis when the rest of the project uses GSAP — fewer integration gotchas with ScrollTrigger.

### Register plugins after loading

```html
<script>
  gsap.registerPlugin(ScrollTrigger, Draggable);
</script>
```

---

## DOMContentLoaded vs Webflow.push

Webflow loads its own DOM and IX2 after initial HTML parse. Three safe patterns:

### Pattern A — Plain DOMContentLoaded (simplest, works for most cases)

```js
document.addEventListener('DOMContentLoaded', () => {
  // your code
});
```

### Pattern B — Webflow's ready hook (runs after IX2 init)

```js
window.Webflow ||= [];
window.Webflow.push(() => {
  // your code — runs after Webflow IX2 ready
});
```

### Pattern C — wait for window load (after images, fonts, etc.)

```js
window.addEventListener('load', () => {
  // your code — runs latest, all assets loaded
});
```

Use Webflow.push when your code needs to interop with IX2 (e.g. trigger an interaction). Use plain DOMContentLoaded for selector-based work on static or CMS-rendered HTML.

---

## ♿ Always handle `prefers-reduced-motion`

Use GSAP's `matchMedia` (see `gsap-core` skill for full details):

```js
gsap.matchMedia().add('(prefers-reduced-motion: no-preference)', () => {
  // animations only run if user has not requested reduced motion
  gsap.from('.card', { opacity: 0, y: 30, stagger: 0.1 });
});
```

Never auto-play looping or scroll-jacked animations without a reduced-motion fallback. End-state must remain visible and functional with motion disabled.

---

## Pattern: IX2 infinite marquee (two-container, scroll-triggered, seamless)

The canonical Webflow recipe for an infinite marquee that loops perfectly and only runs when on-screen. No custom JS, no Finsweet attributes.

### DOM
```
section_marquee            (the wrapper / mask)
  marquee_track            (animates X% on scroll)
    marquee_content        ← container #1: full set of items
    marquee_content        ← container #2: identical duplicate
```

### CSS (set in Designer style panel, not via custom code)

| Selector | Property | Value | Why |
|---|---|---|---|
| `section_marquee` | overflow | hidden | clips the off-screen portion of the moving track |
| `marquee_track` | display | flex | side-by-side containers |
| `marquee_track` | width | **max-content** | track width = 2 × content_width, makes the % math work |
| `marquee_track` | gap | **0** | no inter-container gap (or % math breaks) |
| `marquee_content` | display | flex | items in a row |
| `marquee_content` | gap | **0** | no inter-item gap (spacing comes from item padding) |
| `<item>` | padding-left | e.g. 2rem / 5rem | creates uniform spacing including at the container boundary |

The trick with `padding-left` on each item (instead of `gap` on the container): the boundary between container #1's last item and container #2's first item then looks **identical** to the gap between any two consecutive items inside a container, because every transition is "item content → next item's padding-left". Loop point becomes invisible.

### IX2 setup

**Trigger:** Scroll into view (NOT Page Load — saves CPU when off-screen)
- Element: `marquee_track`
- Range offsets:
  - Start: viewport bottom `120%` (animation begins as section approaches from below)
  - End: viewport bottom `-20%` (animation ends as section leaves from above)

**Trigger event mapping:**
- On scroll in (Enter) → **Play** animation
- On scroll out (Leave) → **Pause** animation
- On scroll back in (Enter again) → **Play** (resume) animation

**The animation itself** (timed animation panel):
- Action: **Move**
- Target: `marquee_track`
- X axis: **-50** with unit **%** (percent, not pixels; the X% unit is what enables the canonical seamless-loop math)
- Easing: **Linear** (any other curve breaks the loop)
- Duration: 30–40s for editorial pace
- **Loop: infinite** — set INSIDE the animation panel (the loop checkbox on the timeline itself), NOT on the trigger

### Why this works
- `width: max-content` makes `track_width = exactly 2 × content_width` (no viewport-relative weirdness)
- `gap: 0` everywhere + `padding-left` on items = every boundary (item-to-item AND container-to-container) is one `padding-left` wide
- `-50%` of `2 × content_width` = exactly `1 × content_width` = container #2's start position
- Container #2 is a pixel-perfect copy of container #1, so at -50% the visual is identical to 0%
- IX2's loop reset is invisible because the end frame matches the start frame
- Scroll-triggered Play/Pause keeps the animation efficient when off-screen

### ⚠️ Animation goes on the PARENT (`marquee_track`), not the children (`marquee_content`)

The single most common marquee bug: applying `animation: scroll 40s linear infinite` to `marquee_content` instead of `marquee_track`. When the animation is on each child, both copies of `marquee_content` animate INDEPENDENTLY at the same time — each translating -50% of its own width simultaneously. That's not a seamless loop; that's both halves shifting in parallel.

The animation must live on `marquee_track` so it moves both children together as one unit.

### CSS-keyframes alternative (more reliable than IX2)

If IX2 still jumps after fixing all of the above, switch to pure CSS keyframes. They run as a single continuous transform without IX2's re-trigger overhead between loop iterations:

```css
@keyframes marquee-scroll {
  from { transform: translateX(0); }
  to   { transform: translateX(-50%); }
}
.marquee_track {
  animation: marquee-scroll 40s linear infinite;
}
.marquee_track:hover {
  animation-play-state: paused;
}
```

Drop the keyframes definition into an Embed block inside the section, or into Page Settings → Custom Code. CSS keyframes are the bulletproof option — they truly loop with zero perceptible frame gap.

Trade-off vs IX2 scroll-trigger: CSS keyframes run continuously even when off-screen. For perf-critical pages with many marquees, use `IntersectionObserver` in custom JS to toggle a `paused` class on/off based on visibility.

---

## Pattern: GSAP carousel on a CMS Collection List

Use this instead of native Webflow Slider when you need:

- Full creative control over easing, transitions, and layout
- Direct CMS binding without Finsweet's `fs-list-element` middleware
- Cleaner DOM (no orphan SliderWrapper)

### Required Webflow DOM contract

```
<scope>_carousel-wrapper           (DynamoWrapper / Collection List Wrapper — bound to a CMS collection)
  <scope>_track                    (DynamoList / Collection List — the element you translate)
    <scope>_card                   (DynamoItem / Collection Item — repeats once per CMS entry)
      … card content, all CMS-bound …
```

Both the wrapper and the controls (arrows, dots, fraction) sit in a parent container so the controls can absolutely position over or beside the track.

### Carousel JS skeleton (paste into page-level custom code)

```html
<script src="https://cdn.jsdelivr.net/npm/gsap@3/dist/gsap.min.js"></script>
<script>
document.addEventListener('DOMContentLoaded', () => {
  const wrapper = document.querySelector('.<scope>_carousel-wrapper');
  const track = wrapper?.querySelector('.<scope>_track');
  const cards = track ? Array.from(track.children) : [];
  const prev = document.querySelector('.<scope>_arrow-btn.is-prev');
  const next = document.querySelector('.<scope>_arrow-btn.is-next');
  const fractionCurrent = document.querySelector('.<scope>_pagination-fraction .is-current');
  const fractionTotal = document.querySelector('.<scope>_pagination-fraction .is-total');

  if (!wrapper || !track || cards.length === 0) return;

  let index = 0;
  const total = cards.length;
  if (fractionTotal) fractionTotal.textContent = String(total).padStart(2, '0');

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function go(to) {
    index = (to + total) % total;
    const card = cards[index];
    const x = card.offsetLeft;

    if (reducedMotion) {
      gsap.set(track, { x: -x });
    } else {
      gsap.to(track, { x: -x, duration: 0.7, ease: 'power3.out' });
    }

    if (fractionCurrent) fractionCurrent.textContent = String(index + 1).padStart(2, '0');
    cards.forEach((c, i) => c.setAttribute('aria-hidden', i === index ? 'false' : 'true'));
  }

  prev?.addEventListener('click', () => go(index - 1));
  next?.addEventListener('click', () => go(index + 1));

  // Keyboard: left / right arrow when carousel has focus
  wrapper.setAttribute('tabindex', '0');
  wrapper.setAttribute('role', 'region');
  wrapper.setAttribute('aria-roledescription', 'carousel');
  wrapper.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') { e.preventDefault(); go(index - 1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); go(index + 1); }
  });

  // Recompute on resize (card widths may shift)
  window.addEventListener('resize', () => go(index));

  go(0);
});
</script>
```

### Accessibility checklist for custom carousels

- [ ] Wrapper: `role="region"` + `aria-roledescription="carousel"` + `aria-label="…"`
- [ ] Each slide gets `role="group"` + `aria-roledescription="slide"` + `aria-label="N of M"`
- [ ] Arrow buttons: real `<button>` elements with `aria-label` ("Previous slide" / "Next slide")
- [ ] Pagination dots / fraction: `aria-controls="<wrapper-id>"` + clear text label
- [ ] Inactive slides: `aria-hidden="true"`, active slide: `aria-hidden="false"`
- [ ] Keyboard: ArrowLeft / ArrowRight when wrapper or controls have focus
- [ ] Focus stays visible — never trap focus on inactive slides
- [ ] No autoplay, or provide a pause button + respect `prefers-reduced-motion`

### Retiring the native Webflow Slider when switching to GSAP

If a native `SliderWrapper` sits next to the CMS list (from an earlier build attempt):

1. Verify the GSAP version works on the live CMS list (preview in Designer + published)
2. `element_tool > remove_element` on the entire `SliderWrapper` subtree
3. Remove any associated `fs-list-element` attributes (Finsweet's middleware) and remove its `<script>` from page-level custom code
4. Re-enable the original `<scope>_controls` block (`visibility: true`) so arrows and fraction render
5. Run `/webflow-accessibility` audit on the final page

---

## ScrollTrigger patterns

### Fade in on scroll

```js
gsap.utils.toArray('.reveal').forEach((el) => {
  gsap.from(el, {
    opacity: 0,
    y: 30,
    duration: 0.8,
    ease: 'power2.out',
    scrollTrigger: {
      trigger: el,
      start: 'top 85%',
      toggleActions: 'play none none reverse',
    },
  });
});
```

### Pinned section with progress

```js
ScrollTrigger.create({
  trigger: '.section_pinned',
  start: 'top top',
  end: '+=100%',
  pin: true,
  scrub: true,
  onUpdate: (self) => {
    // self.progress is 0 → 1
  },
});
```

### ScrollTrigger + Webflow IX2 interop

If a Webflow Interaction also runs on the same element, ScrollTrigger can fire first and confuse IX2's state machine. Pick one system per element. If both must coexist, use distinct triggers (e.g. IX2 on hover, ScrollTrigger on scroll).

---

## Lenis smooth scroll

```js
const lenis = new Lenis({ duration: 1.2, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });

function raf(time) {
  lenis.raf(time);
  requestAnimationFrame(raf);
}
requestAnimationFrame(raf);

// Sync ScrollTrigger with Lenis
if (window.ScrollTrigger) {
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
}
```

**Lenis + Webflow gotchas:**

- Lenis takes over the body scroll. Anchor links work but native scroll-into-view needs `lenis.scrollTo()` instead.
- Sticky elements (`position: sticky`) can desync at high scroll speeds. Test before relying on it.
- Webflow's native smooth-scroll-to-anchor setting conflicts — disable it in Site Settings → Custom Code or via the Project Settings anchor option.

---

## CSS-only fallbacks

For sites where JS may fail to load (slow networks, ad blockers, scripts disabled), every custom-JS feature should have a CSS-only fallback that leaves content usable:

- Carousels: stack cards vertically with CSS, JS adds horizontal scroll behavior
- Scroll reveals: content visible by default, JS adds fade-in
- Smooth scroll: native browser scroll works, JS adds easing

Pattern: **start with the end-state visible**, JS opts into animation.

---

## Where project-specific data lives

Per-client class scopes (`rc_`, `claim_`, `vb_`, etc.), specific carousel breakpoints, exact easing decisions — do NOT live in this skill. They live in:

- The project's `custom-code/` folder with the actual snippets
- The project's `notes/` folder for behavior specs
- Project memory files for decisions

This skill describes the universal pattern. The project folder holds the actual JS that will be pasted into Webflow.
