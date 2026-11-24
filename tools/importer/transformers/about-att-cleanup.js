/* eslint-disable */
/* global WebImporter */

/**
 * about.att.com cleanup transformer.
 * Removes non-authorable chrome (global header/footer, skip nav, cookie/consent
 * containers, feedback widget, tracking pixels/iframes, CMS editor labels,
 * hidden inputs, empty text components, "View More" load-more control).
 * All selectors come from migration-work/cleaned.html.
 */
function removeAll(root, selectors) {
  selectors.forEach((sel) => {
    root.querySelectorAll(sel).forEach((el) => el.remove());
  });
}

/*
 * Story template (/story/*) helpers. Everything below is gated by isStory() so
 * the home template import is unchanged.
 */
function isStory(element, payload) {
  const name = payload && payload.template && payload.template.name;
  if (name) return name === 'story';
  return Boolean(element.querySelector('main > .story__wrap'));
}

// Article header: source H1 is <h1><p><b>title</b></p></h1> (or a bare <p><b>)
// inside .story--title. Author it as a plain-text <h1>.
function normalizeStoryTitle(element, document) {
  element.querySelectorAll('.article__header .story--title').forEach((title) => {
    const source = title.querySelector('h1') || title.querySelector('p');
    if (!source) return;
    const text = source.textContent.replace(/\s+/g, ' ').trim();
    if (!text) return;
    const h1 = document.createElement('h1');
    h1.textContent = text;
    source.replaceWith(h1);
  });
}

// Headings are authored as <hN><b>text</b></hN>; drop the redundant bold.
function unwrapBoldInHeadings(element) {
  element.querySelectorAll('h1 b, h1 strong, h2 b, h2 strong, h3 b, h3 strong, h4 b, h4 strong, h5 b, h5 strong, h6 b, h6 strong')
    .forEach((b) => b.replaceWith(...b.childNodes));
}

// First non-empty <meta> value. Searches the whole document: in the scraped
// snapshot a tracking <iframe> injected into <head> makes the parser move the
// SBC-SEARCH-*, keywords and og:image tags into <body>.
function pageMeta(document, name) {
  const el = [...document.querySelectorAll(`meta[name="${name}"], meta[property="${name}"]`)]
    .find((m) => (m.getAttribute('content') || '').trim());
  return el ? el.getAttribute('content').replace(/\s+/g, ' ').trim() : '';
}

