const DEFAULT_SOURCE = '/query-index.json';
const DEFAULT_PLACEHOLDER = 'Search';
const MIN_QUERY = 2;
const MAX_RESULTS = 10;

let indexCache;

/**
 * Reads authoring config. Accepts either loose cells (a link = source, plain
 * text = placeholder) or key/value rows (`source` | url, `placeholder` | text).
 */
function readConfig(block) {
  const config = { source: '', placeholder: '' };
  [...block.children].forEach((row) => {
    const cells = [...row.children];
    if (cells.length >= 2) {
      const key = cells[0].textContent.trim().toLowerCase();
      const valueCell = cells[1];
      const link = valueCell.querySelector('a[href]');
      if (/source|index|url|action/.test(key)) config.source = link ? link.href : valueCell.textContent.trim();
      else if (/placeholder|label/.test(key)) config.placeholder = valueCell.textContent.trim();
      return;
    }
    cells.forEach((cell) => {
      // a cell may hold the link and the placeholder as separate paragraphs
      const parts = cell.querySelector('p, a') ? [...cell.children] : [cell];
      parts.forEach((part) => {
        const link = part.matches('a[href]') ? part : part.querySelector('a[href]');
        if (link) {
          if (!config.source) config.source = link.href;
        } else if (part.textContent.trim() && !config.placeholder) {
          config.placeholder = part.textContent.trim();
        }
      });
    });
  });
  return {
    source: config.source || DEFAULT_SOURCE,
    placeholder: config.placeholder || DEFAULT_PLACEHOLDER,
  };
}

function isIndex(source) {
  try {
    return /\.json$/i.test(new URL(source, window.location.href).pathname);
  } catch {
    return false;
  }
}

async function loadIndex(source) {
  if (indexCache?.source === source) return indexCache.data;
  const resp = await fetch(source);
  if (!resp.ok) return [];
  const json = await resp.json();
  const data = Array.isArray(json?.data) ? json.data : [];
  indexCache = { source, data };
  return data;
}

function matches(entry, terms) {
  const haystack = `${entry.title || ''} ${entry.description || ''}`.toLowerCase();
  return terms.every((term) => haystack.includes(term));
}

function renderResults(list, results, query) {
  list.replaceChildren();
  if (!query) {
    list.hidden = true;
    return;
  }
  if (!results.length) {
    const li = document.createElement('li');
    li.className = 'search-newsroom-no-results';
    li.textContent = 'No results found.';
    list.append(li);
  }
  results.slice(0, MAX_RESULTS).forEach((entry) => {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = entry.path;
    a.textContent = entry.title || entry.path;
    li.append(a);
    list.append(li);
  });
  list.hidden = false;
}

/**
 * Newsroom search: inline input with a submit (magnifier) button.
 * A `.json` source filters a query index in place; any other URL is a results
 * page the form submits to with `?q=`.
 * Options: inline-input (single-line bar without a results panel overlaying layout).
 * @param {Element} block
 */
export default function decorate(block) {
  const { source, placeholder } = readConfig(block);
  const indexMode = isIndex(source);

  const form = document.createElement('form');
  form.className = 'search-newsroom-form';
  form.setAttribute('role', 'search');
  if (!indexMode) {
    form.action = source;
    form.method = 'get';
  }

  const input = document.createElement('input');
  input.type = 'search';
  input.name = 'q';
  input.className = 'search-newsroom-input';
  input.placeholder = placeholder;
  input.setAttribute('aria-label', placeholder);
  input.autocomplete = 'off';

  const button = document.createElement('button');
  button.type = 'submit';
  button.className = 'search-newsroom-submit';
  button.setAttribute('aria-label', 'Search');
  const icon = document.createElement('span');
  icon.className = 'search-newsroom-icon';
  icon.setAttribute('aria-hidden', 'true');
  button.append(icon);

  form.append(input, button);
  block.replaceChildren(form);

  // prefill from the URL so result pages keep the query
  const current = new URL(window.location.href).searchParams.get('q');
  if (current) input.value = current;

  if (!indexMode) return;

  const list = document.createElement('ul');
  list.className = 'search-newsroom-results';
  list.hidden = true;
  list.setAttribute('aria-live', 'polite');
  block.append(list);

  let token = 0;
  const run = async () => {
    const query = input.value.trim().toLowerCase();
    token += 1;
    const mine = token;
    if (query.length < MIN_QUERY) {
      renderResults(list, [], '');
      return;
    }
    const data = await loadIndex(source).catch(() => []);
    if (mine !== token) return;
    const terms = query.split(/\s+/).filter(Boolean);
    renderResults(list, data.filter((entry) => matches(entry, terms)), query);
  };

  let timer;
  input.addEventListener('input', () => {
    clearTimeout(timer);
    timer = setTimeout(run, 200);
  });
  input.addEventListener('keyup', (e) => {
    if (e.key === 'Escape') {
      input.value = '';
      renderResults(list, [], '');
    }
  });
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    clearTimeout(timer);
    run();
  });
  if (current) run();
}
