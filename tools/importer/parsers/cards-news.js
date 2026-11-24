/* eslint-disable */
/* global WebImporter */
/**
 * cards-news: one row per story.
 * cell 1: image (linked to the story when the source links it)
 * cell 2: h3 title, description paragraph, Learn more link
 * The "View More" load-more control (.stories__cta) is excluded.
 * Source: .featurestorymultifield .featured-stories (about.att.com home)
 *         .story__related .row__wrap (story pages: related stories)
 */
const PLACEHOLDER_ALTS = ['get faster streaming'];

export default function parse(element, { document }) {
  const cells = [];
  const clean = (el) => (el ? el.textContent.replace(/\s+/g, ' ').trim() : '');

  element.querySelectorAll('.featured-item').forEach((item) => {
    // Image cell
    const imageCell = [];
    const img = item.querySelector('.item__img img, .item__media img');
    if (img) {
      // Story-page related cards carry a placeholder alt; use the card title.
      const alt = (img.getAttribute('alt') || '').trim();
      if (!alt || PLACEHOLDER_ALTS.includes(alt.toLowerCase())) {
        const title = clean(item.querySelector('.item__title'));
        if (title) img.setAttribute('alt', title);
      }
      const imgLink = img.closest('a[href]');
      if (imgLink) {
        const a = document.createElement('a');
        a.href = imgLink.getAttribute('href');
        a.append(img);
        imageCell.push(a);
      } else {
        imageCell.push(img);
      }
    }

    // Content cell
    const contentCell = [];
    const titleSrc = item.querySelector('.item__title');
    if (titleSrc && clean(titleSrc)) {
      const h3 = document.createElement('h3');
      h3.textContent = clean(titleSrc);
      contentCell.push(h3);
    }

    const desc = item.querySelector('.item__description');
    if (desc) {
      const ps = desc.querySelectorAll('p');
      if (ps.length) {
        ps.forEach((p) => { if (clean(p)) contentCell.push(p); });
      } else if (clean(desc)) {
        const p = document.createElement('p');
        p.textContent = clean(desc);
        contentCell.push(p);
      }
    }

    const ctaSrc = item.querySelector('.item__cta a[href]');
    if (ctaSrc) {
      const a = document.createElement('a');
      a.href = ctaSrc.getAttribute('href');
      a.textContent = clean(ctaSrc) || 'Learn more';
      const p = document.createElement('p');
      p.append(a);
      contentCell.push(p);
    }

    if (!imageCell.length && !contentCell.length) return;
    cells.push([imageCell.length ? imageCell : '', contentCell.length ? contentCell : '']);
  });

  // Overlapping instance selectors (e.g. .story__related .region--blue around an
  // already-parsed .row__wrap): nothing left to parse, keep the existing block.
  if (!cells.length) return;

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-news', cells });
  element.replaceWith(block);
}
