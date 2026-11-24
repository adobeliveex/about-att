/* eslint-disable */
/* global WebImporter */
/**
 * columns-stock-ticker: one row, four cells
 * price | change | timestamp | View stock information link.
 * Source: .SNR_Stock_Ticker .stock-ticker (about.att.com)
 */
export default function parse(element, { document }) {
  const clean = (el) => (el ? el.textContent.replace(/ /g, ' ').replace(/\s+/g, ' ').trim() : '');
  const para = (text) => {
    const p = document.createElement('p');
    p.textContent = text;
    return p;
  };

  // Price: visible symbol (without screen-reader-only text) + value
  let price = '';
  const symbolEl = element.querySelector('.stock-ticker__price .price__symbol');
  if (symbolEl) {
    const clone = symbolEl.cloneNode(true);
    clone.querySelectorAll('.hidden-spoken').forEach((h) => h.remove());
    price = clean(clone);
  }
  const priceValue = clean(element.querySelector('.stock-ticker__price .price__value'));
  price = [price, priceValue].filter(Boolean).join(' ');

  // Change: arrow + value
  const change = [
    clean(element.querySelector('.stock-ticker__change .change__symbol')),
    clean(element.querySelector('.stock-ticker__change .change__value')),
  ].filter(Boolean).join(' ');

  // Timestamp: date + time
  const timestamp = [
    clean(element.querySelector('.stock-ticker__timestamp .exchange__date')),
    clean(element.querySelector('.stock-ticker__timestamp .exchange__time')),
  ].filter(Boolean).join(' ');

  // Link
  const linkCell = [];
  const srcLink = element.querySelector('.stock-ticker__info a[href]');
  if (srcLink) {
    const a = document.createElement('a');
    a.href = srcLink.getAttribute('href');
    a.textContent = clean(srcLink);
    const p = document.createElement('p');
    p.append(a);
    linkCell.push(p);
  }

  const cells = [[
    price ? para(price) : '',
    change ? para(change) : '',
    timestamp ? para(timestamp) : '',
    linkCell.length ? linkCell : '',
  ]];

  const block = WebImporter.Blocks.createBlock(document, { name: 'columns-stock-ticker', cells });
  element.replaceWith(block);
}
