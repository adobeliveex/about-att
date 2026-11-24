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

  // tools/importer/import-story.js
  var import_story_exports = {};
  __export(import_story_exports, {
    default: () => import_story_default
  });

  // tools/importer/parsers/columns-share-bar.js
  var NETWORKS = [
    { name: "X", icon: "twitter", host: /(^|\.)(x|twitter)\.com$/ },
    { name: "Facebook", icon: "facebook", host: /(^|\.)facebook\.com$/ },
    { name: "LinkedIn", icon: "linkedin", host: /(^|\.)linkedin\.com$/ },
    { name: "Email", icon: "email", mailto: true }
  ];
  function networkFor(li) {
    const a = li.querySelector("a[href]");
    const href = a ? a.getAttribute("href") : "";
    if (href) {
      if (/^mailto:/i.test(href)) return { net: NETWORKS[3], href };
      try {
        const host = new URL(href, "https://about.att.com").hostname;
        const net = NETWORKS.find((n) => n.host && n.host.test(host));
        if (net) return { net, href };
      } catch (e) {
      }
    }
    const icon = li.querySelector('i[class*="icon--"]');
    if (icon) {
      const net = NETWORKS.find((n) => icon.className.includes(n.icon));
      if (net) return { net, href };
    }
    return null;
  }
  function storyUrl(element, document) {
    const candidates = [];
    element.querySelectorAll(".share a[href]").forEach((a) => {
      const m = a.getAttribute("href").match(/[?&](?:u|url)=([^&]+)/);
      if (m) {
        try {
          candidates.push(decodeURIComponent(m[1]));
        } catch (e) {
        }
      }
      const body = a.getAttribute("href").match(/https?%3A%2F%2F[^&]+/i);
      if (body) {
        try {
          candidates.push(decodeURIComponent(body[0]));
        } catch (e) {
        }
      }
    });
    const og = document.querySelector('meta[property="og:url"], meta[name="og:url"]');
    if (og) candidates.push(og.getAttribute("content") || "");
    const canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) candidates.push(canonical.getAttribute("href") || "");
    try {
      if (document.location && document.location.href) candidates.push(document.location.href);
    } catch (e) {
    }
    return candidates.find((u) => /\/story\/\d{4}\/[^/?#]+\.html/.test(u || "")) || "";
  }
  function releasePdfUrl(element, document) {
    const m = storyUrl(element, document).match(/\/story\/(\d{4})\/([^/?#]+)\.html/);
    if (!m) return "";
    return `https://about.att.com/ecms/dam/snrdocs/pdf/${m[1]}/${m[2]}.pdf?action=download`;
  }
  function parse(element, { document }) {
    const clean = (el) => el ? el.textContent.replace(/\s+/g, " ").trim() : "";
    const shareCell = [];
    const share = element.querySelector(".share");
    if (share) {
      const label = document.createElement("p");
      label.textContent = clean(share.querySelector("h4, h3, h2")) || "Share";
      shareCell.push(label);
      const ul = document.createElement("ul");
      const items = [...share.querySelectorAll("li")];
      items.forEach((li, i) => {
        const found = networkFor(li) || (items.length === NETWORKS.length ? { net: NETWORKS[i], href: "" } : null);
        if (!found) return;
        const item = document.createElement("li");
        if (found.href) {
          const a = document.createElement("a");
          a.href = found.href;
          a.textContent = found.net.name;
          item.append(a);
        } else {
          item.textContent = found.net.name;
        }
        ul.append(item);
      });
      if (ul.children.length) shareCell.push(ul);
    }
    const downloadCell = [];
    const select = element.querySelector(".story__assets select, select.story_assets");
    if (select) {
      const options = [...select.querySelectorAll("option")];
      const label = document.createElement("p");
      label.textContent = clean(options[0]) || "Download assets";
      downloadCell.push(label);
      const pdf = releasePdfUrl(element, document);
      const ul = document.createElement("ul");
      options.slice(1).forEach((opt) => {
        const text = clean(opt);
        if (!text) return;
        const value = (opt.getAttribute("value") || "").trim();
        const href = /^(https?:)?\/\//.test(value) || value.startsWith("/") ? value : /pdf/i.test(text) ? pdf : "";
        const li = document.createElement("li");
        if (href) {
          const a = document.createElement("a");
          a.href = href;
          a.textContent = text;
          li.append(a);
        } else {
          li.textContent = text;
        }
        ul.append(li);
      });
      if (ul.children.length) downloadCell.push(ul);
    }
    const ctaCell = [];
    const cta = element.querySelector(".featured-item .item__cta a[href], .featureditem a.cta--button[href]");
    if (cta) {
      const a = document.createElement("a");
      a.href = cta.getAttribute("href");
      a.textContent = clean(cta);
      const p = document.createElement("p");
      p.append(a);
      ctaCell.push(p);
    }
    const cells = [[
      shareCell.length ? shareCell : "",
      downloadCell.length ? downloadCell : "",
      ctaCell.length ? ctaCell : ""
    ]];
    const block = WebImporter.Blocks.createBlock(document, {
      name: "columns-share-bar (three-cells, share-icons, dropdown)",
      cells
    });
    element.replaceWith(block);
  }

  // tools/importer/parsers/accordion-faq.js
  function parse2(element, { document }) {
    const cells = [];
    const clean = (el) => el ? el.textContent.replace(/\s+/g, " ").trim() : "";
    element.querySelectorAll(".item__label").forEach((label) => {
      const question = clean(label);
      if (!question) return;
      let wrap = label.nextElementSibling;
      if (!wrap || !wrap.classList.contains("item__wrap")) {
        wrap = label.parentElement && label.parentElement.querySelector(":scope > .item__wrap");
      }
      const answer = [];
      if (wrap) {
        const content = wrap.querySelector(".text__wrap") || wrap.querySelector(".item__content") || wrap;
        [...content.children].forEach((child) => {
          if (child.matches(".item__close") || child.querySelector(".item__label")) return;
          if (!clean(child) && !child.querySelector("img, picture, video")) return;
          answer.push(child);
        });
      }
      cells.push([question, answer.length ? answer : ""]);
    });
    const block = WebImporter.Blocks.createBlock(document, {
      name: "accordion-faq (chevron, divider-rows)",
      cells
    });
    element.replaceWith(block);
  }

  // tools/importer/parsers/accordion-expand-text.js
  function parse3(element, { document }) {
    const cells = [];
    const clean = (el) => el ? el.textContent.replace(/[\s ]+/g, " ").trim() : "";
    const toggle = element.querySelector(":scope > .text__cta") || element.querySelector(".text__cta");
    const label = clean(toggle) || "View more";
    const wrap = element.querySelector(":scope > .text__wrap") || element.querySelector(".text__wrap");
    const content = [];
    if (wrap) {
      [...wrap.children].forEach((child) => {
        if (child.matches(".text__cta")) return;
        if (!clean(child) && !child.querySelector("img, picture, video")) return;
        content.push(child);
      });
    }
    cells.push([label, content.length ? content : ""]);
    const block = WebImporter.Blocks.createBlock(document, {
      name: "accordion-expand-text (text-link-toggle, small-print)",
      cells
    });
    element.replaceWith(block);
  }

  // tools/importer/parsers/related-stories.js
  function parse4(element, { document }) {
    const count = element.querySelectorAll(".col-4").length || element.querySelectorAll(".featured-item").length;
    const limit = Math.max(3, count);
    const cells = [["limit", String(limit)]];
    const block = WebImporter.Blocks.createBlock(document, { name: "related-stories", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/embed.js
  function videoLink(src) {
    if (!src) return "";
    let url;
    try {
      url = new URL(src, "https://about.att.com");
    } catch (e) {
      return "";
    }
    const host = url.hostname.replace(/^www\./, "");
    if (host === "youtube.com" || host === "youtube-nocookie.com") {
      const m = url.pathname.match(/\/embed\/([\w-]+)/);
      if (m) return `https://www.youtube.com/watch?v=${m[1]}`;
    }
    if (host === "player.vimeo.com") {
      const m = url.pathname.match(/\/video\/(\d+)/);
      if (m) return `https://vimeo.com/${m[1]}`;
    }
    return url.href;
  }
  function parse5(element, { document }) {
    const iframe = element.querySelector("iframe[src]");
    const href = videoLink(iframe && iframe.getAttribute("src"));
    if (!href) {
      element.remove();
      return;
    }
    const a = document.createElement("a");
    a.href = href;
    a.textContent = href;
    const cell = [];
    const poster = element.querySelector("img");
    if (poster) cell.push(poster);
    cell.push(a);
    const cells = [[cell]];
    const block = WebImporter.Blocks.createBlock(document, { name: "embed", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/small-print.js
  function parse6(element, { document }) {
    const wrap = element.querySelector(".text__wrap") || element;
    const nodes = [...wrap.childNodes].filter((n) => n.nodeType === 1 || n.nodeType === 3 && n.textContent.trim());
    while (nodes.length && nodes[0].nodeType === 1 && !nodes[0].textContent.replace(/ /g, " ").trim() && !nodes[0].querySelector("img, a")) {
      nodes.shift();
    }
    if (!nodes.length) {
      element.remove();
      return;
    }
    const cells = [[nodes]];
    const block = WebImporter.Blocks.createBlock(document, { name: "small-print", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/quotes-text.js
  var QUOTE_MARK = /quotation/i;
  function parse7(element, { document }) {
    const mark = [...element.querySelectorAll("img")].find((img) => QUOTE_MARK.test(img.getAttribute("src") || "") || QUOTE_MARK.test(img.getAttribute("alt") || ""));
    if (!mark) return;
    const textCol = element.querySelector(".col-9") || element;
    let nodes = [...textCol.querySelectorAll(".text__wrap > *")];
    if (!nodes.length) nodes = [...textCol.querySelectorAll("p")];
    const content = nodes.filter((n) => n.textContent.replace(/ /g, " ").trim());
    if (!content.length) return;
    const block = WebImporter.Blocks.createBlock(document, { name: "quotes-text", cells: [[content]] });
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
  var STORY_METADATA_FIELDS = [
    "Template",
    "Title",
    "Description",
    "Author",
    "Image",
    "Image Alt",
    "Publish Date",
    "Category",
    "Tags",
    "Keywords",
    "Exclude from Related",
    "Related Priority"
  ];
  var DEFAULT_STORY_AUTHOR = "AT&T Newsroom";
  var CATEGORY_PREFERENCE = [
    "Wireless",
    "Internet & Fiber",
    "Mobile Devices",
    "Technology",
    "Innovation",
    "Investors"
  ];
  function categoryFromTags(tags) {
    const lower = tags.map((t) => t.toLowerCase());
    const preferred = CATEGORY_PREFERENCE.find((c) => lower.includes(c.toLowerCase()));
    return preferred || tags[0] || "";
  }
  function isFilenameAlt(alt) {
    return /\.(png|jpe?g|gif|webp|svg)$/i.test(alt) || /^[\w-]+_\d+x\d+$/i.test(alt);
  }
  function storyBanner(document) {
    return document.querySelector(".article__content img, .story__wrap article img");
  }
  function getStoryMetadata(document) {
    const meta = Object.fromEntries(STORY_METADATA_FIELDS.map((field) => [field, ""]));
    meta.Template = "story";
    meta.Title = textOf(document, "title") || pageMeta(document, "og:title");
    meta.Description = pageMeta(document, "description") || pageMeta(document, "og:description") || textOf(document, ".story--description");
    meta.Author = pageMeta(document, "author") || pageMeta(document, "article:author") || DEFAULT_STORY_AUTHOR;
    const banner = storyBanner(document);
    const bannerAlt = banner ? (banner.getAttribute("alt") || "").trim() : "";
    const imageAlt = pageMeta(document, "og:image:alt") || pageMeta(document, "twitter:image:alt") || (bannerAlt && !isFilenameAlt(bannerAlt) ? bannerAlt : "") || meta.Title;
    const image = pageMeta(document, "og:image") || pageMeta(document, "x:image");
    if (image) {
      const img = document.createElement("img");
      img.src = image;
      img.alt = imageAlt;
      meta.Image = img;
    }
    meta["Image Alt"] = imageAlt;
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
    meta["Publish Date"] = published;
    const tags = pageMeta(document, "SBC-SEARCH-TAGS_LIST").split("~").map((t) => t.trim()).filter(Boolean);
    meta.Tags = tags.join(", ");
    const category = pageMeta(document, "SBC-SEARCH-CATEGORY");
    meta.Category = category && category.toLowerCase() !== "all" ? category : categoryFromTags(tags);
    meta.Keywords = pageMeta(document, "keywords");
    meta["Exclude from Related"] = "false";
    meta["Related Priority"] = "";
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
      const known = new Set(STORY_METADATA_FIELDS.map((f) => f.toLowerCase()).concat(["publication date"]));
      Object.entries(WebImporter.Blocks.getMetadata(doc)).forEach(([key, value]) => {
        if (!(key in meta) && !known.has(key.toLowerCase())) meta[key] = value;
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
  function isBlockTable(table, name) {
    const first = table.querySelector("tr > th, tr > td");
    return Boolean(first) && first.textContent.trim().toLowerCase().replace(/[\s-]+/g, " ").startsWith(name);
  }
  var ATT_BLUE = /rgb\(\s*0\s*,\s*159\s*,\s*219\s*\)|#009fdb/i;
  function markBlueHeadings(element, document) {
    const headings = [...element.querySelectorAll("h2")].filter((h) => !h.closest("table"));
    if (!headings.length) return;
    const isBlue = (h) => [h, ...h.querySelectorAll("[style]")].some((el) => ATT_BLUE.test(el.getAttribute("style") || ""));
    if (!headings.every(isBlue)) return;
    const firstBreak = element.querySelector("hr[data-excat-section-id]") || element.querySelector("hr");
    const style = WebImporter.Blocks.createBlock(document, { name: "Section Metadata", cells: { style: "blue-headings" } });
    if (firstBreak) firstBreak.before(style);
    else element.append(style);
  }
  function appendRelatedStoriesIfMissing(element, document) {
    const tables = [...element.querySelectorAll("table")];
    if (tables.some((t) => isBlockTable(t, "related stories"))) return;
    const block = WebImporter.Blocks.createBlock(document, { name: "related-stories", cells: [["limit", "3"]] });
    const style = WebImporter.Blocks.createBlock(document, { name: "Section Metadata", cells: { style: "blue" } });
    element.append(document.createElement("hr"), block, style);
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
        // Tracking iframes; video players are kept for the embed parser.
        'iframe:not([src*="youtube.com/embed"]):not([src*="youtube-nocookie.com/embed"]):not([src*="player.vimeo.com"])',
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
      const banner = storyBanner(document);
      if (banner && isFilenameAlt((banner.getAttribute("alt") || "").trim())) {
        banner.setAttribute("alt", textOf(document, "title") || "");
      }
      if (document && element === document.body) appendRelatedStoriesIfMissing(element, document);
      if (document && element === document.body) markBlueHeadings(element, document);
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

  // tools/importer/import-story.js
  var PAGE_TEMPLATE = {
    "name": "story",
    "urls": [
      "https://about.att.com/story/2026/samsung-holiday.html",
      "https://about.att.com/story/2026/att-amdocs-expand-collaboration.html",
      "https://about.att.com/story/2026/att-ast-spacemobile-engineering-connected-world.html",
      "https://about.att.com/story/2026/screenready-advisory-board.html",
      "https://about.att.com/story/2026/jv-help-end-dead-zones.html",
      "https://about.att.com/story/2026/forged-fiber-37-gigapower-joint-venture.html",
      "https://about.att.com/story/2026/att-to-sell-att-mexico.html",
      "https://about.att.com/story/2026/3q-earnings.html"
    ],
    "representativeUrl": "https://about.att.com/story/2026/samsung-holiday.html",
    "description": "AT&T newsroom story / press release article pages",
    "blocks": [
      {
        "name": "columns-share-bar",
        "instances": [
          ".article__header .article-header--row"
        ]
      },
      {
        "name": "accordion-faq",
        "instances": [
          ".article__content .expand-collapse"
        ]
      },
      {
        "name": "accordion-expand-text",
        "instances": [
          ".article__content .text.expandable-text"
        ]
      },
      {
        "name": "small-print",
        "instances": [
          ".article__content .text.text--footer"
        ]
      },
      {
        "name": "quotes-text",
        "instances": [
          ".article__content .SNR_column"
        ]
      },
      {
        "name": "embed",
        "instances": [
          '.article__content .media[data-type="video"]'
        ]
      },
      {
        "name": "related-stories",
        "instances": [
          ".story__related .row__wrap",
          ".story__related .region--blue"
        ]
      }
    ],
    "urlPattern": "/story/*",
    "sections": [
      {
        "id": "section-1",
        "name": "Article",
        "selector": [
          "main > .story__wrap",
          "#page > div.story__wrap"
        ],
        "style": null,
        "blocks": [
          "columns-share-bar",
          "accordion-faq",
          "accordion-expand-text",
          "embed",
          "small-print",
          "quotes-text"
        ],
        "defaultContent": [
          ".article__header .story--pub-date",
          ".article__header .story--title",
          ".article__header .story--description",
          ".article__content .text"
        ]
      },
      {
        "id": "section-2",
        "name": "Related stories",
        "selector": [
          "main > .story__related",
          "#page > div.story__related"
        ],
        "style": "blue",
        "blocks": [
          "related-stories"
        ],
        "defaultContent": []
      }
    ]
  };
  var parsers = {
    "columns-share-bar": parse,
    "accordion-faq": parse2,
    "accordion-expand-text": parse3,
    "related-stories": parse4,
    embed: parse5,
    "small-print": parse6,
    "quotes-text": parse7
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
  var import_story_default = {
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
  return __toCommonJS(import_story_exports);
})();
