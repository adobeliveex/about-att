/*
 * Columns Share Bar
 * Article utility row: share links | download-assets dropdown | subscribe button.
 * Options (block classes): three-cells, share-icons, dropdown.
 */

const SVG_NS = 'http://www.w3.org/2000/svg';

const NETWORKS = [
  {
    id: 'x',
    label: 'Share on X',
    test: (host, text) => /(^|\.)(x|twitter)\.com$/.test(host) || /^(x|twitter)$/.test(text),
    build: (url, title) => `https://x.com/intent/tweet?url=${url}&text=${title}`,
    paths: ['M18.24 2.25h3.31l-7.23 8.26 8.5 11.24h-6.65l-5.21-6.82-5.97 6.82H1.68l7.73-8.84L1.25 2.25h6.83l4.71 6.23zm-1.16 17.52h1.83L7.08 4.13H5.12z'],
  },
  {
    id: 'facebook',
    label: 'Share on Facebook',
    test: (host, text) => /(^|\.)facebook\.com$/.test(host) || text === 'facebook',
    build: (url) => `https://www.facebook.com/sharer.php?u=${url}`,
    paths: ['M14 8h3V4h-3c-2.8 0-5 2.2-5 5v2H7v4h2v9h4v-9h3l1-4h-4V9c0-.6.4-1 1-1z'],
  },
  {
    id: 'linkedin',
    label: 'Share on LinkedIn',
    test: (host, text) => /(^|\.)linkedin\.com$/.test(host) || text === 'linkedin',
    build: (url, title) => `https://www.linkedin.com/shareArticle?mini=true&url=${url}&title=${title}`,
    paths: [
      'M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9.5h4V21H3z',
      'M9.5 9.5h3.8v1.6h.1c.5-1 1.8-2 3.8-2 4 0 4.8 2.6 4.8 6V21h-4v-5.2c0-1.2 0-2.8-1.7-2.8s-2 1.3-2 2.7V21h-4z',
    ],
  },
  {
    id: 'email',
    label: 'Share by email',
    test: (host, text, protocol) => protocol === 'mailto:' || /^e-?mail$/.test(text),
    build: (url, title) => `mailto:?subject=${title}&body=${title}%20-%20${url}`,
    paths: ['M3 5h18v14H3zM3 5l9 7 9-7'],
    stroke: true,
  },
];

function pageShareInfo() {
  const canonical = document.querySelector('link[rel="canonical"]')?.href;
  const url = canonical || `${window.location.origin}${window.location.pathname}`;
  const title = document.querySelector('meta[property="og:title"]')?.content || document.title;
  return { url: encodeURIComponent(url), title: encodeURIComponent(title.trim()) };
}

function findNetwork(el) {
  const text = el.textContent.trim().toLowerCase();
  let host = '';
  let protocol = '';
  const href = el.getAttribute && el.getAttribute('href');
  if (href) {
    try {
      const u = new URL(href, window.location.href);
      host = u.hostname;
      protocol = u.protocol;
    } catch { /* ignore malformed href */ }
  }
  return NETWORKS.find((n) => n.test(host, text, protocol));
}

function buildIcon(network) {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  svg.classList.add('columns-share-bar-icon', `columns-share-bar-icon-${network.id}`);
  network.paths.forEach((d) => {
    const path = document.createElementNS(SVG_NS, 'path');
    path.setAttribute('d', d);
    if (network.stroke) {
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke', 'currentColor');
      path.setAttribute('stroke-width', '2');
      path.setAttribute('stroke-linejoin', 'round');
    } else {
      path.setAttribute('fill', 'currentColor');
    }
    svg.append(path);
  });
  return svg;
}

/** True when the cell holds at least one recognisable share link or name. */
function isShareCell(cell) {
  const candidates = [...cell.querySelectorAll('a, li')];
  return candidates.some((el) => findNetwork(el));
}