function toIsoDate(value) {
  if (!value) return '';
  const m = value.match(/^(\d{4}-\d{2}-\d{2})/);
  if (m) return m[1];
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function textOf(document, selector) {
  const el = document.querySelector(selector);
  return el ? el.textContent.replace(/\s+/g, ' ').trim() : '';
}

// Story page metadata: always the same 12 fields, in authoring order, so every
// story page carries the full schema. Values come from the source <meta> tags
// with body fallbacks and site defaults:
//   Author    - "AT&T Newsroom" unless the source names one
//   Category  - the source's search category, else the most specific story tag
//   Image Alt - og:image:alt, else the banner image's alt (filenames ignored), else the title
//   Related Priority - blank (authors set it)
const STORY_METADATA_FIELDS = [
  'Template', 'Title', 'Description', 'Author', 'Image', 'Image Alt',
  'Publish Date', 'Category', 'Tags', 'Keywords', 'Exclude from Related', 'Related Priority',
];

const DEFAULT_STORY_AUTHOR = 'AT&T Newsroom';

// Story tags from most to least specific; the first one a story has becomes its Category.
const CATEGORY_PREFERENCE = [
  'Wireless', 'Internet & Fiber', 'Mobile Devices', 'Technology', 'Innovation', 'Investors',
];

function categoryFromTags(tags) {
  const lower = tags.map((t) => t.toLowerCase());
  const preferred = CATEGORY_PREFERENCE.find((c) => lower.includes(c.toLowerCase()));
  return preferred || tags[0] || '';
}

// CMS alts that are just the asset filename ("ATT_logo_STORY_BANNER_850x500.png").
function isFilenameAlt(alt) {
  return /\.(png|jpe?g|gif|webp|svg)$/i.test(alt) || /^[\w-]+_\d+x\d+$/i.test(alt);
}

// The story banner: first image in the article body.
function storyBanner(document) {
  return document.querySelector('.article__content img, .story__wrap article img');
}

function getStoryMetadata(document) {
  const meta = Object.fromEntries(STORY_METADATA_FIELDS.map((field) => [field, '']));

  // page template: adds the "story" body class used by the story styles
  meta.Template = 'story';

  meta.Title = textOf(document, 'title') || pageMeta(document, 'og:title');

  // The source has two identical <meta name="description"> tags; the default
  // rule joins them ("X, X"). Use the first one.
  meta.Description = pageMeta(document, 'description')
    || pageMeta(document, 'og:description')
    || textOf(document, '.story--description');

  meta.Author = pageMeta(document, 'author') || pageMeta(document, 'article:author') || DEFAULT_STORY_AUTHOR;

  const banner = storyBanner(document);
  const bannerAlt = banner ? (banner.getAttribute('alt') || '').trim() : '';
  const imageAlt = pageMeta(document, 'og:image:alt') || pageMeta(document, 'twitter:image:alt')
    || (bannerAlt && !isFilenameAlt(bannerAlt) ? bannerAlt : '')
    || meta.Title;
  const image = pageMeta(document, 'og:image') || pageMeta(document, 'x:image');
  if (image) {
    const img = document.createElement('img');
    img.src = image;
    img.alt = imageAlt;
    meta.Image = img;
  }
  meta['Image Alt'] = imageAlt;

  let published = toIsoDate(pageMeta(document, 'SBC-SEARCH-PUBLISHDATE'));
  if (!published) {
    document.querySelectorAll('script[type="application/ld+json"]').forEach((s) => {
      if (published) return;
      try { published = toIsoDate(JSON.parse(s.textContent).datePublished); } catch (e) { /* ignore */ }
    });
  }
  if (!published) {
    // Dateline "DALLAS, November 06, 2026"
    const m = textOf(document, '.story--pub-date').match(/([A-Z][a-z]+ \d{1,2}, \d{4})/);
    if (m) published = toIsoDate(m[1]);
  }
  meta['Publish Date'] = published;

  // The source's search category is usually the catch-all "All"; only keep a real one.
  const tags = pageMeta(document, 'SBC-SEARCH-TAGS_LIST')
    .split('~').map((t) => t.trim()).filter(Boolean);
  meta.Tags = tags.join(', ');

  const category = pageMeta(document, 'SBC-SEARCH-CATEGORY');
  meta.Category = category && category.toLowerCase() !== 'all' ? category : categoryFromTags(tags);

  meta.Keywords = pageMeta(document, 'keywords');

  // Related-stories controls: included by default, no priority until an author sets one.
  meta['Exclude from Related'] = 'false';
  meta['Related Priority'] = '';

  return meta;
}

/*
 * Story metadata: the import script appends the page Metadata block with
 * WebImporter.rules.createMetadata(main, document) right after afterTransform.
 * Keep that convention (one Metadata block, in its own trailing section) and
 * add the story fields by wrapping the rule for that one call. The wrapper
 * restores the original rule on first use and only applies to this document.
 */
function installStoryMetadata(document) {
  const rules = typeof WebImporter !== 'undefined' && WebImporter.rules;
  if (!rules || typeof rules.createMetadata !== 'function') return;
  const original = rules.createMetadata.excatOriginal || rules.createMetadata;

  const wrapped = function createStoryMetadata(main, doc) {
    rules.createMetadata = original;
    if (doc !== document) return original(main, doc);
    // Story fields first (authoring order), then anything else the default
    // rule finds (e.g. a differing og:title).
    const meta = { ...getStoryMetadata(doc) };
    // keep the story schema exact: only add default-rule fields that aren't a variant of ours
    const known = new Set(STORY_METADATA_FIELDS.map((f) => f.toLowerCase()).concat(['publication date']));
    Object.entries(WebImporter.Blocks.getMetadata(doc)).forEach(([key, value]) => {
      if (!(key in meta) && !known.has(key.toLowerCase())) meta[key] = value;
    });
    if (Object.keys(meta).length > 0) {
      main.append(WebImporter.Blocks.getMetadataBlock(doc, meta));
    }
    return meta;
  };
  wrapped.excatOriginal = original;
  try {
    rules.createMetadata = wrapped;
  } catch (e) {
    // Read-only rules object: fall back to the default metadata rule.
  }
}

function isBlockTable(table, name) {
  const first = table.querySelector('tr > th, tr > td');
  return Boolean(first) && first.textContent.trim().toLowerCase().replace(/[\s-]+/g, ' ').startsWith(name);
}

const ATT_BLUE = /rgb\(\s*0\s*,\s*159\s*,\s*219\s*\)|#009fdb/i;

function markBlueHeadings(element, document) {
  const headings = [...element.querySelectorAll('h2')].filter((h) => !h.closest('table'));
  if (!headings.length) return;
  const isBlue = (h) => [h, ...h.querySelectorAll('[style]')].some((el) => ATT_BLUE.test(el.getAttribute('style') || ''));
  if (!headings.every(isBlue)) return;
  // the article is the first section: it ends at the first section break (the
  // sections transformer marks styled breaks; any <hr> otherwise)
  const firstBreak = element.querySelector('hr[data-excat-section-id]') || element.querySelector('hr');
  const style = WebImporter.Blocks.createBlock(document, { name: 'Section Metadata', cells: { style: 'blue-headings' } });
  if (firstBreak) firstBreak.before(style); else element.append(style);
}

function appendRelatedStoriesIfMissing(element, document) {
  const tables = [...element.querySelectorAll('table')];
  if (tables.some((t) => isBlockTable(t, 'related stories'))) return;
  const block = WebImporter.Blocks.createBlock(document, { name: 'related-stories', cells: [['limit', '3']] });
  const style = WebImporter.Blocks.createBlock(document, { name: 'Section Metadata', cells: { style: 'blue' } });
  element.append(document.createElement('hr'), block, style);
}

export default function transform(hookName, element, payload) {
  const story = isStory(element, payload);
  const document = element.ownerDocument || (payload && payload.document);

  if (hookName === 'beforeTransform' && story) {
    // Empty CMS parsys containers around the article.
    removeAll(element, ['.story__preface', '.story__footer']);
    normalizeStoryTitle(element, document);
    // Spacer divs (<div>&nbsp;</div>) between article components.
    element.querySelectorAll('.article__content div:not([class])').forEach((div) => {
      if (!div.children.length && !div.textContent.replace(/\u00a0/g, ' ').trim()) div.remove();
    });
  }

  if (hookName === 'beforeTransform') {
    // Blockers that could interfere with block matching / parsing.
    removeAll(element, [
      'script',
      'style',
      'noscript',
      'link',
      // Tracking iframes; video players are kept for the embed parser.
      'iframe:not([src*="youtube.com/embed"]):not([src*="youtube-nocookie.com/embed"]):not([src*="player.vimeo.com"])',
      // Hidden CMS inputs (e.g. inside the hero banner)
      'input.contentFriendlyName',
      // AEM "HTML Editor Component" authoring labels
      '.html-editor > h4.editor',
      // "View More" load-more control (behavior, not content)
      '.stories__cta',
    ]);

    // Empty AEM text components (no text and no media)
    element.querySelectorAll('div.text.section').forEach((el) => {
      if (!el.textContent.trim() && !el.querySelector('img, picture, video, iframe')) {
        el.remove();
      }
    });

    // HTML-editor components that only inject styling helpers
    // ("Featured Item Underlining", "Featured Item Image Hover Over").
    element.querySelectorAll('.openhtml.section').forEach((el) => {
      const wrap = el.querySelector('.editor__wrap');
      if (wrap && wrap.children.length === 1 && wrap.querySelector(':scope > h3.editor, :scope > h3.editor-title')) {
        el.remove();
      }
    });
  }

  if (hookName === 'afterTransform') {
    removeAll(element, [
      // Global header / microsite header / nav
      '#att-about-header',
      '#att-microsite-header',
      'header',
      'nav',
      // Skip navigation
      '.skip-navigation',
      // Footer
      '#att-about-footer',
      'footer',
      // Cookie / privacy consent and security overlays
      '#gpc-banner-container',
      '#sec-overlay',
      // Feedback widget
      '#kampyleButtonContainer',
      // Tracking pixels
      '[id^="batBeacon"]',
      'img[src*="bat.bing.com"]',
      'iframe',
      'link',
      'noscript',
      // Any remaining load-more control
      '.stories__cta',
      'input.contentFriendlyName',
    ]);

    // Source pill buttons (a.cta--button) left as default content become EDS
    // primary buttons: authored as a bold link on its own line.
    element.querySelectorAll('a.cta--button').forEach((a) => {
      if (a.closest('strong, b, table')) return;
      const strong = element.ownerDocument.createElement('strong');
      a.replaceWith(strong);
      strong.append(a);
      a.removeAttribute('class');
    });

    // Strip tracking / inline-behavior attributes (do NOT touch comments).
    element.querySelectorAll('*').forEach((el) => {
      ['onclick', 'data-track', 'data-analytics', 'data-di-res-id', 'data-di-rand'].forEach((attr) => {
        if (el.hasAttribute(attr)) el.removeAttribute(attr);
      });
    });
  }

  if (hookName === 'afterTransform' && story) {
    unwrapBoldInHeadings(element);
    // Empty off-screen focus trap injected by a third-party script.
    element.querySelectorAll('b[aria-hidden="true"][tabindex="-1"]').forEach((b) => {
      if (!b.textContent.trim() && !b.children.length) b.remove();
    });
    // Analytics ids on story links.
    element.querySelectorAll('[data-di-id]').forEach((el) => el.removeAttribute('data-di-id'));
    // A filename is not alt text: describe the banner with the story title instead.
    const banner = storyBanner(document);
    if (banner && isFilenameAlt((banner.getAttribute('alt') || '').trim())) {
      banner.setAttribute('alt', textOf(document, 'title') || '');
    }
    // Every story ends with a Related Stories band, even when the source has none.
    if (document && element === document.body) appendRelatedStoriesIfMissing(element, document);
    // Stories whose headings are all coloured AT&T blue (inline on the source) get the
    // article section style "blue-headings" (inline colours do not survive the import).
    if (document && element === document.body) markBlueHeadings(element, document);
    // Page-level metadata only (not for fragments finalized separately).
    if (document && element === document.body) installStoryMetadata(document);
  }
}
