/*
 * Accordion Expand Text
 * Collapsed small-print text revealed by a plain text-link toggle.
 * One row per section: cell 1 toggle label (e.g. "Disclaimers", "View more"),
 * cell 2 the hidden content. Built on native <details>/<summary>.
 * Options: text-link-toggle, small-print.
 */

function fillSummary(summary, label) {
  const only = label.children.length === 1 ? label.firstElementChild : null;
  // a link authored as the label would navigate away; keep only its text
  if (only && only.tagName === 'A') {
    summary.textContent = only.textContent.trim();
  } else if (only && only.tagName === 'P') {
    const link = only.children.length === 1 && only.firstElementChild.tagName === 'A'
      && only.textContent.trim() === only.firstElementChild.textContent.trim();
    if (link) summary.textContent = only.textContent.trim();
    else summary.append(...only.childNodes);
  } else {
    summary.append(...label.childNodes);
  }
}

export default function decorate(block) {
  [...block.children].forEach((row) => {
    const [label, body, ...extra] = [...row.children];
    if (!label || !label.textContent.trim() || !body) {
      // a row without a label or content has nothing to toggle
      if (label && !body && label.textContent.trim()) {
        label.className = 'accordion-expand-text-static';
        row.replaceWith(label);
      } else {
        row.remove();
      }
      return;
    }

    const details = document.createElement('details');
    details.className = 'accordion-expand-text-item';

    const summary = document.createElement('summary');
    summary.className = 'accordion-expand-text-toggle';
    fillSummary(summary, label);

    body.className = 'accordion-expand-text-body';
    extra.forEach((cell) => body.append(...cell.childNodes));

    details.append(summary, body);
    row.replaceWith(details);
  });
}
