/**
 * Footer block.
 * Content comes from the footer fragment (content/footer.plain.html):
 * each top-level section becomes a footer row; a section holding a list
 * renders as an inline link row, any other section as legal text (e.g. copyright).
 * This file only reads that content and adds structure.
 */

/**
 * Fetches the footer fragment. Metadata-independent:
 * /content/footer.plain.html (local preview) first, then /footer.plain.html (DA / Edge Delivery).
 * @returns {Promise<{container: Element, url: string}|null>}
 */
async function fetchFooter() {
  // local preview serves the fragment under /content; Edge Delivery serves it at the root.
  // Ask the likely location first so the other is only a fallback (no 404 in the console).
  const local = ['localhost', '127.0.0.1'].includes(window.location.hostname);
  const [first, second] = local
    ? ['/content/footer.plain.html', '/footer.plain.html']
    : ['/footer.plain.html', '/content/footer.plain.html'];
  let resp = await fetch(first);
  if (!resp.ok) resp = await fetch(second);
  if (!resp.ok) return null;
  const container = document.createElement('div');
  container.innerHTML = await resp.text();
  return { container, url: resp.url };
}

/**
 * Resolves relative image paths against the fragment location.
 * @param {Element} root
 * @param {string} base URL the fragment was served from
 */
function fixImagePaths(root, base) {
  root.querySelectorAll('img[src]').forEach((img) => {
    const src = img.getAttribute('src');
    if (/^(https?:|\/|data:)/.test(src)) return;
    img.src = new URL(src, base).pathname;
  });
}

/**
 * Opens links to other sites in a new tab (as on the source site).
 * @param {Element} root
 */
function decorateExternalLinks(root) {
  root.querySelectorAll('a[href]').forEach((a) => {
    try {
      const url = new URL(a.href, window.location.href);
      if (url.origin !== window.location.origin && /^https?:$/.test(url.protocol)) {
        a.target = '_blank';
        a.rel = 'noopener';
      }
    } catch { /* ignore malformed */ }
  });
}

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  const result = await fetchFooter();
  block.textContent = '';
  if (!result) return;
  const { container: fragment, url } = result;
  fixImagePaths(fragment, url);

  const wrap = document.createElement('div');
  wrap.className = 'footer-wrap';

  // page-settings blocks (e.g. Robots: noindex) are not footer content
  [...fragment.querySelectorAll(':scope > div')]
    .filter((section) => !section.querySelector(':scope > .metadata'))
    // Edge Delivery leaves an empty section where a page-settings block was
    .filter((section) => section.textContent.trim() || section.querySelector('img, picture'))
    .forEach((section) => {
      const list = section.querySelector(':scope > ul');
      if (list) {
        const nav = document.createElement('nav');
        nav.className = 'footer-links';
        nav.setAttribute('aria-label', 'Footer');
        list.classList.add('footer-links-list');
        list.querySelectorAll(':scope > li img').forEach((img) => {
          img.classList.add('footer-link-icon');
          img.loading = 'lazy';
        });
        nav.append(list);
        wrap.append(nav);
      } else {
        const text = document.createElement('div');
        text.className = 'footer-legal';
        text.append(...section.childNodes);
        wrap.append(text);
      }
    });

  decorateExternalLinks(wrap);
  block.append(wrap);
}
