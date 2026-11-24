# AT&T Newsroom Home Page Migration Plan

## Goal
Move the home page of **https://about.att.com/** into this Edge Delivery Services project as a page authors can edit. The page should keep the original's sections and content, use the right blocks, and render in the preview.

## What I found so far
- **Project:** The site already has a Document Authoring content location (srm0233-adobe / about-att). The project setup details are partly filled in. The project type still needs to be confirmed and recorded.
- **Existing blocks:** The project starts from the commerce boilerplate. It has standard blocks (hero, cards, columns, carousel, accordion, fragment, modal, header, footer) and many commerce blocks that this page won't need.
- **No site catalog:** No block catalog has been built yet, so blocks will be generated from this page's own analysis.
- **Scope:** Only the home page. Header/navigation, footer and design/styling are separate follow-up steps.
- **Where changes go:** Everything happens in the local workspace only. Nothing is uploaded to Document Authoring, previewed or published unless you ask for it.

## Approach
1. **Project setup:** Confirm the project type (expected: Document Authoring) and the block library location, then record them.
2. **Page template:** Classify the home page URL into its page template (a single "homepage" template).
3. **Page analysis:** Capture a screenshot, cleaned HTML and metadata of the live page. Break it into sections and identify each block and its variant (e.g. a featured story hero, news card grids, a press release list, promo columns, a stock/investor strip).
4. **Block generation:** For each block found, reuse an existing block when it fits. Otherwise extend it with a variant, or create a new custom block.
5. **Block mapping:** Map each block to the parts of the original page it comes from.
6. **Import infrastructure:** Generate the parsers (one per block variant) and the cleanup/section transformers. Check whether the images use Dynamic Media and handle them if so.
7. **Content import:** Build the homepage import script, run it on the URL, and produce the page. Then check the import result.
8. **Verify & summarize:** Check the page renders in the preview with all sections present. Report what was created, and offer to refine the blocks against the imported content.

## Checklist
- [ ] Initialize migration plan / progress tracking
- [ ] Project setup: confirm project type (DA) and block library URL, and record them
- [ ] Identify the page template for https://about.att.com/
- [ ] Page analysis: screenshot, cleaned HTML, metadata, sections and block variants
- [ ] Block generation: reuse, extend or create the blocks the page needs, and check the generated code
- [ ] Block mapping: add the source selectors for each block and section
- [ ] Import infrastructure: parsers and transformers (plus Dynamic Media handling if it applies)
- [ ] Content import: generate the homepage import script and import the page
- [ ] Check the imported page in the preview (all sections, images, links)
- [ ] Summarize the results and offer block refinement
- [ ] Suggest the next step: design migration (styling), then header and footer migration

## Out of scope (separate requests)
- Design and styling to match the original
- Header/navigation and footer migration
- Other pages or the whole site
- Uploading to Document Authoring, or previewing or publishing on Edge Delivery

## Risks / notes
- about.att.com may block automated access. If it does, scraping falls back to a bot-protected mode, which may take longer.
- Dynamic parts of the page (live stock ticker, feeds loaded by script) may come in as static content or as a placeholder block.
- Running the import again overwrites any manual edits to the imported page.

> To carry out this plan, switch to Execute mode.
