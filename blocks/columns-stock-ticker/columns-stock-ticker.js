const ROLES = ['price', 'change', 'timestamp', 'link'];

function isFeedRow(row) {
  // a single-cell row holding only a link to a .json endpoint configures the live feed
  if (row.children.length !== 1) return false;
  const a = row.querySelector('a[href]');
  if (!a) return false;
  return row.textContent.trim() === a.textContent.trim() && /\.json(\?|$)/i.test(a.href);
}

function setValue(cell, value) {
  if (value === undefined || value === null || value === '') return;
  const target = cell.querySelector('p') || cell;
  target.textContent = String(value);
}

function applyDirection(block, changeText) {
  const text = (changeText || '').trim();
  block.classList.remove('is-up', 'is-down');
  if (/^[↑▲]|\+/.test(text)) block.classList.add('is-up');
  else if (/^[↓▼]|^-|\$-/.test(text)) block.classList.add('is-down');
}

/**
 * Optional live refresh. Expects a JSON object with any of
 * { price, change, timestamp } (or { data: [{ price, change, timestamp }] } like a
 * spreadsheet export). Authored values stay in place when the feed fails.
 */
async function refresh(block, cells, feedUrl) {
  try {
    const resp = await fetch(feedUrl);
    if (!resp.ok) return;
    const json = await resp.json();
    const data = Array.isArray(json?.data) ? json.data[0] : json;
    if (!data || typeof data !== 'object') return;
    if (cells.price) setValue(cells.price, data.price);
    if (cells.change) {
      setValue(cells.change, data.change);
      applyDirection(block, cells.change.textContent);
    }
    if (cells.timestamp) setValue(cells.timestamp, data.timestamp);
  } catch {
    // keep authored values
  }
}

/**
 * Stock ticker: one row of price | change | timestamp | link.
 * Options: four-cells, inline, live-data (refreshes values from a JSON feed
 * authored as an extra single-cell row containing a link to a .json URL).
 * @param {Element} block
 */
export default function decorate(block) {
  let feedUrl;
  [...block.children].forEach((row) => {
    if (isFeedRow(row)) {
      feedUrl = row.querySelector('a').href;
      row.remove();
    }
  });

  const row = block.firstElementChild;
  if (!row) return;
  row.classList.add('columns-stock-ticker-row');
  // additional authored rows are not part of the ticker
  [...block.children].slice(1).forEach((extra) => extra.remove());

  const cells = {};
  [...row.children].forEach((cell, i) => {
    if (!cell.textContent.trim() && !cell.querySelector('a, img')) {
      cell.remove();
      return;
    }
    // the link cell is whichever holds a link; other cells follow authored order
    const role = cell.querySelector('a[href]') ? 'link' : ROLES[Math.min(i, 2)];
    if (cells[role]) return;
    cells[role] = cell;
    cell.classList.add(`columns-stock-ticker-${role}`);
  });

  if (cells.change) applyDirection(block, cells.change.textContent);
  if (cells.link) cells.link.querySelectorAll('a').forEach((a) => a.classList.remove('button'));

  if (feedUrl && block.classList.contains('live-data')) refresh(block, cells, feedUrl);
}
