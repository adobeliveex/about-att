import {
  loadHeader,
  loadFooter,
  decorateIcons,
  decorateBlocks,
  decorateSections,
  decorateTemplateAndTheme,
  waitForFirstImage,
  loadSection,
  loadSections,
  loadCSS,
  buildBlock,
  readBlockConfig,
  toClassName,
  toCamelCase,
} from './aem.js';
import {
  runExperimentation,
  runExperimentationLazy,
} from './experiment-loader.js';

/** Document Authoring preview mode (?dapreview) */
const IS_DA = new URL(window.location.href).searchParams.has('dapreview');

/**
 * AEM Experimentation (plugins/experimentation): experiments, audiences and
 * campaigns authored as page / section metadata. The live site
 * (*.aem.live, or a custom domain) is production; *.aem.page and localhost
 * show the simulation panel from the Sidekick.
 */
/*
 * Visitor segment for the "consumer" / "business" audiences.
 * Business: arrived from business.att.com, or a link tagged as business
 * (customer_type=business|smallbusiness, utm_audience=business, segment=business).
 * Consumer: everyone else (att.com, search, direct, ...).
 * The browser has no address data, so these referral signals are the source;
 * the result is kept for the visit so it survives navigation on the site.
 */
const SEGMENT_KEY = 'att-visitor-segment';

function hasBusinessSignal() {
  const { searchParams } = new URL(window.location.href);
  const tagged = ['customer_type', 'utm_audience', 'segment']
    .some((key) => /business/i.test(searchParams.get(key) || ''));
  if (tagged) return true;
  try {
    const { hostname } = new URL(document.referrer);
    return hostname === 'business.att.com' || hostname.endsWith('.business.att.com');
  } catch {
    return false; // no or invalid referrer
  }
}

let visitorSegment;
function getVisitorSegment() {
  if (visitorSegment) return visitorSegment;
  let saved;
  try { saved = sessionStorage.getItem(SEGMENT_KEY); } catch { /* storage blocked */ }
  visitorSegment = hasBusinessSignal() ? 'business' : (saved || 'consumer');
  try { sessionStorage.setItem(SEGMENT_KEY, visitorSegment); } catch { /* storage blocked */ }
  return visitorSegment;
}

const experimentationConfig = {
  isProd: () => {
    const { hostname } = window.location;
    return !(hostname === 'localhost' || hostname.endsWith('.page'));
  },
  audiences: {
    mobile: () => window.innerWidth < 600,
    desktop: () => window.innerWidth >= 600,
    consumer: () => getVisitorSegment() === 'consumer',
    business: () => getVisitorSegment() === 'business',
  },
};

/*
 * Trusted Types default policy.
 *
 * This policy is defined but NOT currently enforced: the
 * `require-trusted-types-for 'script'` CSP directive that activates it has been
 * removed from the Content-Security-Policy meta in head.html. The policy is kept
 * here so enforcement can be turned back on without re-authoring it.
 *
 * Why the directive was removed: with it enforced, payment SDKs that build a
 * same-origin iframe and synchronously inject a <script> into it fail to render.
 * The Credit Card checkout flow hits this because its hosted-fields SDK does
 * exactly that. Trusted Types policies are scoped per document/realm, so the
 * child iframe inherits the CSP directive but not this default policy; the SDK's
 * `script.src` assignment in that realm then throws "This document requires
 * 'TrustedScriptURL' assignment" and the card fields never mount. Any dependency
 * that injects scripts into a same-origin iframe realm hits the same wall.
 *
 * To re-enable enforcement: add `require-trusted-types-for 'script';` back to the
 * `Content-Security-Policy` meta in head.html. Before doing so, note that the
 * policy below is a passthrough (createScriptURL/createScript return their input
 * unchanged), so enforcing it satisfies the API without adding real containment;
 * hardening it into an allowlist is the useful next step. Enforcement will also
 * re-break any same-origin-iframe SDK unless that SDK installs its own policy in
 * the iframe realm (the correct long-term fix).
 *
 * References:
 * - Directive introduced upstream: https://github.com/adobe/aem-boilerplate/pull/641
 * - Trusted Types API: https://developer.mozilla.org/en-US/docs/Web/API/Trusted_Types_API
 */
