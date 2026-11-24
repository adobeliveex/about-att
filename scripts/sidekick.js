/*
 * AEM Sidekick extensions for this site.
 * "Experimentation" button: opens the Experience Workspace experimentation UI
 * (create / edit experiments on the current page). The plugin's own
 * simulation panel (aem-experimentation) is wired by the plugin itself.
 * https://www.aem.live/docs/ew/developing/set-up-experimentation
 */
let expMod;
const DA_EXP = 'https://da.live/nx/public/plugins/exp/exp.js';

async function toggleExp() {
  const exists = document.querySelector('#aem-sidekick-exp');
  // If it doesn't exist, let module side effects run
  if (!exists) {
    // eslint-disable-next-line import/no-unresolved
    expMod = await import(DA_EXP);
    return;
  }
  // Else, cache the module here and toggle it.
  // eslint-disable-next-line import/no-unresolved
  if (!expMod) expMod = await import(DA_EXP);
  expMod.default();
}

(async function sidekick() {
  const sk = document.querySelector('aem-sidekick');
  if (!sk) return;
  sk.addEventListener('custom:experimentation', toggleExp);
}());
