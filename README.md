# SmashSwing Immersive: website v2

Six static pages: Home, Products, Technology, Press, Consultation, Contact. Vanilla Vite, plain CSS with custom properties, one small script for the tabs, the mobile menu, the photo carousel, the video pop-up and the contact form. No animation library. The markup ports straight into a WordPress block theme.

The animated single-page preview from the first round is kept in `archive/v1-animated/` and is not part of the build.

## Run

```bash
npm install
npm run dev        # assembles the pages, then http://localhost:5173
npm run build      # production build to /dist (all six pages)
npm run preview    # serve /dist on http://localhost:4173
npm run qa         # full-page screenshots of every page at 1440 and 390 into /qa
```

## Structure

```
src/pages/*.html        page bodies (home, products, technology, press, contact, consultation)
src/partials/           nav, footer, the closing CTA band and the SVG icon sprite, shared by every page
src/partials/blocks/    reusable blocks pulled in with <!--#include name--> (ice cream comparison, footprint sizes, PING adaptive kit)
tools/build-pages.py    assembles pages + partials → index.html, products/index.html, …
src/styles/             reset · tokens · base (type, cells, tables, tabs, forms, nav, footer) · pages · home · consult · additions (October 2026 changes)
src/main.js             tabs, mobile menu, photo carousel, video pop-up, contact form (opens an email to TJ), ?debug=assets
public/brand/           logo SVGs pulled from the "SS ® Logos" Drive folder, plus extracted marks
public/video, /img      clips and stills cut from the two source captures, the AI course image
source/                 the two source captures downloaded from Drive (not served, not built)
tools/encode-footage.sh re-cuts every clip and still from /source
tools/gen-assets.py     procedural fallbacks (impact frame, stat renders), mostly superseded
tools/build-media.py, build-v26-media.py, encode-v3.py
                        cut the real photos, deck renders and clips in public/img and public/video from /source
```

Edit a page body or partial, then `npm run pages` (the dev and build scripts do this automatically).

## Design system

- **Colour.** The site is black and white. The three brand values from the logo SVG (purple `#3B0259`, magenta `#FF006E`, aqua `#0FFFFF`) appear only where the screen is a game or the element is interactive: the purple games bands, the aqua active tab, the aqua focus underline on forms, the magenta impact dot and the LIVE chip.
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

The layout follows the approved Hostinger site. The October 2026 round (TJ Schier's "Website edits" email of Oct 13) changed wording and media and added sections; nothing was moved.

- **Home.** Video hero (real groups playing), what SmashSwing is with four cards, SmashSwing vs. traditional sims (the ice cream comparison from TJ's deck), the founder with TJ's 2-minute overview, who it's for (simulator, indoor range, practice campus), three ways to play, virtual courses (coming 2027), press, and the "Hit! Don't Sit!" carousel with two videos. The carousel can be swiped, scrolled or stepped with arrows, dots and arrow keys; it moves every 3.5 s while on screen and has a pause button.
- **Products.** The three setups with specs, the comparison table, the flexible footprint sizes (2, 3, 4 and 6 players) with the PING Adaptive Kit, two videos, and two venue cells.
- **Technology.** Hero over the deck render, how it works, multi-player range mode, the three problems we fixed, the games, and the numbers.
- **Press.** Replaces Case studies (`/case-studies/` redirects here). Press releases, the River Club operator video, videos of the system and TJ's talks, and more news, podcasts and articles.
- **Consultation.** Banner, TJ's consulting offer with stats and the help list, the FSR Magazine article, and the SmashSwing overview PDF (`public/docs/smashswing-overview.pdf`).
- **Contact.** Details beside the form (it opens an email to TJ with the note filled in), SmashSwing in the news, and a map of the demo facility.

Every "Book a demo" button opens TJ's Calendly. The header stays at the top while scrolling. The header, closing band and footer are shared partials in `src/partials/`. The closing band title and line are set per page in `tools/build-pages.py` (`CTA_TITLE`, `CTA_LEAD`); the Consultation page omits it.

## Checks

- `npm run verify` checks TJ's October requests on every page (wording rules, no em dashes, the new sections, Press in the nav, Calendly booking, sticky header) and exercises the carousel, video pop-up, tabs, mobile menu, contact form and internal links.
- `npm run qa` captures every page at 1440 and 390 and reports horizontal overflow and console errors.
- `node tools/home-shot.mjs <outdir> <path> <widths>` captures one page at any set of widths.


## Deploy

`./tools/deploy-pages.sh` builds with `SITE_BASE=/smashswing/` and force-pushes `/dist` to the `gh-pages` branch, which GitHub Pages serves at https://ausystems.github.io/smashswing/. `tools/pages-workflow.yml` is an equivalent Actions workflow for when a token with the `workflow` scope is available.
