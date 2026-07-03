# BRIEF S6 — Schedule Sheet Import + Locations

**Branch:** `feature/sheet-import` | **Read first:** `COORDINATOR.md`, `MV-OS_OPERATING_MODEL.md` (§4 retirement map)
**Mission:** Idempotent importer that seeds MV-OS from the live "Schedule System" Google Sheet, so cutover day starts with real data.

## Source

Sheet ID: `1VnkvVoLUhZNjN1N_p5XTjxKA_YPi6mD46xA3EBK3Zf4` (public htmlview). CSV export per tab:
`https://docs.google.com/spreadsheets/d/<ID>/export?format=csv&gid=<GID>`

| Tab | gid | Import target |
|---|---|---|
| Lists | 0 | Instructors (8, with phones), Courses (Arduino, AI, EV3, Mobile Apps, Programming Basics, Python, Web Dev, WeDo, Flutter) |
| Availability | 114687001 | InstructorAvailability (day, start, end, Online/Offline mode) |
| Entry | 541324700 | Groups + TeachingSlots: code, instructor, day, start/end, location, status Running/Stopped, level, session # |
| groups | 1664917504 | Group code validation list |
| Form Responses 1 | 394351625 | Historical session reports (~340 rows since Jan 2026) |

## Steps

1. Importer `backend/scripts/import-schedule-sheet.ts` (Node, runs standalone with DB URL env):
   - Fetch CSVs, parse (handle quoted names like `"MA098 ""recap"""`), upsert by natural keys (instructor name, group code) — **idempotent, re-runnable** while sheet stays live during parallel-run.
   - Normalize instructor name variants (e.g. "Mahmoud Khalaf"/"Mahmoud Khalafallah", "Yasmeen"/"Yasmin"/"yasmin" — build alias map, flag unknowns).
   - Location strings → Location records: MOA, ESPACES, DOKKI, Maadi, Online.
   - Group code convention: 2–3 letter course prefix + serial (PY/MA/WD/AI/AR/PB/WEB/FL) — map prefix → Course.
2. Validity re-check: recompute Valid/Out-of-Hours/Wrong-Day/Double-Booked from imported availability; write violations to a `schedule_fix_queue` table (or JSON report `IMPORT_VIOLATIONS.md`) — expect ~13 groups.
3. Historical reports: map free-text student names as raw strings into a `legacy_session_reports` table (no attempt to match students yet); keep engagement/ratings columns for trend baselines.
4. If new models needed (Location, legacy tables, fix queue) → deliver `prisma/PROPOSED_MODELS_IMPORT.md` ([SHARED] schema — integrator merges). Coordinate with S4 which also creates `Location`: **S4 owns the Location model; you consume it** — if S4's isn't merged yet, define it identically in your proposal and note the overlap.
5. Summary output: counts per entity, violations, unknown names — printed and written to `IMPORT_REPORT.md`.

## Extension (added 2026-07-03, from GAP_ANALYSIS B10)

Also import the **2025 Customer Data** Google Sheet (Drive file `1NAu4S8_WJyvIrbq8RtgqgFEn12cGZFNQUAAMdEq9qB0`, folder `109zBwhDXM6snfXRON0kegzOdQsZUH5Rq`):
- Columns: Group Name, Course, Level, Location, Day, Time, Kid's Name, Phone, Email, Session No., last/next payment, notes
- Parents: dedupe by normalized phone (E.164); kids sharing a phone share a parent
- Students + enrollments into matching groups (codes like "PB G36" ≈ PB036 — build alias map)
- Session No. ("session 8 Lv 1") → enrollment session counter seed (feeds renewal engine S9)
- "next payment" dates → `renewalDate` seed; "STOPPED"/"FINISHED" → enrollment status
- Notes column → ContactNote/Student note (rich at-risk + sentiment info — do not lose)
- Locations include Nasr City, Zayed, Tagamo3, Dokki — map to Location records

## Acceptance

- Running twice produces zero duplicates
- All 8 instructors, 9 courses, ~70 groups, availability windows imported on local DB
- Violations report lists the invalid groups with reasons
- No writes to prod DB; no [SHARED] file edits
