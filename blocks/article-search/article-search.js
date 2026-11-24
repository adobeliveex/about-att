const DEFAULT_SOURCE = '/story/query-index.json';
const DEFAULT_TITLE = 'All News Features';
const DEFAULT_PLACEHOLDER = 'Search news';
const DEFAULT_PAGE_SIZE = 20;
const VISIBLE_OPTIONS = 8;

/**
 * Filterable article metadata. `param` is the URL parameter, `field` the index column.
 * Month is derived from publishDate (YYYY-MM).
 */
const FACETS = {
  category: { label: 'Category', param: 'category', field: 'category' },
  tags: { label: 'Tags', param: 'tag', field: 'tags' },
  month: { label: 'Publish month', param: 'month', field: 'publishDate' },
  keywords: { label: 'Keywords', param: 'keyword', field: 'keywords' },
  author: { label: 'Author', param: 'author', field: 'author' },
};
const DEFAULT_FACETS = ['category', 'tags', 'month', 'keywords', 'author'];

const FACET_ALIASES = {
  category: 'category',
  categories: 'category',
  tag: 'tags',
  tags: 'tags',
  month: 'month',
  months: 'month',
  'publish month': 'month',
  'publish date': 'month',
  date: 'month',
  keyword: 'keywords',
  keywords: 'keywords',
  author: 'author',
  authors: 'author',
};

const norm = (value) => `${value ?? ''}`.trim().toLowerCase();

/** Index values arrive as arrays, JSON array strings or comma lists. */
function toValues(value) {
  if (Array.isArray(value)) return value.map((v) => `${v}`.trim()).filter(Boolean);
  const text = `${value ?? ''}`.trim();
  if (!text) return [];
  if (text.startsWith('[')) {
    try { return toValues(JSON.parse(text)); } catch { /* fall through */ }
  }
  return text.split(',').map((v) => v.trim()).filter(Boolean);
}

function parseDate(value) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(`${value || ''}`.trim());
  if (!m) return null;
  const date = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  return Number.isNaN(date.getTime()) ? null : date;
}

const dateFormat = new Intl.DateTimeFormat('en-US', {
  month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC',
});
const monthFormat = new Intl.DateTimeFormat('en-US', {
  month: 'long', year: 'numeric', timeZone: 'UTC',
});

/** Builds the facet values ({ key, label }) for one article. */
function facetValues(entry, facet) {
  if (facet === 'month') {
    const date = parseDate(entry.publishDate);
    if (!date) return [];
    return [{ key: entry.publishDate.slice(0, 7), label: monthFormat.format(date) }];
  }
  return toValues(entry[FACETS[facet].field]).map((label) => ({ key: norm(label), label }));
}

function prepare(entry) {
  const date = parseDate(entry.publishDate);
  const facets = {};
  Object.keys(FACETS).forEach((facet) => { facets[facet] = facetValues(entry, facet); });
  const text = [entry.title, entry.description, entry.category, entry.author,
    toValues(entry.tags).join(' '), toValues(entry.keywords).join(' ')].join(' ').toLowerCase();
  return {
    entry, date, facets, text, time: date ? date.getTime() : 0,
  };
}

/** Reads key/value rows: title, intro, placeholder, source, filters, page size, link. */
function readConfig(block) {
  const config = {};
  [...block.children].forEach((row) => {
    const [keyCell, valueCell] = row.children;
    if (!keyCell || !valueCell) return;
    const key = norm(keyCell.textContent).replace(/[^a-z]+/g, ' ').trim();
    const link = valueCell.querySelector('a[href]');
    const text = valueCell.textContent.trim();
    if (key === 'title' || key === 'heading') config.title = text;
    else if (key === 'intro' || key === 'text' || key === 'description') config.intro = text;
    else if (key === 'placeholder') config.placeholder = text;
    else if (key === 'source' || key === 'index') config.source = link ? link.getAttribute('href') : text;
    else if (key === 'filters' || key === 'facets') config.filters = text;
    else if (key === 'page size' || key === 'limit' || key === 'per page') config.pageSize = text;
    else if ((key === 'link' || key === 'cta' || key === 'button') && link) {
      config.link = { href: link.getAttribute('href'), text: link.textContent.trim() };
    }
  });
  const filters = toValues(config.filters).map((f) => FACET_ALIASES[norm(f)]).filter(Boolean);
  return {
    title: config.title || DEFAULT_TITLE,
    intro: config.intro || '',
    placeholder: config.placeholder || DEFAULT_PLACEHOLDER,
    source: config.source || DEFAULT_SOURCE,
    facets: filters.length ? [...new Set(filters)] : DEFAULT_FACETS,
    pageSize: Math.max(1, Number.parseInt(config.pageSize, 10) || DEFAULT_PAGE_SIZE),
    link: config.link,
  };
}

