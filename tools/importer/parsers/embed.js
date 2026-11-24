/* eslint-disable */
/* global WebImporter */

/**
 * Parser for embed (video).
 * Source: about.att.com story video component
 *   .media[data-type="video"] > figure.media__video > .frame > .embed--youtube > iframe
 * Target: Embed block (AEM Block Collection): block-name row, then ONE row with
 * ONE cell holding the video URL (and, if the source has a poster image, that
 * image above the link in the same cell).
 * YouTube embed URLs (/embed/{id}) are authored as the watch URL, which the
 * block turns back into a lazy-loaded player.
 */
function videoLink(src) {
  if (!src) return '';
  let url;
  try { url = new URL(src, 'https://about.att.com'); } catch (e) { return ''; }
  const host = url.hostname.replace(/^www\./, '');
  if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    const m = url.pathname.match(/\/embed\/([\w-]+)/);
    if (m) return `https://www.youtube.com/watch?v=${m[1]}`;
  }
  if (host === 'player.vimeo.com') {
    const m = url.pathname.match(/\/video\/(\d+)/);
    if (m) return `https://vimeo.com/${m[1]}`;
  }
  return url.href;
}

export default function parse(element, { document }) {
  const iframe = element.querySelector('iframe[src]');
  const href = videoLink(iframe && iframe.getAttribute('src'));
  if (!href) {
    element.remove();
    return;
  }
  const a = document.createElement('a');
  a.href = href;
  a.textContent = href;

  // Single cell: optional poster image first, then the link.
  const cell = [];
  const poster = element.querySelector('img');
  if (poster) cell.push(poster);
  cell.push(a);

  const cells = [[cell]];
  const block = WebImporter.Blocks.createBlock(document, { name: 'embed', cells });
  element.replaceWith(block);
}
