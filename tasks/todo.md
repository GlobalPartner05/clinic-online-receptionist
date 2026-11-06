# Frontend rebuild — Suyat Dental (Remotion + interactive)

Branch: `claude/great-pascal-lq0833`. Plan: `/root/.claude/plans/rebuild-the-frontend-with-ethereal-crab.md`

## Baseline (before changes)
- `npm test`: 7 files / 41 tests pass. `npm run typecheck`: errors in `tests/receptionist-features.test.ts` (`unknown` JSON).

## Code review findings (current `public/*.html` + `src/`)
Security
- [x] Hardcoded Base44 key/agent/conversation IDs `src/server.ts:98-102` -> env only. **User must still rotate the leaked key (it is in git history).**
- [x] Stored XSS: `admin.html` builds rows with innerHTML from patient-controlled fields (fixed in web/)
- [x] Admin password prefilled "test" (fixed in web/)
- [x] CSV export unescaped (quotes / formula injection) (fixed in web/)
- [ ] Not fixed here (flag): /api/calls/* unsigned, Telegram webhook open without secret, no rate limit, phone-only identity
Bugs
- [ ] (DECISION NEEDED, backend untouched) Hours conflict: marketing (SN Mon-Tue 9-6, P6 Wed-Sat 10-6) vs `db.ts` (Mon-Fri 9-17, Sat 9-13); Sunday maps to Project 6
- [x] Quick-chips now use phrasings the parser handles; original: Quick-chips send phrasing the regex parser cannot handle ("next Monday", "tomorrow at 10:00 AM")
- [x] Voice call overwrites chat mic `onresult`; listening state sticks (fixed in web/)
- [x] Hardcoded caller `+639170000001` shared by all web callers (fixed in web/)
- [x] Receipt page shows fake data when API fails (fixed in web/)
- [x] Base44 tab default; fragile reply shape (fixed in web/)
A11y / responsive
- [x] No mobile nav; low contrast text; no focus trap/Esc in call modal; unlabeled input; canvas runs forever, ignores reduced-motion; admin table overflows on phones (fixed in web/)
Dead code
- [x] navy-yard pages, duplicate logo, unused images, fake "Remotion" canvas (fixed in web/)

## Plan checklist
- [x] Phase 1 scaffold `web/` (Vite+React+TS), wrangler assets -> `web/dist`
- [x] Phase 2 Remotion compositions (HeroReel, ServicesShowcase, BookingSteps, ReceptionistWave) + render script
- [x] Phase 3 pages: Landing, Chat/Voice, Receipt, Admin
- [x] Phase 4 backend fixes (Base44 env, hours single source, parser)
- [ ] Verify: tests, build, Playwright 390/768/1440, reduced-motion, render clips
- [ ] Commit, push, draft PR

## Results
- Root: 42 worker tests pass (assets test rewritten for the new frontend); web: 5 unit tests; `npm run build:web` OK.
- Playwright @390/768/1440: no horizontal overflow, no console errors, mobile menu, service-card -> chat reply works, reduced-motion shows posters, admin XSS payload inert.
- `render:clips --video` produces 4 MP4s.
- Phase 4 partial: only Base44 secrets moved to env. Hours/branch single-source NOT changed (tests encode backend hours as spec; product decision).
- Not done / flagged: Twilio signature check, rate limiting, phone-only identity, Telegram secret enforcement, stray root logs/PDFs/vendored `digital-health-skills/`.
- Logo: repo PNG had an opaque gray background; replaced by live SVG/text lockup (`web/src/components/Logo.tsx`). Drop in an official transparent logo to replace.