if (window.trustedTypes && window.trustedTypes.createPolicy) {
  const innerTT = window.trustedTypes.createPolicy('tt-inner', {
    createHTML: (s) => s, // avoid stack overflow
  });

  window.trustedTypes.createPolicy('default', {
    createHTML: (input, type, sink) => {
      let processedInput = input;
      if (/srcdoc\s*=/i.test(processedInput)) {
        const doc = new DOMParser().parseFromString(innerTT.createHTML(processedInput), 'text/html');
        doc.querySelectorAll('iframe[srcdoc]').forEach((el) => el.removeAttribute('srcdoc'));
        processedInput = doc.body.innerHTML;
      }
      if (sink.includes('createContextualFragment') || sink.includes('Document write')) {
        const doc = new DOMParser().parseFromString(innerTT.createHTML(processedInput), 'text/html');
        doc.querySelectorAll('script').forEach((el) => el.remove());
        processedInput = doc.body.innerHTML;
      }
      return processedInput;
    },
    createScriptURL: (input) => input,
    createScript: (input) => input,
  });
}

/**
 * load fonts.css and set a session storage flag
 */
async function loadFonts() {
  await loadCSS(`${window.hlx.codeBasePath}/styles/fonts.css`);
  try {
    if (!window.location.hostname.includes('localhost')) sessionStorage.setItem('fonts-loaded', 'true');
  } catch (e) {
    // do nothing
  }
}

/**
 * Turns `/widgets/...` links into widget blocks.
 * @param {Element} main The container element
 */
function buildWidgetAutoBlocks(main) {
  const widgetLinks = [...main.querySelectorAll('a[href*="/widgets/"]')];
  widgetLinks.forEach((link) => {
    if (link.closest('.widget')) return;
    const newLink = link.cloneNode(true);
    const widgetBlock = buildBlock('widget', { elems: [newLink] });
    const p = link.closest('p');
    if (
      p
      && p.querySelectorAll('a').length === 1
      && p.querySelector('a') === link
      && p.textContent.trim() === link.textContent.trim()
    ) {
      p.replaceWith(widgetBlock);
    } else {
      link.replaceWith(widgetBlock);
    }
  });
}

/**
 * Builds all synthetic blocks in a container element.
 * @param {Element} main The container element
 */
function buildAutoBlocks(main) {
  try {
    // auto load `*/fragments/*` references
    const fragments = [...main.querySelectorAll('a[href*="/fragments/"]')].filter((f) => !f.closest('.fragment'));
    if (fragments.length > 0) {
      // eslint-disable-next-line import/no-cycle
      import('../blocks/fragment/fragment.js').then(({ loadFragment }) => {
        fragments.forEach(async (fragment) => {
          try {
            const { pathname } = new URL(fragment.href);
            const frag = await loadFragment(pathname);
            fragment.parentElement.replaceWith(...frag.children);
          } catch (error) {
            // eslint-disable-next-line no-console
            console.error('Fragment loading failed', error);
          }
        });
      });
    }
    buildWidgetAutoBlocks(main);
  } catch (error) {
    console.error('Auto Blocking failed', error);
  }
}

/**
 * Decorates formatted links to style them as buttons.
 * @param {HTMLElement} main The main container element
 */
function decorateButtons(main) {
  main.querySelectorAll('p a[href]').forEach((a) => {
    a.title = a.title || a.textContent;
    const p = a.closest('p');
    const text = a.textContent.trim();

    // quick structural checks
    if (a.querySelector('img') || p.textContent.trim() !== text) return;

    // skip URL display links
    try {
      if (new URL(a.href).href === new URL(text, window.location).href) return;
    } catch { /* continue */ }

    // require authored formatting for buttonization
    const strong = a.closest('strong');
    const em = a.closest('em');
    if (!strong && !em) return;

    p.className = 'button-wrapper';
    a.className = 'button';
    if (strong && em) { // high-impact call-to-action
      a.classList.add('accent');
      const outer = strong.contains(em) ? strong : em;
      outer.replaceWith(a);
    } else if (strong) {
      a.classList.add('primary');
      strong.replaceWith(a);
    } else {
      a.classList.add('secondary');
      em.replaceWith(a);
    }
  });
}