/** URL state: ?q=&category=&tag=&month=&keyword=&author=&page= */
function readState(facets) {
  const params = new URLSearchParams(window.location.search);
  const selected = {};
  facets.forEach((facet) => {
    const values = params.getAll(FACETS[facet].param).map((v) => (facet === 'month' ? v.trim() : norm(v)));
    selected[facet] = new Set(values.filter(Boolean));
  });
  return {
    query: (params.get('q') || '').trim(),
    selected,
    page: Math.max(1, Number.parseInt(params.get('page'), 10) || 1),
  };
}

function writeState(state, facets) {
  const params = new URLSearchParams();
  if (state.query) params.set('q', state.query);
  facets.forEach((facet) => {
    state.selected[facet].forEach((value) => params.append(FACETS[facet].param, value));
  });
  if (state.page > 1) params.set('page', state.page);
  const search = params.toString();
  const url = `${window.location.pathname}${search ? `?${search}` : ''}${window.location.hash}`;
  window.history.replaceState(null, '', url);
}

const matchesQuery = (item, terms) => terms.every((term) => item.text.includes(term));

/** AND across facets, OR within a facet. `skip` leaves one facet out (for its own counts). */
function matchesFacets(item, selected, facets, skip) {
  return facets.every((facet) => {
    if (facet === skip || !selected[facet].size) return true;
    return item.facets[facet].some((v) => selected[facet].has(v.key));
  });
}

/** Options for one facet with counts, from articles matching the query and the other facets. */
function facetOptions(items, facet, state, facets) {
  const options = new Map();
  items.forEach((item) => {
    if (!matchesFacets(item, state.selected, facets, facet)) return;
    const seen = new Set();
    item.facets[facet].forEach(({ key, label }) => {
      if (seen.has(key)) return;
      seen.add(key);
      const option = options.get(key) || { key, label, count: 0 };
      option.count += 1;
      options.set(key, option);
    });
  });
  // keep selected options visible even when nothing else matches them
  state.selected[facet].forEach((key) => {
    if (options.has(key)) return;
    const label = facet === 'month' && parseDate(`${key}-01`)
      ? monthFormat.format(parseDate(`${key}-01`)) : key;
    options.set(key, { key, label, count: 0 });
  });
  const list = [...options.values()];
  if (facet === 'month') return list.sort((a, b) => b.key.localeCompare(a.key));
  return list.sort((a, b) => (b.count - a.count) || a.label.localeCompare(b.label));
}

function el(tag, props = {}, ...children) {
  const node = document.createElement(tag);
  Object.entries(props).forEach(([name, value]) => {
    if (value === undefined || value === null || value === false) return;
    if (name === 'className') node.className = value;
    else if (name === 'text') node.textContent = value;
    else if (name in node && typeof value !== 'string') node[name] = value;
    else node.setAttribute(name, value === true ? '' : value);
  });
  node.append(...children.filter(Boolean));
  return node;
}

function buildResult(item) {
  const { entry } = item;
  const li = el('li', { className: 'article-search-result' });
  if (item.date) {
    li.append(el('p', { className: 'article-search-result-date' }, el('time', {
      datetime: entry.publishDate.slice(0, 10), text: dateFormat.format(item.date),
    })));
  }
  li.append(el('h2', { className: 'article-search-result-title' }, el('a', {
    href: entry.path, text: entry.title || entry.path,
  })));
  if (entry.description) {
    li.append(el('p', { className: 'article-search-result-description', text: entry.description }));
  }
  return li;
}

