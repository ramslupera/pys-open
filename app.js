// ============================================================
//  PYS OPEN — PUBLIC PAGES (hash router)
// ============================================================
(function () {
  const D = PYS_DATA, E = PYS_CONFIG.EVENT, X = Engine;
  const $ = (s, r = document) => r.querySelector(s);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const enc = encodeURIComponent;
  const ALL_TEAMS = [...D.BRACKETS.A, ...D.BRACKETS.B];
  window.UI = { esc, $ };

  // ---- test hook: ?now=2026-11-28T09:10 previews the site at that Manila time ----
  const qNow = new URLSearchParams(location.search).get("now");
  if (qNow) window.__PYS_TIME_SHIFT = new Date(qNow + ":00+08:00").getTime() - Date.now();

  // ---- local "my team" (per device) ----
  const myTeam = {
    get() { try { return localStorage.getItem("pys-my-team"); } catch (e) { return null; } },
    set(v) { try { v ? localStorage.setItem("pys-my-team", v) : localStorage.removeItem("pys-my-team"); } catch (e) {} }
  };

  // ---------- small components ----------
  const initials = (t) => t.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  const teamLink = (t) => `<a href="#/team/${enc(t)}">Team ${esc(t)}</a>`;
  function pill(status) {
    return { live: `<span class="pill live">Live</span>`, final: `<span class="pill final">Final</span>`, called: `<span class="pill called">Called</span>`, scheduled: `<span class="pill">Upcoming</span>` }[status] || "";
  }
  const courtsLabel = (c) => (c[2] - c[0] === 2 ? `Courts ${c[0]}–${c[2]}` : `Courts ${c.join(", ")}`);
  function sideName(s, side, link = true) {
    const name = s[side];
    if (name) return link ? teamLink(name) : `Team ${esc(name)}`;
    const ph = s["p" + side], proj = s["proj" + side.toUpperCase()];
    return `<span class="ph">${esc(ph)}</span>${proj ? ` <span class="tiny muted">(now: ${esc(proj)})</span>` : ""}`;
  }
  function tieCard(s, opts = {}) {
    const t = s.tie;
    const cls = (side) => (s.decided ? (s.winSide === side ? "w" : "l") : "");
    const showScore = s.status === "live" || s.status === "final";
    const games = s.games.map((g) => {
      const has = g.a !== null && g.b !== null && g.status !== "scheduled";
      const flag = g.result === "retired" ? " RET" : g.result === "forfeit" ? " FF" : "";
      return `<div class="${g.status}"><div class="gl">${g.code} · C${g.court}</div>
        <div class="gs">${has ? `${g.a}–${g.b}` : g.status === "live" ? "LIVE" : "–"}</div>
        <div class="gc">${g.status === "final" ? "Final" + flag : g.status === "live" ? "In play" : g.short}</div></div>`;
    }).join("");
    const hl = opts.team && (s.a === opts.team || s.b === opts.team) ? ` style="border-color:var(--accent)"` : "";
    return `<div class="card tie"${hl}>
      <div class="tie-head"><div><span class="tag">${esc(t.short)}</span>
        <span class="small muted">&nbsp;${X.fmt(s.time)} · ${courtsLabel(s.courts)}</span></div>${pill(s.status)}</div>
      <div class="tie-teams">
        <div class="tt ${cls("a")}"><span class="n">${sideName(s, "a")}</span><span class="s">${showScore ? s.gwA : ""}</span></div>
        <div class="tt ${cls("b")}"><span class="n">${sideName(s, "b")}</span><span class="s">${showScore ? s.gwB : ""}</span></div>
      </div>
      ${s.note ? `<div class="small" style="padding:0 16px 8px;color:var(--warn)">ⓘ ${esc(s.note)}</div>` : ""}
      <div class="games">${games}</div></div>`;
  }

  function standingsTable(br, opts = {}) {
    const st = X.standings(br);
    const compact = opts.compact;
    const rows = st.rows.map((r, i) => {
      const badge = r.clinched ? `<span class="pill q">${st.complete ? "Qualified" : "Clinched"}</span>` : r.eliminated ? `<span class="pill e">Out</span>` : "";
      const pd = `<span class="${r.PD > 0 ? "pos" : r.PD < 0 ? "neg" : ""}">${X.signed(r.PD)}</span>`;
      const me = myTeam.get() === r.team ? ` style="outline:1px solid var(--accent);outline-offset:-1px"` : "";
      if (compact) return `<tr class="${i < 2 ? "qz" : ""} ${i === 1 ? "cut" : ""}"${me}><td class="rank">${i + 1}</td>
        <td><div class="tname">${teamLink(r.team)} ${badge}</div></td><td class="b">${r.W}-${r.L}</td><td>${X.signed(r.GD)}</td><td>${pd}</td></tr>`;
      return `<tr class="${i < 2 ? "qz" : ""} ${i === 1 ? "cut" : ""}"${me}><td class="rank">${i + 1}</td>
        <td><div class="tname">${teamLink(r.team)} ${badge}</div><div class="why">${esc(r.why)}</div></td>
        <td class="hide-s">${r.P}</td><td class="b">${r.W}</td><td>${r.L}</td>
        <td class="hide-s">${r.GW}</td><td class="hide-s">${r.GL}</td><td class="b">${X.signed(r.GD)}</td>
        <td class="hide-s">${r.PF}</td><td class="hide-s">${r.PA}</td><td class="b">${pd}</td></tr>`;
    }).join("");
    const head = compact
      ? `<tr><th>#</th><th>Team</th><th>W-L</th><th>GD</th><th>PD</th></tr>`
      : `<tr><th>#</th><th>Team</th><th class="hide-s">P</th><th>W</th><th>L</th><th class="hide-s">GW</th><th class="hide-s">GL</th><th>GD</th><th class="hide-s">PF</th><th class="hide-s">PA</th><th>PD</th></tr>`;
    const stat = st.complete ? `<span class="pill final">Complete</span>` : st.started ? `<span class="pill live">${st.nFinal}/${st.total} ties final</span>` : `<span class="pill">Not started</span>`;
    return `<div class="card pad0"><div class="spread" style="padding:14px 16px;border-bottom:1px solid var(--line)">
      <h3>Bracket ${br}</h3>${stat}</div><div style="padding:0 8px"><table class="table">${head}${rows}</table></div></div>`;
  }

  // ---------- views ----------
  const views = {};

  views.home = () => {
    const es = X.eventStatus();
    const live = D.ties.map(X.summary).filter((s) => s.status === "live" || s.status === "called");
    let focus = live;
    if (!focus.length) {
      const next = D.ties.map(X.summary).filter((s) => s.status !== "final").sort((a, b) => a.time.localeCompare(b.time));
      focus = next.length ? next.filter((s) => s.time === next[0].time) : [];
    }
    const mt = myTeam.get();
    let mine = "";
    if (mt && ALL_TEAMS.includes(mt)) {
      const tt = X.teamTies(mt), nx = tt.find((s) => s.status !== "final");
      const br = X.bracketOf(mt), row = X.standings(br).rows.find((r) => r.team === mt);
      mine = `<div class="card mt"><div class="spread"><div class="row"><div class="avatar">${initials(mt)}</div>
        <div><div class="eyebrow">My team</div><h3>${teamLink(mt)}</h3></div></div>
        <div class="row"><span class="pill acc">#${row.rank} Bracket ${br}</span><span class="pill">${row.W}-${row.L}</span></div></div>
        ${nx ? `<p class="small" style="margin:10px 0 0">Next: <b>${esc(nx.tie.label)}</b> vs ${nx.a === mt ? sideName(nx, "b") : sideName(nx, "a")} · ${X.fmt(nx.time)} · ${courtsLabel(nx.courts)} · lineup due ${X.fmt(nx.tie.lineup)}</p>` : `<p class="small muted" style="margin:10px 0 0">No more matches scheduled.</p>`}</div>`;
    }
    const ups = Updates.list().slice(0, 2);
    return `
    <section class="hero">
      <div class="card hero-main">
        <div class="eyebrow">${esc(E.presentedBy)} present</div>
        <div class="title">PYS OPEN</div>
        <span class="sub">${esc(E.subtitle)}</span>
        <div class="facts">
          <div><b>Nov 28, 2026</b>Saturday</div>
          <div><b>${esc(E.hours)}</b>Call time ${esc(E.callTime)}</div>
          <div><b>${esc(E.venue)}</b>${esc(E.city)}</div>
          <div><b>12 teams</b>2 brackets · 9 courts</div>
        </div>
        <div class="status-banner ${es.kind === "live" ? "live" : es.kind === "done" ? "done" : ""}">
          <div style="flex:1"><b>${esc(es.title)}</b><div class="small">${esc(es.text)}</div>
          ${es.kind === "pre" ? `<div class="countdown" id="countdown"></div>` : ""}</div>
        </div>
        <div class="row mt"><a class="btn primary" href="#/live">Live courts</a><a class="btn" href="#/standings">Standings</a><a class="btn" href="#/team">Find my team</a></div>
      </div>
      <a href="poster.jpg" target="_blank" rel="noopener"><img class="poster" src="poster.jpg" alt="PYS Open official poster"></a>
    </section>
    ${mine}
    <div class="page-head mt2"><div><div class="eyebrow">${live.length ? "On court now" : "Coming up"}</div><h2>${live.length ? "Live ties" : focus.length ? esc(D.slots.find((x) => x.id === focus[0].tie.slot).label) + " · " + X.fmt(focus[0].time) : "All done"}</h2></div><a href="#/schedule" class="btn sm">Full schedule</a></div>
    <div class="grid g3">${focus.map((s) => tieCard(s)).join("") || `<div class="card empty">All matches are final.</div>`}</div>
    <div class="page-head mt2"><div><div class="eyebrow">Live standings</div><h2>Race to the semis</h2></div><a href="#/standings" class="btn sm">Full standings</a></div>
    <div class="grid g2">${standingsTable("A", { compact: true })}${standingsTable("B", { compact: true })}</div>
    ${ups.length ? `<div class="page-head mt2"><div><div class="eyebrow">From Match Control</div><h2>Latest updates</h2></div><a href="#/updates" class="btn sm">All updates</a></div>${ups.map(Updates.card).join("")}` : ""}
    <div class="page-head mt2"><div><div class="eyebrow">How it works</div><h2>The team battle</h2></div><a href="#/rules" class="btn sm">Official rules</a></div>
    <div class="grid g3">
      <div class="card"><div class="tag">01 · Format</div><h3 class="mt" style="margin-top:6px">3 games per tie</h3><p class="small muted">Men's, Women's and Mixed Doubles are played at the same time on three courts. Win 2 of 3 to win the tie. All three games are always played.</p></div>
      <div class="card"><div class="tag">02 · Brackets</div><h3 style="margin-top:6px">Round robin → semis</h3><p class="small muted">Two brackets of six. Top two from each advance: SF1 A#1 vs B#2, SF2 B#1 vs A#2. Winners play for Gold, losers for Bronze.</p></div>
      <div class="card"><div class="tag">03 · Scoring</div><h3 style="margin-top:6px">Side-out to 11</h3><p class="small muted">Only the serving team scores. Win by 1 in bracket play and semis; win by 2 in Gold and Bronze matches. Ranking: tie wins → game diff → point diff.</p></div>
    </div>`;
  };

  views.live = () => {
    const es = X.eventStatus();
    const courts = Array.from({ length: D.COURTS }, (_, i) => X.courtQueue(i + 1));
    return `<div class="page-head"><div><div class="eyebrow">Matchday</div><h1>Live courts</h1><p>${esc(es.text)}</p></div>
      <span class="pill ${es.kind === "live" ? "live" : es.kind === "done" ? "final" : "acc"}">${esc(es.title)}</span></div>
      <div class="courts">${courts.map(courtCard).join("")}</div>
      <p class="small muted mt">Each card shows the game currently on that court, or the next one up. Scores update automatically as Match Control enters them. Teams must report within 5 minutes of the official match call.</p>`;
  };
  function courtCard(q) {
    const c = q.current;
    if (!c) return `<div class="card court"><div class="court-head"><span class="cn">Court<b>${q.court}</b></span><span class="pill final">Done</span></div>
      <div class="court-body"><p class="muted small">All ${q.total} games on this court are final.</p></div><div class="court-foot">Awarding 2:45 PM</div></div>`;
    const { s, g } = c;
    const st = g.status === "live" ? "live" : s.called ? "called" : "scheduled";
    const showS = g.a !== null && g.status !== "scheduled";
    const w = (side) => (g.status === "final" ? "" : "");
    return `<div class="card court ${st === "live" ? "is-live" : st === "called" ? "is-called" : ""}">
      <div class="court-head"><span class="cn">Court<b>${q.court}</b></span>${pill(st)}</div>
      <div class="court-body">
        <div class="gt">${esc(g.name)} · ${esc(s.tie.short)}</div>
        <div class="score-row"><span class="n">${sideName(s, "a")}</span><span class="s">${showS ? g.a : ""}</span></div>
        <div class="score-row"><span class="n">${sideName(s, "b")}</span><span class="s">${showS ? g.b : ""}</span></div>
        <div class="small muted">${st === "called" ? `Called ${new Date(s.called).toLocaleTimeString("en-PH", { hour: "numeric", minute: "2-digit", timeZone: "Asia/Manila" })} · report now` : st === "live" ? `Tie score ${s.gwA}–${s.gwB}` : `Scheduled ${X.fmt(s.time)}`}</div>
      </div>
      <div class="court-foot">${q.next ? `Next: ${esc(q.next.s.tie.short)} ${q.next.g.code} · ${X.fmt(q.next.s.time)}` : "Last game on this court"} · ${q.done}/${q.total} done</div></div>`;
  }

  // ---- schedule ----
  const sched = { view: "list", q: "", stage: "all", status: "all" };
  views.schedule = () => {
    const all = D.ties.map(X.summary);
    const q = sched.q.trim().toLowerCase();
    const f = all.filter((s) => {
      if (sched.stage === "A" && s.tie.bracket !== "A") return false;
      if (sched.stage === "B" && s.tie.bracket !== "B") return false;
      if (sched.stage === "PO" && s.tie.stage === "RR") return false;
      if (sched.status === "live" && !(s.status === "live" || s.status === "called")) return false;
      if (sched.status === "upcoming" && s.status !== "scheduled") return false;
      if (sched.status === "final" && s.status !== "final") return false;
      if (q && ![s.a, s.b, s.pa, s.pb, s.tie.label].join(" ").toLowerCase().includes(q)) return false;
      return true;
    });
    const seg = (key, opts) => `<div class="seg">${opts.map(([v, l]) => `<button data-sched="${key}" data-v="${v}" class="${sched[key] === v ? "on" : ""}">${l}</button>`).join("")}</div>`;
    let body;
    if (sched.view === "grid") body = scheduleGrid();
    else {
      const bySlot = D.slots.map((sl) => ({ sl, ties: f.filter((s) => s.tie.slot === sl.id) })).filter((x) => x.ties.length);
      body = bySlot.map(({ sl, ties }) => `<div class="slot-head"><span class="time">${X.fmt(ties[0].time)}</span><h3>${esc(sl.label)}</h3>
        <span class="small muted">Ends ${X.fmt(sl.end)} · lineup due ${X.fmt(sl.lineup)}</span></div>
        <div class="grid g3">${ties.map((s) => tieCard(s)).join("")}</div>`).join("") || `<div class="card empty mt">No matches match your filters.</div>`;
    }
    return `<div class="page-head"><div><div class="eyebrow">Official schedule · 9 courts</div><h1>Schedule</h1>
      <p>${D.ties.length} ties · ${D.ties.length * 3} games · 30 round-robin ties, 2 semifinals, Gold & Bronze. Awarding 2:45 PM.</p></div>
      ${seg("view", [["list", "Fixtures"], ["grid", "Court grid"]])}</div>
      ${sched.view === "list" ? `<div class="filters"><input id="sched-q" type="search" placeholder="Search team…" value="${esc(sched.q)}" style="flex:1;min-width:200px">
      ${seg("stage", [["all", "All"], ["A", "Bracket A"], ["B", "Bracket B"], ["PO", "Playoffs"]])}
      ${seg("status", [["all", "Any"], ["live", "Live"], ["upcoming", "Upcoming"], ["final", "Final"]])}</div>
      <div class="small muted">Showing ${f.length} of ${all.length} ties</div>` : ""}
      ${body}`;
  };
  function scheduleGrid() {
    const head = `<tr><th>Time</th>${Array.from({ length: 9 }, (_, i) => `<th>Court ${i + 1}</th>`).join("")}</tr>`;
    const rows = D.slots.map((sl) => {
      const cells = Array(9).fill(`<td class="muted tiny">${sl.id === "SF" || sl.id === "MEDAL" ? "Standby" : ""}</td>`);
      let t0 = sl.start;
      sl.ties.forEach((id) => {
        const s = X.summary(X.tieById[id]); t0 = s.time;
        s.games.forEach((g) => {
          const has = g.a !== null && g.status !== "scheduled";
          cells[g.court - 1] = `<td class="cell ${g.status}"><div class="k">${esc(s.tie.short)} · ${g.code}</div>
            <div>${s.a ? esc(s.a) : `<span class="ph">${esc(s.pa)}</span>`} vs ${s.b ? esc(s.b) : `<span class="ph">${esc(s.pb)}</span>`}</div>
            ${has ? `<div class="sc">${g.a}–${g.b}${g.status === "live" ? " · live" : ""}</div>` : ""}</td>`;
        });
      });
      return `<tr><td class="t">${X.fmt(t0)}<div class="tiny muted">${esc(sl.short)}</div></td>${cells.join("")}</tr>`;
    }).join("");
    return `<div class="sgrid-wrap mt"><table class="sgrid">${head}${rows}</table></div>
      <p class="small muted">MD = Men's Doubles · WD = Women's Doubles · XD = Mixed Doubles. 12:10–12:35 PM reserved for standings & playoff lineups. Courts 7–9 on standby during playoffs.</p>`;
  }

  views.standings = () => {
    const sf = ["SF1", "SF2"].map((id) => X.summary(X.tieById[id]));
    return `<div class="page-head"><div><div class="eyebrow">Live standings</div><h1>Standings</h1>
      <p>Updated the moment Match Control records a result. Top 2 in each bracket advance to the semifinals.</p></div>
      <a class="btn" href="#/brackets">View playoff bracket</a></div>
      <div class="grid g2">${standingsTable("A")}${standingsTable("B")}</div>
      <div class="legend"><span><b>P</b> ties played</span><span><b>W/L</b> tie wins / losses</span><span><b>GW/GL</b> doubles games won / lost</span>
      <span><b>GD</b> game difference</span><span><b>PF/PA</b> points for / against</span><span><b>PD</b> point difference</span>
      <span><b>Clinched</b> guaranteed top 2</span><span><b>Out</b> can no longer reach top 2</span></div>
      <p class="small muted">Ranking (Official Rules §3): 1) tie wins 2) doubles game differential 3) point differential. A tie counts as won once a team takes 2 of the 3 games. Forfeits count 11–0; a retiring team keeps its points and the opponent is awarded 11.</p>
      <div class="page-head mt2"><div><div class="eyebrow">If the bracket ended now</div><h2>Semifinal picture</h2></div></div>
      <div class="grid g2">${sf.map((s) => tieCard(s)).join("")}</div>`;
  };

  views.brackets = () => {
    const A = X.standings("A"), B = X.standings("B");
    const mini = (s, title) => {
      const sc = s.status !== "scheduled" && s.status !== "called";
      const row = (side, seed) => `<div class="mt ${s.winSide === side && s.status === "final" ? "w" : ""}"><span>${seed ? `<span class="seed">${seed}</span>` : ""}${sideName(s, side)}</span><span class="sc b">${sc ? (side === "a" ? s.gwA : s.gwB) : ""}</span></div>`;
      const sa = s.tie.seedA ? `${s.tie.seedA[0]}#${s.tie.seedA[1]}` : "", sb = s.tie.seedB ? `${s.tie.seedB[0]}#${s.tie.seedB[1]}` : "";
      return `<div class="mini"><div class="mh"><span>${esc(title)}</span><span>${X.fmt(s.time)} · ${courtsLabel(s.courts)} ${s.status === "scheduled" ? "" : "· " + s.status}</span></div>${row("a", sa)}${row("b", sb)}</div>`;
    };
    const list = (st) => `<div class="mini"><div class="mh"><span>Bracket ${st.bracket}</span><span>${st.complete ? "Complete" : `${st.nFinal}/${st.total} final`}</span></div>
      ${st.rows.map((r, i) => `<div class="mt ${i < 2 && st.complete ? "w" : ""}"><span><span class="seed">${i + 1}</span>${teamLink(r.team)}</span><span class="small muted">${r.W}-${r.L}${r.clinched ? " ✓" : ""}</span></div>`).join("")}</div>`;
    const pl = X.placements();
    const S = (id) => X.summary(X.tieById[id]);
    const pod = (medal, place, team, sub) => `<div class="card"><div class="medal">${medal}</div><div class="place">${place}</div><div class="team">${team ? teamLink(team) : `<span class="ph">TBD</span>`}</div><div class="small muted">${sub}</div></div>`;
    return `<div class="page-head"><div><div class="eyebrow">Road to gold</div><h1>Playoff bracket</h1>
      <p>Semifinal 1: A #1 vs B #2 · Semifinal 2: B #1 vs A #2 · Medal matches are win by 2.</p></div><a class="btn" href="#/standings">Standings</a></div>
      <div class="bk">
        <div class="bk-col"><h3>1 · Preliminaries</h3>${list(A)}${list(B)}</div>
        <div class="bk-col"><h3>2 · Semifinals · 1:35 PM</h3>${mini(S("SF1"), "Semifinal 1")}${mini(S("SF2"), "Semifinal 2")}</div>
        <div class="bk-col"><h3>3 · Medal matches · 2:20 PM</h3>${mini(S("GOLD"), "🥇 Gold medal match")}${mini(S("BRONZE"), "🥉 Bronze medal match")}</div>
      </div>
      <div class="page-head mt2"><div><div class="eyebrow">Awarding · 2:45–3:00 PM</div><h2>Final placements</h2></div></div>
      <div class="podium">${pod("🥇", "Champion", pl.champion, "Gold match winner")}${pod("🥈", "1st runner-up", pl.runnerUp, "Gold match runner-up")}
      ${pod("🥉", "2nd runner-up", pl.third, "Bronze match winner")}${pod("🏅", "4th place", pl.fourth, "Bronze match runner-up")}</div>`;
  };

  // ---- teams ----
  const teamQ = { q: "" };
  views.team = (name) => {
    if (name && ALL_TEAMS.includes(name)) return teamDetail(name);
    const q = teamQ.q.trim().toLowerCase();
    const card = (t) => {
      const br = X.bracketOf(t), r = X.standings(br).rows.find((x) => x.team === t);
      return `<a class="card team-card" href="#/team/${enc(t)}"><div class="row"><div class="avatar">${initials(t)}</div><div><b>Team ${esc(t)}</b><div class="small muted">Bracket ${br} · #${r.rank}</div></div></div><span class="pill">${r.W}-${r.L}</span></a>`;
    };
    const sec = (br) => {
      const list = D.BRACKETS[br].filter((t) => !q || t.toLowerCase().includes(q));
      return list.length ? `<h3 class="mt2 mb">Bracket ${br}</h3><div class="grid g4">${list.map(card).join("")}</div>` : "";
    };
    const mt = myTeam.get();
    return `<div class="page-head"><div><div class="eyebrow">My team</div><h1>Find my team</h1><p>Pick your team to see your matches, courts and standing. Your choice is saved on this device.</p></div>
      ${mt ? `<a class="btn primary" href="#/team/${enc(mt)}">Go to Team ${esc(mt)}</a>` : ""}</div>
      <input id="team-q" class="search" type="search" placeholder="Search team name (e.g. Ryan, Big Boy)…" value="${esc(teamQ.q)}">
      ${sec("A")}${sec("B")}`;
  };
  function teamDetail(t) {
    const br = X.bracketOf(t), st = X.standings(br), r = st.rows.find((x) => x.team === t);
    const ties = X.teamTies(t), nx = ties.find((s) => s.status !== "final");
    const isMine = myTeam.get() === t;
    return `<div class="page-head"><div class="row"><div class="avatar" style="width:60px;height:60px;font-size:24px">${initials(t)}</div>
      <div><div class="eyebrow">Bracket ${br}</div><h1>Team ${esc(t)}</h1></div></div>
      <div class="row"><button class="btn ${isMine ? "" : "primary"}" data-myteam="${isMine ? "" : esc(t)}">${isMine ? "✓ My team (remove)" : "Make this my team"}</button><a class="btn" href="#/team">All teams</a></div></div>
      <div class="grid g4" style="grid-template-columns:repeat(auto-fit,minmax(120px,1fr))">
        <div class="stat"><b>#${r.rank}</b><span>Bracket ${br}</span></div>
        <div class="stat"><b>${r.W}-${r.L}</b><span>Ties W-L</span></div>
        <div class="stat"><b>${r.GW}-${r.GL}</b><span>Games (${X.signed(r.GD)})</span></div>
        <div class="stat"><b class="${r.PD > 0 ? "pos" : r.PD < 0 ? "neg" : ""}">${X.signed(r.PD)}</b><span>Point diff</span></div>
        <div class="stat"><b>${r.clinched ? "✓" : r.eliminated ? "—" : "…"}</b><span>${r.clinched ? (st.complete ? "Qualified" : "Clinched semis") : r.eliminated ? "Out of top 2" : "In the race"}</span></div>
      </div>
      <p class="small muted">${esc(r.why)}</p>
      ${nx ? `<div class="status-banner"><div><b>Next up · ${X.fmt(nx.time)}</b><div class="small">${esc(nx.tie.label)} vs ${nx.a === t ? sideName(nx, "b") : sideName(nx, "a")} · ${courtsLabel(nx.courts)} (MD C${nx.courts[0]}, WD C${nx.courts[1]}, XD C${nx.courts[2]}) · <b>lineup form due ${X.fmt(nx.tie.lineup)}</b></div></div></div>` : ""}
      <h2 class="mt2 mb">Matches</h2><div class="grid g3">${ties.map((s) => tieCard(s, { team: t })).join("")}</div>`;
  }

  views.updates = () => {
    const ups = Updates.list();
    return `<div class="page-head"><div><div class="eyebrow">From Match Control</div><h1>Updates</h1><p>Schedule changes, court reassignments and announcements.</p></div></div>
      ${ups.map(Updates.card).join("") || `<div class="card empty">No announcements yet.</div>`}`;
  };

  views.rules = () => `<div class="page-head"><div><div class="eyebrow">Official team battle rules</div><h1>Rules</h1><p>Call time: 7:00 AM. Match Control has final authority on all matters below.</p></div></div>
    <div class="card rules">${RULES_HTML}</div>`;

  views.tv = () => {
    document.body.classList.add("tv");
    const es = X.eventStatus();
    const courts = Array.from({ length: D.COURTS }, (_, i) => X.courtQueue(i + 1));
    const up = Updates.list()[0];
    return `<div class="tv"><div class="tv-head"><div><div class="title">PYS OPEN</div><div class="muted">${esc(E.venue)}, ${esc(E.city)} · ${esc(es.title)} — ${esc(es.text)}</div></div>
      <div style="text-align:right"><div class="tv-clock" id="tv-clock"></div><div class="small muted">Follow live on your phone: <b style="color:var(--accent)">${esc(location.host + location.pathname)}</b></div></div></div>
      <div class="tv-grid"><div class="grid" style="gap:14px">${standingsTable("A", { compact: true })}${standingsTable("B", { compact: true })}</div>
      <div class="tv-courts">${courts.map(courtCard).join("")}</div></div>
      ${up ? `<div class="tv-ticker">📣 <b>${esc(up.title)}</b> — ${esc(up.body)}</div>` : ""}</div>`;
  };

  views.control = () => (window.Admin ? Admin.render() : "");

  // ---------- updates helper ----------
  window.Updates = {
    list: () => Store.keys("u:").map((k) => ({ id: k, ...Store.get(k) })).sort((a, b) => (b.ts || "").localeCompare(a.ts || "")),
    card: (u) => `<div class="update ${esc(u.level || "info")}"><div class="row"><span class="pill ${u.level === "important" ? "live" : u.level === "success" ? "final" : "acc"}">${esc(u.level || "info")}</span>
      <span class="small muted">${new Date(u.ts).toLocaleString("en-PH", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: "Asia/Manila" })}</span></div>
      <h3>${esc(u.title)}</h3><p class="small">${esc(u.body)}</p></div>`
  };

  // ---------- router ----------
  const NAV = [["", "Home"], ["live", "Live"], ["schedule", "Schedule"], ["standings", "Standings"], ["brackets", "Bracket"], ["team", "My Team"], ["updates", "Updates"], ["rules", "Rules"]];
  function route() {
    const h = location.hash.replace(/^#\/?/, "");
    const [r, ...rest] = h.split("/");
    return { r: views[r] ? r : "home", arg: rest.length ? decodeURIComponent(rest.join("/")) : null, raw: r };
  }
  function renderNav() {
    const { r } = route();
    const anyLive = D.ties.some((t) => X.summary(t).status === "live");
    $("#nav").innerHTML = NAV.map(([k, l]) => `<a href="#/${k}" class="${(r === "home" ? "" : r) === k ? "active" : ""}">${k === "live" && anyLive ? `<span class="dot"></span>` : ""}${l}</a>`).join("");
    const c = Store.conn();
    const label = { demo: "Demo mode", live: "Live", polling: "Syncing", connecting: "Connecting…", error: "Offline" }[c];
    $("#conn").className = "conn " + (c === "live" ? "ok" : c === "error" ? "bad" : "");
    $("#conn").innerHTML = `<i></i>${label}`;
  }

  function render() {
    const { r, arg } = route();
    if (r !== "tv") document.body.classList.remove("tv");
    const main = $("#main");
    // keep focus + unsaved typing across live re-renders
    const act = document.activeElement;
    const focusId = act && main.contains(act) && act.id ? act.id : null;
    const sel = focusId && "selectionStart" in act ? [act.selectionStart, act.selectionEnd] : null;
    const dirty = {};
    main.querySelectorAll("[data-dirty]").forEach((el) => { if (el.id) dirty[el.id] = el.type === "checkbox" ? el.checked : el.value; });
    main.innerHTML = views[r](arg);
    Object.entries(dirty).forEach(([id, v]) => { const el = document.getElementById(id); if (el) { if (el.type === "checkbox") el.checked = v; else el.value = v; el.dataset.dirty = "1"; } });
    if (focusId) { const el = document.getElementById(focusId); if (el) { el.focus(); try { sel && el.setSelectionRange(sel[0], sel[1]); } catch (e) {} } }
    renderNav();
    document.title = `${{ home: "Home", live: "Live courts", schedule: "Schedule", standings: "Standings", brackets: "Bracket", team: "My team", updates: "Updates", rules: "Rules", tv: "TV", control: "Match Control" }[r]} · PYS Open`;
    tick();
  }
  window.App = { render };

  function tick() {
    const cd = $("#countdown");
    if (cd) {
      const ms = Math.max(0, X.toDate("08:00") - X.now());
      const d = Math.floor(ms / 864e5), h = Math.floor(ms / 36e5) % 24, m = Math.floor(ms / 6e4) % 60, s = Math.floor(ms / 1e3) % 60;
      cd.innerHTML = [[d, "days"], [h, "hrs"], [m, "min"], [s, "sec"]].map(([v, l]) => `<div><b>${v}</b><span>${l}</span></div>`).join("");
    }
    const clk = $("#tv-clock");
    if (clk) clk.textContent = X.now().toLocaleTimeString("en-PH", { hour: "numeric", minute: "2-digit", second: "2-digit", timeZone: "Asia/Manila" });
  }

  // ---------- events ----------
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-sched]");
    if (b) { sched[b.dataset.sched] = b.dataset.v; render(); return; }
    const m = e.target.closest("[data-myteam]");
    if (m) { myTeam.set(m.dataset.myteam || null); render(); }
  });
  document.addEventListener("input", (e) => {
    if (e.target.id === "sched-q") { sched.q = e.target.value; render(); }
    else if (e.target.id === "team-q") { teamQ.q = e.target.value; render(); }
    else if (e.target.closest("#main [data-keep]")) e.target.dataset.dirty = "1";
  });
  window.addEventListener("hashchange", () => { render(); window.scrollTo(0, 0); });
  Store.on(render);
  setInterval(tick, 1000);
  setInterval(() => { if (route().r !== "control") render(); }, 30000); // time-based statuses

  // ---------- rules text (Official Rules) ----------
  const RULES_HTML = `
  <h2>1. Format</h2><p>The PYS Open is a team battle. Every team match (a <b>tie</b>) is made up of three doubles games played on three courts:</p>
  <ol><li>Game 1: Men's Doubles</li><li>Game 2: Women's Doubles</li><li>Game 3: Mixed Doubles</li></ol>
  <p>The team that wins at least two of the three games wins the tie. All three games are played, even if a tie is already decided.</p>
  <h2>2. Lineups</h2><ul><li>Before every round, each captain fills out the lineup form naming the pairs for Game 1, Game 2, and Game 3.</li>
  <li>Forms must be submitted 10 minutes before the start of every round.</li><li>Six distinct players must be assigned across the three games. No player may play more than one game in the same tie.</li>
  <li>Teams may change their lineup between rounds, but not after the form is submitted.</li></ul>
  <h2>3. Brackets and Advancement</h2><ul><li>Teams are divided into two brackets (A and B). Each team plays every other team in its bracket (round-robin).</li>
  <li>The top two teams from each bracket advance to the semifinals.</li><li>Semifinal 1: A #1 vs B #2</li><li>Semifinal 2: B #1 vs A #2</li>
  <li>The two semifinal winners play for the Gold Medal. The two semifinal losers play for the Bronze Medal.</li></ul>
  <p><b>Ranking.</b> Teams in a bracket are ranked by: 1) number of tie (matchup) wins, 2) doubles game differential (games won minus games lost), 3) point differential (points scored minus points allowed).</p>
  <h2>4. Match Scoring</h2><ul><li>All games use traditional side-out scoring: only the serving team can score.</li><li>Games are played to 11 points.</li>
  <li>Elimination and bracket play: win by 1.</li><li>Podium matches (Gold and Bronze): win by 2.</li></ul>
  <h2>5. Line Calls (No Umpires)</h2><p>This tournament has no umpires. It runs on the honor system.</p><ul><li>Make prompt, honest calls.</li>
  <li>If you are unsure whether a ball is out, give your opponent the benefit of the doubt and call it in.</li><li>Respect your opponents' calls.</li>
  <li>Raise concerns calmly with your opponents first. Unresolved questions about rule application may be referred to Match Control.</li></ul>
  <h2>6. Team Timeout</h2><ul><li>Each team is allowed one timeout per game, lasting a maximum of one minute.</li><li>Call it while the ball is dead and before the next serve.</li><li>Timeouts must not be used to unnecessarily delay play.</li></ul>
  <h2>7. Medical Timeout and Injury</h2><ul><li>A player with an injury or sudden physical concern must stop play and notify opponents and Match Control immediately.</li>
  <li>A medical timeout of up to ten minutes may be allowed.</li><li>If the player cannot safely resume, the team retires from that game. The opposing team is awarded 11 points, and the retiring team keeps the score it had when play stopped.</li>
  <li>Notify Match Control immediately if the player or team cannot continue in later games or rounds.</li></ul>
  <h2>8. Withdrawal</h2><p>If a team withdraws from the tournament, its remaining round-robin ties are recorded as 3–0 wins for the opposing teams, with each game scored 11–0. Please notify Match Control promptly so affected players can be informed.</p>
  <h2>9. Match Calls, Late Arrival, and No-Show</h2><ul><li>Monitor the match queue using the QR code displayed at the venue.</li><li>Teams must report promptly to their assigned courts when officially called.</li>
  <li>A team that is not ready within five minutes of the official match call forfeits, and the opposing team is awarded an 11–0 win in each affected game.</li>
  <li>Match Control may consider verified scheduling conflicts, operational delays, or medical circumstances. Report these promptly.</li></ul>
  <h2>10. Schedule Adjustments</h2><ul><li>Match times, court assignments, and match order may change because of delays, court conditions, weather, medical situations, or other operational needs.</li>
  <li>Player safety and tournament operations come first. Follow the latest Match Control announcements and stay available for your next match.</li></ul>
  <h2>11. Sportsmanship and Disputes</h2><ul><li>Respect opponents, partners, organizers, staff, and fellow players.</li><li>Insulting remarks, aggressive behavior, intentional distractions, and unnecessary confrontations will not be tolerated.</li>
  <li>Raise disagreements calmly with Match Control. Warnings, penalties, or disqualification may be imposed depending on the seriousness of the conduct.</li></ul>
  <h2>12. Final Reminders</h2><ul><li>Bring your paddle, drinking water, and personal essentials.</li><li>Use your scheduled breaks to rest, hydrate, and prepare for your next match.</li>
  <li>Check your match results and report any discrepancy to Match Control immediately.</li><li>Match Control has final authority over scheduling, score recording, defaults, eligibility, safety decisions, and unresolved interpretations of these rules.</li></ul>
  <p style="font-family:var(--font-head);font-size:22px;text-transform:uppercase;color:var(--accent);margin-top:24px"><b>Play hard. Respect the game. Have fun!</b></p>`;

  // ---------- boot ----------
  document.addEventListener("DOMContentLoaded", async () => {
    if (Store.demo) $("#demo-bar").hidden = false;
    render();
    await Store.init();
    render();
  });
})();
