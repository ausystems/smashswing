# SmashSwing Immersive — website v2

Five static pages: Home, Products, Technology, Case studies, Contact. Vanilla Vite, plain CSS with custom properties, one small script for the product toggle, the mobile menu and the two forms. No animation library, no scroll effects, no transitions. The markup ports straight into a WordPress block theme.

The animated single-page preview from the first round is kept in `archive/v1-animated/` and is not part of the build.

## Run

```bash
npm install
npm run dev        # assembles the pages, then http://localhost:5173
npm run build      # production build to /dist (all five pages)
npm run preview    # serve /dist on http://localhost:4173
npm run qa         # full-page screenshots of every page at 1440 and 390 into /qa
```

## Structure

```
src/pages/*.html        page bodies (home, products, technology, case-studies, contact)
src/partials/           nav, footer and the closing CTA band, shared by every page
tools/build-pages.py    assembles pages + partials → index.html, products/index.html, …
src/styles/             reset · tokens · base (type, cells, tables, tabs, forms, nav, footer) · pages
src/main.js             tabs, mobile menu, teaser and contact validation, ?debug=assets
public/brand/           logo SVGs pulled from the "SS ® Logos" Drive folder, plus extracted marks
public/video, /img      clips and stills cut from the two source captures, the AI course image
source/                 the two source captures downloaded from Drive (not served, not built)
tools/encode-footage.sh re-cuts every clip and still from /source
tools/gen-assets.py     procedural fallbacks (impact frame, stat renders) — mostly superseded
```

Edit a page body or partial, then `npm run pages` (the dev and build scripts do this automatically).

## Design system

- **Colour.** The site is black and white. The three brand values from the logo SVG — purple `#3B0259`, magenta `#FF006E`, aqua `#0FFFFF` — appear only where the screen is a game or the element is interactive: the purple games bands, the aqua active tab, the aqua focus underline on forms, the magenta impact dot and the LIVE chip.
- **Type.** Archivo throughout. Display headlines use the expanded width (115–118%) at weight 800 to echo the wide wordmark; body copy is the normal width. Martian Mono, uppercase and tracked, carries every label, index and data value.
- **Structure.** A 12-column grid with hairline cells (`.cells`) for features, specs, stats and steps; split section headers (index + headline left, lead + link right); static oversized type bands cropped at both edges; registration marks on the technology hero; the cropped wordmark that closes every page.
- **Media.** All footage and stills sit in monochrome (`.media--bw`) inside black-and-white sections. Inside the purple games bands the same captures run in full colour.

## Assets and what is still placeholder

All footage on the site is cut from the two screen captures on the Drive: `driving-range.mp4` (9 minutes, 1080p60) and `Range Session ipad.MP4` (78 seconds, 4:3). They show the game software, not the rooms. Every slot that should eventually show real people playing carries `data-placeholder="true"`; `?debug=assets` outlines them with a label.

| Slot | Current file | To replace with |
| --- | --- | --- |
| Home hero loop | `video/hero.mp4` (aerial sweep, 66–78 s of driving-range) | room footage with people hitting |
| Product toggle clips | `video/product-sim.mp4`, `video/product-range.mp4` | bay footage / range footage |
| Product proof clips | `video/proof-sim.mp4`, `video/proof-range.mp4` | Mequon and Lewisville clips |
| Founder video | poster only (`img/still-welcome.webp`, the software's welcome splash) | TJ's video: set `data-video-src` and drop the `disabled` on the play button |
| Games band images | `img/still-ring.webp`, `img/still-zones.webp` (colour captures) | Asteroids and Space Invaders captures |
| Coming-soon background | `img/teaser-course.webp` (AI-generated course at dusk) | the AI-animated first look when it lands |
| Case study media | range captures in monochrome | Wisconsin (lead) and Texas footage |
| Testimonial | composite quote from one client | real quotes per facility |
| Contact email | `hello@smashswing.com` | confirmed address |

To re-cut clips after changing times or crops: `./tools/encode-footage.sh` (needs ffmpeg with libx264 and libsvtav1). Every cut crops the HUD column and club badge out of the capture.

## Pages

- **Home.** Full-width monochrome video hero with the differentiator headline; static type band; four hairline cells on why it is different; the founder video, full width; the in-place product toggle (tabs, no animation); the purple games band; the coming-soon teaser with email capture; two facility cards; the closing CTA.
- **Products.** Page head; the same toggle with a seven-row spec list; a side-by-side comparison table; two video proof tiles with native controls; four venue cells.
- **Technology.** Blueprint hero with the readout and the impact frame; four numbered steps; the "conventional simulator vs SmashSwing" contrast table (no competitor named); games band; six data cells.
- **Case studies.** Alternating facility profiles with sticky media, stats, spec rows and a link; a flagged composite testimonial. Add a facility by copying one `article.facility`.
- **Contact.** Details and next steps on the left, the form on the right; client-side validation and a success state only.

## Checks

`npm run qa` captures every page at 1440 and 390, walks each page so lazy images load, and reports horizontal overflow and console errors. Both are clean at the time of writing.
