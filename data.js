// ============================================================
//  PYS OPEN — TEAMS & SCHEDULE (from the official court schedule)
//  Courts listed per tie are [Men's Doubles, Women's Doubles, Mixed Doubles].
//  Times are 24-hour, Asia/Manila.
// ============================================================
window.PYS_DATA = (function () {
  const BRACKETS = {
    A: ["Ryan", "Ron", "Rannie", "Kiko", "Berns", "Madel"],
    B: ["Paul", "Big Boy", "Glen", "Audre", "Tim", "Jeng"]
  };

  const GAMES = [
    { code: "MD", name: "Men's Doubles", short: "Men's" },
    { code: "WD", name: "Women's Doubles", short: "Women's" },
    { code: "XD", name: "Mixed Doubles", short: "Mixed" }
  ];

  const C1 = [1, 2, 3], C2 = [4, 5, 6], C3 = [7, 8, 9];

  // [bracket, round, start, end, lineupDue, [[teamA, teamB] x3 on C1,C2,C3]]
  const RR = [
    ["A", 1, "08:00", "08:25", "07:50", [["Ryan", "Ron"], ["Rannie", "Kiko"], ["Berns", "Madel"]]],
    ["B", 1, "08:30", "08:55", "08:20", [["Paul", "Big Boy"], ["Glen", "Audre"], ["Tim", "Jeng"]]],
    ["A", 2, "09:00", "09:25", "08:50", [["Ron", "Madel"], ["Rannie", "Berns"], ["Ryan", "Kiko"]]],
    ["B", 2, "09:30", "09:55", "09:20", [["Paul", "Glen"], ["Tim", "Big Boy"], ["Jeng", "Audre"]]],
    ["A", 3, "10:15", "10:40", "10:05", [["Ron", "Rannie"], ["Ryan", "Madel"], ["Kiko", "Berns"]]],
    ["B", 3, "10:45", "11:10", "10:35", [["Tim", "Audre"], ["Big Boy", "Glen"], ["Jeng", "Paul"]]],
    ["A", 4, "11:15", "11:40", "11:05", [["Ryan", "Berns"], ["Madel", "Rannie"], ["Kiko", "Ron"]]],
    ["B", 4, "11:45", "12:10", "11:35", [["Audre", "Paul"], ["Big Boy", "Jeng"], ["Tim", "Glen"]]],
    ["A", 5, "12:15", "12:40", "12:05", [["Berns", "Ron"], ["Madel", "Kiko"], ["Ryan", "Rannie"]]],
    ["B", 5, "12:45", "13:10", "12:35", [["Audre", "Big Boy"], ["Tim", "Paul"], ["Glen", "Jeng"]]]
  ];

  const ties = [];
  const slots = [];
  RR.forEach(([br, rd, start, end, lineup, pairs]) => {
    const slot = { id: `${br}R${rd}`, label: `Bracket ${br} · Round ${rd}`, short: `${br}·R${rd}`, start, end, lineup, ties: [] };
    pairs.forEach(([a, b], i) => {
      const t = {
        id: `${br}${rd}-${i + 1}`, stage: "RR", bracket: br, round: rd,
        label: `Bracket ${br} · Round ${rd}`, short: `${br} · R${rd}`,
        start, end, lineup, courts: [C1, C2, C3][i], a, b, winBy: 1, slot: slot.id
      };
      ties.push(t); slot.ties.push(t.id);
    });
    slots.push(slot);
  });

  // Playoffs: teams are filled automatically from the standings.
  const sf = { id: "SF", label: "Semifinals", short: "SF", start: "13:35", end: "14:00", lineup: "13:25", ties: ["SF1", "SF2"] };
  ties.push({ id: "SF1", stage: "SF", label: "Semifinal 1", short: "SF 1", start: "13:35", end: "14:00", lineup: "13:25", courts: C1, seedA: "A1", seedB: "B2", winBy: 1, slot: "SF" });
  ties.push({ id: "SF2", stage: "SF", label: "Semifinal 2", short: "SF 2", start: "13:35", end: "14:00", lineup: "13:25", courts: C2, seedA: "B1", seedB: "A2", winBy: 1, slot: "SF" });
  const md = { id: "MEDAL", label: "Medal Matches", short: "Medals", start: "14:20", end: "14:45", lineup: "14:10", ties: ["GOLD", "BRONZE"] };
  ties.push({ id: "GOLD", stage: "MEDAL", label: "Gold Medal Match", short: "Gold", start: "14:20", end: "14:45", lineup: "14:10", courts: C1, fromA: "W:SF1", fromB: "W:SF2", winBy: 2, slot: "MEDAL" });
  ties.push({ id: "BRONZE", stage: "MEDAL", label: "Bronze Medal Match", short: "Bronze", start: "14:20", end: "14:45", lineup: "14:10", courts: C2, fromA: "L:SF1", fromB: "L:SF2", winBy: 2, slot: "MEDAL" });
  slots.push(sf, md);

  const NOTES = [
    { time: "07:00", text: "Call time" },
    { time: "12:10", text: "12:10–12:35 PM reserved for standings and playoff lineups (per schedule notes)" },
    { time: "14:45", text: "Awarding ceremony 2:45–3:00 PM" }
  ];

  return { BRACKETS, GAMES, ties, slots, COURTS: 9, NOTES };
})();
