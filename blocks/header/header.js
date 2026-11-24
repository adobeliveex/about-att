/**
 * Header block.
 * Content comes from the nav fragment (content/nav.plain.html):
 *   section 1: brand (logo link)
 *   section 2: navigation list; each top-level <li> = link + optional nested <ul> dropdown
 *   any further sections are appended as extra tool areas
 * This file only reads that content and adds structure + behaviour.
 */

const DESKTOP_MQ = window.matchMedia('(width >= 900px)');

/**
 * Fetches the nav fragment. Metadata-independent:
 * /content/nav.plain.html (local preview) first, then /nav.plain.html (DA / Edge Delivery).
 * @returns {Promise<{container: Element, url: string}|null>} fragment sections + source URL
 */
async function fetchNav() {
  // local preview serves the fragment under /content; Edge Delivery serves it at the root.
  // Ask the likely location first so the other is only a fallback (no 404 in the console).
  const local = ['localhost', '127.0.0.1'].includes(window.location.hostname);
  const [first, second] = local
    ? ['/content/nav.plain.html', '/nav.plain.html']
    : ['/nav.plain.html', '/content/nav.plain.html'];
  let resp = await fetch(first);
  if (!resp.ok) resp = await fetch(second);
  if (!resp.ok) return null;
  const html = await resp.text();
  const container = document.createElement('div');
  container.innerHTML = html;
  return { container, url: resp.url };
}

/**
 * Resolves relative image paths in the fragment against the fragment location.
 * @param {Element} root
 * @param {string} base
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

function closeAllDropdowns(nav, except) {
  nav.querySelectorAll('.nav-item.is-open').forEach((item) => {
    if (item === except) return;
    item.classList.remove('is-open');
    const toggle = item.querySelector(':scope > .nav-dropdown-toggle');
    if (toggle) toggle.setAttribute('aria-expanded', 'false');
  });
}

function setItemOpen(nav, item, open) {
  // desktop shows one dropdown at a time; the mobile menu lets several sections stay expanded
  if (open && DESKTOP_MQ.matches) closeAllDropdowns(nav, item);
  item.classList.toggle('is-open', open);
  const toggle = item.querySelector(':scope > .nav-dropdown-toggle');
  if (toggle) toggle.setAttribute('aria-expanded', String(open));
}

function setMenuOpen(nav, open) {
  nav.classList.toggle('is-menu-open', open);
  const button = nav.querySelector('.nav-hamburger');
  if (button) {
    button.setAttribute('aria-expanded', String(open));
    button.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
  }
  document.body.classList.toggle('nav-menu-open', open && !DESKTOP_MQ.matches);
}

/**
 * Builds one top-level nav item from an authored <li>.
 * @param {Element} li authored list item
 * @param {number} index position in the list
 * @param {number} count number of top-level items
 * @returns {Element}
 */
function buildNavItem(li, index, count) {
  const item = document.createElement('li');
  item.className = 'nav-item';
  const link = li.querySelector(':scope > a, :scope > p > a');
  const label = link ? link.textContent.trim() : (li.firstChild?.textContent || '').trim();
  if (link) {
    link.classList.add('nav-link');
    item.append(link);
  } else {
    const span = document.createElement('span');
    span.className = 'nav-link';
    span.textContent = label;
    item.append(span);
  }

  const sub = li.querySelector(':scope > ul');
  if (sub) {
    item.classList.add('has-dropdown');
    item.querySelector(':scope > .nav-link')?.classList.add('nav-trigger');
    // second half of the bar opens its dropdown right-aligned so it stays inside the content area
    if (index >= Math.ceil(count / 2)) item.classList.add('align-right');
    const id = `nav-dropdown-${index}`;
    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'nav-dropdown-toggle';
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-controls', id);
    toggle.setAttribute('aria-label', `${label} sub-menu`);
    sub.id = id;
    sub.className = 'nav-dropdown';
    sub.querySelectorAll(':scope > li').forEach((subLi) => subLi.classList.add('nav-dropdown-item'));
    item.append(toggle, sub);
  }
  return item;
}

