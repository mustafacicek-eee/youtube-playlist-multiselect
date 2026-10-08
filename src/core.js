/*
 * Playlist Çoklu Seçim — core.js
 * Geliştirici: Mustafa Çiçek — https://github.com/mustafacicek-eee · MIT Lisansı
 * Saf (DOM'suz, ağsız) yardımcılar. Node ile birim testi yapılabilir.
 */
(function (root) {
  'use strict';

  const core = {};

  /** YouTube metin nesnelerini ({simpleText} | {runs:[]} | {content} | string) düz metne çevirir. */
  core.textOf = function (t) {
    if (!t) return '';
    if (typeof t === 'string') return t;
    if (typeof t.simpleText === 'string') return t.simpleText;
    if (typeof t.content === 'string') return t.content;
    if (Array.isArray(t.runs)) return t.runs.map((r) => (r && r.text) || '').join('');
    return '';
  };

  /** "1:02:03" -> 3723 saniye; ayrıştırılamazsa null. */
  core.parseDuration = function (s) {
    if (!s || typeof s !== 'string') return null;
    const parts = s.trim().split(':');
    if (parts.length < 2 || parts.length > 3) return null;
    let total = 0;
    for (const p of parts) {
      if (!/^\d+$/.test(p)) return null;
      total = total * 60 + Number(p);
    }
    return total;
  };

  /**
   * /youtubei/v1/next yanıtındaki oynatma listesi panelini ayrıştırır.
   * Doğrulandı (2026-09): playlist.playlist.contents[].playlistPanelVideoRenderer
   *   alanları: videoId, playlistSetVideoId, title, shortBylineText, lengthText,
   *   navigationEndpoint.watchEndpoint.index
   */
  core.parseNextPlaylist = function (resp) {
    const pl = resp && resp.contents && resp.contents.twoColumnWatchNextResults &&
      resp.contents.twoColumnWatchNextResults.playlist &&
      resp.contents.twoColumnWatchNextResults.playlist.playlist;
    if (!pl) return null;
    const items = [];
    for (const c of pl.contents || []) {
      const v = c && c.playlistPanelVideoRenderer;
      if (!v || !v.videoId) continue;
      const we = v.navigationEndpoint && v.navigationEndpoint.watchEndpoint;
      const durationText = core.textOf(v.lengthText);
      items.push({
        setVideoId: v.playlistSetVideoId || null,
        videoId: v.videoId,
        index: we && typeof we.index === 'number' ? we.index : null,
        title: core.textOf(v.title),
        channel: core.textOf(v.shortBylineText) || core.textOf(v.longBylineText),
        durationText,
        duration: core.parseDuration(durationText),
      });
    }
    return {
      playlistId: pl.playlistId || null,
      title: core.textOf(pl.titleText) || core.textOf(pl.title),
      total: typeof pl.totalVideos === 'number' ? pl.totalVideos : null,
      items,
    };
  };

  /** Pencereli /next sonuçlarını birleştirir: setVideoId (yoksa index) ile tekilleştirir, index'e göre sıralar. */
  core.mergeWindows = function (map, items) {
    let added = 0;
    for (const it of items) {
      const key = it.setVideoId || ('idx:' + it.index + ':' + it.videoId);
      if (!map.has(key)) {
        map.set(key, it);
        added++;
      }
    }
    return added;
  };

  core.sortedFromMap = function (map) {
    const arr = Array.from(map.values());
    arr.sort((a, b) => {
      if (a.index == null && b.index == null) return 0;
      if (a.index == null) return 1;
      if (b.index == null) return -1;
      return a.index - b.index;
    });
    return arr;
  };

  /** Tekrarlanan videolar: her videoId'nin ilk geçişi hariç diğer satırların anahtarları. */
  core.findDuplicateKeys = function (items, keyOf) {
    const seen = new Set();
    const dups = [];
    for (const it of items) {
      if (seen.has(it.videoId)) dups.push(keyOf(it));
      else seen.add(it.videoId);
    }
    return dups;
  };

  /** Metin filtresi: boşlukla ayrılmış tüm kelimeler başlıkta veya kanalda geçmeli (Türkçe büyük/küçük harf duyarsız). */
  core.normalize = function (s) {
    return String(s || '').toLocaleLowerCase('tr-TR').normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/ı/g, 'i');
  };
  core.matchesFilter = function (item, query) {
    const q = core.normalize(query).trim();
    if (!q) return true;
    const hay = core.normalize(item.title + ' ' + item.channel);
    return q.split(/\s+/).every((w) => hay.includes(w));
  };

  /** Sıralama anahtarları. Karşılaştırmalar kararlı (stable) tutulur. */
  core.sortItems = function (items, mode, rng) {
    const arr = items.slice();
    const coll = new Intl.Collator('tr', { sensitivity: 'base', numeric: true });
    const dur = (x) => (x.duration == null ? Number.POSITIVE_INFINITY : x.duration);
    switch (mode) {
      case 'title-asc': arr.sort((a, b) => coll.compare(a.title, b.title)); break;
      case 'title-desc': arr.sort((a, b) => coll.compare(b.title, a.title)); break;
      case 'channel-asc': arr.sort((a, b) => coll.compare(a.channel, b.channel) || coll.compare(a.title, b.title)); break;
      case 'duration-asc': arr.sort((a, b) => dur(a) - dur(b)); break;
      case 'duration-desc': arr.sort((a, b) => {
        const da = a.duration == null ? -1 : a.duration;
        const db = b.duration == null ? -1 : b.duration;
        return db - da;
      }); break;
      case 'reverse': arr.reverse(); break;
      case 'shuffle': {
        const r = rng || Math.random;
        for (let i = arr.length - 1; i > 0; i--) {
          const j = Math.floor(r() * (i + 1));
          const t = arr[i]; arr[i] = arr[j]; arr[j] = t;
        }
        break;
      }
      default: throw new Error('Bilinmeyen sıralama: ' + mode);
    }
    return arr;
  };

  /** Kanal grupları: [{channel, count}] — çoktan aza, eşitlikte ada göre. Kanal adı boş olanlar atlanır. */
  core.channelGroups = function (items) {
    const counts = new Map();
    for (const it of items) {
      const c = (it.channel || '').trim();
      if (!c) continue;
      counts.set(c, (counts.get(c) || 0) + 1);
    }
    const coll = new Intl.Collator('tr', { sensitivity: 'base', numeric: true });
    return Array.from(counts, ([channel, count]) => ({ channel, count }))
      .sort((a, b) => b.count - a.count || coll.compare(a.channel, b.channel));
  };

  /**
   * Hazır süre aralıkları (saniye). Alt sınır dahil, üst sınır hariç: [min, max).
   * 'unknown' = süresi okunamayan (canlı/yaklaşan yayın vb.).
   */
  core.DURATION_PRESETS = [
    { id: 'lt1', min: 0, max: 60 },
    { id: '1to10', min: 60, max: 600 },
    { id: '10to30', min: 600, max: 1800 },
    { id: '30to60', min: 1800, max: 3600 },
    { id: 'gt60', min: 3600, max: Infinity },
    { id: 'unknown', unknown: true },
  ];

  /** Öğe süre aralığına uyuyor mu? range: {min, max} ya da {unknown:true} */
  core.inDurationRange = function (item, range) {
    if (range.unknown) return item.duration == null;
    if (item.duration == null) return false;
    return item.duration >= range.min && item.duration < range.max;
  };

  /**
   * Kullanıcının dakika cinsinden girdiği aralığı doğrular ve saniyeye çevirir.
   * max boş bırakılabilir (sınırsız). Geçersizse null.
   */
  core.parseMinuteRange = function (minStr, maxStr) {
    const parse = (s) => {
      const v = String(s == null ? '' : s).trim().replace(',', '.');
      if (v === '') return undefined;
      if (!/^\d+(\.\d+)?$/.test(v)) return NaN;
      return Number(v);
    };
    const mn = parse(minStr);
    const mx = parse(maxStr);
    const min = mn === undefined ? 0 : mn;
    const max = mx === undefined ? Infinity : mx;
    if (Number.isNaN(min) || Number.isNaN(max)) return null;
    const out = { min: Math.round(min * 60), max: max === Infinity ? Infinity : Math.round(max * 60) };
    if (out.max <= out.min) return null;
    return out;
  };

  // ---------- Erişilemeyen videolar (canlı doğrulandı, 2026-09-24) ----------
  // /browse (VL<id>) yanıtında "Show unavailable videos" menü öğesi: icon VISIBILITY +
  // browseEndpoint{browseId:'VL<id>', params}. Bu params ile gizlenen videolar da lockupViewModel olarak gelir.
  // Silinmiş/özel olanların lockup'ında başlık YOKTUR; bölge kısıtlılarının başlığı vardır (oEmbed 200).

  /** Nesne ağacında belirli anahtarın tüm değerleri. */
  core.findAllByKey = function (obj, key, out) {
    out = out || [];
    if (!obj || typeof obj !== 'object') return out;
    if (Array.isArray(obj)) { for (const x of obj) core.findAllByKey(x, key, out); return out; }
    for (const k in obj) {
      if (k === key) out.push(obj[k]);
      core.findAllByKey(obj[k], key, out); // eşleşenin içine de in: YouTube aynı anahtarı iç içe kullanıyor
    }
    return out;
  };

  /** "Erişilemeyen videoları göster" komutunun params değeri; yoksa null. */
  core.findShowUnavailableParams = function (resp, playlistId) {
    const want = 'VL' + playlistId;
    const pick = (node) => {
      const eps = core.findAllByKey(node, 'browseEndpoint', []);
      const ep = eps.find((e) => e && e.browseId === want && typeof e.params === 'string' && e.params);
      return ep ? ep.params : null;
    };
    for (const m of core.findAllByKey(resp, 'menuNavigationItemRenderer', [])) {
      if (m && m.icon && m.icon.iconType === 'VISIBILITY') { const p = pick(m.navigationEndpoint); if (p) return p; }
    }
    for (const li of core.findAllByKey(resp, 'listItemViewModel', [])) {
      const img = JSON.stringify((li && li.leadingImage) || {});
      if (img.indexOf('"VISIBILITY"') !== -1) { const p = pick(li.rendererContext); if (p) return p; }
    }
    return null;
  };

  /** Yanıttaki video lockup'ları ve devam jetonları. Oynatma listesi lockup'ları (öneriler) atlanır. */
  core.collectVideoLockups = function (obj, lockups, tokens) {
    if (!obj || typeof obj !== 'object') return;
    if (Array.isArray(obj)) { for (const x of obj) core.collectVideoLockups(x, lockups, tokens); return; }
    for (const k in obj) {
      const v = obj[k];
      if (k === 'lockupViewModel') {
        if (v && v.contentType === 'LOCKUP_CONTENT_TYPE_VIDEO' && v.contentId) lockups.push(v);
        continue;
      }
      if (k === 'continuationItemViewModel' || k === 'continuationItemRenderer') {
        const c = core.findAllByKey(v, 'continuationCommand', []).find((x) => x && typeof x.token === 'string');
        if (c) tokens.push(c.token);
        continue;
      }
      core.collectVideoLockups(v, lockups, tokens);
    }
  };

  /**
   * Oynatma listesi satırlarını iki biçimden de okur (canlı doğrulandı, 2026-09-24):
   *  - lockupViewModel: başkasının listesi (ör. herkese açık listeler)
   *  - playlistVideoRenderer: SAHİBİ olduğun liste; setVideoId satırda doğrudan bulunur
   * Döner: {videoId, index, format, deadSignal, setVideoId, raw}
   *  deadSignal = ölü olma işareti (lockup: başlık yok; pvr: isPlayable===false veya süre yok).
   *  Bölge kısıtlı gizli satırlarda bu işaret YOK (canlı: başlık/süre var, isPlayable true).
   */
  core.collectPlaylistRows = function (obj, rows, tokens) {
    if (!obj || typeof obj !== 'object') return;
    if (Array.isArray(obj)) { for (const x of obj) core.collectPlaylistRows(x, rows, tokens); return; }
    for (const k in obj) {
      const v = obj[k];
      if (k === 'lockupViewModel') {
        if (v && v.contentType === 'LOCKUP_CONTENT_TYPE_VIDEO' && v.contentId) {
          rows.push({ videoId: v.contentId, index: core.lockupIndex(v), format: 'lockup', deadSignal: !core.lockupTitle(v), setVideoId: null, raw: v });
        }
        continue;
      }
      if (k === 'playlistVideoRenderer') {
        if (v && v.videoId) {
          const idxText = core.textOf(v.index);
          const idx = /^\d+$/.test(idxText) ? Number(idxText) - 1 : null;
          const noLength = !core.textOf(v.lengthText) && !v.lengthSeconds;
          rows.push({ videoId: v.videoId, index: idx, format: 'pvr', deadSignal: v.isPlayable === false || noLength,
            setVideoId: typeof v.setVideoId === 'string' && v.setVideoId ? v.setVideoId : null, raw: v });
        }
        continue;
      }
      if (k === 'continuationItemViewModel' || k === 'continuationItemRenderer') {
        const c = core.findAllByKey(v, 'continuationCommand', []).find((x) => x && typeof x.token === 'string');
        if (c) tokens.push(c.token);
        continue;
      }
      core.collectPlaylistRows(v, rows, tokens);
    }
  };

  /** Satır için güvenli kaldırma eylemi: pvr → kendi setVideoId'si; lockup → YouTube'un kendi komutu (varsa). */
  core.removeActionForRow = function (row, playlistId) {
    if (row.format === 'pvr' && row.setVideoId) {
      return { action: 'ACTION_REMOVE_VIDEO', setVideoId: row.setVideoId, removedVideoId: row.videoId };
    }
    return core.findOwnRemoveAction(row.raw, playlistId);
  };

  core.lockupTitle = function (l) {
    const m = l && l.metadata && l.metadata.lockupMetadataViewModel;
    return m ? core.textOf(m.title).trim() : '';
  };

  core.lockupIndex = function (l) {
    const we = core.findAllByKey(l && l.rendererContext, 'watchEndpoint', [])[0];
    return we && typeof we.index === 'number' ? we.index : null;
  };

  /**
   * Lockup'ın içinde YouTube'un bu liste için kendi "listeden kaldır" komutu varsa onu döndürür
   * (liste sahibine gösterilen menü). Yalnızca bu liste ve bu videoya ait, bilinen eylemler kabul edilir.
   */
  core.findOwnRemoveAction = function (l, playlistId) {
    for (const ep of core.findAllByKey(l, 'playlistEditEndpoint', [])) {
      if (!ep || ep.playlistId !== playlistId || !Array.isArray(ep.actions) || ep.actions.length !== 1) continue;
      const a = ep.actions[0];
      if (a && a.action === 'ACTION_REMOVE_VIDEO' && typeof a.setVideoId === 'string' && a.setVideoId) {
        return { action: 'ACTION_REMOVE_VIDEO', setVideoId: a.setVideoId, removedVideoId: l.contentId };
      }
      if (a && a.action === 'ACTION_REMOVE_VIDEO_BY_VIDEO_ID' && a.removedVideoId === l.contentId) {
        return { action: 'ACTION_REMOVE_VIDEO_BY_VIDEO_ID', removedVideoId: l.contentId };
      }
    }
    return null;
  };

  /**
   * oEmbed HTTP durumu → sınıf. Yalnızca kesin durumlar sınıflanır; gerisi 'unknown' (dokunulmaz).
   * Canlı gözlem: silinmiş → 404, özel → 403. 401 bilerek 'unknown': gömmesi kapalı SAĞLAM videolar da 401 dönebilir.
   */
  core.classifyOembed = function (status) {
    if (status === 404) return 'deleted';
    if (status === 403) return 'private';
    if (status === 200) return 'available';
    return 'unknown';
  };

  /** Seçilileri başa/sona taşıyan hedef sıra (seçilenlerin kendi aralarındaki sırası korunur). */
  core.orderWithSelectionAt = function (keys, selectedSet, where) {
    const sel = keys.filter((k) => selectedSet.has(k));
    const rest = keys.filter((k) => !selectedSet.has(k));
    return where === 'top' ? sel.concat(rest) : rest.concat(sel);
  };

  /** En uzun artan alt dizi (indeks listesi döner). O(n log n). */
  core.lisIndices = function (seq) {
    const n = seq.length;
    const tails = [];
    const tailIdx = [];
    const prev = new Array(n).fill(-1);
    for (let i = 0; i < n; i++) {
      let lo = 0, hi = tails.length;
      while (lo < hi) {
        const mid = (lo + hi) >> 1;
        if (tails[mid] < seq[i]) lo = mid + 1; else hi = mid;
      }
      tails[lo] = seq[i];
      tailIdx[lo] = i;
      prev[i] = lo > 0 ? tailIdx[lo - 1] : -1;
    }
    const out = [];
    let k = tailIdx.length ? tailIdx[tailIdx.length - 1] : -1;
    while (k !== -1) { out.push(k); k = prev[k]; }
    return out.reverse();
  };

  /**
   * Mevcut sıradan istenen sıraya geçmek için en az sayıda tekil taşıma planı.
   * Yerinde kalan öğeler = en uzun artan alt dizi (LIS); diğerleri taşınır.
   * Her taşıma: {key, after} (key'i after'ın hemen arkasına) veya {key, before}.
   * Döndürür: { moves, result } — result, planın yerel simülasyonunun sonucu (test için).
   */
  core.planReorder = function (current, desired) {
    if (current.length !== desired.length) throw new Error('Uzunluklar farklı');
    const pos = new Map(current.map((k, i) => [k, i]));
    if (pos.size !== current.length) throw new Error('Anahtarlar benzersiz değil');
    for (const k of desired) if (!pos.has(k)) throw new Error('Bilinmeyen anahtar: ' + k);

    const seq = desired.map((k) => pos.get(k));
    const settled = new Set(core.lisIndices(seq).map((i) => desired[i]));

    const list = current.slice();
    const moves = [];
    const removeKey = (k) => list.splice(list.indexOf(k), 1);

    for (let i = 0; i < desired.length; i++) {
      const k = desired[i];
      if (settled.has(k)) continue;
      if (i > 0) {
        const prevKey = desired[i - 1]; // her zaman yerleşmiş durumda
        removeKey(k);
        list.splice(list.indexOf(prevKey) + 1, 0, k);
        moves.push({ key: k, after: prevKey });
      } else {
        // İlk öğe: listedeki ilk yerleşmiş öğenin önüne.
        removeKey(k);
        const firstSettled = list.find((x) => settled.has(x));
        list.splice(list.indexOf(firstSettled), 0, k);
        moves.push({ key: k, before: firstSettled });
      }
      settled.add(k);
    }
    return { moves, result: list };
  };

  /** Dizi parçalama. */
  core.chunk = function (arr, size) {
    const out = [];
    for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
    return out;
  };

  /** URL veya çıplak ID'den playlist ID'si çıkarır. */
  core.extractPlaylistId = function (input) {
    const s = String(input || '').trim();
    if (!s) return null;
    const m = s.match(/[?&]list=([A-Za-z0-9_-]+)/);
    if (m) return m[1];
    if (/^(PL|UU|LL|FL|OL|RD|WL)[A-Za-z0-9_-]*$/.test(s) || /^[A-Za-z0-9_-]{10,}$/.test(s)) return s;
    return null;
  };

  core.formatDuration = function (sec) {
    if (sec == null || !isFinite(sec)) return '—';
    const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
    const pad = (n) => String(n).padStart(2, '0');
    return h ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = core;
  else {
    root.__msx = root.__msx || {};
    root.__msx.core = core;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
