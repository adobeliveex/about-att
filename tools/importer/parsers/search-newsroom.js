/* eslint-disable */
/* global WebImporter */
/**
 * search-newsroom: one cell containing the search source link (a results page,
 * submitted with ?q=) and the placeholder text as a separate paragraph.
 * Source: .search-widget--shortened (embedded att.com search widget, no
 * authorable content in the DOM, so source URL and placeholder are fixed).
 */
export default function parse(element, { document }) {
  const SOURCE_URL = 'https://about.att.com/allnews.html';
  const PLACEHOLDER = 'What can we help you find?';

  const input = element.querySelector('input#searchfield, input.wgt-search-feild');
  const placeholderText = (input && input.getAttribute('placeholder')) || PLACEHOLDER;

  const linkP = document.createElement('p');
  const a = document.createElement('a');
  a.href = SOURCE_URL;
  a.textContent = SOURCE_URL;
  linkP.append(a);

  const placeholderP = document.createElement('p');
  placeholderP.textContent = placeholderText;

  const cells = [[[linkP, placeholderP]]];

  const block = WebImporter.Blocks.createBlock(document, { name: 'search-newsroom', cells });
  element.replaceWith(block);
}
