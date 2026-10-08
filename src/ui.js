/*
 * Playlist Çoklu Seçim — ui.js
 * Geliştirici: Mustafa Çiçek — https://github.com/mustafacicek-eee · MIT Lisansı
 * Arayüz ve işlem akışı. Not: YouTube "Trusted Types" zorunlu kılıyor;
 * bu yüzden innerHTML hiç kullanılmaz, tüm DOM createElement/textContent ile kurulur.
 */
(function (root) {
  'use strict';
  const M = root.__msx;
  if (!M || !M.core || !M.api || M.uiLoaded) return;
  M.uiLoaded = true;
  const { core, api } = M;

  // ---------- Dil ----------
  // Kullanıcının seçtiği dil youtube.com localStorage'ında tutulur; seçim yoksa sayfanın dili kullanılır.
  const LANG_KEY = 'msx.lang.v1';
  const autoLang = () => (String(document.documentElement.lang || navigator.language || 'en').toLowerCase().startsWith('tr') ? 'tr' : 'en');
  let LANG = (() => {
    try { const v = localStorage.getItem(LANG_KEY); if (v === 'tr' || v === 'en') return v; } catch (_) { /* yok say */ }
    return autoLang();
  })();
  const STR = {
    tr: {
      launcher: 'Çoklu seçim', loading: 'Yükleniyor… {0}', videos: '{0} video', hiddenNote: ' · {0} erişilemeyen video YouTube tarafından gizli',
      search: 'Başlık veya kanalda ara…', selMatches: 'Eşleşenleri seç', all: 'Tümü', none: 'Hiçbiri', invert: 'Ters çevir',
      dups: 'Tekrarları seç', sortPh: 'Listeyi sırala…', sTitleAsc: 'Başlık A→Z', sTitleDesc: 'Başlık Z→A', sChannel: 'Kanal A→Z',
      sDurAsc: 'Süre: kısadan uzuna', sDurDesc: 'Süre: uzundan kısaya', sReverse: 'Ters çevir', sShuffle: 'Karıştır',
      selected: '<b>{0}</b> seçili · {1}', copyTo: 'Kopyala…', moveTo: 'Taşı…', toTop: 'Başa al', toBottom: 'Sona al', remove: 'Kaldır',
      clipCopy: 'Panoya kopyala', clipCut: 'Kes', paste: 'Yapıştır', clipInfo: 'Pano: {0} video ({1}) · kaynak: {2}', clipEmpty: 'Pano boş',
      modeCopy: 'kopya', modeCut: 'kesilen', close: 'Kapat', reload: 'Yenile', refreshPage: 'Sayfayı yenile',
      changedNote: 'Liste değişti. YouTube sayfası eski hâlini gösteriyor olabilir.', notLoggedIn: 'YouTube hesabına giriş yapılmamış: yalnızca görüntüleme ve seçim yapılabilir.',
      notEditable: 'Bu liste türü (otomatik karışık liste) düzenlenemez; yalnızca kopyalayabilirsiniz.',
      likedNote: 'Beğenilen videolar listesinden kaldırmak, videoyu beğenmekten vazgeçmek anlamına gelebilir.',
      empty: 'Liste boş.', noMatch: 'Eşleşen video yok.', cancel: 'Vazgeç', ok: 'Tamam', confirm: 'Onayla',
      pickTarget: 'Hedef liste seç', pickTargetMove: 'Taşınacak liste seç', loadingLists: 'Listelerin yükleniyor…',
      noLists: 'Liste bulunamadı. Aşağıya URL veya ID yapıştırabilirsin.', pasteId: 'Liste URL’si veya ID’si', useId: 'Bunu kullan',
      newList: 'Yeni liste oluştur', newName: 'Yeni liste adı', privacy: 'Gizlilik', pPrivate: 'Özel', pUnlisted: 'Liste dışı', pPublic: 'Herkese açık',
      create: 'Oluştur ve ekle', watchLater: 'Daha sonra izle', badId: 'Geçerli bir liste URL’si/ID’si değil.',
      confirmRemove: '{0} video bu listeden kaldırılsın mı?', confirmMove: '{0} video “{1}” listesine taşınsın mı? (Eklendikten sonra buradan kaldırılır.)',
      confirmSort: 'Tüm liste “{0}” düzenine göre sıralanacak. Gereken taşıma: {1}. Devam edilsin mi?', nothingToDo: 'Zaten bu sırada, değişiklik gerekmiyor.',
      working: 'İşlem sürüyor…', adding: 'Ekleniyor… {0}/{1}', removing: 'Kaldırılıyor… {0}/{1}', moving: 'Taşınıyor… {0}/{1}', verifying: 'Doğrulanıyor…',
      readingTarget: 'Hedef liste okunuyor…', creating: 'Liste oluşturuluyor…',
      doneAdd: '{0} video eklendi.', doneAddSkip: '{0} video eklendi, {1} tanesi zaten vardı.', doneMove: '{0} video taşındı.', doneRemove: '{0} video kaldırıldı.',
      doneOrder: 'Sıralama tamamlandı ({0} taşıma).', orderMismatch: 'Sıralama doğrulanamadı; “Yenile” ile kontrol edip tekrar deneyin.',
      undo: 'Geri ekle', undoNote: 'Geri eklenen videolar liste sonuna eklenir.', openList: 'Listeyi aç', copied: '{0} video panoya kopyalandı.', cut: '{0} video kesildi. Hedef listede Yapıştır’a bas.',
      pasteSame: 'Kesilen videolar zaten bu listede; yapıştırma yapılmadı.', pasted: '{0} video yapıştırıldı.', pastedSkip: '{0} video yapıştırıldı, {1} tanesi zaten vardı.',
      error: 'Hata: {0}', needSetIds: 'Bu listedeki öğe kimlikleri alınamadı; sıralama yapılamıyor.', menuSelectOnly: 'Yalnızca bunu seç',
      sameList: 'Kaynak ve hedef aynı liste.',
      byChannel: 'Kanala göre seç…', byDuration: 'Süreye göre seç…', dLt1: '1 dakikadan kısa', d1to10: '1–10 dakika', d10to30: '10–30 dakika',
      d30to60: '30–60 dakika', dGt60: '1 saat ve üzeri', dUnknown: 'Süresi belirsiz (canlı / yaklaşan)', dCustom: 'Özel aralık…',
      customTitle: 'Süre aralığı (dakika)', minLabel: 'En az', maxLabel: 'En fazla', maxHint: 'boş = sınırsız', selectBtn: 'Seç',
      badRange: 'Geçerli bir aralık gir: sayılar 0 veya büyük olmalı ve “en fazla”, “en az”dan büyük olmalı.',
      addedSel: '{0} video seçime eklendi.', noneMatched: 'Görünen videolar arasında bu ölçüte uyan yok.', menuChannel: 'Bu kanaldan tümünü seç ({0})',
      filterNote: 'Yalnızca görünen (aramaya uyan) videolar seçilir.',
      findDead: 'Silinmiş/özel videoları bul', scanHidden: 'Gizlenen videolar taranıyor… {0}', checkingDead: 'Videolar doğrulanıyor… {0}/{1}',
      noHidden: 'Bu listede YouTube’un gizlediği video yok.', deadTitle: 'Silinmiş ve özel videolar',
      deadSummary: 'YouTube bu listede {0} videoyu gizliyor. Kesin silinmiş: {1} · Kesin özel: {2}.',
      deadRestricted: '{0} video hâlâ yayında ama senin bölgende/hesabında izlenemiyor; bunlara dokunulmaz.',
      deadUnknown: '{0} video doğrulanamadı; bunlara dokunulmaz.', deadNone: 'Kaldırılacak kesin silinmiş/özel video yok.',
      deadDeleted: 'Silinmiş', deadPrivate: 'Özel', deadIncDeleted: 'Silinmişleri kaldır ({0})', deadIncPrivate: 'Özelleri kaldır ({0})',
      deadRemove: 'Seçilenleri kaldır', deadNoUndo: 'Bu videolar zaten izlenemiyor; bu işlemin geri alma seçeneği yok.',
      deadLogin: 'Kaldırmak için YouTube’a giriş yapmalı ve listenin sahibi olmalısın.', deadDone: '{0} silinmiş/özel video kaldırıldı ve doğrulandı.',
      deadPartial: '{0} video kaldırıldı; {1} video hâlâ listede görünüyor. YouTube isteği uygulamamış olabilir, bir süre sonra tekrar dene.', total: 'toplam {0}', keys: 'Kısayollar: ⇧ tık = aralık, ⌘/Ctrl+A, ⌘/Ctrl+C/X/V, Del = kaldır, Esc',
    },
    en: {
      launcher: 'Multiselect', loading: 'Loading… {0}', videos: '{0} videos', hiddenNote: ' · {0} unavailable videos hidden by YouTube',
      search: 'Search title or channel…', selMatches: 'Select matches', all: 'All', none: 'None', invert: 'Invert',
      dups: 'Select duplicates', sortPh: 'Sort playlist…', sTitleAsc: 'Title A→Z', sTitleDesc: 'Title Z→A', sChannel: 'Channel A→Z',
      sDurAsc: 'Duration: short→long', sDurDesc: 'Duration: long→short', sReverse: 'Reverse', sShuffle: 'Shuffle',
      selected: '<b>{0}</b> selected · {1}', copyTo: 'Copy…', moveTo: 'Move…', toTop: 'To top', toBottom: 'To bottom', remove: 'Remove',
      clipCopy: 'Copy to clipboard', clipCut: 'Cut', paste: 'Paste', clipInfo: 'Clipboard: {0} videos ({1}) · from: {2}', clipEmpty: 'Clipboard empty',
      modeCopy: 'copied', modeCut: 'cut', close: 'Close', reload: 'Reload', refreshPage: 'Refresh page',
      changedNote: 'The playlist changed. The YouTube page may still show the old version.', notLoggedIn: 'Not signed in to YouTube: you can only view and select.',
      notEditable: 'This list type (auto-generated mix) cannot be edited; you can only copy.',
      likedNote: 'Removing from Liked videos may unlike the video.',
      empty: 'Playlist is empty.', noMatch: 'No matching videos.', cancel: 'Cancel', ok: 'OK', confirm: 'Confirm',
      pickTarget: 'Choose target playlist', pickTargetMove: 'Choose playlist to move to', loadingLists: 'Loading your playlists…',
      noLists: 'No playlists found. Paste a URL or ID below.', pasteId: 'Playlist URL or ID', useId: 'Use this',
      newList: 'Create new playlist', newName: 'New playlist name', privacy: 'Privacy', pPrivate: 'Private', pUnlisted: 'Unlisted', pPublic: 'Public',
      create: 'Create & add', watchLater: 'Watch later', badId: 'Not a valid playlist URL/ID.',
      confirmRemove: 'Remove {0} videos from this playlist?', confirmMove: 'Move {0} videos to “{1}”? (They are removed here after being added.)',
      confirmSort: 'The whole playlist will be sorted by “{0}”. Moves needed: {1}. Continue?', nothingToDo: 'Already in this order, nothing to do.',
      working: 'Working…', adding: 'Adding… {0}/{1}', removing: 'Removing… {0}/{1}', moving: 'Moving… {0}/{1}', verifying: 'Verifying…',
      readingTarget: 'Reading target playlist…', creating: 'Creating playlist…',
      doneAdd: '{0} videos added.', doneAddSkip: '{0} videos added, {1} were already there.', doneMove: '{0} videos moved.', doneRemove: '{0} videos removed.',
      doneOrder: 'Reordering done ({0} moves).', orderMismatch: 'Could not verify the order; press Reload and try again.',
      undo: 'Re-add', undoNote: 'Re-added videos go to the end of the playlist.', openList: 'Open playlist', copied: '{0} videos copied to clipboard.', cut: '{0} videos cut. Press Paste in the target playlist.',
      pasteSame: 'The cut videos are already in this playlist; nothing pasted.', pasted: '{0} videos pasted.', pastedSkip: '{0} videos pasted, {1} were already there.',
      error: 'Error: {0}', needSetIds: 'Item IDs for this playlist are missing; cannot reorder.', menuSelectOnly: 'Select only this',
      sameList: 'Source and target are the same playlist.',
      byChannel: 'Select by channel…', byDuration: 'Select by duration…', dLt1: 'Under 1 minute', d1to10: '1–10 minutes', d10to30: '10–30 minutes',
      d30to60: '30–60 minutes', dGt60: '1 hour or longer', dUnknown: 'Unknown duration (live / upcoming)', dCustom: 'Custom range…',
      customTitle: 'Duration range (minutes)', minLabel: 'At least', maxLabel: 'At most', maxHint: 'empty = no limit', selectBtn: 'Select',
      badRange: 'Enter a valid range: numbers must be 0 or more and “at most” must be greater than “at least”.',
      addedSel: '{0} videos added to selection.', noneMatched: 'No visible videos match this criterion.', menuChannel: 'Select all from this channel ({0})',
      filterNote: 'Only visible (search-matching) videos are selected.',
      findDead: 'Find deleted/private videos', scanHidden: 'Scanning hidden videos… {0}', checkingDead: 'Verifying videos… {0}/{1}',
      noHidden: 'YouTube hides no videos in this playlist.', deadTitle: 'Deleted and private videos',
      deadSummary: 'YouTube hides {0} videos in this playlist. Confirmed deleted: {1} · Confirmed private: {2}.',
      deadRestricted: '{0} videos are still online but unavailable in your region/account; they are left untouched.',
      deadUnknown: '{0} videos could not be verified; they are left untouched.', deadNone: 'No confirmed deleted/private videos to remove.',
      deadDeleted: 'Deleted', deadPrivate: 'Private', deadIncDeleted: 'Remove deleted ({0})', deadIncPrivate: 'Remove private ({0})',
      deadRemove: 'Remove selected', deadNoUndo: 'These videos are already unwatchable; this cannot be undone.',
      deadLogin: 'Sign in to YouTube and own this playlist to remove them.', deadDone: '{0} deleted/private videos removed and verified.',
      deadPartial: '{0} removed; {1} still appear in the playlist. YouTube may not have applied the request, try again later.', total: 'total {0}', keys: 'Shortcuts: ⇧ click = range, ⌘/Ctrl+A, ⌘/Ctrl+C/X/V, Del = remove, Esc',
    },
  };
  const t = (k, ...a) => {
    let s = STR[LANG][k] != null ? STR[LANG][k] : (STR.en[k] != null ? STR.en[k] : k);
    a.forEach((v, i) => { s = s.split('{' + i + '}').join(String(v)); });
    return s;
  };

  // ---------- DOM yardımcısı (innerHTML yok) ----------
  function h(tag, props, ...children) {
    const el = document.createElement(tag);
    if (props) {
      for (const k of Object.keys(props)) {
        const v = props[k];
        if (v == null || v === false) continue;
        if (k === 'class') el.className = v;
        else if (k === 'text') el.textContent = v;
        else if (k.slice(0, 2) === 'on' && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
        else if (k === 'checked' || k === 'value' || k === 'disabled' || k === 'hidden' || k === 'tabIndex') el[k] = v;
        else el.setAttribute(k, v === true ? '' : String(v));
      }
    }
    for (const c of children.flat(Infinity)) {
      if (c == null || c === false) continue;
      el.appendChild(typeof c === 'string' || typeof c === 'number' ? document.createTextNode(String(c)) : c);
    }
    return el;
  }
  /** "<b>x</b> metin" biçimli basit şablonu güvenli düğümlere çevirir (yalnızca <b>). */
  function rich(str) {
    const out = [];
    const re = /<b>(.*?)<\/b>/g;
    let last = 0, m;
    while ((m = re.exec(str))) {
      if (m.index > last) out.push(str.slice(last, m.index));
      out.push(h('b', { text: m[1] }));
      last = re.lastIndex;
    }
    if (last < str.length) out.push(str.slice(last));
    return out;
  }
  const clear = (el) => { while (el.firstChild) el.removeChild(el.firstChild); };

  // ---------- Durum ----------
  const S = {
    open: false, playlistId: null, title: '', total: null, items: [], rows: new Map(), selected: new Set(),
    anchor: null, focus: null, filter: '', visible: [], busy: false, changed: false, loadToken: 0,
  };
  const keyOf = (it) => it.setVideoId || ('i' + it.index + ':' + it.videoId);
  const itemByKey = () => new Map(S.items.map((it) => [keyOf(it), it]));
  const selectedItems = () => S.items.filter((it) => S.selected.has(keyOf(it)));
  const isMix = (id) => /^RD/.test(id || '');
  const canEdit = () => api.isLoggedIn() && !isMix(S.playlistId);

  // ---------- Pano (localStorage; yalnızca bu tarayıcıda, youtube.com kökeninde) ----------
  const CLIP_KEY = 'msx.clipboard.v1';
  const clip = {
    get() { try { const v = JSON.parse(localStorage.getItem(CLIP_KEY) || 'null'); return v && Array.isArray(v.items) ? v : null; } catch (_) { return null; } },
    set(v) { try { localStorage.setItem(CLIP_KEY, JSON.stringify(v)); } catch (_) { /* yok say */ } },
    clear() { try { localStorage.removeItem(CLIP_KEY); } catch (_) { /* yok say */ } },
  };

  // ---------- İskelet ----------
  const host = h('div', { id: 'msx-host' });
  const shadow = host.attachShadow({ mode: 'open' });
  shadow.appendChild(h('style', { text: M.css }));

  const launcher = h('button', { class: 'launcher', hidden: true, title: 'Playlist Multiselect', onclick: () => openPanel() }, '☑ ', t('launcher'));
  const elTitle = h('h2');
  const elSub = h('div', { class: 'sub' });
  const elSearch = h('input', { class: 'search', type: 'text', placeholder: t('search') });
  const SORT_LABEL = { '': 'sortPh', 'title-asc': 'sTitleAsc', 'title-desc': 'sTitleDesc', 'channel-asc': 'sChannel', 'duration-asc': 'sDurAsc', 'duration-desc': 'sDurDesc', reverse: 'sReverse', shuffle: 'sShuffle' };
  const elSort = h('select', { class: 'btn', title: t('sortPh') },
    Object.keys(SORT_LABEL).map((v) => h('option', { value: v, text: t(SORT_LABEL[v]) })));
  const elChannel = h('select', { class: 'btn', title: t('byChannel') });
  const DUR_LABEL = { lt1: 'dLt1', '1to10': 'd1to10', '10to30': 'd10to30', '30to60': 'd30to60', gt60: 'dGt60', unknown: 'dUnknown' };
  const elDuration = h('select', { class: 'btn', title: t('byDuration') },
    h('option', { value: '', text: t('byDuration') }),
    core.DURATION_PRESETS.map((p) => h('option', { value: p.id, text: t(DUR_LABEL[p.id]) })),
    h('option', { value: 'custom', text: t('dCustom') }));
  const elWarn = h('div', { class: 'warn', hidden: true });
  const elList = h('div', { class: 'list', role: 'listbox', 'aria-multiselectable': 'true' });
  const elInfo = h('span');
  const elKeys = h('span', { class: 'kbd', text: t('keys') });
  const elClipInfo = h('span');
  const btn = (label, onclick, cls) => h('button', { class: 'btn' + (cls ? ' ' + cls : ''), onclick }, label);
  const B = {
    selMatches: btn(t('selMatches'), () => selectVisible(true)),
    all: btn(t('all'), () => selectVisible(false)),
    none: btn(t('none'), () => setSelection([])),
    invert: btn(t('invert'), invertSelection),
    dups: btn(t('dups'), selectDuplicates),
    findDead: btn(t('findDead'), () => doFindDead()),
    copyTo: btn(t('copyTo'), () => doCopyOrMove(false), 'primary'),
    moveTo: btn(t('moveTo'), () => doCopyOrMove(true)),
    toTop: btn(t('toTop'), () => doMoveSelection('top')),
    toBottom: btn(t('toBottom'), () => doMoveSelection('bottom')),
    remove: btn(t('remove'), doRemove, 'danger'),
    clipCopy: btn(t('clipCopy'), () => doClip('copy')),
    clipCut: btn(t('clipCut'), () => doClip('cut')),
    paste: btn(t('paste'), doPaste),
  };
  const elToastText = h('span');
  const elToastBtns = h('div');
  const elToastClose = h('button', { title: t('close'), onclick: () => hideToast() }, '✕');
  const elToast = h('div', { class: 'toast', hidden: true, role: 'status' }, elToastText, elToastBtns, elToastClose);

  // Dil seçici (başlıkta): TR | EN — etkin olan vurgulanır
  const elLangTR = h('span', { text: 'TR', lang: 'tr' });
  const elLangEN = h('span', { text: 'EN', lang: 'en' });
  const elLang = h('button', { class: 'lang', title: 'Dil / Language', 'aria-label': 'Dil / Language', onclick: () => setLang(LANG === 'tr' ? 'en' : 'tr') }, elLangTR, elLangEN);
  const elReloadBtn = h('button', { class: 'icon', title: t('reload'), onclick: () => load() }, '↻');
  const elCloseBtn = h('button', { class: 'icon', title: t('close'), onclick: () => closePanel() }, '✕');

  const panel = h('div', { class: 'panel', hidden: true, tabIndex: -1, role: 'dialog', 'aria-label': 'Playlist Multiselect' },
    h('div', { class: 'head' },
      h('div', { class: 'ttl' }, elTitle, elSub),
      elLang, elReloadBtn, elCloseBtn),
    elWarn,
    h('div', { class: 'bar' }, elSearch, B.selMatches),
    h('div', { class: 'bar' }, B.all, B.none, B.invert, B.dups, B.findDead),
    h('div', { class: 'bar sels' }, elChannel, elDuration, elSort),
    elList,
    h('div', { class: 'foot' },
      h('div', { class: 'info' }, elInfo, elKeys),
      h('div', { class: 'row2' }, B.copyTo, B.moveTo, B.toTop, B.toBottom, B.remove),
      h('div', { class: 'row2' }, B.clipCopy, B.clipCut, B.paste),
      h('div', { class: 'info' }, elClipInfo),
      h('div', { class: 'credit' },
        'Mustafa Çiçek · ',
        h('a', { href: 'https://www.linkedin.com/in/mustafacicek-eee/', target: '_blank', rel: 'noopener noreferrer', text: 'LinkedIn' }),
        ' · ',
        h('a', { href: 'https://github.com/mustafacicek-eee/youtube-playlist-multiselect', target: '_blank', rel: 'noopener noreferrer', text: 'GitHub' }))),
    elToast);

  shadow.appendChild(launcher);
  shadow.appendChild(panel);

  function mount() {
    if (!host.isConnected) (document.body || document.documentElement).appendChild(host);
  }

  // ---------- Dil değiştirme ----------
  function syncLangToggle() {
    elLangTR.classList.toggle('on', LANG === 'tr');
    elLangEN.classList.toggle('on', LANG === 'en');
  }
  syncLangToggle();
  /** Kurulumda bir kez yazılan sabit etiketleri seçili dile göre yeniden yazar. */
  function relabel() {
    launcher.textContent = '☑ ' + t('launcher');
    elSearch.placeholder = t('search');
    elSort.title = t('sortPh');
    for (const o of elSort.options) if (SORT_LABEL[o.value] != null) o.textContent = t(SORT_LABEL[o.value]);
    elDuration.title = t('byDuration');
    for (const o of elDuration.options) {
      o.textContent = o.value === '' ? t('byDuration') : o.value === 'custom' ? t('dCustom') : t(DUR_LABEL[o.value]);
    }
    elChannel.title = t('byChannel');
    rebuildChannelOptions();
    for (const k of Object.keys(B)) B[k].textContent = t(k);
    elKeys.textContent = t('keys');
    elReloadBtn.title = t('reload');
    elCloseBtn.title = t('close');
    elToastClose.title = t('close');
    const nm = elList.querySelector('[data-nomatch]');
    if (nm) nm.textContent = t('noMatch');
    const em = elList.querySelector('[data-empty]');
    if (em) em.textContent = t('empty');
    if (S.rows.size || em) updateSub(); // yükleme sürerken alt başlığa dokunma; ilerleme metni zaten yeni dille yazılır
    updateWarn();
    updateFooter();
    syncLangToggle();
  }
  function setLang(l) {
    if (l === LANG || S.busy || modalOpen) return;
    LANG = l;
    try { localStorage.setItem(LANG_KEY, l); } catch (_) { /* yok say */ }
    closeMenu();
    relabel();
  }

  // ---------- Tema ----------
  function syncTheme() {
    host.setAttribute('data-theme', document.documentElement.hasAttribute('dark') ? 'dark' : 'light');
  }

  // ---------- Açma / kapama ----------
  function currentListId() {
    try { return new URLSearchParams(location.search).get('list'); } catch (_) { return null; }
  }
  function openPanel() {
    const id = currentListId();
    if (!id) return;
    syncTheme();
    S.open = true;
    panel.hidden = false;
    launcher.hidden = true;
    if (S.playlistId !== id || !S.items.length) load();
    panel.focus();
  }
  function closePanel() {
    S.open = false;
    panel.hidden = true;
    closeMenu();
    updateLauncher();
  }
  function updateLauncher() {
    mount();
    const id = currentListId();
    const eligible = !!id && (location.pathname === '/playlist' || location.pathname === '/watch');
    if (S.open && id !== S.playlistId) { closePanel(); S.items = []; S.selected.clear(); }
    launcher.hidden = !eligible || S.open;
  }

  // ---------- Yükleme ----------
  async function load() {
    const id = currentListId() || S.playlistId;
    if (!id) return;
    const token = ++S.loadToken;
    const sameList = S.playlistId === id;
    const keepSel = sameList ? new Set(S.selected) : new Set();
    S.playlistId = id;
    elTitle.textContent = sameList && S.title ? S.title : '…';
    elSub.textContent = t('loading', '');
    clear(elList);
    S.rows.clear();
    try {
      const data = await api.fetchPlaylist(id, (n, total) => {
        if (token === S.loadToken) elSub.textContent = t('loading', total ? n + '/' + total : n);
      });
      if (token !== S.loadToken) return;
      S.items = data.items;
      S.title = data.title || id;
      S.total = data.total;
      const keys = new Set(S.items.map(keyOf));
      S.selected = new Set([...keepSel].filter((k) => keys.has(k)));
      if (S.anchor && !keys.has(S.anchor)) S.anchor = null;
      if (S.focus && !keys.has(S.focus)) S.focus = null;
      renderList();
    } catch (e) {
      if (token !== S.loadToken) return;
      elTitle.textContent = id;
      elSub.textContent = '';
      clear(elList);
      elList.appendChild(h('div', { class: 'empty', text: t('error', e.message) }));
    }
    updateWarn();
    updateFooter();
  }

  function updateWarn() {
    const msgs = [];
    if (!api.isLoggedIn()) msgs.push(t('notLoggedIn'));
    else if (isMix(S.playlistId)) msgs.push(t('notEditable'));
    if (S.playlistId === 'LL') msgs.push(t('likedNote'));
    if (S.changed) msgs.push(t('changedNote'));
    clear(elWarn);
    elWarn.hidden = !msgs.length;
    msgs.forEach((m, i) => { if (i) elWarn.appendChild(h('br')); elWarn.appendChild(document.createTextNode(m)); });
    if (S.changed) {
      elWarn.appendChild(h('br'));
      elWarn.appendChild(h('button', { class: 'btn', style: 'margin-top:6px', onclick: () => location.reload() }, t('refreshPage')));
    }
  }

  // ---------- Liste çizimi ----------
  function renderList() {
    elTitle.textContent = S.title;
    updateSub();
    clear(elList);
    S.rows.clear();
    if (!S.items.length) { elList.appendChild(h('div', { class: 'empty', 'data-empty': '1', text: t('empty') })); return; }
    const seen = new Set();
    const frag = document.createDocumentFragment();
    S.items.forEach((it, i) => {
      const k = keyOf(it);
      const isDup = seen.has(it.videoId);
      seen.add(it.videoId);
      const cb = h('input', { type: 'checkbox', tabIndex: -1, 'aria-label': it.title });
      const row = h('div', { class: 'row', role: 'option', 'data-key': k },
        cb,
        h('div', { class: 'idx', text: String(i + 1) }),
        h('img', { src: 'https://i.ytimg.com/vi/' + encodeURIComponent(it.videoId) + '/mqdefault.jpg', loading: 'lazy', alt: '', referrerpolicy: 'no-referrer' }),
        h('div', { class: 'meta' },
          h('div', { class: 't', title: it.title, text: it.title }),
          h('div', { class: 'c' }, it.channel || '', isDup ? h('span', { class: 'dup', text: '• dup' }) : null)),
        h('div', { class: 'd', text: it.durationText || '' }));
      S.rows.set(k, { row, cb, item: it });
      frag.appendChild(row);
    });
    elList.appendChild(frag);
    elList.appendChild(h('div', { class: 'empty', hidden: true, 'data-nomatch': '1', text: t('noMatch') }));
    applyFilter();
    refreshSelectionUI();
  }

  function updateSub() {
    const hidden = S.total != null && S.total > S.items.length ? S.total - S.items.length : 0;
    const dur = S.items.reduce((a, it) => a + (it.duration || 0), 0);
    elSub.textContent = t('videos', S.items.length) + ' · ' + t('total', core.formatDuration(dur)) + (hidden ? t('hiddenNote', hidden) : '');
  }

  function applyFilter() {
    S.filter = elSearch.value;
    S.visible = [];
    for (const it of S.items) {
      const k = keyOf(it);
      const r = S.rows.get(k);
      if (!r) continue;
      const vis = core.matchesFilter(it, S.filter);
      r.row.hidden = !vis;
      if (vis) S.visible.push(k);
    }
    const nm = elList.querySelector('[data-nomatch]');
    if (nm) nm.hidden = !!S.visible.length || !S.items.length;
    rebuildChannelOptions();
  }

  function rebuildChannelOptions() {
    const byKey = itemByKey();
    const groups = core.channelGroups(S.visible.map((k) => byKey.get(k)).filter(Boolean));
    clear(elChannel);
    elChannel.appendChild(h('option', { value: '', text: t('byChannel') }));
    groups.forEach((g, i) => elChannel.appendChild(h('option', { value: String(i), text: g.channel + ' (' + g.count + ')' })));
    elChannel._groups = groups;
  }

  function refreshSelectionUI() {
    for (const [k, r] of S.rows) {
      const on = S.selected.has(k);
      r.row.classList.toggle('sel', on);
      r.row.setAttribute('aria-selected', on ? 'true' : 'false');
      r.cb.checked = on;
      r.row.classList.toggle('focus', k === S.focus);
    }
    updateFooter();
  }

  function updateFooter() {
    const sel = selectedItems();
    const dur = sel.reduce((a, it) => a + (it.duration || 0), 0);
    clear(elInfo);
    rich(t('selected', sel.length, core.formatDuration(dur))).forEach((n) => elInfo.appendChild(typeof n === 'string' ? document.createTextNode(n) : n));
    const has = sel.length > 0;
    const busy = S.busy;
    const edit = canEdit();
    const logged = api.isLoggedIn();
    B.copyTo.disabled = busy || !has || !logged;
    B.moveTo.disabled = busy || !has || !edit;
    B.toTop.disabled = busy || !has || !edit;
    B.toBottom.disabled = busy || !has || !edit;
    B.remove.disabled = busy || !has || !edit;
    B.clipCopy.disabled = busy || !has;
    B.clipCut.disabled = busy || !has || !edit;
    const c = clip.get();
    B.paste.disabled = busy || !c || !logged || isMix(S.playlistId);
    elSort.disabled = busy || !edit || S.items.length < 2;
    B.findDead.disabled = busy || !S.playlistId || isMix(S.playlistId);
    elChannel.disabled = busy || !S.visible.length;
    elDuration.disabled = busy || !S.visible.length;
    elClipInfo.textContent = c ? t('clipInfo', c.items.length, c.mode === 'cut' ? t('modeCut') : t('modeCopy'), c.sourceTitle || c.sourceId) : t('clipEmpty');
  }

  // ---------- Seçim ----------
  function setSelection(keys) { S.selected = new Set(keys); refreshSelectionUI(); }
  function toggle(k) { if (S.selected.has(k)) S.selected.delete(k); else S.selected.add(k); }
  function selectVisible(add) {
    if (add) S.visible.forEach((k) => S.selected.add(k));
    else S.selected = new Set(S.visible);
    refreshSelectionUI();
  }
  function invertSelection() {
    const vis = new Set(S.visible);
    for (const k of vis) toggle(k);
    refreshSelectionUI();
  }
  /** Görünen öğelerden koşula uyanları seçime ekler; eklenen yeni sayıyı bildirir. */
  function selectWhere(pred) {
    const byKey = itemByKey();
    let matched = 0, added = 0;
    for (const k of S.visible) {
      const it = byKey.get(k);
      if (!it || !pred(it)) continue;
      matched++;
      if (!S.selected.has(k)) { S.selected.add(k); added++; }
    }
    refreshSelectionUI();
    if (!matched) toast(t('noneMatched'));
    else toast(t('addedSel', added) + (S.filter.trim() ? ' ' + t('filterNote') : ''));
  }
  const selectChannel = (name) => selectWhere((it) => (it.channel || '').trim() === name);

  async function pickCustomRange() {
    const minIn = h('input', { type: 'text', inputmode: 'decimal', placeholder: '0', 'aria-label': t('minLabel') });
    const maxIn = h('input', { type: 'text', inputmode: 'decimal', placeholder: '∞', 'aria-label': t('maxLabel') });
    const err = h('div', { class: 'muted' });
    let done = null;
    const submit = () => {
      const r = core.parseMinuteRange(minIn.value, maxIn.value);
      if (!r) { err.textContent = t('badRange'); return; }
      done(r);
    };
    [minIn, maxIn].forEach((el) => el.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); submit(); } }));
    const body = [
      h('div', { class: 'field' }, h('label', { text: t('minLabel') }), minIn, h('label', { text: t('maxLabel') }), maxIn),
      h('div', { class: 'muted', text: t('maxHint') }),
      err,
      h('div', { class: 'acts' },
        h('button', { class: 'btn', onclick: () => done(null) }, t('cancel')),
        h('button', { class: 'btn primary', onclick: submit }, t('selectBtn'))),
    ];
    const p = modal(t('customTitle'), body, []);
    const overlay = panel.lastElementChild;
    done = (v) => overlay._done(v);
    minIn.focus();
    return p;
  }

  function selectDuplicates() {
    setSelection(core.findDuplicateKeys(S.items, keyOf));
    if (!S.selected.size) toast(t('nothingToDo'));
  }
  function rangeSelect(toKey) {
    const from = S.anchor && S.visible.includes(S.anchor) ? S.anchor : toKey;
    const a = S.visible.indexOf(from), b = S.visible.indexOf(toKey);
    const [lo, hi] = a < b ? [a, b] : [b, a];
    for (let i = lo; i <= hi; i++) S.selected.add(S.visible[i]);
  }
  function setFocus(k, scroll) {
    S.focus = k;
    if (scroll && S.rows.get(k)) S.rows.get(k).row.scrollIntoView({ block: 'nearest' });
  }

  elList.addEventListener('click', (e) => {
    const row = e.target.closest('.row');
    if (!row || S.busy) return;
    const k = row.getAttribute('data-key');
    if (e.shiftKey) rangeSelect(k);
    else { toggle(k); S.anchor = k; }
    setFocus(k, false);
    refreshSelectionUI();
    panel.focus({ preventScroll: true });
  });
  elList.addEventListener('mousedown', (e) => { if (e.shiftKey) e.preventDefault(); });
  elList.addEventListener('contextmenu', (e) => {
    const row = e.target.closest('.row');
    if (!row) return;
    e.preventDefault();
    const k = row.getAttribute('data-key');
    if (!S.selected.has(k)) { S.selected = new Set([k]); S.anchor = k; }
    setFocus(k, false);
    refreshSelectionUI();
    openMenu(e.clientX, e.clientY, k);
  });
  elSearch.addEventListener('input', () => applyFilter());
  elChannel.addEventListener('change', () => {
    const g = elChannel._groups && elChannel._groups[Number(elChannel.value)];
    elChannel.value = '';
    if (g && !S.busy) selectChannel(g.channel);
  });
  elDuration.addEventListener('change', async () => {
    const v = elDuration.value;
    elDuration.value = '';
    if (!v || S.busy) return;
    if (v === 'custom') {
      const r = await pickCustomRange();
      if (r) selectWhere((it) => core.inDurationRange(it, r));
      return;
    }
    const preset = core.DURATION_PRESETS.find((p) => p.id === v);
    if (preset) selectWhere((it) => core.inDurationRange(it, preset));
  });
  elSort.addEventListener('change', () => {
    const v = elSort.value;
    elSort.value = '';
    if (v) doSort(v, elSort.querySelector('option[value="' + v + '"]').textContent);
  });

  // ---------- Bağlam menüsü ----------
  let menuEl = null;
  function closeMenu() { if (menuEl) { menuEl.remove(); menuEl = null; } }
  function openMenu(x, y, k) {
    closeMenu();
    const mi = (label, fn, dis, kbd) => h('button', { disabled: !!dis, onclick: () => { closeMenu(); fn(); } }, h('span', { text: label }), kbd ? h('span', { class: 'kbd', text: kbd }) : null);
    const edit = canEdit();
    const has = S.selected.size > 0;
    menuEl = h('div', { class: 'menu', role: 'menu' },
      mi(t('menuSelectOnly'), () => { setSelection([k]); S.anchor = k; }),
      (() => {
        const it = itemByKey().get(k);
        const ch = it && (it.channel || '').trim();
        if (!ch) return null;
        const byKey = itemByKey();
        const n = S.visible.filter((x) => { const y = byKey.get(x); return y && (y.channel || '').trim() === ch; }).length;
        return mi(t('menuChannel', n), () => selectChannel(ch));
      })(),
      h('hr'),
      mi(t('copyTo'), () => doCopyOrMove(false), !has || !api.isLoggedIn()),
      mi(t('moveTo'), () => doCopyOrMove(true), !has || !edit),
      mi(t('toTop'), () => doMoveSelection('top'), !has || !edit),
      mi(t('toBottom'), () => doMoveSelection('bottom'), !has || !edit),
      h('hr'),
      mi(t('clipCopy'), () => doClip('copy'), !has, '⌘C'),
      mi(t('clipCut'), () => doClip('cut'), !has || !edit, '⌘X'),
      mi(t('paste'), doPaste, !clip.get() || !api.isLoggedIn(), '⌘V'),
      h('hr'),
      mi(t('remove'), doRemove, !has || !edit, 'Del'));
    panel.appendChild(menuEl);
    const r = menuEl.getBoundingClientRect();
    menuEl.style.left = Math.max(4, Math.min(x, window.innerWidth - r.width - 4)) + 'px';
    menuEl.style.top = Math.max(4, Math.min(y, window.innerHeight - r.height - 4)) + 'px';
  }
  panel.addEventListener('mousedown', (e) => { if (menuEl && !menuEl.contains(e.target)) closeMenu(); });

  // ---------- Klavye ----------
  panel.addEventListener('keydown', (e) => {
    e.stopPropagation(); // YouTube kısayolları (k, j, boşluk…) tetiklenmesin
    const inField = /^(INPUT|SELECT|TEXTAREA)$/.test((e.target && e.target.tagName) || '') && e.target.type !== 'checkbox';
    const mod = e.metaKey || e.ctrlKey;
    if (e.key === 'Escape') {
      e.preventDefault();
      if (menuEl) return closeMenu();
      if (modalOpen) return modalCancel && modalCancel();
      if (inField && elSearch.value) { elSearch.value = ''; applyFilter(); return; }
      if (S.selected.size) return setSelection([]);
      return closePanel();
    }
    if (inField || modalOpen || S.busy) return;
    const k = e.key.toLowerCase();
    if (mod && k === 'a') { e.preventDefault(); selectVisible(false); return; }
    if (mod && k === 'c') { e.preventDefault(); if (S.selected.size) doClip('copy'); return; }
    if (mod && k === 'x') { e.preventDefault(); if (S.selected.size && canEdit()) doClip('cut'); return; }
    if (mod && k === 'v') { e.preventDefault(); if (clip.get()) doPaste(); return; }
    if ((e.key === 'Delete' || e.key === 'Backspace') && S.selected.size && canEdit()) { e.preventDefault(); doRemove(); return; }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!S.visible.length) return;
      let i = S.visible.indexOf(S.focus);
      i = i === -1 ? 0 : Math.max(0, Math.min(S.visible.length - 1, i + (e.key === 'ArrowDown' ? 1 : -1)));
      const nk = S.visible[i];
      if (e.shiftKey) { if (!S.anchor) S.anchor = S.focus || nk; rangeSelect(nk); }
      setFocus(nk, true);
      refreshSelectionUI();
      return;
    }
    if (e.key === ' ' && S.focus) { e.preventDefault(); toggle(S.focus); S.anchor = S.focus; refreshSelectionUI(); }
  });
  // Panel dışına tıklama/kaydırmanın YouTube'a gitmesini engellemeye gerek yok; yalnızca klavye yalıtılır.
  panel.addEventListener('keyup', (e) => e.stopPropagation());
  panel.addEventListener('keypress', (e) => e.stopPropagation());

  // ---------- Modal ----------
  let modalOpen = false;
  let modalCancel = null;
  function modal(title, bodyNodes, buttons, { dismissible = true } = {}) {
    return new Promise((resolve) => {
      const overlay = h('div', { class: 'overlay' });
      const done = (v) => { overlay.remove(); modalOpen = false; modalCancel = null; panel.focus({ preventScroll: true }); resolve(v); };
      const acts = h('div', { class: 'acts' }, buttons.map((b) =>
        h('button', { class: 'btn' + (b.primary ? ' primary' : '') + (b.danger ? ' danger' : ''), onclick: () => done(b.value) }, b.label)));
      const box = h('div', { class: 'modal', role: 'alertdialog' }, h('h3', { text: title }), bodyNodes, buttons.length ? acts : null);
      overlay.appendChild(box);
      if (dismissible) overlay.addEventListener('mousedown', (e) => { if (e.target === overlay) done(null); });
      modalOpen = true;
      modalCancel = dismissible ? () => done(null) : null;
      panel.appendChild(overlay);
      const primary = acts.querySelector('.primary');
      if (primary) primary.focus();
      overlay._done = done;
    });
  }
  const confirmBox = (msg, danger) => modal(t('confirm'), h('p', { text: msg }), [
    { label: t('cancel'), value: false },
    { label: t('ok'), value: true, primary: true, danger: !!danger },
  ]).then((v) => v === true);

  // İlerleme göstergesi
  let prog = null;
  function progressOpen(label) {
    const bar = h('div');
    const txt = h('p', { text: label || t('working') });
    const overlay = h('div', { class: 'overlay' }, h('div', { class: 'modal' }, h('h3', { text: t('working') }), txt, h('div', { class: 'progress' }, bar)));
    panel.appendChild(overlay);
    modalOpen = true;
    prog = { overlay, bar, txt };
  }
  function progress(label, done, total) {
    if (!prog) return;
    prog.txt.textContent = label;
    prog.bar.style.width = total ? Math.round((done / total) * 100) + '%' : '100%';
  }
  function progressClose() { if (prog) { prog.overlay.remove(); prog = null; modalOpen = false; } }

  // Toast
  let toastTimer = null;
  function toast(msg, actions, isErr) {
    elToastText.textContent = msg;
    clear(elToastBtns);
    (actions || []).forEach((a) => elToastBtns.appendChild(h('button', { onclick: () => { hideToast(); a.fn(); } }, a.label)));
    elToast.classList.toggle('err', !!isErr);
    elToast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(hideToast, isErr ? 15000 : (actions && actions.length ? 12000 : 5000));
  }
  function hideToast() { elToast.hidden = true; clearTimeout(toastTimer); }

  async function runTask(fn) {
    if (S.busy) return;
    S.busy = true;
    updateFooter();
    progressOpen();
    try {
      await fn();
    } catch (e) {
      console.warn('[Playlist Multiselect]', e, e && e.detail);
      progressClose();
      toast(t('error', (e && e.message) || String(e)), null, true);
    } finally {
      progressClose();
      S.busy = false;
      updateFooter();
    }
  }

  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  async function reloadAfterChange() {
    S.changed = true;
    await wait(700);
    await load();
  }

  // ---------- Hedef liste seçici ----------
  async function pickTarget(forMove) {
    const sample = (selectedItems()[0] || S.items[0] || {}).videoId;
    let chosen = null;
    const listBox = h('div', { class: 'plist' }, h('div', { class: 'empty', text: t('loadingLists') }));
    const idInput = h('input', { type: 'text', placeholder: t('pasteId') });
    const idErr = h('div', { class: 'muted' });
    const nameInput = h('input', { type: 'text', placeholder: t('newName') });
    const privSel = h('select', { class: 'btn' },
      h('option', { value: 'PRIVATE', text: t('pPrivate') }),
      h('option', { value: 'UNLISTED', text: t('pUnlisted') }),
      h('option', { value: 'PUBLIC', text: t('pPublic') }));
    let resolveFn = null;
    const body = [
      listBox,
      h('div', { class: 'field' }, idInput, h('button', { class: 'btn', onclick: () => {
        const id = core.extractPlaylistId(idInput.value);
        if (!id) { idErr.textContent = t('badId'); return; }
        resolveFn({ type: 'existing', id, title: id });
      } }, t('useId'))),
      idErr,
      h('div', { class: 'muted', text: t('newList') }),
      h('div', { class: 'field' }, nameInput, privSel, h('button', { class: 'btn primary', onclick: () => {
        const name = nameInput.value.trim();
        if (!name) { nameInput.focus(); return; }
        resolveFn({ type: 'new', title: name, privacy: privSel.value });
      } }, t('create'))),
    ];
    const p = modal(forMove ? t('pickTargetMove') : t('pickTarget'), body, [{ label: t('cancel'), value: null }]);
    const overlay = panel.lastElementChild;
    resolveFn = (v) => { chosen = v; overlay._done(v); };
    api.listMyPlaylists(sample).then((lists) => {
      clear(listBox);
      const all = [{ id: 'WL', title: t('watchLater'), privacy: '' }].concat(lists.filter((l) => l.id !== 'WL'))
        .filter((l) => l.id !== S.playlistId && l.id !== 'LL');
      if (all.length <= 1 && !lists.length) listBox.appendChild(h('div', { class: 'empty', text: t('noLists') }));
      const PRIV = { PRIVATE: t('pPrivate'), UNLISTED: t('pUnlisted'), PUBLIC: t('pPublic') };
      all.forEach((l) => listBox.appendChild(h('button', { onclick: () => resolveFn({ type: 'existing', id: l.id, title: l.title }) },
        l.title, l.privacy ? h('span', { class: 'pv', text: PRIV[l.privacy] || l.privacy }) : null)));
    }).catch(() => { clear(listBox); listBox.appendChild(h('div', { class: 'empty', text: t('noLists') })); });
    const r = await p;
    return r || chosen;
  }

  // ---------- İşlemler ----------
  /** Hedefe ekler; {added, skipped, targetId, targetTitle} döner. */
  async function addToTarget(target, videoIds) {
    const unique = Array.from(new Set(videoIds));
    if (target.type === 'new') {
      progress(t('creating'), 0, 0);
      const first = unique.slice(0, 50);
      const id = await api.createPlaylist(target.title, target.privacy, first);
      const rest = unique.slice(50);
      if (rest.length) await api.addVideos(id, rest, (d, n) => progress(t('adding', d + first.length, n + first.length), d, n));
      return { added: unique.length, skipped: 0, targetId: id, targetTitle: target.title };
    }
    if (target.id === S.playlistId) throw new Error(t('sameList'));
    let existing = new Set();
    progress(t('readingTarget'), 0, 0);
    let targetTitle = target.title;
    try {
      const tl = await api.fetchPlaylist(target.id);
      existing = new Set(tl.items.map((x) => x.videoId));
      if (tl.title) targetTitle = tl.title;
    } catch (_) { /* hedef okunamazsa tekrar kontrolü yapılmadan eklenir */ }
    const toAdd = unique.filter((v) => !existing.has(v));
    if (toAdd.length) await api.addVideos(target.id, toAdd, (d, n) => progress(t('adding', d, n), d, n));
    return { added: toAdd.length, skipped: unique.length - toAdd.length, targetId: target.id, targetTitle };
  }

  async function doCopyOrMove(isMove) {
    const items = selectedItems();
    if (!items.length || S.busy) return;
    const target = await pickTarget(isMove);
    if (!target) return;
    if (isMove && !(await confirmBox(t('confirmMove', items.length, target.title), false))) return;
    let res = null;
    let ok = false;
    await runTask(async () => {
      res = await addToTarget(target, items.map((x) => x.videoId));
      if (isMove) {
        await api.removeItems(S.playlistId, items, (d, n) => progress(t('removing', d, n), d, n));
        S.selected.clear();
        progress(t('verifying'), 0, 0);
        await reloadAfterChange();
      }
      ok = true;
    });
    if (!ok || !res) return;
    const openBtn = { label: t('openList'), fn: () => { location.href = '/playlist?list=' + encodeURIComponent(res.targetId); } };
    const msg = isMove ? t('doneMove', items.length) + (res.skipped ? ' ' + t('doneAddSkip', res.added, res.skipped) : '')
      : (res.skipped ? t('doneAddSkip', res.added, res.skipped) : t('doneAdd', res.added));
    toast(msg, [openBtn]);
  }

  async function doRemove() {
    const items = selectedItems();
    if (!items.length || S.busy || !canEdit()) return;
    if (!(await confirmBox(t('confirmRemove', items.length), true))) return;
    let ok = false;
    const pid = S.playlistId;
    await runTask(async () => {
      await api.removeItems(pid, items, (d, n) => progress(t('removing', d, n), d, n));
      ok = true;
      S.selected.clear();
      progress(t('verifying'), 0, 0);
      await reloadAfterChange();
    });
    if (!ok) return;
    const vids = items.map((x) => x.videoId);
    toast(t('doneRemove', items.length) + ' ' + t('undoNote'), [{ label: t('undo'), fn: () => runTask(async () => {
      await api.addVideos(pid, vids, (d, n) => progress(t('adding', d, n), d, n));
      progress(t('verifying'), 0, 0);
      await reloadAfterChange();
      toast(t('doneAdd', vids.length));
    }) }]);
  }

  /** İstenen sıraya getirir; toplu gönderim doğrulanamazsa tek tek yeniden dener. */
  async function applyOrder(desiredKeys) {
    if (S.items.some((it) => !it.setVideoId)) throw new Error(t('needSetIds'));
    const pid = S.playlistId;
    let batch = 20;
    let totalMoves = 0;
    for (let attempt = 0; attempt < 2; attempt++) {
      const current = S.items.map(keyOf);
      const want = desiredKeys.filter((k) => current.includes(k));
      // Yükleme arasında listeye eklenmiş öğeler varsa sona koy
      current.forEach((k) => { if (!want.includes(k)) want.push(k); });
      const plan = core.planReorder(current, want);
      if (!plan.moves.length) return totalMoves;
      await api.applyMoves(pid, plan.moves, (d, n) => progress(t('moving', d, n), d, n), batch);
      totalMoves += plan.moves.length;
      progress(t('verifying'), 0, 0);
      await reloadAfterChange();
      const now = S.items.map(keyOf);
      if (now.length === want.length && now.every((k, i) => k === want[i])) return totalMoves;
      batch = 1; // sunucu toplu taşımayı farklı yorumladıysa tek tek dene
    }
    throw new Error(t('orderMismatch'));
  }

  async function doMoveSelection(where) {
    if (!S.selected.size || S.busy || !canEdit()) return;
    const desired = core.orderWithSelectionAt(S.items.map(keyOf), S.selected, where);
    const plan = core.planReorder(S.items.map(keyOf), desired);
    if (!plan.moves.length) { toast(t('nothingToDo')); return; }
    let n = null;
    await runTask(async () => { n = await applyOrder(desired); });
    if (n != null) toast(t('doneOrder', n));
  }

  async function doSort(mode, label) {
    if (S.busy || !canEdit() || S.items.length < 2) return;
    const desired = core.sortItems(S.items, mode).map(keyOf);
    const plan = core.planReorder(S.items.map(keyOf), desired);
    if (!plan.moves.length) { toast(t('nothingToDo')); return; }
    if (!(await confirmBox(t('confirmSort', label, plan.moves.length), false))) return;
    let n = null;
    await runTask(async () => { n = await applyOrder(desired); });
    if (n != null) toast(t('doneOrder', n));
  }

  function doClip(mode) {
    const items = selectedItems();
    if (!items.length) return;
    clip.set({
      mode, sourceId: S.playlistId, sourceTitle: S.title, at: Date.now(),
      items: items.map((x) => ({ videoId: x.videoId, setVideoId: x.setVideoId, title: x.title })),
    });
    updateFooter();
    toast(mode === 'cut' ? t('cut', items.length) : t('copied', items.length));
  }

  async function doPaste() {
    const c = clip.get();
    if (!c || S.busy || !api.isLoggedIn() || isMix(S.playlistId)) return;
    if (c.mode === 'cut' && c.sourceId === S.playlistId) { toast(t('pasteSame')); return; }
    const here = new Set(S.items.map((x) => x.videoId));
    const unique = Array.from(new Set(c.items.map((x) => x.videoId)));
    const toAdd = unique.filter((v) => !here.has(v));
    let done = false;
    await runTask(async () => {
      if (toAdd.length) await api.addVideos(S.playlistId, toAdd, (d, n) => progress(t('adding', d, n), d, n));
      if (c.mode === 'cut') {
        await api.removeItems(c.sourceId, c.items, (d, n) => progress(t('removing', d, n), d, n));
        clip.clear();
      }
      done = true;
      progress(t('verifying'), 0, 0);
      await reloadAfterChange();
    });
    if (done) toast(toAdd.length === unique.length ? t('pasted', toAdd.length) : t('pastedSkip', toAdd.length, unique.length - toAdd.length));
  }

  // ---------- Silinmiş / özel videolar ----------
  function deadModal(res) {
    const del = res.dead.filter((d) => d.kind === 'deleted');
    const prv = res.dead.filter((d) => d.kind === 'private');
    const incDel = h('input', { type: 'checkbox', checked: del.length > 0, disabled: !del.length });
    const incPrv = h('input', { type: 'checkbox', checked: prv.length > 0, disabled: !prv.length });
    const listBox = h('div', { class: 'plist' }, res.dead.slice().sort((a, b) => (a.index ?? 1e9) - (b.index ?? 1e9)).map((d) =>
      h('div', { class: 'deadrow' },
        h('span', { class: 'muted', text: d.index != null ? '#' + (d.index + 1) : '#?' }),
        h('span', { class: 'mono', text: d.videoId }),
        h('span', { class: 'pv', text: d.kind === 'deleted' ? t('deadDeleted') : t('deadPrivate') }))));
    const edit = canEdit();
    let done = null;
    const removeBtn = h('button', { class: 'btn primary danger', onclick: () => {
      const chosen = res.dead.filter((d) => (d.kind === 'deleted' && incDel.checked) || (d.kind === 'private' && incPrv.checked));
      done(chosen);
    } }, t('deadRemove'));
    const sync = () => { removeBtn.disabled = !edit || !((incDel.checked && del.length) || (incPrv.checked && prv.length)); };
    incDel.addEventListener('change', sync);
    incPrv.addEventListener('change', sync);
    const body = [
      h('p', { text: t('deadSummary', res.hiddenTotal, del.length, prv.length) }),
      res.restricted ? h('p', { text: t('deadRestricted', res.restricted) }) : null,
      res.unknown ? h('p', { text: t('deadUnknown', res.unknown) }) : null,
      res.dead.length ? listBox : h('p', { text: t('deadNone') }),
      res.dead.length ? h('div', { class: 'field' },
        h('label', { class: 'chk' }, incDel, ' ', t('deadIncDeleted', del.length)),
        h('label', { class: 'chk' }, incPrv, ' ', t('deadIncPrivate', prv.length))) : null,
      res.dead.length ? h('div', { class: 'muted', text: edit ? t('deadNoUndo') : t('deadLogin') }) : null,
      h('div', { class: 'acts' },
        h('button', { class: 'btn', onclick: () => done(null) }, t(res.dead.length ? 'cancel' : 'ok')),
        res.dead.length ? removeBtn : null),
    ];
    sync();
    const p = modal(t('deadTitle'), body, []);
    const overlay = panel.lastElementChild;
    done = (v) => overlay._done(v);
    return p;
  }

  async function doFindDead() {
    if (S.busy || !S.playlistId) return;
    const pid = S.playlistId;
    const scanProgress = (phase, a, b) => phase === 'scan' ? progress(t('scanHidden', a), 0, 0) : progress(t('checkingDead', a, b), a, b);
    let res = null;
    await runTask(async () => { res = await api.findDeadVideos(pid, S.items.map((x) => x.videoId), scanProgress); });
    if (!res) return;
    if (res.noHidden || !res.hiddenTotal) { toast(t('noHidden')); return; }
    const chosen = await deadModal(res);
    if (!chosen || !chosen.length || !canEdit()) return;
    let out = null;
    await runTask(async () => {
      await api.removeDead(pid, chosen, (d, n) => progress(t('removing', d, n), d, n));
      progress(t('verifying'), 0, 0);
      await wait(800);
      const again = await api.findDeadVideos(pid, S.items.map((x) => x.videoId));
      const left = new Set(again.dead.map((d) => d.videoId));
      const ids = Array.from(new Set(chosen.map((c) => c.videoId)));
      out = { removed: ids.filter((v) => !left.has(v)).length, left: ids.filter((v) => left.has(v)).length };
      S.changed = true;
      await load();
    });
    if (out) toast(out.left ? t('deadPartial', out.removed, out.left) : t('deadDone', out.removed), null, !!out.left);
  }

  // ---------- SPA gezinme takibi ----------
  let lastHref = '';
  function onNav() {
    if (location.href === lastHref) return;
    lastHref = location.href;
    updateLauncher();
  }
  document.addEventListener('yt-navigate-finish', onNav, true);
  window.addEventListener('popstate', onNav);
  setInterval(onNav, 1000);
  new MutationObserver(syncTheme).observe(document.documentElement, { attributes: true, attributeFilter: ['dark'] });
  window.addEventListener('storage', (e) => { if (e.key === CLIP_KEY) updateFooter(); });

  function init() { mount(); syncTheme(); onNav(); }
  if (document.body) init(); else document.addEventListener('DOMContentLoaded', init, { once: true });
})(globalThis);
