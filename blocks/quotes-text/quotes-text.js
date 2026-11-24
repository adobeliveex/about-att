/*
 * Quotes Text
 * Story quotation with the AT&T blue quotation-mark graphic beside it
 * (about.att.com story quote rows). One row per quote: the quote text,
 * attribution in bold inside the text. The quote mark is built in; an
 * optional first cell with an image replaces it.
 */

function defaultMark() {
  const base = `${window.hlx.codeBasePath}/blocks/quotes-text`;
  const picture = document.createElement('picture');
  const source = document.createElement('source');
  source.media = '(max-width: 599px)';
  source.srcset = `${base}/quotation-mobile.png`;
  source.width = 1728;
  source.height = 785;
  const img = document.createElement('img');
  img.src = `${base}/quotation.png`;
  img.alt = '';
  img.width = 1728;
  img.height = 1358;
  img.loading = 'lazy';
  picture.append(source, img);
  return picture;
}

export default function decorate(block) {
  const items = [...block.children].map((row) => {
    const cells = [...row.children];
    const textCell = cells[cells.length - 1];
    if (!textCell || !textCell.textContent.trim()) return null;
    const customMark = cells.length > 1 ? cells[0].querySelector('picture') : null;

    const item = document.createElement('div');
    item.className = 'quotes-text-item';

    const mark = document.createElement('div');
    mark.className = 'quotes-text-mark';
    mark.setAttribute('aria-hidden', 'true');
    const picture = customMark || defaultMark();
    const img = picture.querySelector('img');
    if (img) img.alt = '';
    mark.append(picture);

    const quote = document.createElement('blockquote');
    quote.className = 'quotes-text-quote';
    if (textCell.querySelector('p')) {
      quote.append(...textCell.childNodes);
    } else {
      const p = document.createElement('p');
      p.append(...textCell.childNodes);
      quote.append(p);
    }

    item.append(mark, quote);
    return item;
  }).filter(Boolean);

  block.replaceChildren(...items);
}
