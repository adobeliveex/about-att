import { createOptimizedPicture } from '../../scripts/aem.js';

function optimize(picture) {
  const img = picture.querySelector('img');
  if (!img) return picture;
  const url = new URL(img.src, window.location.href);
  if (url.origin !== window.location.origin || /\.svg$/i.test(url.pathname)) return picture;
  const optimized = createOptimizedPicture(img.src, img.alt, true, [
    { media: '(min-width: 900px)', width: '2000' },
    { width: '900' },
  ]);
  picture.replaceWith(optimized);
  return optimized;
}

/**
 * Hero banner: a full-bleed image with a headline and CTA overlaid.
 * Authoring: row 1 = image, row 2 = heading / text / link. Image and text in
 * the same cell, or rows in any order, are tolerated.
 * Options: image-background (default behaviour), text-left (default alignment).
 * @param {Element} block
 */
export default function decorate(block) {
  const media = document.createElement('div');
  media.className = 'hero-banner-image';
  const content = document.createElement('div');
  content.className = 'hero-banner-content';

  const picture = block.querySelector('picture');
  if (picture) {
    // drop the wrapping paragraph if the picture was its only content
    const parent = picture.parentElement;
    media.append(picture);
    if (parent && parent.tagName === 'P' && !parent.textContent.trim() && !parent.children.length) {
      parent.remove();
    }
  }

  [...block.children].forEach((row) => {
    [...row.children].forEach((cell) => {
      while (cell.firstChild) content.append(cell.firstChild);
    });
  });

  // trim empty nodes left behind by authors
  [...content.children].forEach((el) => {
    if (!el.textContent.trim() && !el.querySelector('img, picture, a')) el.remove();
  });

  // a standalone link paragraph is a CTA
  content.querySelectorAll('p > a:only-child').forEach((a) => {
    const p = a.parentElement;
    if (p.textContent.trim() === a.textContent.trim()) {
      a.classList.add('button');
      p.classList.add('button-container');
      // "Learn more" -> "Learn more about <headline>" for screen readers
      const headline = content.querySelector('h1, h2, h3, h4, h5, h6')?.textContent.trim();
      if (headline && !a.textContent.toLowerCase().includes(headline.toLowerCase())) {
        const hidden = document.createElement('span');
        hidden.className = 'visually-hidden';
        hidden.textContent = ` about ${headline}`;
        a.append(hidden);
      }
    }
  });

  block.replaceChildren();
  if (media.children.length) {
    const pic = media.querySelector('picture');
    if (pic) optimize(pic);
    block.append(media);
  } else {
    block.classList.add('no-image');
  }
  if (content.children.length) block.append(content);
}