/**
 * Applies authored Section Metadata blocks to their sections:
 * `style` becomes section classes, other keys become data attributes.
 * The section-metadata block is then removed.
 * @param {Element} main The main element
 */
function decorateSectionMetadata(main) {
  main.querySelectorAll(':scope > div.section div.section-metadata').forEach((sectionMeta) => {
    const section = sectionMeta.closest('div.section');
    const meta = readBlockConfig(sectionMeta);
    Object.keys(meta).forEach((key) => {
      if (key === 'style') {
        `${meta.style}`.split(',')
          .map((style) => toClassName(style.trim()))
          .filter(Boolean)
          .forEach((style) => section.classList.add(style));
      } else {
        section.dataset[toCamelCase(key)] = meta[key];
      }
    });
    const wrapper = sectionMeta.parentElement;
    sectionMeta.remove();
    if (wrapper && wrapper !== section && !wrapper.children.length) wrapper.remove();
  });
}

/**
 * Decorates the main element.
 * @param {Element} main The main element
 */
export function decorateMain(main) {
  decorateIcons(main);
  buildAutoBlocks(main);
  decorateSections(main);
  decorateSectionMetadata(main);
  decorateBlocks(main);
  decorateButtons(main);
}

/**
 * Loads everything needed to get to LCP.
 * @param {Element} doc The container element
 */
async function loadEager(doc) {
  document.documentElement.lang = 'en';
  decorateTemplateAndTheme();
  // pick the experiment / audience / campaign variant before the page is decorated
  await runExperimentation(doc, experimentationConfig);

  const main = doc.querySelector('main');
  if (main) {
    decorateMain(main);
    document.body.classList.add('appear');
    await loadSection(main.querySelector('.section'), waitForFirstImage);
  }

  try {
    /* if desktop (proxy for fast connection) or fonts already loaded, load fonts.css */
    if (window.innerWidth >= 900 || sessionStorage.getItem('fonts-loaded')) {
      loadFonts();
    }
  } catch (e) {
    // do nothing
  }
}

/**
 * Loads everything that doesn't need to be delayed.
 * @param {Element} doc The container element
 */
async function loadLazy(doc) {
  loadHeader(doc.querySelector('body > header'));

  const main = doc.querySelector('main');
  await loadSections(main);

  const { hash } = window.location;
  const element = hash ? doc.getElementById(hash.substring(1)) : false;
  if (hash && element) element.scrollIntoView();

  loadFooter(doc.querySelector('body > footer'));

  loadCSS(`${window.hlx.codeBasePath}/styles/lazy-styles.css`);
  loadFonts();

  // experimentation simulation panel (preview / local only; never on the live site)
  await runExperimentationLazy(doc, experimentationConfig);
}

/**
 * Loads everything that happens a lot later,
 * without impacting the user experience.
 */
function loadDelayed() {
  import('./consent-check.js');
  // load anything that can be postponed to the latest here
}

async function loadPage() {
  await loadEager(document);
  await loadLazy(document);
  loadDelayed();
}

loadPage();

/** Sidekick extensions (Experience Workspace "Experimentation" button). */
function loadSidekick() {
  if (document.querySelector('aem-sidekick')) {
    import('./sidekick.js');
    return;
  }
  document.addEventListener('sidekick-ready', () => {
    import('./sidekick.js');
  }, { once: true });
}

loadSidekick();

(async function loadDa() {
  const { searchParams } = new URL(window.location.href);
  /* eslint-disable import/no-unresolved */
  if (IS_DA) {
    import('https://da.live/scripts/dapreview.js').then(({ default: daPreview }) => daPreview(loadPage));
  }
  // Experience Workspace experimentation UI
  if (searchParams.get('daexperiment')) {
    import('https://da.live/nx/public/plugins/exp/exp.js');
  }
  /* eslint-enable import/no-unresolved */
}());
