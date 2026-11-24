import {
  createOptimizedPicture,
  getMetadata,
  readBlockConfig,
} from '../../scripts/aem.js';

const DEFAULT_SOURCE = '/story/query-index.json';
const DEFAULT_LIMIT = 3;

/** Normalizes a comma list or an index array into lower-cased, trimmed values. */
function toList(value) {
  if (Array.isArray(value)) return value.map((v) => `${v}`.trim().toLowerCase()).filter(Boolean);
  if (!value) return [];
  const text = `${value}`.trim();
  if (text.startsWith('[')) {
    try { return toList(JSON.parse(text)); } catch { /* fall through */ }
  }
  return text.split(',').map((v) => v.trim().toLowerCase()).filter(Boolean);
}

/** Current page tags: article:tag meta tags, else a "tags" meta. */
function currentPageTags() {
  const tagMetas = [...document.head.querySelectorAll('meta[property="article:tag"]')]
    .map((m) => m.content);
  return toList(tagMetas.length ? tagMetas : getMetadata('tags'));
}

const isTrue = (value) => ['true', 'yes', '1'].includes(`${value || ''}`.trim().toLowerCase());

/** Lower Related Priority wins; stories without one come after prioritised ones. */
function priority(value) {
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : Number.POSITIVE_INFINITY;
}

function timestamp(story) {
  const t = Date.parse(story.publishDate || '');
  if (Number.isFinite(t)) return t;
  const lm = Number(story.lastModified);
  return Number.isFinite(lm) ? lm * 1000 : 0;
}

/**
 * Picks related stories: shared category scores 2, each shared tag 1; ties are
 * broken by Related Priority (lower first), then by newest publish date. When
 * fewer than `limit` stories share a category or tag, the newest remaining
 * stories fill the gaps.
 */
export function pickRelated(stories, {
  path, category, tags, limit,
}) {
  const current = path.replace(/\/$/, '').replace(/\.html$/, '');
  const cat = `${category || ''}`.trim().toLowerCase();
  const scored = stories
    .filter((s) => s && s.path && s.path.replace(/\.html$/, '') !== current)
    .filter((s) => !isTrue(s.excludeFromRelated))
    .map((s) => {
      const sTags = toList(s.tags);
      const sharedTags = sTags.filter((t) => tags.includes(t)).length;
      const sameCategory = cat && `${s.category || ''}`.trim().toLowerCase() === cat ? 2 : 0;
      return { story: s, score: sameCategory + sharedTags };
    });
  const byRank = (a, b) => (b.score - a.score)
    || (priority(a.story.relatedPriority) - priority(b.story.relatedPriority))
    || (timestamp(b.story) - timestamp(a.story));
  const related = scored.filter((s) => s.score > 0).sort(byRank);
  const fill = scored.filter((s) => s.score === 0).sort(byRank);
  return [...related, ...fill].slice(0, limit).map((s) => s.story);
}

function imagePath(src) {
  if (!src) return '';
  try {
    const url = new URL(src, window.location.href);
    return url.origin === window.location.origin ? url.pathname : url.href;
  } catch {
    return src;
  }
}

function buildCard(story) {
  const li = document.createElement('li');
  li.className = 'related-stories-card';
  const href = story.path;
  const title = story.title || '';

  const media = document.createElement('div');
  media.className = 'related-stories-card-image';
  const src = imagePath(story.image);
  if (src) {
    const link = document.createElement('a');
    link.href = href;
    link.tabIndex = -1;
    link.setAttribute('aria-hidden', 'true');
    const picture = src.startsWith('/')
      ? createOptimizedPicture(src, story.imageAlt || title, false, [
        { media: '(min-width: 600px)', width: '750' },
        { width: '500' },
      ])
      : Object.assign(document.createElement('img'), { src, alt: story.imageAlt || title, loading: 'lazy' });
    link.append(picture);
    media.append(link);
  }

  const body = document.createElement('div');
  body.className = 'related-stories-card-body';
  const h3 = document.createElement('h3');
  const titleLink = document.createElement('a');
  titleLink.href = href;
  titleLink.textContent = title;
  h3.append(titleLink);
  body.append(h3);

  if (story.description) {
    const p = document.createElement('p');
    p.className = 'related-stories-card-description';
    p.textContent = story.description;
    body.append(p);
  }

  const ctaP = document.createElement('p');
  ctaP.className = 'related-stories-card-cta-container';
  const cta = document.createElement('a');
  cta.className = 'related-stories-card-cta';
  cta.href = href;
  cta.textContent = 'Read More';
  const hidden = document.createElement('span');
  hidden.className = 'visually-hidden';
  hidden.textContent = ` about ${title}`;
  cta.append(hidden);
  ctaP.append(cta);
  body.append(ctaP);

  li.append(media, body);
  return li;
}

/** Hides the block, and its section when nothing else is in it (no empty band). */
function hide(block) {
  const wrapper = block.closest('.related-stories-wrapper') || block;
  wrapper.hidden = true;
  const section = block.closest('.section');
  if (section && [...section.children].every((child) => child.hidden
    || child.classList.contains('section-metadata'))) {
    section.hidden = true;
  }
}

/**
 * Related stories: fills itself from the stories query index; authors only place
 * the block. Optional rows: "limit" (number of cards, default 3) and "source"
 * (index URL, default /story/query-index.json).
 * @param {Element} block
 */
export default async function decorate(block) {
  const config = readBlockConfig(block);
  const limit = Math.max(1, Number.parseInt(config.limit, 10) || DEFAULT_LIMIT);
  const source = config.source || DEFAULT_SOURCE;
  block.textContent = '';

  let stories = [];
  try {
    const resp = await fetch(source);
    if (resp.ok) {
      const json = await resp.json();
      stories = Array.isArray(json?.data) ? json.data : [];
    }
  } catch {
    // index unavailable: hide below
  }

  const picks = pickRelated(stories, {
    path: window.location.pathname.replace(/^\/content(?=\/)/, ''),
    category: getMetadata('category'),
    tags: currentPageTags(),
    limit,
  });

  if (!picks.length) {
    hide(block);
    return;
  }

  const ul = document.createElement('ul');
  picks.forEach((story) => ul.append(buildCard(story)));
  block.append(ul);
}
