import { createOptimizedPicture } from '../../scripts/aem.js';

const PAGE_SIZE = 6;

/**
 * Gives a generic link ("Learn more") a unique accessible name by appending
 * visually hidden context, e.g. "Learn more about <story title>".
 * @param {HTMLAnchorElement} link
 * @param {string} context
 */
function nameLinkWithContext(link, context) {
  const text = link.textContent.trim();
  const ctx = (context || '').trim();
  if (!ctx || text.toLowerCase().includes(ctx.toLowerCase())) return;
  const hidden = document.createElement('span');
  hidden.className = 'visually-hidden';
  hidden.textContent = ` about ${ctx}`;
  link.append(hidden);
}

function optimizeImages(root) {
  root.querySelectorAll('picture > img').forEach((img) => {
    const url = new URL(img.src, window.location.href);
    if (url.origin !== window.location.origin || /\.svg$/i.test(url.pathname)) return;
    // cards are ~400px wide in every layout; phones get a lighter rendition
    img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [
      { media: '(min-width: 600px)', width: '750' },
      { width: '500' },
    ]));
  });
}

function decorateCard(row) {
  const li = document.createElement('li');
  li.className = 'cards-news-card';
  while (row.firstElementChild) li.append(row.firstElementChild);

  [...li.children].forEach((div) => {
    const onlyPicture = div.querySelector('picture')
      && !div.textContent.trim()
      && div.querySelectorAll('picture').length === 1;
    div.className = onlyPicture ? 'cards-news-card-image' : 'cards-news-card-body';
    if (!onlyPicture && !div.textContent.trim() && !div.querySelector('img')) div.remove();
  });

  const body = li.querySelector('.cards-news-card-body');
  const image = li.querySelector('.cards-news-card-image');
  // image-top: keep the image first regardless of authored cell order
  if (image && li.firstElementChild !== image) li.prepend(image);

  if (body) {
    // the last standalone link is the card's text CTA
    const ctas = [...body.querySelectorAll('p > a:only-child')]
      .filter((a) => a.parentElement.textContent.trim() === a.textContent.trim());
    const cta = ctas[ctas.length - 1];
    if (cta) {
      cta.classList.remove('button', 'primary', 'secondary');
      cta.classList.add('cards-news-card-cta');
      cta.parentElement.classList.remove('button-container');
      cta.parentElement.classList.add('cards-news-card-cta-container');
      nameLinkWithContext(cta, body.querySelector('h1, h2, h3, h4, h5, h6')?.textContent);

      // link an unlinked image to the story
      const pic = image?.querySelector('picture');
      if (pic && !pic.closest('a')) {
        const link = document.createElement('a');
        link.href = cta.href;
        link.tabIndex = -1;
        link.setAttribute('aria-hidden', 'true');
        pic.replaceWith(link);
        link.append(pic);
      }
    }
  }
  return li;
}

function setupLoadMore(block, ul) {
  const cards = [...ul.children];
  if (cards.length <= PAGE_SIZE) return;
  let shown = PAGE_SIZE;
  cards.forEach((card, i) => { card.hidden = i >= shown; });

  const wrap = document.createElement('div');
  wrap.className = 'cards-news-load-more';
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'button';
  button.textContent = 'View More';
  wrap.append(button);
  block.append(wrap);

  button.addEventListener('click', () => {
    const firstNew = cards[shown];
    shown += PAGE_SIZE;
    cards.forEach((card, i) => { card.hidden = i >= shown; });
    if (shown >= cards.length) wrap.remove();
    firstNew?.querySelector('a')?.focus({ preventScroll: true });
  });
}

/**
 * News cards: a grid of story cards (image, title, description, text CTA).
 * Options: 3-up (three columns on desktop), image-top, text-link-cta,
 * load-more (reveals cards six at a time behind a "View More" button).
 * @param {Element} block
 */
export default function decorate(block) {
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    if (!row.textContent.trim() && !row.querySelector('img')) return;
    ul.append(decorateCard(row));
  });
  optimizeImages(ul);
  block.replaceChildren(ul);

  if (block.classList.contains('load-more')) setupLoadMore(block, ul);
}