function bindBehaviour(nav) {
  const items = [...nav.querySelectorAll('.nav-item.has-dropdown')];

  items.forEach((item) => {
    const toggle = item.querySelector(':scope > .nav-dropdown-toggle');
    // desktop: hover opens
    item.addEventListener('mouseenter', () => { if (DESKTOP_MQ.matches) setItemOpen(nav, item, true); });
    item.addEventListener('mouseleave', () => { if (DESKTOP_MQ.matches) setItemOpen(nav, item, false); });
    // keyboard focus opens on desktop; leaving the item closes it
    item.addEventListener('focusin', () => { if (DESKTOP_MQ.matches) setItemOpen(nav, item, true); });
    item.addEventListener('focusout', (e) => {
      if (DESKTOP_MQ.matches && !item.contains(e.relatedTarget)) setItemOpen(nav, item, false);
    });
    // toggle button: all viewports (keyboard on desktop, accordion on mobile)
    toggle.addEventListener('click', (e) => {
      e.preventDefault();
      setItemOpen(nav, item, !item.classList.contains('is-open'));
    });
  });

  nav.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    const open = nav.querySelector('.nav-item.is-open');
    if (open) {
      setItemOpen(nav, open, false);
      open.querySelector(':scope > .nav-link')?.focus();
    } else if (nav.classList.contains('is-menu-open')) {
      setMenuOpen(nav, false);
      nav.querySelector('.nav-hamburger')?.focus();
    }
  });

  const hamburger = nav.querySelector('.nav-hamburger');
  hamburger.addEventListener('click', () => {
    setMenuOpen(nav, !nav.classList.contains('is-menu-open'));
  });

  // reset state when crossing the desktop breakpoint
  DESKTOP_MQ.addEventListener('change', () => {
    closeAllDropdowns(nav);
    setMenuOpen(nav, false);
  });
}

/**
 * Keyboard "skip to main content" link, shown only when focused.
 * @returns {HTMLAnchorElement}
 */
function buildSkipLink() {
  const main = document.querySelector('main');
  if (main && !main.id) main.id = 'main';
  const link = document.createElement('a');
  link.className = 'skip-link';
  link.href = `#${main?.id || 'main'}`;
  link.textContent = 'Skip to main content';
  link.addEventListener('click', (e) => {
    if (!main) return;
    e.preventDefault();
    main.tabIndex = -1;
    main.focus();
  });
  return link;
}

/**
 * loads and decorates the header
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  const result = await fetchNav();
  block.textContent = '';
  if (!result) return;
  const { container: fragment, url: navUrl } = result;
  // relative image paths are relative to wherever the fragment was served from
  fixImagePaths(fragment, navUrl);

  // page-settings blocks (e.g. Robots: noindex) are not header content
  const sections = [...fragment.querySelectorAll(':scope > div')]
    .filter((section) => !section.querySelector(':scope > .metadata'));
  const [brandSection, navSection, ...extraSections] = sections;

  const nav = document.createElement('nav');
  nav.id = 'nav';
  nav.setAttribute('aria-label', 'Main navigation');

  // brand
  const brand = document.createElement('div');
  brand.className = 'nav-brand';
  if (brandSection) {
    const brandLink = brandSection.querySelector('a');
    if (brandLink) {
      brandLink.classList.add('nav-brand-link');
      const img = brandLink.querySelector('img');
      if (img && !brandLink.getAttribute('aria-label')) {
        brandLink.setAttribute('aria-label', img.alt || 'Home');
      }
      if (img) {
        img.loading = 'eager';
        img.width = img.width || 95;
        img.height = img.height || 38;
      }
      brand.append(brandLink);
    } else {
      brand.append(...brandSection.childNodes);
    }
  }

  // hamburger (mobile menu trigger)
  const hamburger = document.createElement('button');
  hamburger.type = 'button';
  hamburger.className = 'nav-hamburger';
  hamburger.setAttribute('aria-controls', 'nav-sections');
  hamburger.setAttribute('aria-expanded', 'false');
  hamburger.setAttribute('aria-label', 'Open navigation');
  hamburger.innerHTML = '<span class="nav-hamburger-bar"></span><span class="nav-hamburger-bar"></span><span class="nav-hamburger-bar"></span>';

  // navigation list
  const navSections = document.createElement('div');
  navSections.className = 'nav-sections';
  navSections.id = 'nav-sections';
  const authoredList = navSection?.querySelector('ul');
  if (authoredList) {
    const list = document.createElement('ul');
    list.className = 'nav-list';
    const topItems = [...authoredList.querySelectorAll(':scope > li')];
    topItems.forEach((li, i) => list.append(buildNavItem(li, i, topItems.length)));
    navSections.append(list);
  }

  nav.append(brand, hamburger, navSections);

  extraSections.forEach((section) => {
    const tools = document.createElement('div');
    tools.className = 'nav-tools';
    tools.append(...section.childNodes);
    nav.append(tools);
  });

  decorateExternalLinks(nav);

  const wrapper = document.createElement('div');
  wrapper.className = 'nav-wrapper';
  wrapper.append(nav);
  block.append(buildSkipLink(), wrapper);

  bindBehaviour(nav);
}
