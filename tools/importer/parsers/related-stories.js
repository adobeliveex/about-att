/* eslint-disable */
/* global WebImporter */
/**
 * related-stories: the source's hand-picked related cards (.story__related) become
 * an auto-populated Related Stories block. The block fills itself from the stories
 * query index, so no card content is carried over; only the number of cards.
 */
export default function parse(element, { document }) {
  // one card per column (each column also contains a .featured-item, so don't count both)
  const count = element.querySelectorAll('.col-4').length
    || element.querySelectorAll('.featured-item').length;
  const limit = Math.max(3, count);
  const cells = [['limit', String(limit)]];
  const block = WebImporter.Blocks.createBlock(document, { name: 'related-stories', cells });
  element.replaceWith(block);
}
