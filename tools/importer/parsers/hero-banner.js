/* eslint-disable */
/* global WebImporter */
/**
 * hero-banner: row 1 background image, row 2 h1 headline + optional text + CTA link.
 * Source: .snr-banner .banner (about.att.com)
 */
export default function parse(element, { document }) {
  const cells = [];

  // Row 1: background image
  const img = element.querySelector('.banner__img img, .banner__img picture img');
  if (img) cells.push([img]);

  // Row 2: headline, optional text, CTA
  const content = [];
  const headlineSrc = element.querySelector('.banner__text h1, .banner__text h2, .banner__text .banner__level2, .banner__text .banner__level1');
  if (headlineSrc && headlineSrc.textContent.trim()) {
    const h1 = document.createElement('h1');
    h1.textContent = headlineSrc.textContent.replace(/\s+/g, ' ').trim();
    content.push(h1);
  }

  // optional sub text: any other text nodes in banner__text besides the headline
  element.querySelectorAll('.banner__text > p, .banner__text .banner__level3, .banner__text .banner__subtitle').forEach((el) => {
    if (el !== headlineSrc && el.textContent.trim()) {
      const p = document.createElement('p');
      p.textContent = el.textContent.replace(/\s+/g, ' ').trim();
      content.push(p);
    }
  });

  const cta = element.querySelector('.banner__cta a[href]');
  if (cta) {
    const a = document.createElement('a');
    a.href = cta.getAttribute('href');
    a.textContent = cta.textContent.trim();
    const p = document.createElement('p');
    p.append(a);
    content.push(p);
  }
  if (content.length) cells.push([content]);

  const block = WebImporter.Blocks.createBlock(document, { name: 'hero-banner', cells });
  element.replaceWith(block);
}
