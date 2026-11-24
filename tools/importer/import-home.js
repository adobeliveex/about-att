/* eslint-disable */
/* global WebImporter */

import heroBannerParser from './parsers/hero-banner.js';
import columnsStockTickerParser from './parsers/columns-stock-ticker.js';
import searchNewsroomParser from './parsers/search-newsroom.js';
import cardsNewsParser from './parsers/cards-news.js';
import cleanupTransformer from './transformers/about-att-cleanup.js';
import sectionsTransformer from './transformers/about-att-sections.js';

const PAGE_TEMPLATE = {
  "name": "home",
  "urls": [
    "https://about.att.com/"
  ],
  "representativeUrl": "https://about.att.com/",
  "description": "AT&T newsroom home page: earnings hero banner, stock ticker, subscribe and newsroom search bar, latest news story cards",
  "urlPattern": "/",
  "blocks": [
    {
      "name": "hero-banner",
      "instances": [
        ".snr-banner .banner",
        "#page > div.SNR_section.section:nth-of-type(1) .banner"
      ]
    },
    {
      "name": "columns-stock-ticker",
      "instances": [
        ".SNR_Stock_Ticker .stock-ticker",
        ".stock-ticker"
      ]
    },
    {
      "name": "search-newsroom",
      "instances": [
        ".search-widget--shortened",
        "#newsroom-search-widget"
      ]
    },
    {
      "name": "cards-news",
      "instances": [
        ".featurestorymultifield .featured-stories",
        ".featured-stories"
      ]
    }
  ],
  "sections": [
    {
      "id": "section-1",
      "name": "Hero banner",
      "selector": [
        ".region.banner-button",
        "#page > div.SNR_section.section:nth-of-type(1)"
      ],
      "style": null,
      "blocks": [
        "hero-banner"
      ],
      "defaultContent": []
    },
    {
      "id": "section-2",
      "name": "Stock ticker",
      "selector": [
        ".region--gray",
        "#page > div.SNR_section.section:nth-of-type(2)"
      ],
      "style": "light-grey-gradient",
      "blocks": [
        "columns-stock-ticker"
      ],
      "defaultContent": []
    },
    {
      "id": "section-3",
      "name": "Subscribe and search bar",
      "selector": [
        ".custom-featured-items .region__wrap > div.SNR_column.section"
      ],
      "style": "split",
      "blocks": [
        "search-newsroom"
      ],
      "defaultContent": [
        ".custom-featured-items .SNR_column .col-6:first-child .cta--button"
      ]
    },
    {
      "id": "section-4",
      "name": "Latest news",
      "selector": [
        ".custom-featured-items .region__wrap > div.text.section:has(h2)",
        ".custom-featured-items .region__wrap > div.text.section:nth-of-type(5)"
      ],
      "style": null,
      "blocks": [
        "cards-news"
      ],
      "defaultContent": [
        ".custom-featured-items .text__wrap h2",
        ".custom-featured-items .featureditem .featured-item--alternate .cta--button"
      ]
    }
  ]
};

const parsers = {
  'hero-banner': heroBannerParser,
  'columns-stock-ticker': columnsStockTickerParser,
  'search-newsroom': searchNewsroomParser,
  'cards-news': cardsNewsParser,
};
// Late transformers change the DOM (section <hr> markers, shared fragments), so their beforeTransform
// runs after block discovery.
const sectionTransformers = [sectionsTransformer];
const fragmentTransformers = [];
const lateTransformers = [...sectionTransformers, ...fragmentTransformers];
const transformers = [cleanupTransformer, ...lateTransformers];
const earlyTransformers = transformers.filter((fn) => !lateTransformers.includes(fn));
// Catalog selectors (pageInstances, pageCleanup) count the <script> and <hr> elements the importer
// removes before transform, so a catalog template finds its targets in preprocess.
const CATALOG = Boolean(PAGE_TEMPLATE.pageCleanup || PAGE_TEMPLATE.blocks.some((b) => b.pageInstances));

