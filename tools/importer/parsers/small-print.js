/* eslint-disable */
/* global WebImporter */

/**
 * Parser for small-print.
 * Source: about.att.com story always-visible small print
 *   .article__content .text.text--footer > .text__wrap > (p | ul | ...)
 *   (non-GAAP footnotes, Ookla footnotes, "About AT&T" boilerplate, PDF links)
 * Target: Small Print block, one row with one cell holding the rich text.
 */
export default function parse(element, { document }) {
  const wrap = element.querySelector('.text__wrap') || element;
  const nodes = [...wrap.childNodes].filter((n) => n.nodeType === 1 || (n.nodeType === 3 && n.textContent.trim()));
  // Leading empty paragraphs (<p>&nbsp;</p>) carry no content.
  while (nodes.length && nodes[0].nodeType === 1 && !nodes[0].textContent.replace(/ /g, ' ').trim() && !nodes[0].querySelector('img, a')) {
    nodes.shift();
  }
  if (!nodes.length) {
    element.remove();
    return;
  }
  const cells = [[nodes]];
  const block = WebImporter.Blocks.createBlock(document, { name: 'small-print', cells });
  element.replaceWith(block);
}
