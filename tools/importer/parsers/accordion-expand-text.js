/* eslint-disable */
/* global WebImporter */
/**
 * accordion-expand-text (text-link-toggle, small-print): one row per section.
 * cell 1: toggle label as plain text (e.g. "Disclaimers", "View more")
 * cell 2: the collapsed content (footnote paragraphs, links)
 * Each source component becomes its own block.
 * Source: .article__content .text.expandable-text (about.att.com story pages)
 *   .text__wrap  -> hidden content
 *   .text__cta a -> toggle label (javascript:void(0) link, text only)
 */
export default function parse(element, { document }) {
  const cells = [];
  const clean = (el) => (el ? el.textContent.replace(/[\s ]+/g, ' ').trim() : '');

  const toggle = element.querySelector(':scope > .text__cta') || element.querySelector('.text__cta');
  const label = clean(toggle) || 'View more';

  const wrap = element.querySelector(':scope > .text__wrap') || element.querySelector('.text__wrap');
  const content = [];
  if (wrap) {
    [...wrap.children].forEach((child) => {
      if (child.matches('.text__cta')) return;
      if (!clean(child) && !child.querySelector('img, picture, video')) return;
      content.push(child);
    });
  }

  cells.push([label, content.length ? content : '']);

  const block = WebImporter.Blocks.createBlock(document, {
    name: 'accordion-expand-text (text-link-toggle, small-print)',
    cells,
  });
  element.replaceWith(block);
}
