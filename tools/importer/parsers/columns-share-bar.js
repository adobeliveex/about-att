/* eslint-disable */
/* global WebImporter */
/**
 * columns-share-bar (three-cells, share-icons, dropdown): one row, three cells.
 * cell 1: "Share" label + list of network links (X, Facebook, LinkedIn, Email)
 * cell 2: "Download assets" label + list of download links (release PDF)
 * cell 3: "Subscribe to AT&T News" link
 * Source: .article__header .article-header--row (about.att.com story pages)
 *
 * Share anchors on the source are icon-only (<a><i class="icon--x"></i></a>), so
 * the link text is rebuilt from the network; the block rebuilds share URLs from
 * the page URL at runtime anyway.
 * The download menu is a <select> without URLs; the release PDF lives at
 * /ecms/dam/snrdocs/pdf/{year}/{slug}.pdf?action=download for /story/{year}/{slug}.html.
 */
const NETWORKS = [
  { name: 'X', icon: 'twitter', host: /(^|\.)(x|twitter)\.com$/ },
  { name: 'Facebook', icon: 'facebook', host: /(^|\.)facebook\.com$/ },
  { name: 'LinkedIn', icon: 'linkedin', host: /(^|\.)linkedin\.com$/ },
  { name: 'Email', icon: 'email', mailto: true },
];

function networkFor(li) {
  const a = li.querySelector('a[href]');
  const href = a ? a.getAttribute('href') : '';
  if (href) {
    if (/^mailto:/i.test(href)) return { net: NETWORKS[3], href };
    try {
      const host = new URL(href, 'https://about.att.com').hostname;
      const net = NETWORKS.find((n) => n.host && n.host.test(host));
      if (net) return { net, href };
    } catch (e) { /* ignore */ }
  }
  const icon = li.querySelector('i[class*="icon--"]');
  if (icon) {
    const net = NETWORKS.find((n) => icon.className.includes(n.icon));
    if (net) return { net, href };
  }
  return null;
}

// Story page URL: from a share link's encoded url, og:url/canonical, or the document.
function storyUrl(element, document) {
  const candidates = [];
  element.querySelectorAll('.share a[href]').forEach((a) => {
    const m = a.getAttribute('href').match(/[?&](?:u|url)=([^&]+)/);
    if (m) {
      try { candidates.push(decodeURIComponent(m[1])); } catch (e) { /* ignore */ }
    }
    const body = a.getAttribute('href').match(/https?%3A%2F%2F[^&]+/i);
    if (body) {
      try { candidates.push(decodeURIComponent(body[0])); } catch (e) { /* ignore */ }
    }
  });
  const og = document.querySelector('meta[property="og:url"], meta[name="og:url"]');
  if (og) candidates.push(og.getAttribute('content') || '');
  const canonical = document.querySelector('link[rel="canonical"]');
  if (canonical) candidates.push(canonical.getAttribute('href') || '');
  try { if (document.location && document.location.href) candidates.push(document.location.href); } catch (e) { /* ignore */ }
  return candidates.find((u) => /\/story\/\d{4}\/[^/?#]+\.html/.test(u || '')) || '';
}

function releasePdfUrl(element, document) {
  const m = storyUrl(element, document).match(/\/story\/(\d{4})\/([^/?#]+)\.html/);
  if (!m) return '';
  return `https://about.att.com/ecms/dam/snrdocs/pdf/${m[1]}/${m[2]}.pdf?action=download`;
}

export default function parse(element, { document }) {
  const clean = (el) => (el ? el.textContent.replace(/\s+/g, ' ').trim() : '');

  // Cell 1: share
  const shareCell = [];
  const share = element.querySelector('.share');
  if (share) {
    const label = document.createElement('p');
    label.textContent = clean(share.querySelector('h4, h3, h2')) || 'Share';
    shareCell.push(label);
    const ul = document.createElement('ul');
    const items = [...share.querySelectorAll('li')];
    items.forEach((li, i) => {
      const found = networkFor(li) || (items.length === NETWORKS.length ? { net: NETWORKS[i], href: '' } : null);
      if (!found) return;
      const item = document.createElement('li');
      if (found.href) {
        const a = document.createElement('a');
        a.href = found.href;
        a.textContent = found.net.name;
        item.append(a);
      } else {
        item.textContent = found.net.name;
      }
      ul.append(item);
    });
    if (ul.children.length) shareCell.push(ul);
  }

  // Cell 2: download assets
  const downloadCell = [];
  const select = element.querySelector('.story__assets select, select.story_assets');
  if (select) {
    const options = [...select.querySelectorAll('option')];
    const label = document.createElement('p');
    label.textContent = clean(options[0]) || 'Download assets';
    downloadCell.push(label);
    const pdf = releasePdfUrl(element, document);
    const ul = document.createElement('ul');
    options.slice(1).forEach((opt) => {
      const text = clean(opt);
      if (!text) return;
      const value = (opt.getAttribute('value') || '').trim();
      const href = /^(https?:)?\/\//.test(value) || value.startsWith('/') ? value : (/pdf/i.test(text) ? pdf : '');
      const li = document.createElement('li');
      if (href) {
        const a = document.createElement('a');
        a.href = href;
        a.textContent = text;
        li.append(a);
      } else {
        li.textContent = text;
      }
      ul.append(li);
    });
    if (ul.children.length) downloadCell.push(ul);
  }

  // Cell 3: subscribe CTA
  const ctaCell = [];
  const cta = element.querySelector('.featured-item .item__cta a[href], .featureditem a.cta--button[href]');
  if (cta) {
    const a = document.createElement('a');
    a.href = cta.getAttribute('href');
    a.textContent = clean(cta);
    const p = document.createElement('p');
    p.append(a);
    ctaCell.push(p);
  }

  const cells = [[
    shareCell.length ? shareCell : '',
    downloadCell.length ? downloadCell : '',
    ctaCell.length ? ctaCell : '',
  ]];

  const block = WebImporter.Blocks.createBlock(document, {
    name: 'columns-share-bar (three-cells, share-icons, dropdown)',
    cells,
  });
  element.replaceWith(block);
}
