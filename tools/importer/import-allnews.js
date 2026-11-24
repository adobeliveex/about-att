/* eslint-disable */
/* global WebImporter */

/**
 * allnews template: the newsroom All News / search results page
 * (https://about.att.com/allnews.html). The whole search region becomes one
 * Article Search block; the global header and footer come from nav/footer
 * fragments, so everything else is dropped.
 */
import articleSearchParser from './parsers/article-search.js';

const PAGE_TEMPLATE = {
  name: 'allnews',
  urls: ['https://about.att.com/allnews.html'],
  representativeUrl: 'https://about.att.com/allnews.html',
  description: 'Newsroom All News search / listing page',
  blocks: [{ name: 'article-search', instances: ['main#page > .region'] }],
};

function findRegion(document) {
  const header = document.querySelector('.search-header');
  return (header && header.closest('.region'))
    || document.querySelector(PAGE_TEMPLATE.blocks[0].instances[0]);
}

export default {
  transform: (payload) => {
    const { document, url, params } = payload;
    const main = document.body;

    const title = (document.querySelector('meta[property="og:title"]')?.content
      || document.querySelector('.search-header h1')?.textContent
      || document.title || 'All News Features').replace(/\s+/g, ' ').trim();
    const description = (document.querySelector('meta[name="description"]')?.content
      || 'Check out the latest news from AT&T').trim();

    const region = findRegion(document);
    const content = document.createElement('div');
    if (region) {
      const holder = document.createElement('div');
      region.replaceWith(holder);
      holder.append(region);
      articleSearchParser(region, { document, url, params });
      content.append(...holder.childNodes);
    }
    main.replaceChildren(content);

    const meta = WebImporter.Blocks.getMetadataBlock(document, {
      Title: title,
      Description: description,
      Template: 'allnews',
    });
    main.append(document.createElement('hr'), meta);

    const rawPath = new URL(params.originalURL).pathname.replace(/\/$/, '').replace(/\.html?$/, '');
    const path = WebImporter.FileUtils.sanitizePath(rawPath === '' ? '/index' : rawPath);
    return [{
      element: main,
      path,
      report: { title, template: PAGE_TEMPLATE.name, blocks: region ? ['article-search'] : [] },
    }];
  },
};
