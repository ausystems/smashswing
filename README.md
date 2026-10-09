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

- **Home.** Follows the approved Hostinger layout section for section: video hero, why it's different with four cards, the founder, the two-format toggle, ways to play, virtual golf courses (coming in 2027), where it's playing, the River Club photo gallery, and the closing band. Copy follows the October 2026 homepage brief. The gallery steps instantly with arrows, dots and arrow keys. Nothing animates.
- **Products.** Page head, the format toggle with spec lists, a comparison table, two video proof tiles and four venue cells.
- **Technology.** Blueprint hero with the readout and impact frame, four steps, the conventional-simulator contrast table, the games band and six data cells.
- **Case studies.** Alternating facility profiles with stats and a flagged composite testimonial. Add a facility by copying one `article.facility`.
- **Consultation.** Mirrors the approved Consultation page: banner, TJ's consulting offer with stats and the help list, the FSR Magazine article, and the SmashSwing overview PDF (`public/docs/smashswing-overview.pdf`).
- **Contact.** Details and next steps beside the form, with client-side validation and a success state.

The header, closing band and footer are shared partials in `src/partials/`. The closing band line is set per page in `tools/build-pages.py` (`CTA_LEAD`). The Contact and Consultation pages omit it, as in the approved layout.

## Checks

- `npm run verify` checks every homepage string from the copy brief, confirms the old copy is gone, scans for em dashes, and exercises the tabs, gallery, mobile menu and internal links.
- `npm run qa` captures every page at 1440 and 390 and reports horizontal overflow and console errors.
- `node tools/home-shot.mjs <outdir> <path> <widths>` captures one page at any set of widths.


## Deploy

`./tools/deploy-pages.sh` builds with `SITE_BASE=/smashswing/` and force-pushes `/dist` to the `gh-pages` branch, which GitHub Pages serves at https://ausystems.github.io/smashswing/. `tools/pages-workflow.yml` is an equivalent Actions workflow for when a token with the `workflow` scope is available.