export default async function decorate(block) {
  const config = readConfig(block);
  const { facets } = config;
  const state = readState(facets);
  let uid = 0;
  const id = (name) => { uid += 1; return `article-search-${name}-${uid}`; };

  /* header: title, search form, intro, link */
  const title = el('h1', { className: 'article-search-title' });
  const input = el('input', {
    type: 'search',
    name: 'q',
    className: 'article-search-input',
    placeholder: config.placeholder,
    'aria-label': config.placeholder,
    autocomplete: 'off',
    value: state.query,
  });
  const form = el(
    'form',
    { className: 'article-search-form', role: 'search' },
    input,
    el(
      'button',
      { type: 'submit', className: 'article-search-submit', 'aria-label': 'Search' },
      el('span', { className: 'article-search-icon', 'aria-hidden': 'true' }),
    ),
  );
  const header = el('div', { className: 'article-search-header' }, title, form);
  if (config.intro) header.append(el('p', { className: 'article-search-intro', text: config.intro }));
  if (config.link) {
    header.append(el('p', { className: 'button-wrapper' }, el('a', {
      href: config.link.href, className: 'button', text: config.link.text,
    })));
  }

  /* sidebar filters */
  const filtersId = id('filters');
  const toggle = el('button', {
    type: 'button',
    className: 'article-search-filters-toggle',
    'aria-expanded': 'false',
    'aria-controls': filtersId,
  });
  const clearAll = el('button', { type: 'button', className: 'article-search-clear', text: 'Clear all' });
  const groups = el('div', { className: 'article-search-groups' });
  const aside = el(
    'aside',
    { className: 'article-search-filters', id: filtersId, 'aria-label': 'Filter articles' },
    el('div', { className: 'article-search-filters-head' }, el('h2', { text: 'Filter by' }), clearAll),
    groups,
  );

  /* results */
  const summary = el('p', { className: 'article-search-summary', 'aria-live': 'polite' });
  const chips = el('ul', { className: 'article-search-chips', 'aria-label': 'Active filters' });
  const list = el('ul', { className: 'article-search-list' });
  const pager = el('nav', { className: 'article-search-pagination', 'aria-label': 'Search results pages' });
  const results = el('div', { className: 'article-search-results' }, summary, chips, list, pager);

  const body = el('div', { className: 'article-search-body' }, toggle, aside, results);
  block.replaceChildren(header, body);

  /* mobile: the sidebar collapses behind a toggle */
  const mobile = window.matchMedia('(max-width: 899px)');
  const setOpen = (open) => {
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    aside.classList.toggle('is-open', open);
  };
  toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
  mobile.addEventListener('change', () => setOpen(false));

  const expanded = new Set(); // facets showing all options
  const collapsed = new Set(); // facet groups closed by the visitor
  // on mobile the groups start closed so the open panel stays short
  if (mobile.matches) facets.forEach((facet) => collapsed.add(facet));

  let items = [];
  summary.textContent = 'Loading articles…';
  try {
    const resp = await fetch(config.source);
    if (resp.ok) {
      const json = await resp.json();
      items = (Array.isArray(json?.data) ? json.data : [])
        .filter((entry) => entry && entry.path && entry.title)
        .map(prepare)
        .sort((a, b) => b.time - a.time || `${a.entry.title}`.localeCompare(`${b.entry.title}`));
    }
  } catch {
    // index unavailable: shown as no results
  }

  const selectedCount = () => facets.reduce((n, f) => n + state.selected[f].size, 0);

  function renderGroups(queryItems) {
    groups.replaceChildren();
    facets.forEach((facet) => {
      const options = facetOptions(queryItems, facet, state, facets);
      if (!options.length) return;
      const details = el('details', { className: 'article-search-group', open: !collapsed.has(facet) });
      details.dataset.facet = facet;
      details.addEventListener('toggle', () => {
        if (details.open) collapsed.delete(facet); else collapsed.add(facet);
      });
      const count = state.selected[facet].size;
      details.append(el(
        'summary',
        {},
        FACETS[facet].label,
        count ? el('span', { className: 'article-search-group-count', text: ` (${count})` }) : null,
      ));
      const showAll = expanded.has(facet) || options.length <= VISIBLE_OPTIONS + 2;
      const visible = showAll ? options
        : options.filter((o, i) => i < VISIBLE_OPTIONS || state.selected[facet].has(o.key));
      const ul = el('ul', { className: 'article-search-options', role: 'group', 'aria-label': FACETS[facet].label });
      visible.forEach((option) => {
        const checked = state.selected[facet].has(option.key);
        const box = el('input', {
          type: 'checkbox', value: option.key, checked, disabled: !checked && !option.count,
        });
        box.addEventListener('change', () => {
          if (box.checked) state.selected[facet].add(option.key);
          else state.selected[facet].delete(option.key);
          state.page = 1;
          update({ focus: { facet, key: option.key } });
        });
        ul.append(el('li', {}, el(
          'label',
          { className: 'article-search-option' },
          box,
          el('span', { className: 'article-search-option-label', text: option.label }),
          el('span', { className: 'article-search-option-count', text: `${option.count}` }),
        )));
      });
      details.append(ul);
      if (options.length > visible.length || expanded.has(facet)) {
        const more = el('button', {
          type: 'button',
          className: 'article-search-more',
          'aria-expanded': expanded.has(facet) ? 'true' : 'false',
          text: expanded.has(facet) ? 'Show fewer' : `Show all ${options.length}`,
        });
        more.addEventListener('click', () => {
          if (expanded.has(facet)) expanded.delete(facet); else expanded.add(facet);
          update({ focusMore: facet });
        });
        details.append(more);
      }
      groups.append(details);
    });
    clearAll.hidden = !selectedCount();
    const n = selectedCount();
    toggle.textContent = n ? `Filters (${n})` : 'Filters';
  }

  function renderChips() {
    chips.replaceChildren();
    facets.forEach((facet) => {
      state.selected[facet].forEach((key) => {
        const label = facet === 'month' && parseDate(`${key}-01`)
          ? monthFormat.format(parseDate(`${key}-01`))
          : (items.flatMap((i) => i.facets[facet]).find((v) => v.key === key)?.label || key);
        const remove = el(
          'button',
          { type: 'button', className: 'article-search-chip', 'aria-label': `Remove filter ${FACETS[facet].label}: ${label}` },
          el('span', { text: label }),
          el('span', { className: 'article-search-chip-x', 'aria-hidden': 'true', text: '×' }),
        );
        remove.addEventListener('click', () => {
          state.selected[facet].delete(key);
          state.page = 1;
          update();
        });
        chips.append(el('li', {}, remove));
      });
    });
    chips.hidden = !chips.children.length;
  }

  function renderPager(page, pages) {
    pager.replaceChildren();
    pager.hidden = pages <= 1;
    if (pages <= 1) return;
    const go = (target) => {
      state.page = target;
      update();
      block.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
    if (page > 1) {
      const prev = el('button', { type: 'button', className: 'button article-search-prev', text: '‹ Previous' });
      prev.addEventListener('click', () => go(page - 1));
      pager.append(prev);
    }
    pager.append(el('span', { className: 'article-search-page', text: `Page ${page} of ${pages}` }));
    if (page < pages) {
      const next = el('button', { type: 'button', className: 'button article-search-next', text: 'Next ›' });
      next.addEventListener('click', () => go(page + 1));
      pager.append(next);
    }
  }

  function update({ focus, focusMore } = {}) {
    const terms = norm(state.query).split(/\s+/).filter(Boolean);
    const queryItems = items.filter((item) => matchesQuery(item, terms));
    const matched = queryItems.filter((item) => matchesFacets(item, state.selected, facets));
    const pages = Math.max(1, Math.ceil(matched.length / config.pageSize));
    state.page = Math.min(state.page, pages);
    const start = (state.page - 1) * config.pageSize;
    const pageItems = matched.slice(start, start + config.pageSize);

    title.textContent = state.query ? `Search Results for "${state.query}"` : config.title;
    renderGroups(queryItems);
    renderChips();

    list.replaceChildren(...pageItems.map(buildResult));
    if (!matched.length) {
      list.append(el('li', {
        className: 'article-search-empty',
        text: items.length ? 'No articles match your search. Try other words or remove some filters.'
          : 'No articles are available right now.',
      }));
    }
    summary.textContent = matched.length
      ? `Showing ${start + 1}–${start + pageItems.length} of ${matched.length} article${matched.length === 1 ? '' : 's'}`
      : '0 articles';
    renderPager(state.page, pages);
    writeState(state, facets);

    // keep keyboard focus on the control the visitor used (the list is rebuilt)
    if (focus) {
      const sel = `.article-search-group[data-facet="${focus.facet}"] input[value="${CSS.escape(focus.key)}"]`;
      groups.querySelector(sel)?.focus();
    } else if (focusMore) {
      groups.querySelector(`.article-search-group[data-facet="${focusMore}"] .article-search-more`)?.focus();
    }
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    state.query = input.value.trim();
    state.page = 1;
    update();
  });
  input.addEventListener('search', () => {
    // fired when the native clear (x) empties the field
    if (input.value || !state.query) return;
    state.query = '';
    state.page = 1;
    update();
  });
  clearAll.addEventListener('click', () => {
    facets.forEach((facet) => state.selected[facet].clear());
    state.page = 1;
    update();
    input.focus();
  });

  update();
}
