# Fabricated test email thread — Globex Inc (new account, no record yet)

Used to test the `log-interaction` skill's "no record yet" path. All people and companies are invented.

**Expected result:** the skill offers to start a new `globex-corp`/`globex-inc` record and fills it from the thread:
- `domains: [globex.example]`
- Stakeholders: Tom Reyes (CTO), Aiko Tanaka (Engineering Manager); no champion set without asking.
- Commitments:
  1. us, Account manager: send the onboarding plan, due 2026-10-07 ("by Wednesday", from Mon 2026-10-05).
  2. us, Account manager: confirm the data-residency (EU) answer with the product team, due 2026-10-09 ("this week") or flagged.
  3. them, Aiko Tanaka: send the list of admin users, due `unknown`.
- Issue I-001: sandbox API keys not working, opened 2026-10-05, `open`.
- One email timeline entry on 2026-10-05; `last_contact.email` → 2026-10-05.

---

**From:** Tom Reyes <tom.reyes@globex.example>
**To:** Account manager
**Date:** Mon, 5 Oct 2026 09:12
**Subject:** Getting started

Hi — great to have the contract signed. Aiko Tanaka, our Engineering Manager, will lead the rollout on our side. Two things: our sandbox API keys don't seem to work yet, and we need to know whether data can stay in the EU.

Tom Reyes, CTO, Globex

---

**From:** Account manager
**To:** Tom Reyes, Aiko Tanaka
**Date:** Mon, 5 Oct 2026 11:40

Welcome aboard! I've raised the sandbox key problem with support. I'll send the onboarding plan over by Wednesday, and I'll confirm the data-residency answer with our product team this week. Aiko, could you send me the list of people who need admin access when you get a chance?

---

**From:** Aiko Tanaka <aiko.tanaka@globex.example>
**Date:** Mon, 5 Oct 2026 14:03

Will do — I'll send the admin list once I've checked with IT.
