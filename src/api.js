/*
 * Playlist Çoklu Seçim — api.js
 * Geliştirici: Mustafa Çiçek — https://github.com/mustafacicek-eee · MIT Lisansı
 * YouTube'un kendi web istemcisinin kullandığı InnerTube uç noktalarına,
 * sayfanın kendi oturumuyla (aynı köken, youtube.com) istek atar.
 * Hiçbir üçüncü tarafa veri gönderilmez.
 *
 * Doğrulama durumu (2026-09-24):
 *  [CANLI DOĞRULANDI, oturumsuz] /next pencereleme: playlistPanelVideoRenderer + playlistSetVideoId,
 *      pencere = [index-200, index+199]; tüm liste /browse ile aynı sırada.
 *  [KAYNAKTAN] browse/edit_playlist eylemleri: ACTION_ADD_VIDEO{addedVideoId},
 *      ACTION_REMOVE_VIDEO{setVideoId}, ACTION_MOVE_VIDEO_AFTER{setVideoId, movedSetVideoIdPredecessor}
 *      (YouTube.js PlaylistManager), ACTION_MOVE_VIDEO_BEFORE{setVideoId, movedSetVideoIdSuccessor}
 *      (ytmusicapi). ACTION_ADD_VIDEO / ACTION_REMOVE_VIDEO_BY_VIDEO_ID biçimi canlı yanıtta da görüldü.
 *  [KAYNAKTAN] playlist/create, playlist/get_add_to_playlist (YouTube.js).
 *  [KAYNAKTAN] SAPISIDHASH yetkilendirmesi (YouTube.js, ytmusicapi).
 *  Oturum açık hesapta yazma işlemleri bu ortamda canlı test EDİLEMEDİ.
 */
