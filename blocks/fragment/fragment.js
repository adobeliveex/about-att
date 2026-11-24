/*
 * Fragment Block
 * Include content on a page as a fragment.
 * https://www.aem.live/developer/block-collection/fragment
 */

import { getRootPath } from '@dropins/tools/lib/aem/configs.js';
import { decorateMain } from '../../scripts/scripts.js';
import {
  loadSections,
} from '../../scripts/aem.js';

/**
 * Loads a fragment.
 * @param {string} path The path to the fragment
 * @returns {Promise<HTMLElement>} The root element of the fragment
 */
export async function loadFragment(path) {
  if (path && path.startsWith('/') && !path.startsWith('//')) {
    const root = getRootPath().replace(/\/$/, '');
    const url = `${root}${path}.plain.html`;
    const resp = await fetch(url);
    if (resp.ok) {
      const main = document.createElement('main');
      main.innerHTML = await resp.text();

      // reset base path for media to fragment base
      const resetAttributeBase = (tag, attr) => {
        main.querySelectorAll(`${tag}[${attr}^="./media_"]`).forEach((elem) => {
          elem[attr] = new URL(elem.getAttribute(attr), new URL(path, window.location)).href;
        });
      };
      resetAttributeBase('img', 'src');
      resetAttributeBase('source', 'srcset');

      decorateMain(main);
      await loadSections(main);
      return main;
    }
  }
  return null;
}

// This site's Edge Delivery hosts end in "--{site}--{org}"; used when authors
// paste a full preview / live URL instead of a site-relative path.
const SITE_SUFFIX = '--about-att--srm0233-adobe';
const DA_SITE_PATH = '/srm0233-adobe/about-att';

/**
 * Turns an authored fragment reference into a site-relative path.
 * Accepts "/fragments/x", this site's aem.page / aem.live (or current origin)
 * URLs, and Document Authoring links (content.da.live or da.live/edit#).
 * @param {string} ref Link href or text
 * @returns {string} Site-relative path, or '' when not this site's content
 */
export function toFragmentPath(ref) {
  const value = (ref || '').trim();
  if (!value) return '';
  if (value.startsWith('/') && !value.startsWith('//')) return value;
  let url;
  try { url = new URL(value, window.location.href); } catch { return ''; }
  const clean = (p) => p.replace(/\.(plain\.)?html$/, '').replace(/\/$/, '') || '/';
  const host = url.hostname;
  if (url.origin === window.location.origin
    || (/\.(aem|hlx)\.(page|live)$/.test(host) && host.split('.')[0].endsWith(SITE_SUFFIX))) {
    return clean(url.pathname);
  }
  if (host === 'content.da.live' && url.pathname.startsWith(`${DA_SITE_PATH}/`)) {
    return clean(url.pathname.slice(DA_SITE_PATH.length));
  }
  if (host === 'da.live' && url.hash.startsWith(`#${DA_SITE_PATH}/`)) {
    return clean(url.hash.slice(DA_SITE_PATH.length + 1));
  }
  return '';
}

export default async function decorate(block) {
  const link = block.querySelector('a');
  const path = toFragmentPath(link ? link.getAttribute('href') : block.textContent);
  const fragment = await loadFragment(path);
  if (!fragment) return;

  const wrapper = block.closest('.fragment-wrapper');
  const section = wrapper.closest('.section');

  if (section && section.children.length === 1) {
    // fragment is the ONLY child of its section; replace the whole section
    section.replaceWith(...fragment.childNodes);
  } else {
    // fragment shares section with other children; flatten children into it
    fragment.querySelectorAll(':scope > .section').forEach((fragSection) => {
      [...fragSection.childNodes].forEach((child) => wrapper.before(child));
    });
    wrapper.remove();
  }
}
