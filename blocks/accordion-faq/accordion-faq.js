/*
 * Accordion FAQ
 * One row per question: cell 1 question, cell 2 answer (rich text).
 * Built on native <details>/<summary>. Options: chevron, divider-rows.
 */

/** Move a label cell's content into the summary, unwrapping a lone paragraph. */
function fillSummary(summary, label) {
  const only = label.children.length === 1 ? label.firstElementChild : null;
  if (only && only.tagName === 'P') summary.append(...only.childNodes);
  else summary.append(...label.childNodes);
}

export default function decorate(block) {
  [...block.children].forEach((row) => {
    const [label, body, ...extra] = [...row.children];
    if (!label || !label.textContent.trim()) {
      row.remove();
      return;
    }

    const details = document.createElement('details');
    details.className = 'accordion-faq-item';

    const summary = document.createElement('summary');
    summary.className = 'accordion-faq-item-label';
    fillSummary(summary, label);

    const panel = body || document.createElement('div');
    panel.className = 'accordion-faq-item-body';
    // fold any extra cells authors add into the answer
    extra.forEach((cell) => panel.append(...cell.childNodes));

    details.append(summary, panel);
    row.replaceWith(details);
  });
}
