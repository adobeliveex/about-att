/*
 * Offer Banner
 * Promotional banner modelled on att.com / business.att.com offer components.
 *
 * Text banner (no image): centred on a light AT&T blue panel (att.com offer strip).
 * Image banner (an image is authored): business.att.com hero offer - text left over
 * the photo on desktop, photo above the text on mobile.
 *
 * Authoring: rich text, in this order (one cell, or one row per part)
 *   - optional image row/cell: the background photo; a second image is used on mobile
 *   - optional eyebrow paragraph before the heading (e.g. "AT&T Business deals")
 *   - a heading (any level; <sup> for SM / TM marks)
 *   - the first paragraph after it: description
 *   - further text paragraphs: legal / offer terms (small print, may hold a link)
 *   - a paragraph that holds only a link: a call-to-action button (several allowed)
 */

const BUTTON_CLASSES = ['button', 'primary', 'secondary', 'accent'];

/** A paragraph whose only content is a single link (a CTA line). */
function isLinkOnly(p) {
  const links = p.querySelectorAll('a');
  return links.length === 1 && p.textContent.trim() === links[0].textContent.trim()
    && !p.querySelector('img, picture');
}

/** An element that only holds pictures (an authored image line). */
function isImageOnly(el) {
  return Boolean(el.querySelector('picture, img')) && !el.textContent.trim();
}

function buildMedia(pictures) {
  const media = document.createElement('div');
  media.className = 'offer-banner-media';
  const [desktop, mobile] = pictures;
  desktop.classList.add('offer-banner-image', mobile ? 'offer-banner-image-desktop' : 'offer-banner-image-all');
  media.append(desktop);
  if (mobile) {
    mobile.classList.add('offer-banner-image', 'offer-banner-image-mobile');
    media.append(mobile);
  }
  // the banner photo sits behind the text: decorative unless the author gave alt text
  media.querySelectorAll('img').forEach((img) => {
    img.loading = 'lazy';
    if (!img.getAttribute('alt')) img.setAttribute('alt', '');
  });
  return media;
}

export default function decorate(block) {
  const content = document.createElement('div');
  content.className = 'offer-banner-content';
  [...block.children].forEach((row) => {
    [...row.children].forEach((cell) => content.append(...cell.childNodes));
  });

  // images: any line that only holds pictures
  const pictures = [];
  [...content.children].forEach((el) => {
    if (el.tagName === 'PICTURE') {
      pictures.push(el);
    } else if (isImageOnly(el)) {
      pictures.push(...el.querySelectorAll('picture'));
      el.remove();
    }
  });

  const ctas = document.createElement('div');
  ctas.className = 'offer-banner-ctas';
  let headingSeen = false;
  let described = false;

  [...content.children].forEach((el) => {
    if (/^H[1-6]$/.test(el.tagName)) {
      el.classList.add('offer-banner-heading');
      headingSeen = true;
      return;
    }
    if (el.tagName !== 'P') return;
    if (isLinkOnly(el)) {
      const a = el.querySelector('a');
      // own button look: drop the site button decoration (decorateButtons)
      a.classList.remove(...BUTTON_CLASSES);
      a.classList.add('offer-banner-cta');
      ctas.append(a);
      el.remove();
      return;
    }
    if (!headingSeen) {
      el.classList.add('offer-banner-eyebrow');
    } else if (!described) {
      el.classList.add('offer-banner-description');
      described = true;
    } else {
      el.classList.add('offer-banner-legal');
    }
  });

  if (ctas.children.length) content.append(ctas);

  if (pictures.length) {
    block.classList.add('offer-banner-with-image');
    block.replaceChildren(buildMedia(pictures), content);
  } else {
    block.replaceChildren(content);
  }
}
