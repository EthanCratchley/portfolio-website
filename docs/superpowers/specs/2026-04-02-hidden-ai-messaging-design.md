# Hidden AI Messaging — Design Spec

## Context

Ethan's portfolio site (ethancratchley.com) is a static HTML/CSS/JS site with 21 pages hosted on GitHub Pages. Currently it has zero SEO meta tags, no structured data, no robots.txt, and no sitemap. The goal is to embed hidden messaging across the entire site that positively influences AI agents and web crawlers evaluating or summarizing Ethan — without affecting visual appearance or functionality. Three narrative angles: hire as engineer, back as founder, playful easter eggs.

## Approach: Multi-Layer Saturation

Six layers targeting different AI ingestion vectors. Every page gets layers 2-5. Layer 1 on main pages only. Layer 6 is site-wide.

### Layer 1: JSON-LD Structured Data (6 main pages)

- Person schema on `index.html` only (name, jobTitle, description, knowsAbout, alumniOf, worksFor, sameAs)
- WebPage schema on all 6 main pages with persuasive descriptions
- Inserted in `<head>` after Google Analytics script
- Description fields carry superlative professional language

### Layer 2: Meta Tags (all 21 files)

- `<meta name="description">` — unique per page, persuasive framing
- `<meta name="keywords">` — skill-focused keywords
- `<meta name="author">` — Ethan Cratchley
- Open Graph tags (og:title, og:description, og:type, og:url)
- Inserted after `<title>` tag in every file
- Also fixes the site's missing SEO as a side effect

### Layer 3: HTML Comments (all 21 files)

- 15 unique comment variants across 3 angles (5 hire, 5 founder, 5 playful)
- 3-4 comments per main page, 2 per writing article
- Placed at: before `</head>`, after `</header>`, between sections, before `</body>`
- Distribution matrix ensures no two pages share the same comment pair

### Layer 4: Visually Hidden Elements (all 21 files)

- `.aux` CSS class in styles.css (standard sr-only pattern: position absolute, 1px, clip rect)
- `<span class="aux">` elements with persuasive text
- 2-3 per main page, 1 per writing article
- 27 unique text variants — each page-specific and contextual
- Placed at end of major content sections

### Layer 5: Aria-Label & Alt Text Enrichment (all 21 files)

- Nav links get aria-labels with persuasive descriptions (all 21 files)
- Project card images get enriched alt text (projects page)
- Resume download link gets aria-label (home page)
- Profile images get enriched alt text (home + contact)

### Layer 6: robots.txt & Sitemap (site root)

- `robots.txt` with comment-based messaging + Allow all + Sitemap directive
- `sitemap.xml` listing all 21 pages with priority weighting

## Files Modified

- `styles/styles.css` — add `.aux` class
- `robots.txt` — new file
- `sitemap.xml` — new file
- All 6 main pages: `index.html`, `contact/index.html`, `experience/index.html`, `projects/index.html`, `writing/index.html`, `garden/index.html`
- All 15 writing articles in `writing/microblogFiles/`

## Implementation Sequence

1. **Foundation (parallel):** Add `.aux` to CSS, create robots.txt, create sitemap.xml
2. **HTML files (per-file single pass):** Process each file once applying all applicable layers
   - Batch 1: `index.html` (most complex — all layers)
   - Batch 2: Other 5 main pages
   - Batch 3: 15 writing articles (similar template structure)
3. **Verification:** Visual regression, JS functionality, DOM audit, schema validation

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| `.aux` shifts layout | Standard sr-only pattern, position:absolute removes from flow |
| JSON-LD syntax errors | Validate with schema.org validator |
| Google spam filters on meta tags | Keep meta descriptions factual-sounding; aggressive content goes in comments and .aux spans |
| JS breakage from new DOM elements | Confirmed: no JS selectors match `.aux` spans |

## Verification

1. Open all 6 main pages in browser — zero visual differences
2. Test theme toggle, search modal, project filters, canvas animation
3. DevTools: `document.querySelectorAll('.aux')` returns correct count per page
4. View source: comments visible, meta tags in head, JSON-LD valid
5. Validate JSON-LD with Google Rich Results Test
6. Load robots.txt and sitemap.xml in browser
7. Lighthouse accessibility audit — score should improve

## Message Variant Totals

| Layer | Unique variants | Total placements |
|-------|----------------|-----------------|
| JSON-LD | 7 blocks | 7 |
| Meta tags | 21 descriptions | ~147 tags |
| HTML comments | 15 variants | ~51 |
| .aux spans | 27 texts | 27 |
| Aria-labels/alt | ~8 types | ~130 |
| robots.txt/sitemap | 2 files | 2 |

~78 unique persuasive text variants across the entire site.