(function (root) {
  'use strict';
  const core = root.__msx.core;

  const cfg = (k) => (root.ytcfg && typeof root.ytcfg.get === 'function' ? root.ytcfg.get(k) : undefined);
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  function getCookie(name) {
    const m = document.cookie.match(new RegExp('(?:^|;\\s*)' + name.replace(/[-[\]/{}()*+?.\\^$|]/g, '\\$&') + '=([^;]*)'));
    return m ? decodeURIComponent(m[1]) : null;
  }

  async function sha1Hex(str) {
    const buf = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(str));
    return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  async function authHeader() {
    const sapisid = getCookie('SAPISID') || getCookie('__Secure-3PAPISID');
    if (!sapisid) return null;
    const ts = Math.floor(Date.now() / 1000);
    const origin = location.origin; // https://www.youtube.com
    return 'SAPISIDHASH ' + ts + '_' + (await sha1Hex(ts + ' ' + sapisid + ' ' + origin));
  }

  class ApiError extends Error {
    constructor(message, detail) { super(message); this.detail = detail; }
  }

  const api = {};

  api.isLoggedIn = function () {
    return cfg('LOGGED_IN') === true && !!(getCookie('SAPISID') || getCookie('__Secure-3PAPISID'));
  };

  api.post = async function (endpoint, body, { auth = true } = {}) {
    const context = cfg('INNERTUBE_CONTEXT');
    if (!context) throw new ApiError('YouTube yapılandırması (ytcfg) bulunamadı. Sayfayı yenileyin.');
    const headers = { 'Content-Type': 'application/json' };
    const clientName = cfg('INNERTUBE_CONTEXT_CLIENT_NAME');
    const clientVersion = cfg('INNERTUBE_CLIENT_VERSION');
    if (clientName != null) headers['X-Youtube-Client-Name'] = String(clientName);
    if (clientVersion) headers['X-Youtube-Client-Version'] = String(clientVersion);
    if (auth) {
      const a = await authHeader();
      if (a) {
        headers['Authorization'] = a;
        headers['X-Origin'] = location.origin;
        headers['X-Goog-AuthUser'] = String(cfg('SESSION_INDEX') ?? '0');
        const pageId = cfg('DELEGATED_SESSION_ID');
        if (pageId) headers['X-Goog-PageId'] = String(pageId);
      }
    }
    const res = await fetch('/youtubei/v1/' + endpoint + '?prettyPrint=false', {
      method: 'POST',
      credentials: 'same-origin',
      headers,
      body: JSON.stringify(Object.assign({ context: JSON.parse(JSON.stringify(context)) }, body)),
    });
    let json = null;
    try { json = await res.json(); } catch (_) { /* boş gövde */ }
    if (!res.ok) {
      const msg = (json && json.error && json.error.message) || ('HTTP ' + res.status);
      throw new ApiError(msg, json);
    }
    return json;
  };

  /**
   * Bir oynatma listesinin tamamını /next pencereleriyle çeker.
   * onProgress(yüklenen, toplam)
   */
  api.fetchPlaylist = async function (playlistId, onProgress) {
    const map = new Map();
    let body = { playlistId };
    let meta = null;
    for (let call = 0; call < 80; call++) {
      const resp = await api.post('next', body);
      const page = core.parseNextPlaylist(resp);
      if (!page) {
        if (call === 0) throw new ApiError('Liste okunamadı (gizli, silinmiş ya da erişim yok olabilir).', resp);
        break;
      }
      if (!meta) meta = { playlistId: page.playlistId || playlistId, title: page.title, total: page.total };
      const added = core.mergeWindows(map, page.items);
      if (onProgress) onProgress(map.size, meta.total);
      const last = page.items[page.items.length - 1];
      if (!added || !last || last.index == null) break;
      if (meta.total != null && map.size >= meta.total) break;
      body = { playlistId, videoId: last.videoId, index: last.index };
      await sleep(120);
    }
    return Object.assign(meta || { playlistId, title: '', total: 0 }, { items: core.sortedFromMap(map) });
  };

  function ensureSucceeded(resp, what) {
    const status = resp && resp.status;
    if (typeof status === 'string' && status.indexOf('SUCCEEDED') !== -1) return resp;
    const msg = (resp && resp.error && resp.error.message) ||
      (resp && resp.alerts && JSON.stringify(resp.alerts).slice(0, 200)) || 'bilinmeyen yanıt';
    throw new ApiError(what + ' başarısız: ' + msg, resp);
  }

  api.editPlaylist = async function (playlistId, actions) {
    const resp = await api.post('browse/edit_playlist', { playlistId, actions });
    return ensureSucceeded(resp, 'Liste düzenleme');
  };

  /** Toplu ekleme. onProgress(yapılan, toplam) */
  api.addVideos = async function (playlistId, videoIds, onProgress, batch = 50) {
    let done = 0;
    for (const part of core.chunk(videoIds, batch)) {
      await api.editPlaylist(playlistId, part.map((id) => ({ action: 'ACTION_ADD_VIDEO', addedVideoId: id })));
      done += part.length;
      if (onProgress) onProgress(done, videoIds.length);
      await sleep(200);
    }
  };

  /** Toplu kaldırma. items: [{setVideoId, videoId}] */
  api.removeItems = async function (playlistId, items, onProgress, batch = 50) {
    let done = 0;
    for (const part of core.chunk(items, batch)) {
      await api.editPlaylist(playlistId, part.map((it) => it.setVideoId
        ? { action: 'ACTION_REMOVE_VIDEO', setVideoId: it.setVideoId, removedVideoId: it.videoId }
        : { action: 'ACTION_REMOVE_VIDEO_BY_VIDEO_ID', removedVideoId: it.videoId }));
      done += part.length;
      if (onProgress) onProgress(done, items.length);
      await sleep(200);
    }
  };

  /** Taşıma planını uygular. moves: core.planReorder çıktısı (anahtar = setVideoId). */
  api.applyMoves = async function (playlistId, moves, onProgress, batch = 1) {
    let done = 0;
    for (const part of core.chunk(moves, batch)) {
      await api.editPlaylist(playlistId, part.map((m) => m.after
        ? { action: 'ACTION_MOVE_VIDEO_AFTER', setVideoId: m.key, movedSetVideoIdPredecessor: m.after }
        : { action: 'ACTION_MOVE_VIDEO_BEFORE', setVideoId: m.key, movedSetVideoIdSuccessor: m.before }));
      done += part.length;
      if (onProgress) onProgress(done, moves.length);
      await sleep(batch > 1 ? 250 : 120);
    }
  };

  /** Yeni liste oluşturur (ilk videolarla birlikte, YouTube.js'deki gibi); oluşturulan ID'yi döndürür. */
  api.createPlaylist = async function (title, privacyStatus, initialVideoIds) {
    const resp = await api.post('playlist/create', { title, privacyStatus: privacyStatus || 'PRIVATE', videoIds: initialVideoIds || [] });
    if (!resp || !resp.playlistId) throw new ApiError('Liste oluşturulamadı.', resp);
    return resp.playlistId;
  };

  function findAll(obj, key, out) {
    if (!obj || typeof obj !== 'object') return out;
    if (Array.isArray(obj)) { for (const x of obj) findAll(x, key, out); return out; }
    for (const k in obj) {
      if (k === key) out.push(obj[k]);
      else findAll(obj[k], key, out);
    }
    return out;
  }

  /**
   * Kullanıcının kaydedebileceği listeler.
   * 1) playlist/get_add_to_playlist → playlistAddToOptionRenderer (YouTube.js'deki biçim)
   * 2) Olmazsa /feed/playlists (FEplaylist_aggregation) → LOCKUP_CONTENT_TYPE_PLAYLIST
   * Her ikisi de oturumlu hesapta canlı doğrulanmadı; arayüzde elle ID/URL girme her zaman var.
   */
  api.listMyPlaylists = async function (sampleVideoId) {
    const seen = new Map();
    try {
      const r = await api.post('playlist/get_add_to_playlist', { videoIds: [sampleVideoId], excludeWatchLater: false });
      for (const o of findAll(r, 'playlistAddToOptionRenderer', [])) {
        if (o && o.playlistId && !seen.has(o.playlistId)) seen.set(o.playlistId, { id: o.playlistId, title: core.textOf(o.title) || o.playlistId, privacy: o.privacy || '' });
      }
    } catch (_) { /* yedek yönteme geç */ }
    if (!seen.size) {
      try {
        const r = await api.post('browse', { browseId: 'FEplaylist_aggregation' });
        for (const l of findAll(r, 'lockupViewModel', [])) {
          if (!l || l.contentType !== 'LOCKUP_CONTENT_TYPE_PLAYLIST' || !l.contentId) continue;
          const t = l.metadata && l.metadata.lockupMetadataViewModel && core.textOf(l.metadata.lockupMetadataViewModel.title);
          if (!seen.has(l.contentId)) seen.set(l.contentId, { id: l.contentId, title: t || l.contentId, privacy: '' });
        }
      } catch (_) { /* elle giriş kalır */ }
    }
    return Array.from(seen.values());
  };

  // ---------- Silinmiş / özel videolar ----------
  async function oembedOnce(videoId) {
    try {
      const r = await fetch('/oembed?format=json&url=' + encodeURIComponent('https://www.youtube.com/watch?v=' + videoId), { credentials: 'same-origin' });
      return r.status;
    } catch (_) {
      return 0; // ağ hatası
    }
  }
  /** Hız sınırı (429) / ağ hatası / 5xx'te bir kez bekleyip yeniden dener; yine olmazsa 'unknown' kalır → dokunulmaz. */
  async function oembedStatus(videoId) {
    const st = await oembedOnce(videoId);
    if (st === 429 || st === 0 || st >= 500) { await sleep(1500); return oembedOnce(videoId); }
    return st;
  }

  /**
   * Listede YouTube'un gizlediği videoları tarar ve yalnızca kesin ölü olanları döndürür.
   * Aday = gizli + ölü işareti (lockup: başlık yok; sahibin listesi: oynatılamaz/süresiz); kesinleşme = oEmbed 404 (silinmiş) / 403 (özel).
   * Canlı doğrulama (2026-09-24, 2 liste): 19/19 başlıksız video 404/403; başlıklı gizliler 200 (bölge kısıtlı).
   * onProgress(aşama, a, b): 'scan' (taranan) | 'check' (kontrol edilen, toplam)
   */
  api.findDeadVideos = async function (playlistId, availableVideoIds, onProgress) {
    const r0 = await api.post('browse', { browseId: 'VL' + playlistId });
    const params = core.findShowUnavailableParams(r0, playlistId);
    if (!params) return { noHidden: true, hiddenTotal: 0, dead: [], restricted: 0, unknown: 0 };
    const r = await api.post('browse', { browseId: 'VL' + playlistId, params });
    const rows = [];
    const tokens = [];
    core.collectPlaylistRows(r.contents, rows, tokens);
    const seenTok = new Set();
    for (let pages = 0; tokens.length && pages < 120; ) {
      const tok = tokens.shift();
      if (seenTok.has(tok)) continue;
      seenTok.add(tok);
      const c = await api.post('browse', { continuation: tok });
      core.collectPlaylistRows(c.onResponseReceivedActions, rows, tokens);
      pages++;
      if (onProgress) onProgress('scan', rows.length);
      await sleep(120);
    }
    const avail = new Set(availableVideoIds);
    const hidden = rows.filter((x) => !avail.has(x.videoId));
    const candidates = hidden.filter((x) => x.deadSignal);
    const ids = Array.from(new Set(candidates.map((x) => x.videoId)));
    const status = new Map();
    for (let i = 0; i < ids.length; i++) {
      status.set(ids[i], await oembedStatus(ids[i]));
      if (onProgress) onProgress('check', i + 1, ids.length);
      await sleep(80);
    }
    const dead = [];
    let unknown = 0;
    for (const x of candidates) {
      const kind = core.classifyOembed(status.get(x.videoId));
      if (kind === 'deleted' || kind === 'private') {
        dead.push({ videoId: x.videoId, index: x.index, kind, removeAction: core.removeActionForRow(x, playlistId) });
      } else unknown++;
    }
    return { noHidden: false, hiddenTotal: hidden.length, dead, restricted: hidden.length - candidates.length, unknown };
  };

  /**
   * Ölü videoları kaldırır. YouTube'un lockup içinde verdiği kendi kaldırma komutu varsa o kullanılır;
   * yoksa ACTION_REMOVE_VIDEO_BY_VIDEO_ID (YouTube yanıtlarında görülen biçim). Yalnızca ölü video kimlikleri gönderilir.
   */
  api.removeDead = async function (playlistId, dead, onProgress) {
    const deadIds = new Set(dead.map((d) => d.videoId));
    const seen = new Set();
    const actions = [];
    for (const d of dead) {
      const a = d.removeAction || { action: 'ACTION_REMOVE_VIDEO_BY_VIDEO_ID', removedVideoId: d.videoId };
      if (!deadIds.has(a.removedVideoId)) throw new ApiError('Güvenlik denetimi: beklenmeyen video kimliği.');
      const sig = JSON.stringify(a);
      if (seen.has(sig)) continue;
      seen.add(sig);
      actions.push(a);
    }
    let done = 0;
    for (const part of core.chunk(actions, 25)) {
      await api.editPlaylist(playlistId, part);
      done += part.length;
      if (onProgress) onProgress(done, actions.length);
      await sleep(200);
    }
  };

  api.ApiError = ApiError;
  root.__msx.api = api;
})(globalThis);
