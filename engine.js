// ============================================================
//  ENGINE — turns raw scores into tie results, standings,
//  playoff teams, court queues and event status.
//  Ranking (Official Rules §3): tie wins → game differential →
//  point differential.
// ============================================================
window.Engine = (function () {
  const D = window.PYS_DATA;
  const E = window.PYS_CONFIG.EVENT;
  const tieById = Object.fromEntries(D.ties.map((t) => [t.id, t]));
  const n = (v) => (v === "" || v === null || v === undefined || isNaN(+v) ? null : +v);

  // ---------- time helpers (Philippines = UTC+8, no DST) ----------
  const toDate = (hhmm) => new Date(`${E.date}T${hhmm}:00+08:00`);
  function fmt(hhmm) {
    if (!hhmm) return "";
    let [h, m] = hhmm.split(":").map(Number);
    const ap = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    return `${h}:${String(m).padStart(2, "0")} ${ap}`;
  }
  const now = () => new Date(Date.now() + (window.__PYS_TIME_SHIFT || 0));
  function manilaHHMM(d) {
    const u = new Date(d.getTime() + 8 * 3600e3);
    return `${String(u.getUTCHours()).padStart(2, "0")}:${String(u.getUTCMinutes()).padStart(2, "0")}`;
  }

  // ---------- raw ----------
  function game(tieId, code) {
    const v = Store.get(`g:${tieId}:${code}`) || {};
    return { a: n(v.a), b: n(v.b), status: v.status || "scheduled", result: v.result || "normal", ts: v.ts || null };
  }
  const meta = (id) => Store.get(`t:${id}`) || {};
  const tieTime = (t) => meta(t.id).time || t.start;
  function tieCourts(t) {
    const o = meta(t.id).courts;
    if (o) {
      const arr = String(o).split(/[^0-9]+/).filter(Boolean).map(Number);
      if (arr.length === 3) return arr;
    }
    return t.courts;
  }

  // ---------- teams for a tie (playoffs filled from standings) ----------
  function seedTeam(seed) {
    const st = standings(seed[0]);
    const row = st.rows[+seed[1] - 1];
    return { team: st.complete ? row.team : null, proj: st.started ? row.team : null };
  }
  function teamsFor(t) {
    const m = meta(t.id);
    if (t.stage === "RR") return { a: t.a, b: t.b, pa: t.a, pb: t.b };
    if (t.stage === "SF") {
      const A = seedTeam(t.seedA), B = seedTeam(t.seedB);
      return {
        a: m.a || A.team, b: m.b || B.team,
        pa: `${t.seedA[0]} #${t.seedA[1]}`, pb: `${t.seedB[0]} #${t.seedB[1]}`,
        projA: A.proj, projB: B.proj
      };
    }
    const from = (f) => {
      const [k, id] = f.split(":");
      const s = summary(tieById[id]);
      return k === "W" ? s.winner : s.loser;
    };
    const lbl = (f) => (f[0] === "W" ? "Winner " : "Loser ") + f.split(":")[1].replace("SF", "SF ");
    return { a: m.a || from(t.fromA), b: m.b || from(t.fromB), pa: lbl(t.fromA), pb: lbl(t.fromB) };
  }

  // ---------- tie summary ----------
  const cache = { v: 0, s: {}, st: {} };
  Store.on(() => { cache.v++; cache.s = {}; cache.st = {}; });

  function summary(t) {
    if (cache.s[t.id]) return cache.s[t.id];
    const tm = teamsFor(t);
    const courts = tieCourts(t);
    const m = meta(t.id);
    const games = D.GAMES.map((g, i) => ({ ...g, ...game(t.id, g.code), court: courts[i], key: `g:${t.id}:${g.code}` }));
    let gwA = 0, gwB = 0, pA = 0, pB = 0, nFinal = 0, anyLive = false;
    games.forEach((g) => {
      if (g.status === "final" && g.a !== null && g.b !== null) {
        nFinal++; pA += g.a; pB += g.b;
        if (g.a > g.b) gwA++; else if (g.b > g.a) gwB++;
      }
      if (g.status === "live") anyLive = true;
    });
    let status = "scheduled";
    if (nFinal === 3) status = "final";
    else if (anyLive || nFinal > 0) status = "live";
    else if (m.called) status = "called";
    const decided = gwA >= 2 || gwB >= 2;
    const winner = decided ? (gwA >= 2 ? tm.a : tm.b) : null;
    const loser = decided ? (gwA >= 2 ? tm.b : tm.a) : null;
    const s = {
      tie: t, id: t.id, ...tm, games, gwA, gwB, pA, pB, nFinal, status, decided, winner, loser,
      winSide: decided ? (gwA >= 2 ? "a" : "b") : null,
      time: tieTime(t), courts, called: m.called || null, note: m.note || ""
    };
    cache.s[t.id] = s;
    return s;
  }

  // ---------- standings ----------
  function cmp(x, y) {
    return y.W - x.W || y.GD - x.GD || y.PD - x.PD || x.team.localeCompare(y.team);
  }
  const sg = (v) => (v > 0 ? `+${v}` : `${v}`);
  function reason(x, y) {
    if (x.W !== y.W) return `tie wins (${x.W} vs ${y.W})`;
    if (x.GD !== y.GD) return `game difference (${sg(x.GD)} vs ${sg(y.GD)})`;
    if (x.PD !== y.PD) return `point difference (${sg(x.PD)} vs ${sg(y.PD)})`;
    return null;
  }

  function standings(br) {
    if (cache.st[br]) return cache.st[br];
    const rows = D.BRACKETS[br].map((team) => ({ team, P: 0, W: 0, L: 0, GW: 0, GL: 0, PF: 0, PA: 0, remaining: 0, form: [] }));
    const R = Object.fromEntries(rows.map((r) => [r.team, r]));
    const ties = D.ties.filter((t) => t.stage === "RR" && t.bracket === br);
    let nFinal = 0, started = false;
    ties.forEach((t) => {
      const s = summary(t);
      if (s.status === "final") nFinal++;
      if (s.status === "live" || s.status === "final") started = true;
      const A = R[t.a], B = R[t.b];
      s.games.forEach((g) => {
        if (g.status !== "final" || g.a === null || g.b === null) return;
        A.PF += g.a; A.PA += g.b; B.PF += g.b; B.PA += g.a;
        if (g.a > g.b) { A.GW++; B.GL++; } else if (g.b > g.a) { B.GW++; A.GL++; }
      });
      if (s.decided) {
        A.P++; B.P++;
        if (s.winSide === "a") { A.W++; B.L++; A.form.push("W"); B.form.push("L"); }
        else { B.W++; A.L++; B.form.push("W"); A.form.push("L"); }
      } else { A.remaining++; B.remaining++; }
    });
    rows.forEach((r) => { r.GD = r.GW - r.GL; r.PD = r.PF - r.PA; });
    rows.sort(cmp);
    const complete = nFinal === ties.length;

    // clinch / elimination using tie wins only (conservative & always correct)
    rows.forEach((r, i) => {
      r.rank = i + 1;
      const others = rows.filter((o) => o !== r);
      const canReach = others.filter((o) => o.W + o.remaining >= r.W).length;
      const surelyAbove = others.filter((o) => o.W > r.W + r.remaining).length;
      r.clinched = complete ? i < 2 : canReach < 2;
      r.eliminated = complete ? i >= 2 : surelyAbove >= 2;
      if (!started) r.why = "No results yet";
      else if (i < rows.length - 1) {
        const why = reason(r, rows[i + 1]);
        r.why = why ? `Ahead of Team ${rows[i + 1].team} on ${why}` : `Level with Team ${rows[i + 1].team} on all tiebreakers — Match Control decides`;
      } else {
        const why = reason(rows[i - 1], r);
        r.why = why ? `Behind Team ${rows[i - 1].team} on ${why}` : `Level with Team ${rows[i - 1].team} on all tiebreakers — Match Control decides`;
      }
    });
    const res = { bracket: br, rows, complete, nFinal, total: ties.length, started };
    cache.st[br] = res;
    return res;
  }

  // ---------- placements ----------
  function placements() {
    const g = summary(tieById.GOLD), b = summary(tieById.BRONZE);
    return {
      champion: g.status === "final" ? g.winner : null,
      runnerUp: g.status === "final" ? g.loser : null,
      third: b.status === "final" ? b.winner : null,
      fourth: b.status === "final" ? b.loser : null,
      gold: g, bronze: b
    };
  }

  // ---------- courts ----------
  function courtQueue(c) {
    const list = [];
    D.ties.forEach((t) => {
      const s = summary(t);
      s.games.forEach((g) => { if (g.court === c) list.push({ s, g }); });
    });
    list.sort((x, y) => x.s.time.localeCompare(y.s.time));
    const live = list.find((x) => x.g.status === "live");
    const called = list.find((x) => x.g.status !== "final" && x.s.called && x.g.status !== "live");
    const pending = list.filter((x) => x.g.status !== "final");
    const current = live || called || pending[0] || null;
    const next = pending.find((x) => x !== current) || null;
    const done = list.filter((x) => x.g.status === "final").length;
    return { court: c, list, current, next, done, total: list.length };
  }

  // ---------- event status ----------
  function eventStatus() {
    const all = D.ties.map((t) => summary(t));
    const nowD = now();
    const pl = placements();
    if (pl.champion && pl.third) return { kind: "done", title: "That's a wrap!", text: `Team ${pl.champion} are the PYS Open champions. Awarding ceremony 2:45–3:00 PM.` };
    const live = all.filter((s) => s.status === "live");
    const called = all.filter((s) => s.status === "called");
    const start = toDate("08:00");
    if (!live.length && !called.length && !all.some((s) => s.status === "final") && nowD < start) {
      return { kind: "pre", title: "Countdown to first serve", text: `Call time ${E.callTime}. First matches 8:00 AM.`, start };
    }
    const slots = [...new Set(live.map((s) => s.tie.slot))].map((id) => D.slots.find((x) => x.id === id).label);
    if (live.length) return { kind: "live", title: "Live now", text: `${slots.join(" & ")} in progress on ${live.length * 3} courts.` };
    const nxt = all.filter((s) => s.status !== "final").sort((a, b) => a.time.localeCompare(b.time))[0];
    if (called.length) return { kind: "live", title: "Match call", text: `${called.map((s) => s.tie.short).join(", ")} called to court. Teams have 5 minutes to report.` };
    if (nxt) return { kind: "next", title: "Up next", text: `${nxt.tie.label} at ${fmt(nxt.time)} · lineups due ${fmt(nxt.tie.lineup)}.` };
    return { kind: "next", title: "Stand by", text: "Waiting for final results." };
  }

  function teamTies(team) {
    return D.ties.map((t) => summary(t)).filter((s) => s.a === team || s.b === team).sort((a, b) => a.time.localeCompare(b.time));
  }
  const bracketOf = (team) => (D.BRACKETS.A.includes(team) ? "A" : D.BRACKETS.B.includes(team) ? "B" : null);

  // ---------- score validation (Official Rules §4, §7, §9) ----------
  function validate(t, a, b, result) {
    if (a === null || b === null) return "Enter both scores.";
    if (a < 0 || b < 0) return "Scores cannot be negative.";
    if (a === b) return "A game cannot end level.";
    const hi = Math.max(a, b), lo = Math.min(a, b);
    if (result === "forfeit") return hi === 11 && lo === 0 ? null : "Forfeit / no-show is recorded 11–0.";
    if (result === "retired") return hi === 11 ? null : "Retirement: the opposing team is awarded 11 points.";
    if (t.winBy === 2) {
      if (hi < 11) return "Games are played to 11.";
      if (hi - lo < 2) return "Podium matches are win by 2.";
      if (hi > 11 && hi - lo !== 2) return "Past 11, a win-by-2 game ends exactly 2 points apart.";
      return null;
    }
    if (hi !== 11) return "Bracket & semifinal games end at 11 (win by 1).";
    return null;
  }

  return {
    D, tieById, fmt, toDate, now, manilaHHMM, game, meta, summary, teamsFor, standings, placements,
    courtQueue, eventStatus, teamTies, bracketOf, validate, signed: sg
  };
})();
