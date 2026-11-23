# PYS Open — Match Control site

Live scores, standings, schedule and court calls for the **PYS Open Pickleball Tournament**
(Nov 28, 2026 · Pickleball World, CSFP). It's a static site hosted free on GitHub Pages, with a free Supabase database for live scores.

## Pages

| Page | URL | What it does |
|---|---|---|
| Home | `#/` | Event info, live status / countdown, current round, standings snapshot, latest updates |
| Live Courts | `#/live` | All 9 courts: what's on now, scores, match calls, what's next |
| Schedule | `#/schedule` | Every tie by time slot, with filters (bracket, status, team search), plus a court-grid view |
| Standings | `#/standings` | Live tables for Brackets A and B (W, L, GW, GL, GD, PF, PA, PD), Clinched/Out badges, tiebreak explanation |
| Bracket | `#/brackets` | Prelims → Semifinals → Gold/Bronze → final placements |
| My Team | `#/team` | Team directory; each team page shows its record, next match, courts and lineup deadline |
| Updates | `#/updates` | Announcements posted by Match Control |
| Rules | `#/rules` | The official rules |
| TV mode | `#/tv` | Big-screen view: both standings tables + all 9 courts, live clock |
| **Match Control** | `#/control` | Password-protected score entry (not shown in the menu; linked in the footer) |

Ranking follows the Official Rules §3: **tie wins → doubles game differential → point differential**.
A tie counts as won as soon as a team takes 2 of 3 games. The semifinal teams (A#1 vs B#2, B#1 vs A#2) and the medal-match teams fill in automatically.

---

## Step 1 — Create the Supabase database (about 10 minutes)

1. Go to <https://supabase.com>, sign up for free, and click **New project**. Pick region **Southeast Asia (Singapore)**.
2. Open **SQL Editor → New query**. Paste the contents of `supabase/setup.sql`. **Change `matchcontrol@example.com` to your own email first.** Then click **Run**.
3. Go to **Authentication → Users → Add user → Create new user**. Use the same email, set a strong password, and tick *Auto confirm*.
   Add more emails to the SQL list (and run it again) if other officials will enter scores.
4. Recommended: go to **Authentication → Sign In / Providers** and turn off **Allow new users to sign up**.
5. Go to **Project Settings → API** (or **Data API**) and copy the **Project URL** and the **anon public** key.
6. Open `js/config.js` and paste them in:
   ```js
   SUPABASE_URL: "https://xxxx.supabase.co",
   SUPABASE_ANON_KEY: "eyJhbGciOi...",
   ```
   The anon key is safe to publish. Only the emails in your SQL list can change scores.

> Until you do this, the site runs in **Demo mode**: everything works, but scores are saved only in your own browser. That's useful for practice.

## Step 2 — Publish on GitHub Pages

1. Create a GitHub account and a **new public repository**, for example `pys-open`.
2. Click **Add file → Upload files** and drag in everything in this folder (`index.html`, `css/`, `js/`, `assets/`, `supabase/`, `README.md`). Then **Commit**.
3. Go to **Settings → Pages**. Under *Source*, choose **Deploy from a branch**, then choose `main` / `(root)` and click **Save**.
4. After about a minute your site is live at `https://YOUR-USERNAME.github.io/pys-open/`.
5. Make a QR code of that link for the venue (Rules §9: "Monitor the match queue using the QR code").

## Step 3 — Before the event

- Open `…/#/control`, sign in, go to **Tools → Random: all rounds**, and click around the site to practice.
- Then go to **Tools → Reset everything** to clear the test data.
- Put a laptop or TV on `…/#/tv` (press F11 for full screen).

## On match day (Match Control)

1. **Call a round:** use 📢 *Call all ties in this round* (or *Call to court* per tie). Courts show **Called**, and the 5-minute report window starts (Rules §9).
2. **Game in progress:** click **Live**. Scores are optional. The court card turns red.
3. **Game over:** type both scores and click **Save final** (or press Enter). Standings update everywhere within about 1 second.
   - The rule check warns if a score doesn't fit the rules (to 11, win by 1; win by 2 for Gold and Bronze). You can still save it, for example for a time-limited game.
   - **Retired** (Rules §7): set type to *Retired* and enter 11 for the opponent and the retiring team's score at the stop.
   - **Forfeit / no-show / withdrawal** (Rules §8–9): under *Tie settings*, click **"X wins by forfeit"**. This records 11–0 in all three games.
4. **Schedule changes:** under *Tie settings*, change the start time and courts (`7,8,9` = MD, WD, XD) and add a public note.
5. **Playoffs:** the SF teams fill automatically when both brackets are complete. If teams are fully level on all three tiebreakers, choose the team manually in *Tie settings*.
6. **Updates tab:** post announcements. They appear on Home, Updates and the TV ticker.
7. **Tools → Download backup** after each round.

Every score change is also logged in the Supabase table `pys_log` (who, when, before and after). You can view it under Supabase → Table Editor.

## Editing teams or times

All teams, times and courts are in `js/data.js`. Event details (venue, date, hours) are in `js/config.js`.

## Notes on the schedule PDF

- A·R5 and B·R5 are listed as *12:15 AM* and *12:45 AM*. The site uses **12:15 PM** and **12:45 PM**.
- A·R5 (12:15–12:40 PM) overlaps the "12:10–12:35 PM standings and playoff lineups" window in the PDF notes. The site follows the time grid.

## Preview at a given time

Add `?now=2026-11-28T09:10` to the URL (before the `#`) to see the site as it would look at that Manila time.
