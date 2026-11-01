'use strict';
const api = globalThis.browser || globalThis.chrome;
const msg = (k) => api.i18n.getMessage(k);
document.documentElement.lang = api.i18n.getUILanguage();
document.getElementById('name').textContent = msg('extName');
document.getElementById('hint').textContent = msg('popupHint');
const btn = document.getElementById('open');
btn.textContent = msg('popupOpen');
btn.addEventListener('click', () => {
  Promise.resolve(api.tabs.create({ url: 'https://www.youtube.com/feed/playlists' }))
    .finally(() => window.close());
});
