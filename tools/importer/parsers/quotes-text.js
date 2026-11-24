/* eslint-disable */
/* global WebImporter */

/**
 * Parser for quotes-text.
 * Source: about.att.com story quote row
 *   .article__content .SNR_column .row__wrap
 *     > .col-3 (banner image "blue quotation marks", quotation-1728x1358.png)
 *     > .col-9 .text__wrap (quote paragraphs, attribution in bold)
 * Target: Quotes Text block, one row with one cell of quote text. The quote
 * mark is built into the block, so the source image is not carried over.
 * Rows without the quotation-mark image are left untouched.
 */
const QUOTE_MARK = /quotation/i;

export default function parse(element, { document }) {
  const mark = [...element.querySelectorAll('img')]
    .find((img) => QUOTE_MARK.test(img.getAttribute('src') || '') || QUOTE_MARK.test(img.getAttribute('alt') || ''));
  if (!mark) return;
  const textCol = element.querySelector('.col-9') || element;
  let nodes = [...textCol.querySelectorAll('.text__wrap > *')];
  if (!nodes.length) nodes = [...textCol.querySelectorAll('p')];
  const content = nodes.filter((n) => n.textContent.replace(/ /g, ' ').trim());
  if (!content.length) return;
  const block = WebImporter.Blocks.createBlock(document, { name: 'quotes-text', cells: [[content]] });
  element.replaceWith(block);
}
