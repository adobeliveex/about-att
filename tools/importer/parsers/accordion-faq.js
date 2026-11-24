/* eslint-disable */
/* global WebImporter */
/**
 * accordion-faq (chevron, divider-rows): one row per question.
 * cell 1: question text
 * cell 2: rich answer (paragraphs, lists, links, footnote superscripts)
 * The per-item "Close" control (.item__close) is behavior, not content.
 * Source: .article__content .expand-collapse (about.att.com story pages)
 */
export default function parse(element, { document }) {
  const cells = [];
  const clean = (el) => (el ? el.textContent.replace(/\s+/g, ' ').trim() : '');

  element.querySelectorAll('.item__label').forEach((label) => {
    const question = clean(label);
    if (!question) return;

    let wrap = label.nextElementSibling;
    if (!wrap || !wrap.classList.contains('item__wrap')) {
      wrap = label.parentElement && label.parentElement.querySelector(':scope > .item__wrap');
    }

    const answer = [];
    if (wrap) {
      const content = wrap.querySelector('.text__wrap') || wrap.querySelector('.item__content') || wrap;
      [...content.children].forEach((child) => {
        if (child.matches('.item__close') || child.querySelector('.item__label')) return;
        if (!clean(child) && !child.querySelector('img, picture, video')) return;
        answer.push(child);
      });
    }

    cells.push([question, answer.length ? answer : '']);
  });

  const block = WebImporter.Blocks.createBlock(document, {
    name: 'accordion-faq (chevron, divider-rows)',
    cells,
  });
  element.replaceWith(block);
}
