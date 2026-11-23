// ============================================================
//  MATCH CONTROL — score entry (open at  #/control )
// ============================================================
window.Admin = (function () {
  const D = PYS_DATA, X = Engine, { esc } = UI;
  const ALL = [...D.BRACKETS.A, ...D.BRACKETS.B];
  let tab = null; // slot id | "updates" | "tools"

  function toast(msg, err) {
    let box = document.querySelector(".toasts");
    if (!box) { box = document.createElement("div"); box.className = "toasts"; document.body.appendChild(box); }
    const t = document.createElement("div");
    t.className = "toast" + (err ? " err" : "");
    t.textContent = msg;
    box.appendChild(t);
    setTimeout(() => t.remove(), err ? 4500 : 2200);
  }
  async function run(fn, ok) {
    try { await fn(); if (ok) toast(ok); } catch (e) { console.error(e); toast("Not saved: " + (e.message || e), true); }
  }
  const val = (id) => { const el = document.getElementById(id); if (!el || el.value === "") return null; return +el.value; };

  function defaultTab() {
    const s = D.slots.find((sl) => sl.ties.some((id) => X.summary(X.tieById[id]).status !== "final"));
    return s ? s.id : "MEDAL";
  }

  // ---------------- render ----------------
  function render() {
    if (!Store.authed()) return loginView();
    if (!tab) tab = defaultTab();
    const slotBtns = D.slots.map((sl) => {
      const ss = sl.ties.map((id) => X.summary(X.tieById[id]).status);
      const dot = ss.every((x) => x === "final") ? "✓ " : ss.some((x) => x === "live" || x === "called") ? "● " : "";
      return `<button data-adm-tab="${sl.id}" class="${tab === sl.id ? "on" : ""}">${dot}${esc(sl.short)}</button>`;
    }).join("");
    const body = tab === "updates" ? updatesView() : tab === "tools" ? toolsView() : slotView(D.slots.find((s) => s.id === tab));
    return `<div class="page-head"><div><div class="eyebrow">Official</div><h1>Match Control</h1>
      <p>Signed in as <b>${esc(Store.user())}</b>${Store.demo ? " · <span style='color:var(--warn)'>Demo mode: scores are saved in this browser only</span>" : ""}</p></div>
      <div class="row"><a class="btn sm" href="#/live" target="_blank">Open Live Courts ↗</a><a class="btn sm" href="#/tv" target="_blank">TV mode ↗</a>${Store.demo ? "" : `<button class="btn sm danger" data-adm="signout">Sign out</button>`}</div></div>
      <div class="seg mb" style="border-radius:16px">${slotBtns}<button data-adm-tab="updates" class="${tab === "updates" ? "on" : ""}">📣 Updates</button><button data-adm-tab="tools" class="${tab === "tools" ? "on" : ""}">⚙ Tools</button></div>
      ${body}`;
  }

  function loginView() {
    return `<div class="card" style="max-width:420px;margin:30px auto">
      <div class="eyebrow">Officials only</div><h2 style="margin-bottom:14px">Match Control sign-in</h2>
      <form id="adm-login" class="grid" style="gap:12px">
        <label class="f">Email<input type="email" id="adm-email" required autocomplete="username"></label>
        <label class="f">Password<input type="password" id="adm-pass" required autocomplete="current-password"></label>
        <button class="btn primary" type="submit">Sign in</button>
        <p class="small muted" style="margin:0">Accounts are created by the organizer in Supabase (see README). Spectators don't need to sign in.</p>
      </form></div>`;
  }

  function slotView(sl) {
    const ties = sl.ties.map((id) => X.summary(X.tieById[id]));
    const isPO = sl.id === "SF" || sl.id === "MEDAL";
    let poNote = "";
    if (sl.id === "SF") {
      const A = X.standings("A"), B = X.standings("B");
      poNote = `<div class="status-banner mb"><div class="small">${A.complete && B.complete ? "Both brackets are complete. Semifinal teams are filled automatically from the final standings." : `Brackets not complete yet (A ${A.nFinal}/15, B ${B.nFinal}/15 ties final). Teams fill in automatically when they are, or set them manually below.`}
        If a tiebreak is fully level, pick the team manually under <b>Tie settings</b>.</div></div>`;
    }
    return `<div class="spread mb"><div><h2>${esc(sl.label)}</h2><div class="small muted">${X.fmt(sl.start)}–${X.fmt(sl.end)} · lineup forms due ${X.fmt(sl.lineup)}${sl.ties.length ? "" : ""}</div></div>
      <button class="btn sm" data-adm="call-slot" data-slot="${sl.id}">📢 Call all ties in this round</button></div>
      ${poNote}
      ${ties.map((s) => tieAdmin(s, isPO)).join("")}
      <p class="small muted">Tip: type both scores and press <b>Save final</b>. Use <b>Live</b> to show a game as in progress (scores optional). The rule check warns about scores that don't fit the rules (to 11, win by ${sl.id === "MEDAL" ? 2 : 1}); you can still save them, for example for time-limited games.</p>`;
  }

  function tieAdmin(s, isPO) {
    const t = s.tie;
    const A = s.a ? `Team ${esc(s.a)}` : `<span class="ph">${esc(s.pa)}</span>`;
    const B = s.b ? `Team ${esc(s.b)}` : `<span class="ph">${esc(s.pb)}</span>`;
    const rows = s.games.map((g) => {
      const id = `${t.id}-${g.code}`;
      const opt = (v, l) => `<option value="${v}" ${g.result === v ? "selected" : ""}>${l}</option>`;
      return `<div class="arow ${g.status}" data-keep>
        <div class="gname"><b>${g.code} · Court ${g.court}</b><span>${g.name}${g.status === "final" ? ` · <span class="st-final">FINAL${g.result !== "normal" ? " (" + g.result + ")" : ""}</span>` : g.status === "live" ? ` · <span style="color:var(--live);font-weight:700">LIVE</span>` : ""}</span></div>
        <div class="an">${s.a ? esc(s.a) : esc(s.pa)}</div>
        <input class="as" type="number" min="0" max="30" inputmode="numeric" id="in-${id}-a" value="${g.a ?? ""}" aria-label="${g.code} score ${esc(s.a || s.pa)}">
        <div class="x muted" style="text-align:center">–</div>
        <input class="bs" type="number" min="0" max="30" inputmode="numeric" id="in-${id}-b" value="${g.b ?? ""}" aria-label="${g.code} score ${esc(s.b || s.pb)}">
        <div class="bn">${s.b ? esc(s.b) : esc(s.pb)}</div>
        <div class="acts">
          <select id="in-${id}-r" title="Result type">${opt("normal", "Normal")}${opt("retired", "Retired")}${opt("forfeit", "Forfeit")}</select>
          <button class="btn sm warn" data-adm="live" data-tie="${t.id}" data-g="${g.code}">Live</button>
          <button class="btn sm ok" data-adm="final" data-tie="${t.id}" data-g="${g.code}">Save final</button>
          <button class="btn sm danger" data-adm="clear" data-tie="${t.id}" data-g="${g.code}" title="Clear this game">✕</button>
        </div></div>`;
    }).join("");
    const m = X.meta(t.id);
    const teamOpts = (sel) => `<option value="">Auto</option>` + ALL.map((n) => `<option ${sel === n ? "selected" : ""}>${esc(n)}</option>`).join("");
    const tieStatus = s.status === "final" ? `<span class="pill final">Final ${s.gwA}–${s.gwB}</span>` : s.status === "live" ? `<span class="pill live">${s.gwA}–${s.gwB}</span>` : s.status === "called" ? `<span class="pill called">Called</span>` : `<span class="pill">Upcoming</span>`;
    return `<div class="card pad0 admin-tie">
      <div class="tie-head"><div><span class="tag">${esc(t.label)}</span> <span class="small muted">· ${X.fmt(s.time)} · ${s.courts.length ? `Courts ${s.courts.join(", ")}` : ""}</span>
        <div style="font-weight:700;font-size:16px;margin-top:2px">${A} <span class="muted">vs</span> ${B}</div></div>
        <div class="row">${tieStatus}
          ${s.called ? `<button class="btn sm" data-adm="uncall" data-tie="${t.id}">Undo call</button>` : `<button class="btn sm primary" data-adm="call" data-tie="${t.id}">📢 Call to court</button>`}</div></div>
      ${rows}
      <details style="border-top:1px solid var(--line);padding:10px 16px"><summary class="small" style="cursor:pointer;color:var(--accent)">Tie settings · schedule change · forfeit</summary>
        <div class="row mt" style="align-items:flex-end">
          <label class="f">Start time<input type="time" id="ts-${t.id}-time" value="${esc(m.time || "")}" placeholder="${t.start}"></label>
          <label class="f">Courts MD,WD,XD<input type="text" id="ts-${t.id}-courts" value="${esc(m.courts || "")}" placeholder="${t.courts.join(",")}" style="width:110px"></label>
          <label class="f" style="flex:1;min-width:180px">Public note<input type="text" id="ts-${t.id}-note" value="${esc(m.note || "")}" placeholder="e.g. Moved to Court 7 due to delay"></label>
          ${isPO ? `<label class="f">Team (top)<select id="ts-${t.id}-a">${teamOpts(m.a)}</select></label><label class="f">Team (bottom)<select id="ts-${t.id}-b">${teamOpts(m.b)}</select></label>` : ""}
          <button class="btn sm primary" data-adm="tie-save" data-tie="${t.id}">Save settings</button>
        </div>
        <div class="row mt"><span class="small muted">No-show / withdrawal (11–0 in all three games):</span>
          <button class="btn sm danger" data-adm="ff" data-tie="${t.id}" data-side="a" ${s.a ? "" : "disabled"}>${esc(s.a || s.pa)} wins by forfeit</button>
          <button class="btn sm danger" data-adm="ff" data-tie="${t.id}" data-side="b" ${s.b ? "" : "disabled"}>${esc(s.b || s.pb)} wins by forfeit</button></div>
      </details></div>`;
  }

  function updatesView() {
    const ups = Updates.list();
    return `<div class="grid g2"><div class="card"><h3 class="mb">Post an update</h3>
      <div class="grid" style="gap:10px">
        <label class="f">Title<input type="text" id="up-title" data-keep placeholder="e.g. Round 3 delayed by 10 minutes"></label>
        <label class="f">Message<textarea id="up-body" data-keep placeholder="Details for players and spectators"></textarea></label>
        <label class="f">Type<select id="up-level"><option value="info">Info</option><option value="important">Important</option><option value="success">Result / good news</option></select></label>
        <button class="btn primary" data-adm="post">Publish update</button></div></div>
      <div><h3 class="mb">Published (${ups.length})</h3>${ups.map((u) => `<div style="position:relative">${Updates.card(u)}<button class="btn sm danger" style="position:absolute;top:10px;right:10px" data-adm="unpost" data-id="${esc(u.id)}">Delete</button></div>`).join("") || `<div class="card empty">Nothing yet.</div>`}</div></div>`;
  }

  function toolsView() {
    return `<div class="grid g2">
      <div class="card"><h3>Backup</h3><p class="small muted">Download every score, call and update as a JSON file. Do this after each round, just in case.</p>
        <div class="row"><button class="btn primary" data-adm="export">⬇ Download backup</button>
        <label class="btn">⬆ Restore backup<input type="file" id="adm-import" accept=".json" hidden></label></div></div>
      <div class="card"><h3>Reset</h3><p class="small muted">Clear all scores, calls, schedule changes and updates. Use this after testing and before the event starts.</p>
        <button class="btn danger" data-adm="reset">Reset everything</button></div>
      <div class="card"><h3>Test data</h3><p class="small muted">Fill all round-robin games with random valid scores so you can preview standings and the bracket. Use <b>Reset everything</b> afterwards.</p>
        <div class="row"><button class="btn" data-adm="random" data-upto="A3">Random up to A·R3</button><button class="btn" data-adm="random" data-upto="B5">Random: all rounds</button><button class="btn" data-adm="random" data-upto="ALL">Random incl. playoffs</button></div></div>
      <div class="card"><h3>Status</h3><p class="small">Connection: <b>${esc(Store.conn())}</b>${Store.lastSync() ? ` · last sync ${Store.lastSync().toLocaleTimeString()}` : ""}</p>
        <p class="small muted">${Store.demo ? "Demo mode: add your Supabase URL and key in js/config.js to go live." : "Connected to Supabase. All devices update in real time."}</p></div></div>`;
  }

  // ---------------- actions ----------------
  async function saveGame(tieId, code, status) {
    const t = X.tieById[tieId], s = X.summary(t);
    const a = val(`in-${tieId}-${code}-a`), b = val(`in-${tieId}-${code}-b`);
    const result = document.getElementById(`in-${tieId}-${code}-r`).value;
    if (!s.a || !s.b) { if (!confirm("The teams for this tie aren't set yet. Save anyway?")) return; }
    if (status === "final") {
      const err = X.validate(t, a, b, result);
      if (a === null || b === null) return toast("Enter both scores first.", true);
      if (err && !confirm(`Rule check: ${err}\n\nSave ${a}–${b} anyway?`)) return;
    }
    await run(() => Store.set(`g:${tieId}:${code}`, { a, b, status, result, ts: new Date().toISOString(), by: Store.user() }),
      status === "final" ? `${code} saved: ${a ?? "-"}–${b ?? "-"}` : `${code} marked live`);
  }

  async function randomFill(upto) {
    const rnd = (winBy) => { const lo = Math.floor(Math.random() * (winBy === 2 ? 10 : 11)); return winBy === 2 ? [Math.max(11, lo + 2), lo] : [11, lo]; };
    const obj = {};
    const stopIdx = upto === "ALL" ? 99 : D.slots.findIndex((s) => s.id === (upto === "A3" ? "AR3" : "BR5"));
    const fillSlot = (sl) => sl.ties.forEach((id) => D.GAMES.forEach((g) => {
      let [w, l] = rnd(X.tieById[id].winBy);
      const flip = Math.random() < 0.5;
      obj[`g:${id}:${g.code}`] = { a: flip ? l : w, b: flip ? w : l, status: "final", result: "normal", ts: new Date().toISOString(), by: "test" };
    }));
    D.slots.forEach((sl, i) => { if (i <= stopIdx && sl.id !== "SF" && sl.id !== "MEDAL") fillSlot(sl); });
    await Store.setMany(obj);
    if (upto === "ALL") { // playoffs depend on standings, fill in order
      await Store.setMany((() => { const o = {}; D.slots.find((s) => s.id === "SF").ties.forEach((id) => D.GAMES.forEach((g) => { const [w, l] = rnd(1); const f = Math.random() < .5; o[`g:${id}:${g.code}`] = { a: f ? l : w, b: f ? w : l, status: "final", result: "normal", ts: new Date().toISOString() }; })); return o; })());
      await Store.setMany((() => { const o = {}; D.slots.find((s) => s.id === "MEDAL").ties.forEach((id) => D.GAMES.forEach((g) => { const [w, l] = rnd(2); const f = Math.random() < .5; o[`g:${id}:${g.code}`] = { a: f ? l : w, b: f ? w : l, status: "final", result: "normal", ts: new Date().toISOString() }; })); return o; })());
    }
  }

  document.addEventListener("click", async (e) => {
    const tb = e.target.closest("[data-adm-tab]");
    if (tb) { tab = tb.dataset.admTab; App.render(); return; }
    const b = e.target.closest("[data-adm]");
    if (!b) return;
    const act = b.dataset.adm, tieId = b.dataset.tie, code = b.dataset.g;
    const nowIso = new Date().toISOString();
    switch (act) {
      case "signout": await Store.signOut(); App.render(); break;
      case "final": await saveGame(tieId, code, "final"); break;
      case "live": await saveGame(tieId, code, "live"); break;
      case "clear":
        if (confirm(`Clear ${code} for ${X.tieById[tieId].label}?`)) await run(() => Store.del(`g:${tieId}:${code}`), "Cleared");
        break;
      case "call": await run(() => Store.set(`t:${tieId}`, { ...X.meta(tieId), called: nowIso }), "Match called — teams have 5 minutes"); break;
      case "uncall": { const m = { ...X.meta(tieId) }; delete m.called; await run(() => Store.set(`t:${tieId}`, Object.keys(m).length ? m : null), "Call removed"); break; }
      case "call-slot": {
        const sl = D.slots.find((s) => s.id === b.dataset.slot), o = {};
        sl.ties.forEach((id) => { o[`t:${id}`] = { ...X.meta(id), called: nowIso }; });
        await run(() => Store.setMany(o), `${sl.label} called to court`); break;
      }
      case "tie-save": {
        const m = { ...X.meta(tieId) };
        const g = (k) => { const el = document.getElementById(`ts-${tieId}-${k}`); return el ? el.value.trim() : undefined; };
        ["time", "courts", "note", "a", "b"].forEach((k) => { const v = g(k); if (v === undefined) return; if (v) m[k] = v; else delete m[k]; });
        if (m.courts && String(m.courts).split(/[^0-9]+/).filter(Boolean).length !== 3) return toast("Courts must be three numbers, e.g. 7,8,9", true);
        await run(() => Store.set(`t:${tieId}`, Object.keys(m).length ? m : null), "Tie settings saved"); break;
      }
      case "ff": {
        const s = X.summary(X.tieById[tieId]), side = b.dataset.side, w = s[side];
        if (!confirm(`Record a forfeit: Team ${w} wins all three games 11–0?`)) return;
        const o = {};
        D.GAMES.forEach((g) => { o[`g:${tieId}:${g.code}`] = { a: side === "a" ? 11 : 0, b: side === "b" ? 11 : 0, status: "final", result: "forfeit", ts: nowIso, by: Store.user() }; });
        await run(() => Store.setMany(o), "Forfeit recorded"); break;
      }
      case "post": {
        const title = document.getElementById("up-title").value.trim(), body = document.getElementById("up-body").value.trim();
        if (!title) return toast("Add a title", true);
        await run(() => Store.set(`u:${Date.now()}`, { ts: nowIso, title, body, level: document.getElementById("up-level").value }), "Update published");
        break;
      }
      case "unpost": if (confirm("Delete this update?")) await run(() => Store.del(b.dataset.id), "Deleted"); break;
      case "export": {
        const blob = new Blob([JSON.stringify({ exported: nowIso, data: Store.all() }, null, 2)], { type: "application/json" });
        const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `pys-open-backup-${nowIso.slice(0, 16).replace(/[:T]/g, "-")}.json`; a.click();
        break;
      }
      case "reset":
        if (confirm("Reset EVERYTHING? All scores, calls and updates will be deleted.") && confirm("Are you sure? This cannot be undone (download a backup first).")) await run(() => Store.replaceAll({}), "All data cleared");
        break;
      case "random": await run(() => randomFill(b.dataset.upto), "Test results added"); break;
    }
  });
  document.addEventListener("change", async (e) => {
    if (e.target.id === "adm-import") {
      const f = e.target.files[0]; if (!f) return;
      try {
        const j = JSON.parse(await f.text());
        if (!j.data || typeof j.data !== "object") throw new Error("Not a PYS Open backup file");
        if (confirm(`Restore backup from ${j.exported}? Current data will be replaced.`)) await run(() => Store.replaceAll(j.data), "Backup restored");
      } catch (err) { toast(err.message, true); }
    }
  });
  document.addEventListener("submit", async (e) => {
    if (e.target.id !== "adm-login") return;
    e.preventDefault();
    await run(() => Store.signIn(document.getElementById("adm-email").value, document.getElementById("adm-pass").value), "Signed in");
    App.render();
  });
  // pressing Enter in a score box saves it as final
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Enter") return;
    const m = e.target.id && e.target.id.match(/^in-(.+)-(MD|WD|XD)-[ab]$/);
    if (m) { e.preventDefault(); saveGame(m[1], m[2], "final"); }
  });

  return { render };
})();
