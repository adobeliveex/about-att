/**
 * Small print never holds buttons: a bold / italic link on its own line (e.g.
 * "Descargar PDF en español") is a plain emphasised link here. Undo the site
 * button decoration (scripts.js decorateButtons), restoring the authored
 * <strong> / <em> it replaced.
 * @param {Element} root Block content
 */
function unbuttonLinks(root) {
  root.querySelectorAll('a.button').forEach((a) => {
    const strong = a.classList.contains('accent') || a.classList.contains('primary');
    const em = a.classList.contains('accent') || a.classList.contains('secondary');
    const wrapper = a.closest('.button-wrapper');
    let node = a;
    if (strong) {
      const s = document.createElement('strong');
      node.replaceWith(s);
      s.append(node);
      node = s;
    }
    if (em) {
      const e = document.createElement('em');
      node.replaceWith(e);
      e.append(node);
    }
    a.removeAttribute('class');
    if (wrapper) wrapper.classList.remove('button-wrapper');
    if (wrapper && !wrapper.classList.length) wrapper.removeAttribute('class');
  });
}

/**
 * Small Print: footnotes, disclaimers and "About AT&T" boilerplate at the
 * foot of a story, in the source's 15px small-print type.
 * Authoring: one cell (or several rows) of rich text. Rows are flattened so
 * the paragraphs sit directly in the block.
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const content = document.createElement('div');
  content.className = 'small-print-content';
  [...block.children].forEach((row) => {
    [...row.children].forEach((cell) => content.append(...cell.childNodes));
  });
  unbuttonLinks(content);
  block.replaceChildren(content);
}
