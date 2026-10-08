/* Playlist Çoklu Seçim — styles.js (Shadow DOM içine enjekte edilen CSS) · Mustafa Çiçek · MIT */
(function (root) {
  'use strict';
  root.__msx.css = `
:host { all: initial; }
* { box-sizing: border-box; }
[hidden] { display: none !important; }
:host {
  --bg: #ffffff; --bg2: #f2f2f2; --bg3: #e5e5e5; --fg: #0f0f0f; --fg2: #606060;
  --line: rgba(0,0,0,.1); --accent: #065fd4; --accent-bg: #def1ff; --sel: #e8f0fe;
  --danger: #cc0000; --shadow: 0 8px 32px rgba(0,0,0,.18);
  font-family: Roboto, Arial, system-ui, sans-serif; font-size: 13px; color: var(--fg);
}
:host([data-theme="dark"]) {
  --bg: #0f0f0f; --bg2: #212121; --bg3: #303030; --fg: #f1f1f1; --fg2: #aaaaaa;
  --line: rgba(255,255,255,.12); --accent: #3ea6ff; --accent-bg: #263850; --sel: #1e2a3a;
  --danger: #ff4e45; --shadow: 0 8px 32px rgba(0,0,0,.6);
}
button, input, select { font: inherit; color: inherit; }
.launcher {
  position: fixed; left: 24px; bottom: 120px; z-index: 2147483000;
  display: flex; align-items: center; gap: 10px; padding: 14px 24px; border: 0; border-radius: 28px;
  background: var(--fg); color: var(--bg); font-size: 16px; font-weight: 600; cursor: pointer; box-shadow: var(--shadow);
}
.launcher:hover { opacity: .9; }
.launcher[hidden] { display: none; }
.panel {
  position: fixed; top: 0; right: 0; bottom: 0; width: min(560px, 100vw); z-index: 2147483001;
  display: flex; flex-direction: column; background: var(--bg); border-left: 1px solid var(--line);
  box-shadow: var(--shadow); outline: none;
}
.panel[hidden] { display: none; }
.head { display: flex; align-items: center; gap: 8px; padding: 12px 12px 8px 16px; }
.head .ttl { flex: 1; min-width: 0; }
.head h2 { margin: 0; font-size: 16px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.head .sub { color: var(--fg2); font-size: 12px; margin-top: 2px; }
.icon { border: 0; background: transparent; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; font-size: 16px; line-height: 32px; }
.icon:hover { background: var(--bg2); }
.lang { display: flex; gap: 2px; padding: 3px; border: 0; border-radius: 16px; background: var(--bg2); cursor: pointer; }
.lang span { padding: 4px 9px; border-radius: 13px; font-size: 12px; font-weight: 600; color: var(--fg2); }
.lang span.on { background: var(--fg); color: var(--bg); }
.lang:hover span:not(.on) { color: var(--fg); }
.bar { display: flex; flex-wrap: wrap; gap: 6px; padding: 4px 12px 8px; align-items: center; }
.btn {
  border: 0; background: var(--bg2); padding: 6px 12px; border-radius: 16px; cursor: pointer; white-space: nowrap;
}
.btn:hover:not(:disabled) { background: var(--bg3); }
.btn:disabled { opacity: .45; cursor: default; }
.btn.primary { background: var(--accent); color: #fff; }
:host([data-theme="dark"]) .btn.primary { color: #0f0f0f; }
.btn.danger { color: var(--danger); }
.btn.primary.danger { background: var(--danger); color: #fff; }
.search {
  flex: 1; min-width: 160px; padding: 7px 12px; border-radius: 16px; border: 1px solid var(--line); background: var(--bg);
  outline: none;
}
.search:focus { border-color: var(--accent); }
select.btn { appearance: auto; padding-right: 8px; }
.bar.sels { flex-wrap: nowrap; }
.bar.sels select { flex: 1 1 0; min-width: 0; text-overflow: ellipsis; }
.list { flex: 1; overflow-y: auto; border-top: 1px solid var(--line); border-bottom: 1px solid var(--line); }
.row {
  display: grid; grid-template-columns: 22px 34px 80px 1fr auto; gap: 8px; align-items: center;
  padding: 6px 12px; cursor: pointer; user-select: none; border-left: 3px solid transparent;
}
.row:hover { background: var(--bg2); }
.row.sel { background: var(--sel); border-left-color: var(--accent); }
.row.focus { outline: 1px dashed var(--accent); outline-offset: -2px; }
.row[hidden] { display: none; }
.row input { width: 16px; height: 16px; margin: 0; accent-color: var(--accent); cursor: pointer; }
.row .idx { color: var(--fg2); text-align: right; font-variant-numeric: tabular-nums; font-size: 12px; }
.row img { width: 80px; height: 45px; object-fit: cover; border-radius: 6px; background: var(--bg3); display: block; }
.row .meta { min-width: 0; }
.row .t { font-weight: 500; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; line-height: 1.3; }
.row .c { color: var(--fg2); font-size: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.row .d { color: var(--fg2); font-size: 12px; font-variant-numeric: tabular-nums; }
.row .dup { color: var(--danger); font-size: 11px; margin-left: 4px; }
.empty { padding: 32px 16px; text-align: center; color: var(--fg2); }
.foot { padding: 8px 12px 12px; display: flex; flex-direction: column; gap: 6px; }
.foot .info { color: var(--fg2); font-size: 12px; display: flex; justify-content: space-between; gap: 8px; }
.foot .info b { color: var(--fg); }
.foot .row2 { display: flex; flex-wrap: wrap; gap: 6px; }
.kbd { color: var(--fg2); font-size: 11px; margin-left: 4px; }
.credit { color: var(--fg2); font-size: 11px; text-align: right; }
.credit a { color: var(--accent); text-decoration: none; }
.credit a:hover { text-decoration: underline; }
.overlay {
  position: absolute; inset: 0; background: rgba(0,0,0,.45); display: flex; align-items: center; justify-content: center; z-index: 5;
}
.modal {
  width: calc(100% - 32px); max-height: calc(100% - 64px); overflow: auto; background: var(--bg); border-radius: 12px;
  padding: 16px; box-shadow: var(--shadow); display: flex; flex-direction: column; gap: 12px;
}
.modal h3 { margin: 0; font-size: 15px; }
.modal p { margin: 0; line-height: 1.45; color: var(--fg2); }
.modal .acts { display: flex; justify-content: flex-end; gap: 8px; flex-wrap: wrap; }
.plist { display: flex; flex-direction: column; max-height: 280px; overflow: auto; border: 1px solid var(--line); border-radius: 8px; }
.plist button {
  text-align: left; border: 0; background: transparent; padding: 8px 12px; cursor: pointer; border-bottom: 1px solid var(--line);
}
.plist button:last-child { border-bottom: 0; }
.plist button:hover { background: var(--bg2); }
.plist button.on { background: var(--accent-bg); }
.plist .pv { color: var(--fg2); font-size: 11px; margin-left: 6px; }
.deadrow { display: grid; grid-template-columns: 56px 1fr auto; gap: 8px; padding: 6px 12px; border-bottom: 1px solid var(--line); align-items: center; }
.deadrow:last-child { border-bottom: 0; }
.mono { font-family: ui-monospace, Menlo, Consolas, monospace; font-size: 12px; }
label.chk { display: inline-flex; align-items: center; gap: 4px; color: var(--fg); font-size: 13px; cursor: pointer; }
label.chk input { accent-color: var(--accent); }
.field { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; }
.field input[type=text] { flex: 1; min-width: 140px; padding: 7px 10px; border-radius: 8px; border: 1px solid var(--line); background: var(--bg); outline: none; }
.field input[type=text]:focus { border-color: var(--accent); }
.field label { color: var(--fg2); font-size: 12px; }
.muted { color: var(--fg2); font-size: 12px; }
.progress { height: 6px; background: var(--bg3); border-radius: 3px; overflow: hidden; }
.progress > div { height: 100%; width: 0; background: var(--accent); transition: width .15s; }
.toast {
  position: absolute; left: 12px; right: 12px; bottom: 12px; z-index: 6; background: var(--fg); color: var(--bg);
  border-radius: 8px; padding: 10px 12px; display: flex; gap: 10px; align-items: center; box-shadow: var(--shadow);
}
.toast[hidden] { display: none; }
.toast span { flex: 1; line-height: 1.4; }
.toast button { border: 0; background: transparent; color: var(--accent); font-weight: 600; cursor: pointer; padding: 4px 6px; }
:host([data-theme="light"]) .toast button { color: #3ea6ff; }
.toast.err { background: var(--danger); color: #fff; }
.toast.err button { color: #fff; }
.menu {
  position: fixed; z-index: 7; background: var(--bg); border: 1px solid var(--line); border-radius: 8px; box-shadow: var(--shadow);
  padding: 4px 0; min-width: 200px;
}
.menu button { display: flex; justify-content: space-between; width: 100%; border: 0; background: transparent; padding: 8px 14px; text-align: left; cursor: pointer; gap: 16px; }
.menu button:hover:not(:disabled) { background: var(--bg2); }
.menu button:disabled { opacity: .45; cursor: default; }
.menu hr { border: 0; border-top: 1px solid var(--line); margin: 4px 0; }
.warn { background: var(--accent-bg); color: var(--fg); padding: 8px 12px; margin: 0 12px 8px; border-radius: 8px; font-size: 12px; line-height: 1.4; }
.warn[hidden] { display: none; }
`;
})(globalThis);
