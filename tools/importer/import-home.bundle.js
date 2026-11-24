/* eslint-disable */
var CustomImportScript = (() => {
  var __defProp = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // tools/importer/import-home.js
  var import_home_exports = {};
  __export(import_home_exports, {
    default: () => import_home_default
  });

  // tools/importer/parsers/hero-banner.js
  function parse(element, { document }) {
    const cells = [];
    const img = element.querySelector(".banner__img img, .banner__img picture img");
    if (img) cells.push([img]);
    const content = [];
    const headlineSrc = element.querySelector(".banner__text h1, .banner__text h2, .banner__text .banner__level2, .banner__text .banner__level1");
    if (headlineSrc && headlineSrc.textContent.trim()) {
      const h1 = document.createElement("h1");
      h1.textContent = headlineSrc.textContent.replace(/\s+/g, " ").trim();
      content.push(h1);
    }
    element.querySelectorAll(".banner__text > p, .banner__text .banner__level3, .banner__text .banner__subtitle").forEach((el) => {
      if (el !== headlineSrc && el.textContent.trim()) {
        const p = document.createElement("p");
        p.textContent = el.textContent.replace(/\s+/g, " ").trim();
        content.push(p);
      }
    });
    const cta = element.querySelector(".banner__cta a[href]");
    if (cta) {
      const a = document.createElement("a");
      a.href = cta.getAttribute("href");
      a.textContent = cta.textContent.trim();
      const p = document.createElement("p");
      p.append(a);
      content.push(p);
    }
    if (content.length) cells.push([content]);
    const block = WebImporter.Blocks.createBlock(document, { name: "hero-banner", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/columns-stock-ticker.js
  function parse2(element, { document }) {
    const clean = (el) => el ? el.textContent.replace(/ /g, " ").replace(/\s+/g, " ").trim() : "";
    const para = (text) => {
      const p = document.createElement("p");
      p.textContent = text;
      return p;
    };
    let price = "";
    const symbolEl = element.querySelector(".stock-ticker__price .price__symbol");
    if (symbolEl) {
      const clone = symbolEl.cloneNode(true);
      clone.querySelectorAll(".hidden-spoken").forEach((h) => h.remove());
      price = clean(clone);
    }
    const priceValue = clean(element.querySelector(".stock-ticker__price .price__value"));
    price = [price, priceValue].filter(Boolean).join(" ");
    const change = [
      clean(element.querySelector(".stock-ticker__change .change__symbol")),
      clean(element.querySelector(".stock-ticker__change .change__value"))
    ].filter(Boolean).join(" ");
    const timestamp = [
      clean(element.querySelector(".stock-ticker__timestamp .exchange__date")),
      clean(element.querySelector(".stock-ticker__timestamp .exchange__time"))
    ].filter(Boolean).join(" ");
    const linkCell = [];
    const srcLink = element.querySelector(".stock-ticker__info a[href]");
    if (srcLink) {
      const a = document.createElement("a");
      a.href = srcLink.getAttribute("href");
      a.textContent = clean(srcLink);
      const p = document.createElement("p");
      p.append(a);
      linkCell.push(p);
    }
    const cells = [[
      price ? para(price) : "",
      change ? para(change) : "",
      timestamp ? para(timestamp) : "",
      linkCell.length ? linkCell : ""
    ]];
    const block = WebImporter.Blocks.createBlock(document, { name: "columns-stock-ticker", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/search-newsroom.js
  function parse3(element, { document }) {
    const SOURCE_URL = "https://about.att.com/allnews.html";
    const PLACEHOLDER = "What can we help you find?";
    const input = element.querySelector("input#searchfield, input.wgt-search-feild");
    const placeholderText = input && input.getAttribute("placeholder") || PLACEHOLDER;
    const linkP = document.createElement("p");
    const a = document.createElement("a");
    a.href = SOURCE_URL;
    a.textContent = SOURCE_URL;
    linkP.append(a);
    const placeholderP = document.createElement("p");
    placeholderP.textContent = placeholderText;
    const cells = [[[linkP, placeholderP]]];
    const block = WebImporter.Blocks.createBlock(document, { name: "search-newsroom", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-news.js
  var PLACEHOLDER_ALTS = ["get faster streaming"];
  function parse4(element, { document }) {
    const cells = [];
    const clean = (el) => el ? el.textContent.replace(/\s+/g, " ").trim() : "";
    element.querySelectorAll(".featured-item").forEach((item) => {
      const imageCell = [];
      const img = item.querySelector(".item__img img, .item__media img");
      if (img) {
        const alt = (img.getAttribute("alt") || "").trim();
        if (!alt || PLACEHOLDER_ALTS.includes(alt.toLowerCase())) {
          const title = clean(item.querySelector(".item__title"));
          if (title) img.setAttribute("alt", title);
        }
        const imgLink = img.closest("a[href]");
        if (imgLink) {
          const a = document.createElement("a");
          a.href = imgLink.getAttribute("href");
          a.append(img);
          imageCell.push(a);
        } else {
          imageCell.push(img);
        }
      }
      const contentCell = [];
      const titleSrc = item.querySelector(".item__title");
      if (titleSrc && clean(titleSrc)) {
        const h3 = document.createElement("h3");
        h3.textContent = clean(titleSrc);
        contentCell.push(h3);
      }
      const desc = item.querySelector(".item__description");
      if (desc) {
        const ps = desc.querySelectorAll("p");
        if (ps.length) {
          ps.forEach((p) => {
            if (clean(p)) contentCell.push(p);
          });
        } else if (clean(desc)) {
          const p = document.createElement("p");
          p.textContent = clean(desc);
          contentCell.push(p);
        }
      }
      const ctaSrc = item.querySelector(".item__cta a[href]");
      if (ctaSrc) {
        const a = document.createElement("a");
        a.href = ctaSrc.getAttribute("href");
        a.textContent = clean(ctaSrc) || "Learn more";
        const p = document.createElement("p");
        p.append(a);
        contentCell.push(p);
      }
      if (!imageCell.length && !contentCell.length) return;
      cells.push([imageCell.length ? imageCell : "", contentCell.length ? contentCell : ""]);
    });
    if (!cells.length) return;
    const block = WebImporter.Blocks.createBlock(document, { name: "cards-news", cells });
    element.replaceWith(block);
  }

  // tools/importer/transformers/about-att-cleanup.js
  function removeAll(root, selectors) {
    selectors.forEach((sel) => {
      root.querySelectorAll(sel).forEach((el) => el.remove());
    });
  }
  function isStory(element, payload) {
    const name = payload && payload.template && payload.template.name;
    if (name) return name === "story";
    return Boolean(element.querySelector("main > .story__wrap"));
  }
  function normalizeStoryTitle(element, document) {
    element.querySelectorAll(".article__header .story--title").forEach((title) => {
      const source = title.querySelector("h1") || title.querySelector("p");
      if (!source) return;
      const text = source.textContent.replace(/\s+/g, " ").trim();
      if (!text) return;
      const h1 = document.createElement("h1");
      h1.textContent = text;
      source.replaceWith(h1);
    });
  }
  function unwrapBoldInHeadings(element) {
    element.querySelectorAll("h1 b, h1 strong, h2 b, h2 strong, h3 b, h3 strong, h4 b, h4 strong, h5 b, h5 strong, h6 b, h6 strong").forEach((b) => b.replaceWith(...b.childNodes));
  }
  function pageMeta(document, name) {
    const el = [...document.querySelectorAll(`meta[name="${name}"], meta[property="${name}"]`)].find((m) => (m.getAttribute("content") || "").trim());
    return el ? el.getAttribute("content").replace(/\s+/g, " ").trim() : "";
  }
  function toIsoDate(value) {
    if (!value) return "";
    const m = value.match(/^(\d{4}-\d{2}-\d{2})/);
    if (m) return m[1];
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }
  function textOf(document, selector) {
    const el = document.querySelector(selector);
    return el ? el.textContent.replace(/\s+/g, " ").trim() : "";
  }
  function getStoryMetadata(document) {
    const meta = {};
    const title = textOf(document, "title") || pageMeta(document, "og:title");
    if (title) meta.Title = title;
    const description = pageMeta(document, "description") || pageMeta(document, "og:description") || textOf(document, ".story--description");
    if (description) meta.Description = description;
    const image = pageMeta(document, "og:image") || pageMeta(document, "x:image");
    if (image) {
      const img = document.createElement("img");
      img.src = image;
      const alt = pageMeta(document, "og:image:alt");
      if (alt) img.alt = alt;
      meta.Image = img;
    }
    let published = toIsoDate(pageMeta(document, "SBC-SEARCH-PUBLISHDATE"));
    if (!published) {
      document.querySelectorAll('script[type="application/ld+json"]').forEach((s) => {
        if (published) return;
        try {
          published = toIsoDate(JSON.parse(s.textContent).datePublished);
        } catch (e) {
        }
      });
    }
    if (!published) {
      const m = textOf(document, ".story--pub-date").match(/([A-Z][a-z]+ \d{1,2}, \d{4})/);
      if (m) published = toIsoDate(m[1]);
    }
    if (published) meta["Publication Date"] = published;
    const tags = pageMeta(document, "SBC-SEARCH-TAGS_LIST").split("~").map((t) => t.trim()).filter(Boolean);
    if (tags.length) meta.Tags = tags.join(", ");
    const keywords = pageMeta(document, "keywords");
    if (keywords) meta.Keywords = keywords;
    meta.Template = "story";
    return meta;
  }
  function installStoryMetadata(document) {
    const rules = typeof WebImporter !== "undefined" && WebImporter.rules;
    if (!rules || typeof rules.createMetadata !== "function") return;
    const original = rules.createMetadata.excatOriginal || rules.createMetadata;
    const wrapped = function createStoryMetadata(main, doc) {
      rules.createMetadata = original;
      if (doc !== document) return original(main, doc);
      const meta = __spreadValues({}, getStoryMetadata(doc));
      Object.entries(WebImporter.Blocks.getMetadata(doc)).forEach(([key, value]) => {
        if (!(key in meta)) meta[key] = value;
      });
      if (Object.keys(meta).length > 0) {
        main.append(WebImporter.Blocks.getMetadataBlock(doc, meta));
      }
      return meta;
    };
    wrapped.excatOriginal = original;
    try {
      rules.createMetadata = wrapped;
    } catch (e) {
    }
  }
  function transform(hookName, element, payload) {
    const story = isStory(element, payload);
    const document = element.ownerDocument || payload && payload.document;
    if (hookName === "beforeTransform" && story) {
      removeAll(element, [".story__preface", ".story__footer"]);
      normalizeStoryTitle(element, document);
      element.querySelectorAll(".article__content div:not([class])").forEach((div) => {
        if (!div.children.length && !div.textContent.replace(/\u00a0/g, " ").trim()) div.remove();
      });
    }
    if (hookName === "beforeTransform") {
      removeAll(element, [
        "script",
        "style",
        "noscript",
        "link",
        "iframe",
        // Hidden CMS inputs (e.g. inside the hero banner)
        "input.contentFriendlyName",
        // AEM "HTML Editor Component" authoring labels
        ".html-editor > h4.editor",
        // "View More" load-more control (behavior, not content)
        ".stories__cta"
      ]);
      element.querySelectorAll("div.text.section").forEach((el) => {
        if (!el.textContent.trim() && !el.querySelector("img, picture, video, iframe")) {
          el.remove();
        }
      });
      element.querySelectorAll(".openhtml.section").forEach((el) => {
        const wrap = el.querySelector(".editor__wrap");
        if (wrap && wrap.children.length === 1 && wrap.querySelector(":scope > h3.editor, :scope > h3.editor-title")) {
          el.remove();
        }
      });
    }
    if (hookName === "afterTransform") {
      removeAll(element, [
        // Global header / microsite header / nav
        "#att-about-header",
        "#att-microsite-header",
        "header",
        "nav",
        // Skip navigation
        ".skip-navigation",
        // Footer
        "#att-about-footer",
        "footer",
        // Cookie / privacy consent and security overlays
        "#gpc-banner-container",
        "#sec-overlay",
        // Feedback widget
        "#kampyleButtonContainer",
        // Tracking pixels
        '[id^="batBeacon"]',
        'img[src*="bat.bing.com"]',
        "iframe",
        "link",
        "noscript",
        // Any remaining load-more control
        ".stories__cta",
        "input.contentFriendlyName"
      ]);
      element.querySelectorAll("a.cta--button").forEach((a) => {
        if (a.closest("strong, b, table")) return;
        const strong = element.ownerDocument.createElement("strong");
        a.replaceWith(strong);
        strong.append(a);
        a.removeAttribute("class");
      });
      element.querySelectorAll("*").forEach((el) => {
        ["onclick", "data-track", "data-analytics", "data-di-res-id", "data-di-rand"].forEach((attr) => {
          if (el.hasAttribute(attr)) el.removeAttribute(attr);
        });
      });
    }
    if (hookName === "afterTransform" && story) {
      unwrapBoldInHeadings(element);
      element.querySelectorAll('b[aria-hidden="true"][tabindex="-1"]').forEach((b) => {
        if (!b.textContent.trim() && !b.children.length) b.remove();
      });
      element.querySelectorAll("[data-di-id]").forEach((el) => el.removeAttribute("data-di-id"));
      if (document && element === document.body) installStoryMetadata(document);
    }
  }

  // tools/importer/transformers/about-att-sections.js
  var MARKER = "data-excat-section-id";
  function findSectionEl(root, section) {
    const selectors = Array.isArray(section.selector) ? section.selector : [section.selector];
    for (const sel of selectors) {
      if (!sel) continue;
      try {
        const el = root.querySelector(sel);
        if (el) return el;
      } catch (e) {
      }
    }
    return null;
  }
  function transform2(hookName, element, payload) {
    const sections = payload && payload.template && payload.template.sections || [];
    if (sections.length < 2) return;
    const document = element.ownerDocument || payload.document;
    if (hookName === "beforeTransform") {
      for (let i = sections.length - 1; i >= 0; i -= 1) {
        const section = sections[i];
        const el = findSectionEl(element, section);
        if (!el || !el.parentNode) continue;
        if (i === 0 && !section.style) continue;
        const hr = document.createElement("hr");
        if (section.style) hr.setAttribute(MARKER, section.id);
        el.parentNode.insertBefore(hr, el);
      }
    }
    if (hookName === "afterTransform") {
      for (let i = sections.length - 1; i >= 0; i -= 1) {
        const section = sections[i];
        const marker = element.querySelector(`hr[${MARKER}="${section.id}"]`);
        if (section.style) {
          const metadata = WebImporter.Blocks.createBlock(document, {
            name: "Section Metadata",
            cells: { style: section.style }
          });
          const sectionEl = findSectionEl(element, section);
          if (sectionEl && sectionEl.parentNode) {
            sectionEl.after(metadata);
          } else if (marker) {
            marker.after(metadata);
          } else {
            element.append(metadata);
          }
        }
        if (marker) {
          if (i === 0) marker.remove();
          else marker.removeAttribute(MARKER);
        }
      }
    }
  }

  // tools/importer/import-home.js
  var PAGE_TEMPLATE = {
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
  var parsers = {
    "hero-banner": parse,
    "columns-stock-ticker": parse2,
    "search-newsroom": parse3,
    "cards-news": parse4
  };
  var sectionTransformers = [transform2];
  var fragmentTransformers = [];
  var lateTransformers = [...sectionTransformers, ...fragmentTransformers];
  var transformers = [transform, ...lateTransformers];
  var earlyTransformers = transformers.filter((fn) => !lateTransformers.includes(fn));
  var CATALOG = Boolean(PAGE_TEMPLATE.pageCleanup || PAGE_TEMPLATE.blocks.some((b) => b.pageInstances));
  function executeTransformers(hookName, element, payload, list = transformers) {
    var _a, _b;
    const enhancedPayload = __spreadProps(__spreadValues({}, payload), { template: ((_b = (_a = payload.params) == null ? void 0 : _a.targets) == null ? void 0 : _b.template) || PAGE_TEMPLATE });
    list.forEach((fn) => {
      try {
        fn(hookName, element, enhancedPayload);
      } catch (e) {
        console.error(`Transformer failed at ${hookName}:`, e);
      }
    });
  }
  function findBlocksOnPage(document, template, url) {
    const pageBlocks = [];
    const pageKey = (u) => {
      try {
        const { origin, pathname } = new URL(u);
        return `${origin}${pathname.replace(/\/$/, "")}`;
      } catch (e) {
        return u;
      }
    };
    const key = pageKey(url);
    const claim = (blockDef, selector) => {
      let matches = [];
      try {
        matches = document.querySelectorAll(selector);
      } catch (e) {
        return;
      }
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
  function markPageTargets(payload) {
    const { document, params } = payload;
    executeTransformers("beforeTransform", document.body, payload, earlyTransformers);
    const blocks = findBlocksOnPage(document, PAGE_TEMPLATE, params.originalURL).map(({ name, selector, element }, i) => {
      element.setAttribute("data-excat-block", String(i));
      return { name, selector };
    });
    const sections = (PAGE_TEMPLATE.sections || []).map((section, i) => {
      const target = (section.selector || []).map((s) => {
        try {
          return document.querySelector(s);
        } catch (e) {
          return null;
        }
      }).find(Boolean);
      if (!target) return section;
      target.setAttribute("data-excat-section", String(i));
      return __spreadProps(__spreadValues({}, section), { selector: [`[data-excat-section="${i}"]`] });
    });
    params.targets = { blocks, template: __spreadProps(__spreadValues({}, PAGE_TEMPLATE), { sections }) };
  }
  var import_home_default = {
    preprocess: (payload) => {
      if (CATALOG) markPageTargets(payload);
    },
    transform: (payload) => {
      const { document, url, params } = payload;
      const main = document.body;
      params.fragments = [];
      if (!params.targets) markPageTargets(payload);
      const pageBlocks = params.targets.blocks.map((block, i) => __spreadProps(__spreadValues({}, block), { element: document.querySelector(`[data-excat-block="${i}"]`) })).filter((block) => block.element);
      executeTransformers("beforeTransform", main, __spreadProps(__spreadValues({}, payload), { pageBlocks }), lateTransformers);
      pageBlocks.forEach((block) => {
        if (!main.contains(block.element)) return;
        const parser = parsers[block.name];
        if (!parser) return;
        try {
          parser(block.element, { document, url, params });
        } catch (e) {
          console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
        }
      });
      executeTransformers("afterTransform", main, payload);
      main.appendChild(document.createElement("hr"));
      WebImporter.rules.createMetadata(main, document);
      WebImporter.rules.transformBackgroundImages(main, document);
      WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
      params.fragments.forEach(({ element }) => {
        executeTransformers("afterTransform", element, payload, earlyTransformers);
        WebImporter.rules.transformBackgroundImages(element, document);
        WebImporter.rules.adjustImageUrls(element, url, params.originalURL);
      });
      const rawPath = new URL(params.originalURL).pathname.replace(/\/$/, "").replace(/\.html?$/, "");
      const path = WebImporter.FileUtils.sanitizePath(rawPath === "" ? "/index" : rawPath);
      return [{
        element: main,
        path,
        report: { title: document.title, template: PAGE_TEMPLATE.name, blocks: pageBlocks.map((b) => b.name) }
      }, ...params.fragments];
    }
  };
  return __toCommonJS(import_home_exports);
})();
