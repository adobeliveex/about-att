/* eslint-disable */
/* global WebImporter */
/**
 * article-search: the source's All News search page (.region with .search-header,
 * the newsroom search widget, the filter form and the JS-rendered results) becomes
 * one Article Search block. The block lists and filters articles itself from the
 * stories query index, so only the labels are carried over: the headline, the
 * helper sentence and the Subscribe button link.
 */
export default function parse(element, { document }) {
  const text = (el) => (el ? el.textContent.replace(/\s+/g, ' ').trim() : '');

  const title = text(element.querySelector('.search-header h1, h1'));
  const intro = text(element.querySelector('.text__wrap p'))
    // the source says "the filter below"; the filters now sit in the sidebar
    .replace(/the filter below to further narrow down the results below\.?/i, 'the filters to narrow down the results.');
  const placeholder = element.querySelector('input.wgt-search-feild, input[type="search"]')?.getAttribute('placeholder') || '';
  const cta = element.querySelector('a.cta--button');

  const cells = [];
  if (title) cells.push(['title', title]);
  if (intro) cells.push(['intro', intro]);
  if (placeholder) cells.push(['placeholder', placeholder]);
  if (cta) {
    const link = document.createElement('a');
    link.href = cta.getAttribute('href');
    link.textContent = text(cta) || cta.getAttribute('aria-label') || 'Subscribe to AT&T News';
    cells.push(['link', link]);
  }
  cells.push(['filters', 'Category, Tags, Publish Month, Keywords, Author']);
  cells.push(['page size', '20']);

  const block = WebImporter.Blocks.createBlock(document, { name: 'article-search', cells });
  element.replaceWith(block);
}
