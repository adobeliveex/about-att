/* eslint-disable */
var CustomImportScript = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
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

  // tools/importer/import-allnews.js
  var import_allnews_exports = {};
  __export(import_allnews_exports, {
    default: () => import_allnews_default
  });

  // tools/importer/parsers/article-search.js
  function parse(element, { document }) {
    var _a;
    const text = (el) => el ? el.textContent.replace(/\s+/g, " ").trim() : "";
    const title = text(element.querySelector(".search-header h1, h1"));
    const intro = text(element.querySelector(".text__wrap p")).replace(/the filter below to further narrow down the results below\.?/i, "the filters to narrow down the results.");
    const placeholder = ((_a = element.querySelector('input.wgt-search-feild, input[type="search"]')) == null ? void 0 : _a.getAttribute("placeholder")) || "";
    const cta = element.querySelector("a.cta--button");
    const cells = [];
    if (title) cells.push(["title", title]);
    if (intro) cells.push(["intro", intro]);
    if (placeholder) cells.push(["placeholder", placeholder]);
    if (cta) {
      const link = document.createElement("a");
      link.href = cta.getAttribute("href");
      link.textContent = text(cta) || cta.getAttribute("aria-label") || "Subscribe to AT&T News";
      cells.push(["link", link]);
    }
    cells.push(["filters", "Category, Tags, Publish Month, Keywords, Author"]);
    cells.push(["page size", "20"]);
    const block = WebImporter.Blocks.createBlock(document, { name: "article-search", cells });
    element.replaceWith(block);
  }

  // tools/importer/import-allnews.js
  var PAGE_TEMPLATE = {
    name: "allnews",
    urls: ["https://about.att.com/allnews.html"],
    representativeUrl: "https://about.att.com/allnews.html",
    description: "Newsroom All News search / listing page",
    blocks: [{ name: "article-search", instances: ["main#page > .region"] }]
  };
  function findRegion(document) {
    const header = document.querySelector(".search-header");
    return header && header.closest(".region") || document.querySelector(PAGE_TEMPLATE.blocks[0].instances[0]);
  }
  var import_allnews_default = {
    transform: (payload) => {
      var _a, _b, _c;
      const { document, url, params } = payload;
      const main = document.body;
      const title = (((_a = document.querySelector('meta[property="og:title"]')) == null ? void 0 : _a.content) || ((_b = document.querySelector(".search-header h1")) == null ? void 0 : _b.textContent) || document.title || "All News Features").replace(/\s+/g, " ").trim();
      const description = (((_c = document.querySelector('meta[name="description"]')) == null ? void 0 : _c.content) || "Check out the latest news from AT&T").trim();
      const region = findRegion(document);
      const content = document.createElement("div");
      if (region) {
        const holder = document.createElement("div");
        region.replaceWith(holder);
        holder.append(region);
        parse(region, { document, url, params });
        content.append(...holder.childNodes);
      }
      main.replaceChildren(content);
      const meta = WebImporter.Blocks.getMetadataBlock(document, {
        Title: title,
        Description: description,
        Template: "allnews"
      });
      main.append(document.createElement("hr"), meta);
      const rawPath = new URL(params.originalURL).pathname.replace(/\/$/, "").replace(/\.html?$/, "");
      const path = WebImporter.FileUtils.sanitizePath(rawPath === "" ? "/index" : rawPath);
      return [{
        element: main,
        path,
        report: { title, template: PAGE_TEMPLATE.name, blocks: region ? ["article-search"] : [] }
      }];
    }
  };
  return __toCommonJS(import_allnews_exports);
})();
