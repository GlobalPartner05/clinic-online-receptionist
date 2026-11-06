# Starting a new client from this sample

This repo is a working sample personalised for **Suyat Dental Clinic**. To personalise it for another clinic, follow this checklist. Everything the visitor sees is controlled from three places; a few backend strings need a find-and-replace.

## 1. Fresh repo (do this first)
- Copy the repo **without its git history** (`git archive`, or a squashed first commit). Do not fork: history may contain a previous client's secrets.
- Rename the Worker in `wrangler.jsonc` (`name`) and create a new D1 database for the client:
  `npx wrangler d1 create <client>-appointments-db` → put the new `database_id` in `wrangler.jsonc`, then `npx wrangler d1 migrations apply <client>-appointments-db --remote`.
- Remove or repoint the `send_email` binding if the client does not use it.

## 2. The three personalisation points (frontend)
| What | File | Change |
|---|---|---|
| Name, tagline, hero copy, welcome message, domain | `web/src/config/clinic.ts` (`CLINIC`) | Edit the values |
| Services, booking steps, branches (address, days, hours), quick chat chips | `web/src/config/clinic.ts` (`SERVICES`, `STEPS`, `BRANCHES`, `QUICK_CHIPS`) | Edit the lists |
| Colours, spacing, type, motion | `web/src/styles/tokens.css` + `web/DESIGN.md` | Change the brand primitives (`--cyan`, `--red`, `--navy`, `--orange`, `--cyan-N`, `--ink-N`, `--color-action`) and re-check contrast (spec rules in DESIGN.md) |
| Page title, description, social tags | `web/index.html` | Edit `<title>` and meta tags; update the canonical URL |
| Logo | `web/src/components/Logo.tsx` | The wordmark text comes from `CLINIC`; replace the component with the client's transparent logo if they have one |
| Receptionist mascot | `web/public/images/receptionist.webp` (512px) + `receptionist-128.webp`; name in `CLINIC.receptionistName` | Replace both files with the client's mascot (transparent PNG → webp; clean any edge specks) and rename it |
| Hero images | `web/public/images/` | Replace `dentist-thumbs-up.webp`, `schedule-phone-mockup.webp`; then `npm run render:clips` to regenerate the poster stills |

After editing, run `npm run build:web` and `npm run render:clips` (regenerates the animated hero poster from the same config).

## 3. Backend strings to replace (find-and-replace; not yet config-driven)
| File | What |
|---|---|
| `src/tools.ts` | `getBranchForDate` (branch names, addresses, which weekday maps to which branch); `SUYAT-` booking reference prefix (2 places) |
| `src/db.ts` | `CLINIC_HOURS` and `clinicHoursFor` (bookable slots). **Keep these consistent with the branch hours shown on the site** |
| `src/chat.ts` | Welcome menu text and the hours wording in error messages |
| `src/agent.ts` | `SYSTEM` prompt (clinic name, timezone, branches, hours) |
| `src/calls.ts` | Spoken greeting, goodbye and the website name |
| `skills/dental-receptionist/SKILL.md` | The skill description for the agent |
| `tests/` | Update expectations that encode branch names, hours or the reference prefix |

## 3b. Optional voice agent
`voice/` holds the NVIDIA voice-agent overlay (prompt, tools, handlers) and `/api/voice/tool` in the Worker. Edit `voice/prompt.yaml` and `voice/tools.yaml` for the client; see `voice/README.md` for status and setup.

## 4. Secrets and environment
Copy `.dev.vars.example` to `.dev.vars` for local work, and set the same names with `npx wrangler secret put <NAME>` for production: `ADMIN_PASSWORD` (required), `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, `TELEGRAM_WEBHOOK_SECRET`, `RESEND_API_KEY`, `CLINIC_NOTIFICATION_EMAIL`, `VOICE_TOOL_SECRET` (only if using voice/), and optionally `BASE44_API_KEY`, `BASE44_AGENT_ID`, `BASE44_CONVERSATION_ID`. Never commit real values.

## 5. Before go-live
- [ ] Opening hours: backend slots (`src/db.ts`) match the branch hours in `clinic.ts`.
- [ ] Tests pass (`npm test`, `npm run test:web`) and `npm run build:web` is clean.
- [ ] Contrast re-checked if colours changed (AA: 4.5:1 text, 3:1 UI).
- [ ] Share image is a PNG/JPG, SEO head/schema/`llms.txt` updated for the client (see `work/<domain>/` for the Suyat example).
- [ ] Known gaps from the sample, to decide per client: unsigned voice-call webhook, no rate limiting on chat/booking, phone-number-only identity for managing bookings, Telegram webhook open when its secret is unset.