function executeTransformers(hookName, element, payload, list = transformers) {
  const enhancedPayload = { ...payload, template: payload.params?.targets?.template || PAGE_TEMPLATE };
  list.forEach((fn) => {
    try { fn(hookName, element, enhancedPayload); }
    catch (e) { console.error(`Transformer failed at ${hookName}:`, e); }
  });
}

function findBlocksOnPage(document, template, url) {
  const pageBlocks = [];
  const pageKey = (u) => {
    try { const { origin, pathname } = new URL(u); return `${origin}${pathname.replace(/\/$/, '')}`; }
    catch { return u; }
  };
  const key = pageKey(url);
  const claim = (blockDef, selector) => {
    let matches = [];
    try { matches = document.querySelectorAll(selector); } catch { return; }
    matches.forEach((element) => {
      if (pageBlocks.some((b) => b.element === element || b.element.contains(element) || element.contains(b.element))) return;
      pageBlocks.push({ name: blockDef.name, selector, element });
    });
  };
  template.blocks.forEach((blockDef) => {
    const entry = Object.entries(blockDef.pageInstances || {}).find(([u]) => pageKey(u) === key);
    (entry ? entry[1] : []).forEach((selector) => claim(blockDef, selector));
  });
  template.blocks.forEach((blockDef) => (blockDef.instances || []).forEach((selector) => claim(blockDef, selector)));
  return pageBlocks;
}

// Runs the early transformers, then marks each block and section target with an attribute: the
// importer re-creates the body before transform, so only attributes survive, not element references.
function markPageTargets(payload) {
  const { document, params } = payload;
  executeTransformers('beforeTransform', document.body, payload, earlyTransformers);
  const blocks = findBlocksOnPage(document, PAGE_TEMPLATE, params.originalURL).map(({ name, selector, element }, i) => {
    element.setAttribute('data-excat-block', String(i));
    return { name, selector };
  });
  const sections = (PAGE_TEMPLATE.sections || []).map((section, i) => {
    const target = (section.selector || []).map((s) => { try { return document.querySelector(s); } catch { return null; } }).find(Boolean);
    if (!target) return section;
    target.setAttribute('data-excat-section', String(i));
    return { ...section, selector: [`[data-excat-section="${i}"]`] };
  });
  params.targets = { blocks, template: { ...PAGE_TEMPLATE, sections } };
}

export default {
  preprocess: (payload) => {
    if (CATALOG) markPageTargets(payload);
  },
  transform: (payload) => {
    const { document, url, params } = payload;
    const main = document.body;
    params.fragments = [];

    if (!params.targets) markPageTargets(payload);
    const pageBlocks = params.targets.blocks
      .map((block, i) => ({ ...block, element: document.querySelector(`[data-excat-block="${i}"]`) }))
      .filter((block) => block.element);
    executeTransformers('beforeTransform', main, { ...payload, pageBlocks }, lateTransformers);

    pageBlocks.forEach((block) => {
      if (!main.contains(block.element)) return;
      const parser = parsers[block.name];
      if (!parser) return;
      try { parser(block.element, { document, url, params }); }
      catch (e) { console.error(`Failed to parse ${block.name} (${block.selector}):`, e); }
    });

    executeTransformers('afterTransform', main, payload);

    main.appendChild(document.createElement('hr'));
    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    // A fragment's nodes left `main` before afterTransform: finalize it the same way, without the
    // page-only section breaks and metadata.
    params.fragments.forEach(({ element }) => {
      executeTransformers('afterTransform', element, payload, earlyTransformers);
      WebImporter.rules.transformBackgroundImages(element, document);
      WebImporter.rules.adjustImageUrls(element, url, params.originalURL);
    });

    const rawPath = new URL(params.originalURL).pathname
      .replace(/\/$/, '')
      .replace(/\.html?$/, '');
    const path = WebImporter.FileUtils.sanitizePath(rawPath === '' ? '/index' : rawPath);

    return [{
      element: main,
      path,
      report: { title: document.title, template: PAGE_TEMPLATE.name, blocks: pageBlocks.map((b) => b.name) },
    }, ...params.fragments];
  },
};