/** True when the cell has a label plus links (a dropdown), not just a lone link. */
function isDropdownCell(cell) {
  const links = cell.querySelectorAll('a[href]');
  if (!links.length) return false;
  if (cell.querySelector('ul, ol')) return true;
  const linkText = [...links].map((a) => a.textContent).join('').replace(/\s+/g, '');
  return cell.textContent.replace(/\s+/g, '') !== linkText;
}

function decorateShare(cell, useIcons) {
  cell.classList.add('columns-share-bar-share');
  const { url, title } = pageShareInfo();

  // collect items: authored links, or plain list items naming a network
  let items = [...cell.querySelectorAll('li')];
  if (!items.length) items = [...cell.querySelectorAll('a')];

  const list = document.createElement('ul');
  list.className = 'columns-share-bar-links';
  items.forEach((item) => {
    const network = findNetwork(item.querySelector('a') || item);
    if (!network) return;
    const a = document.createElement('a');
    a.href = network.build(url, title);
    a.setAttribute('aria-label', network.label);
    a.title = network.label;
    if (network.id !== 'email') {
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
    }
    if (useIcons) {
      a.append(buildIcon(network));
    } else {
      a.textContent = (item.querySelector('a') || item).textContent.trim();
    }
    const li = document.createElement('li');
    li.className = `columns-share-bar-${network.id}`;
    li.append(a);
    list.append(li);
    item.remove();
  });

  // whatever text is left (e.g. "Share") becomes the label
  const labelText = cell.textContent.trim();
  cell.textContent = '';
  if (labelText) {
    const label = document.createElement('p');
    label.className = 'columns-share-bar-label';
    label.textContent = labelText;
    cell.append(label);
  }
  if (list.children.length) cell.append(list);
}

function closeDropdown(details, focus) {
  if (!details.open) return;
  details.open = false;
  if (focus) details.querySelector('summary').focus();
}

function decorateDropdown(cell) {
  cell.classList.add('columns-share-bar-downloads');
  const links = [...cell.querySelectorAll('a[href]')];
  links.forEach((a) => a.remove());
  const labelText = cell.textContent.trim() || 'Download assets';

  const details = document.createElement('details');
  details.className = 'columns-share-bar-dropdown';
  const summary = document.createElement('summary');
  summary.textContent = labelText;
  const list = document.createElement('ul');
  list.className = 'columns-share-bar-menu';
  links.forEach((a) => {
    a.classList.remove('button');
    a.classList.add('columns-share-bar-menu-link');
    const li = document.createElement('li');
    li.append(a);
    list.append(li);
  });
  details.append(summary, list);

  details.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeDropdown(details, true);
  });
  details.addEventListener('focusout', (e) => {
    if (!details.contains(e.relatedTarget)) closeDropdown(details, false);
  });
  document.addEventListener('click', (e) => {
    if (!details.contains(e.target)) closeDropdown(details, false);
  });

  cell.textContent = '';
  cell.append(details);
}

function decorateCta(cell) {
  cell.classList.add('columns-share-bar-cta');
  cell.querySelectorAll('a[href]').forEach((a) => a.classList.add('button'));
}

export default function decorate(block) {
  const useIcons = block.classList.contains('share-icons');
  const useDropdown = block.classList.contains('dropdown');

  // authors normally use one row; flatten any extra rows into the first
  const rows = [...block.children];
  const row = rows[0];
  if (!row) return;
  rows.slice(1).forEach((extra) => {
    row.append(...extra.children);
    extra.remove();
  });
  row.classList.add('columns-share-bar-row');

  let shareDone = false;
  [...row.children].forEach((cell) => {
    cell.classList.add('columns-share-bar-cell');
    if (!cell.textContent.trim() && !cell.querySelector('a, img')) {
      cell.remove();
      return;
    }
    if (!shareDone && isShareCell(cell)) {
      decorateShare(cell, useIcons);
      shareDone = true;
    } else if (useDropdown && isDropdownCell(cell)) {
      decorateDropdown(cell);
    } else if (cell.querySelector('a[href]') && !isDropdownCell(cell)) {
      decorateCta(cell);
    } else {
      cell.classList.add('columns-share-bar-downloads');
    }
  });

  block.classList.add(`columns-share-bar-${row.children.length}-cols`);
}
