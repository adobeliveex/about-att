/*
 * Quote Plain
 * Unadorned body-text quotation. Row 1: quotation. Row 2 (optional): attribution.
 * Option inline-attribution: an authored attribution row is appended inline to the
 * end of the quotation text instead of on its own line.
 */

function toCite(attribution) {
  const cite = document.createElement('cite');
  cite.className = 'quote-plain-attribution';
  // unwrap single paragraph so the cite can sit inline
  const paras = attribution.querySelectorAll(':scope > p');
  if (paras.length === 1) cite.append(...paras[0].childNodes);
  else cite.append(...attribution.childNodes);
  return cite;
}

export default function decorate(block) {
  const rows = [...block.children];
  const cells = rows.map((row) => row.firstElementChild).filter((c) => c && c.textContent.trim());
  if (!cells.length) return;

  const [quotation, attribution] = cells;
  const blockquote = document.createElement('blockquote');
  blockquote.className = 'quote-plain-quote';

  const body = document.createElement('div');
  body.className = 'quote-plain-quotation';
  // wrap bare text in a paragraph so styling is consistent
  if (!quotation.querySelector('p')) {
    const p = document.createElement('p');
    p.append(...quotation.childNodes);
    body.append(p);
  } else {
    body.append(...quotation.childNodes);
  }
  blockquote.append(body);

  if (attribution) {
    const cite = toCite(attribution);
    const lastP = body.querySelector('p:last-of-type');
    if (block.classList.contains('inline-attribution') && lastP) {
      lastP.append(' ', cite);
    } else {
      const p = document.createElement('p');
      p.className = 'quote-plain-attribution-line';
      p.append(cite);
      blockquote.append(p);
    }
  }

  block.textContent = '';
  block.append(blockquote);
}
