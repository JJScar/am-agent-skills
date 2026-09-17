# Contributing

This file currently exists for one reason: to state the data-safety rule somewhere a contributor and a reviewer will actually see it, ahead of the full contribution flow that lands later (issue-first proposals, the description-quality standard, attribution via `metadata.author` — see `Tickets.md` ticket AM-020). Expect this file to grow.

## Data safety — no real customer data, ever

Nothing in `SKILL.md`, `references/`, or `assets/` may contain real customer data: no real company names, no real numbers (ARR, seat counts, usage figures), no real people. Every example in this catalog uses fabricated data — see any existing skill (e.g. `skills/onboarding/kickoff-prep`, which uses "Acme Corp") for the pattern.

This isn't optional style guidance. Skills in this repo get pasted into AI agents and can end up quoted back in a live conversation — a real customer's numbers baked into example content is a leak, not a hypothetical.

**Before opening a PR that touches `skills/`:**

- [ ] Every example account, company, and number in your change is fabricated.
- [ ] `npm run validate` passes locally.
- [ ] `npm run generate:registry` was re-run and the resulting `skills-registry.json` diff is included, if you added, removed, or edited a skill.

This checklist is also enforced by the PR template — see `.github/PULL_REQUEST_TEMPLATE.md`.
