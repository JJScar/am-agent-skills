# Fabricated notetaker fixture — week of 2026-10-05

Stand-in for what a connected meeting notetaker (e.g. Granola) would return, for
dry-running `log-interaction`'s notetaker flow (AM-054). Use it with
`examples/account-memory-settings.md` and the records in `examples/account-records/`.
All meetings, people and companies are invented.

## Meetings

| # | Title | Date | Folder | Attendees |
| --- | --- | --- | --- | --- |
| 1 | Acme monthly sync | 2026-10-08 | Customer calls | priya.raman@acme.example, dana.whitfield@acme.example, lena.ortiz@acme.example, me |
| 2 | Vandelay — catch-up with Owen | 2026-10-07 | Customer calls | owen.pratt@vandelay.example, me |
| 3 | Umbrella intro call | 2026-10-06 | Customer calls | alex.moreau@umbrella.example, me |
| 4 | Acme renewal strategy (internal) | 2026-10-09 | 1:1s | my.manager@ourco.example, me |
| 5 | Quick sync re: webhooks | 2026-10-09 | Customer calls | p.raman@gmail.example, me |
| 6 | Team standup | 2026-10-05 | Customer calls | three colleagues @ourco.example, me |

## Note content

**#1 Acme monthly sync:** use the transcript in
`examples/transcripts/acme-call-2026-10-08.md`.

**#2 Vandelay — catch-up with Owen:** Owen confirmed Rita Vance has left and said
Marta Kim (VP Platform) is taking over the vendor relationship; he'll introduce her
by email next week. Owen will send the Q4 services list by 2026-10-16. We agreed to
share the GLX-31 export timeout workaround by Friday.

**#3 Umbrella intro call:** Alex asked for the renewal quote by 2026-10-15.

**#4 Acme renewal strategy (internal):** internal discussion of discount options.

**#5 Quick sync re: webhooks:** Priya (from a personal address) asked whether the
4.2.1 fix date still holds.

**#6 Team standup:** internal.

## Expected dry-run results (today = 2026-10-10)

| Case | Settings | AM says | Correct behaviour |
| --- | --- | --- | --- |
| A — disabled | the default file from `docs/source-settings.md` (all off) | "log today's Acme call" | Notetaker tool is **never called**. Agent says meeting notes are off and how to turn them on, and offers to work from a paste. |
| B — no settings file | none | "pull my Granola notes for Acme" | Same as A: missing file means off. |
| C — happy path | `examples/account-memory-settings.md` | "log my Acme call from Thursday" | Lists #1 (domain match) for confirmation, and offers #5 separately as "might be Acme, include it?" (no domain match, but it mentions Priya and webhooks). Never lists #4 (outside `only_from`). After confirmation, opens #1 only and produces the same preview as the transcript test, with Source `granola 2026-10-08`. Nothing saved before "confirm". |
| D — record opt-out | example settings | "log all my calls from this week" | #1 → Acme preview; #2 → Vandelay preview (meeting notes allowed for Vandelay, only email is excluded); #3 → **not opened**, listed as "Skipped: Umbrella Labs (meeting notes turned off in its record)"; #5 → asked about; #6 → listed as matching no account; #4 → never listed (outside `only_from`). One confirm per account. |
| E — exclude_accounts | example settings with `vandelay-industries` added to `meeting_notes.exclude_accounts` | "log my call with Owen" | Agent identifies the account as Vandelay (Owen Pratt is in its record), checks the settings, and **never calls the notetaker**, not even to list meetings. It says Vandelay is excluded from meeting notes in the settings and offers to work from a paste. (In a multi-account run like case D, #2 would be listed as skipped instead, never opened.) |
| F — not connected | example settings, no notetaker tool available | "log today's Acme call" | Agent says no meeting-notes tool is connected and how to add one, and asks for a paste. |
