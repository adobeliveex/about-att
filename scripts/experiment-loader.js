/*
 * Edge Delivery renders authored Section Metadata as attributes on the section
 * (e.g. <div data-audience:-consumer="https://.../fragments/x">) instead of a
 * .section-metadata block, but the plugin reads .section-metadata blocks. Put
 * the experiment / audience / campaign entries back as a block before the
 * plugin runs (decorateSections() consumes it afterwards as usual).
 */
const EXPERIMENTATION_ATTR = /^data-(experiment|audience|campaign)/i;

function restoreSectionMetadata(doc) {
  doc.querySelectorAll('main > div').forEach((section) => {
    const attrs = [...section.attributes].filter((a) => EXPERIMENTATION_ATTR.test(a.name));
    if (!attrs.length) return;
    let block = section.querySelector(':scope > .section-metadata');
    if (!block) {
      block = doc.createElement('div');
      block.className = 'section-metadata';
      section.append(block);
    }
    attrs.forEach(({ name, value }) => {
      const row = doc.createElement('div');
      const key = doc.createElement('div');
      key.textContent = name.slice('data-'.length);
      const val = doc.createElement('div');
      val.textContent = value;
      row.append(key, val);
      block.append(row);
      section.removeAttribute(name);
    });
  });
}

/**
 * Checks if experimentation is enabled.
 * @returns {boolean} True if experimentation is enabled, false otherwise.
 */
const isExperimentationEnabled = () => document.head.querySelector('[name^="experiment"],[name^="campaign-"],[name^="audience-"],[property^="campaign:"],[property^="audience:"]')
  || [...document.querySelectorAll('.section-metadata div')].some((d) => d.textContent.match(/Experiment|Campaign|Audience/i));

/**
 * Loads the experimentation module (eager).
 * @param {Document} document The document object.
 * @param {Object} config The experimentation configuration.
 * @returns {Promise<void>} A promise that resolves when the experimentation module is loaded.
 */
export async function runExperimentation(document, config) {
  restoreSectionMetadata(document);
  if (!isExperimentationEnabled()) {
    window.addEventListener('message', async (event) => {
      if (event.data?.type === 'hlx:experimentation-get-config') {
        event.source.postMessage({
          type: 'hlx:experimentation-config',
          config: { experiments: [], audiences: [], campaigns: [] },
          source: 'no-experiments',
        }, '*');
      }
    });
    return null;
  }

  try {
    const { loadEager } = await import(
      '../plugins/experimentation/src/index.js'
    );
    return loadEager(document, config);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to load experimentation module (eager):', error);
    return null;
  }
}

/**
 * Loads the experimentation simulation UI (lazy).
 * The simulation panel is an authoring aid, so this is a no-op in production —
 * the coarse check below avoids even fetching the plugin there, and the plugin
 * re-checks authoritatively before showing anything.
 * @param {Document} document The document object.
 * @param {Object} config The experimentation configuration.
 * @returns {Promise<void>} A promise that resolves when the simulation UI is loaded.
 */
export async function runExperimentationLazy(document, config) {
  const { host, hostname, origin } = window.location;
  const isPreview = hostname === 'localhost'
    || hostname.endsWith('.page')
    || (typeof config.isProd === 'function' && !config.isProd())
    || (config.prodHost && ![host, hostname, origin].includes(config.prodHost));
  if (!isPreview) {
    return null;
  }

  try {
    const { loadLazy } = await import(
      '../plugins/experimentation/src/index.js'
    );
    return loadLazy(document, config);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to load experimentation module (lazy):', error);
    return null;
  }
}
