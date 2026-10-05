# The Times of Palestine — news theme

English-language news site for **The Times of Palestine** (paltimesnews.com):
news, context and stories from Palestine. Static HTML, CSS and JavaScript with
no framework and no required build step. Open `index.html` through any static
server and it runs.

**Live demo:** <https://taktek-dev.github.io/theme-times-of-palestine/>
(add `?news=breaking` or `?news=calm` to any page to see the header's other moods)

![Home, desktop](docs/home-desktop.webp)

| | |
| --- | --- |
| ![Front-page modules](docs/home-modules.webp) | ![Article](docs/article-desktop.webp) |

![Home, article and live page on a phone](docs/mobile.webp)

## Pages

| File | Template |
| --- | --- |
| `index.html` | Home: lead story with its package, "The day so far" timeline, context card, Gaza front, photo gallery, ledger of places, the context desk (analysis and opinion), most read with the newsletter, culture spread |
| `article.html` | Story: headline, byline and sharing, lead photograph, body on the spine with side notes, pull quote (Arabic and English), step timeline, picture pair, standards note, author box, related stories |
| `live.html` | Live coverage: status, key events (sticky on desktop), updates feed with "new updates" and "older updates", context column |
| `section.html` | Section front (Gaza): giant title, topics, front strip, gallery, two-column archive, most read |
| `author.html` | Reporter profile, latest story as a spread, earlier stories |
| `search.html` | Search results with facets, highlighted terms and a context card |
| `photo-essay.html` | Photo essay on ink: numbered plates in four layouts |
| `about.html` | About, how to read us, standards, corrections, contact |
| `404.html` | Not found, with search and the main sections |

Every story link in the demo opens `article.html` and every section link opens
`section.html` (with `?section=` naming the section), so each template can be
reached from anywhere.

## Run it

```bash
python -m http.server 8000
```

Then open <http://localhost:8000>. Any static host works the same way
(GitHub Pages, Netlify, an S3 bucket, nginx).

## Structure

```
.
├── index.html … 404.html   nine templates (see above)
├── partials/               head.html, header.html, footer.html: the source of truth for shared markup
├── css/
│   ├── fonts.css           @font-face, plus metric-matched fallbacks (no layout shift on swap)
│   ├── tokens.css          colour, type, space and layout tokens
│   ├── base.css            reset, document defaults, motion and print
│   ├── components.css      atoms and shared parts (cards, section heads, tabs, share, pager…)
│   ├── header.css          header, menu, breaking band, condensed bar
│   ├── footer.css          footer
│   ├── core.css            GENERATED: the six files above in one request
│   ├── modules.css         front-page modules (home, section front, author)
│   └── home.css · article.css · live.css · section.css · author.css · search.css · essay.css · about.css · 404.css
├── js/main.js              all behaviour, one deferred file, no dependencies
├── fonts/                  Newsreader, Figtree, Markazi Text (woff2, OFL licences alongside)
├── img/
│   ├── brand/              logo, inverse logo, mark, leaf, braces, ring (SVG)
│   ├── photos/             responsive WebP sets: <name>-<width>.webp
│   ├── icons/              app icons for the manifest
│   └── og/                 1200×630 social cards
├── tools/build.py          builds css/core.css, syncs partials into pages, versions assets, checks links
├── favicon.ico · favicon.svg · apple-touch-icon.png · site.webmanifest
├── robots.txt · sitemap.xml · feed.xml
└── CREDITS.md              photographs, typefaces, identity
```

## Editing

The header, footer and the shared part of `<head>` are written once, in
`partials/`. Each page holds a copy between markers such as
`<!-- tot:header -->` and `<!-- /tot:header -->`. Edit the partial, never the
copy, then run:

```bash
python tools/build.py
```

It rebuilds `css/core.css`, writes the partials into every page, marks links to
the current page with `aria-current="page"` and stamps `?v=N` on every CSS and JS
reference. After any CSS or JS change, raise the version so browsers fetch the
new files:

```bash
python tools/build.py --bump
```

`--check` also reports missing files, duplicate ids and placeholder links.
The tool is standard-library Python 3.8+.

## The identity in code: "Ledger & Leaf"

- **Colour is temperature.** Red `--now` (#CC3333) means live, breaking, the
  last hour; when nothing is live there is no red on the page. Green
  `--context` (#006633) means explainers, analysis, links and focus. Ink
  `--record` (#190707) is the reporting itself. Neutrals are "stone": red and
  green mixed in OKLab, run from paper (#FBF9F6) to ink.
- **One glyph.** A single leaf of the three-leaf mark is the only icon shape:
  arrow head, live pulse, timeline node, breadcrumb separator, the notch in the
  footer, the marker under the current tab. Half a leaf on each side makes the
  braces `{ Explained }` that label context. A ring of leaves marks the
  editorial standards.
- **The spine.** The mark's column is carried down every page
  (`.spine`, `--mark-w`): the day's timeline, the places ledger, the article
  progress leaf and the live feed all hang on it.
- **Type.** Newsreader for headlines and text (roman reports, italic stories
  and section titles), Figtree for the interface, Markazi Text for Arabic.
  Scales in `tokens.css` (`--t-display` 44→92px down to `--t-micro` 12px).
- **The menu is the mark**: three stacked leaves that light up red, green and
  ink on hover and turn into a triskelion when open.
- Photographs stay rectangular, are cropped by ratio only and never carry text.

Components answer to their own width through container queries, so the same
markup works in a sidebar, a column or across the page. Breakpoints:
720px (8 columns) and 1100px (12 columns).

## Behaviour (`js/main.js`)

Each part looks for its own markup, so every page loads the same file.

| Hook | What it does |
| --- | --- |
| `[data-now]`, `[data-clock]` | Date and clock in Palestine time (Asia/Hebron), updated on the minute |
| `time[data-ago="N"]` | **Demo only**: sample times written as "N minutes before the page loaded", so the theme always reads as today. A CMS prints real times and drops the attribute |
| `?news=calm\|live\|breaking` | **Demo only**: previews the header's three moods (also `data-news` on `.site-header`) |
| `[data-menu-toggle]` | Opens and closes `#site-menu`; Escape and outside clicks close it; focus returns to the button |
| `.minibar` | The condensed 56px bar once the masthead scrolls away; the menu then hangs under it |
| `[data-gallery]` | Gallery: index, thumbnails, previous/next, arrow keys; pictures come from the JSON in `[data-gal-data]` |
| `[data-live-feed]` | Live page: `[data-new]` updates wait behind "N new updates", `[data-older]` behind "Load older updates"; key events open older updates when needed |
| `[data-copy-link]` | Copies the page address (plus the attribute's fragment, e.g. one live update) and confirms in a toast |
| `[data-share]` | Builds X, WhatsApp, Facebook and Telegram share links from the page being viewed (real links are also in the markup) |
| `[data-newsletter]` | Shows the confirmation in place. **Front end only**: connect the form to the mailing service |

Without JavaScript every page still reads in full: new and older live updates
are simply shown, and the gallery shows its first picture with its captions.

## Images

Each photograph has WebP files at 160, 320, 640, 800, 960, 1280 and 1600px
(up to its original width). Markup uses `srcset` plus `sizes` written for where
the picture sits. Lazy pictures add `sizes="auto"` so Chromium picks from the
rendered width, except where a picture takes its height from its own
proportions (photo-essay plates, article figures): `auto` adds size containment
there. The lead picture of each template loads eagerly with
`fetchpriority="high"`. `width` and `height` are always set; focal points use
`object-position`.

## SEO and sharing

Every template has a title, description, canonical URL, Open Graph and
Twitter card tags (1200×630 images in `img/og/`) and JSON-LD: `WebSite` with
`SearchAction` and `NewsMediaOrganization` (home), `NewsArticle` (article,
photo essay), `LiveBlogPosting` (live), `CollectionPage` (section),
`ProfilePage` (author), `AboutPage`, and `BreadcrumbList` where there are
breadcrumbs. Search and 404 are `noindex`. `sitemap.xml`, `robots.txt` and an
RSS `feed.xml` are included as static samples.

## Accessibility

Landmarks and one `h1` per page, a skip link, visible focus (2px green),
`aria-current` on the current section, labelled controls (labels that are not
shown are visually hidden, never removed), 24px minimum targets, live regions
for the toast and gallery captions, focus moved to revealed live updates, and
`prefers-reduced-motion` respected (the live pulse stops, transitions collapse).

## Checked on 5 October 2026

- **Layout**: all nine templates at 375, 834 and 1440px in Chrome: no
  horizontal overflow, no console errors, no failed requests; desktop pages
  match the approved design boards.
- **Behaviour**: 29 scripted checks (menu, condensed bar, gallery, live
  updates, copy and share, newsletter, header moods, search form): all pass.
- **Accessibility**: axe-core 4.10 (WCAG 2.0, 2.1, 2.2 A and AA, plus best
  practices) on every template at 375 and 1440px, and with the menu open: no
  violations.
- **Markup**: html-validate 9: no errors with the `standard` preset, nor with
  `recommended` (its `no-inline-style` and `long-title` rules off: focal
  points are inline `object-position`, and page titles carry the site name).
- **Lighthouse 12**, mobile, served locally without compression: Performance
  80–84, Accessibility 100, Best Practices 100, SEO 100; CLS 0, FCP 1.8s, LCP
  about 4.1s under simulated slow 4G. On a host that compresses text
  (GitHub Pages does) the HTML and CSS weigh far less, so expect better.

Not checked: Safari and Firefox on real devices, screen readers by hand, the
pages behind a real CMS.

## Browser support

Current Chrome, Edge, Safari and Firefox. The layout relies on container
queries, `subgrid`, `:where()`, `inert`, `text-wrap: balance` (enhancement
only) and the individual `translate`/`rotate`/`scale` properties.

## Before launch

- [ ] Replace the placeholders in square brackets (`[Reporter name]`,
      `[Breaking headline…]`, `[newsroom email]`…) and the placeholder links
      (`#instagram`, `#privacy`…); `python tools/build.py --check` lists them
- [ ] Replace the sample photographs (see `CREDITS.md`), or keep their credits
- [ ] Print real times from the CMS and remove `data-ago` (and the `?news=` preview, if wanted)
- [ ] Connect the newsletter form and the search page to the backend
- [ ] Generate `sitemap.xml` and `feed.xml` from the CMS; check the domain in
      `robots.txt`, canonical and `og:url` tags if it changes
- [ ] `404.html` uses root-relative paths so it works at any depth. `BASE_404`
      in `tools/build.py` is `/theme-times-of-palestine/` for the GitHub Pages
      demo: set it to `/` for the production domain and run the tool
- [ ] Point the server's 404 handler at `404.html`

## Credits

Photographs from Wikimedia Commons, typefaces under the SIL Open Font
License: see [`CREDITS.md`](CREDITS.md). The logo and mark belong to The Times
of Palestine.
