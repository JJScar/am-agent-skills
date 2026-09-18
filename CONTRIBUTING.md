# Contributing

This repo uses an issue-first contribution flow: proposals get discussed before a PR is opened, so quality stays consistent and nobody invests time in a skill that needs to change shape first. This file covers propose → discuss → PR → validate → merge, plus the two things that are mechanically enforced (the description-quality standard, and no real customer data — ever).

## 1. Propose: open an issue first

Before writing a `SKILL.md`, open a GitHub issue using the [**Propose a new skill**](.github/ISSUE_TEMPLATE/propose-skill.yml) issue template. It captures the same four things a maintainer needs to triage:

- **Category** — which existing `skills/<category>/` it belongs to, or a new one.
- **Audience** — `technical`, `non-technical`, or `both` (see [Audience](README.md#audience) in the README).
- **Trigger phrases** — the kinds of things an AM would say that should surface this skill.
- **What it does** — a sentence or two; you'll turn this into the full `description` field later.

## 2. Discuss

A maintainer will respond on the issue — usually to confirm the category/audience split, flag overlap with an existing skill, or suggest a scope change before any code is written. Wait for at least a lightweight go-ahead before opening a PR; it avoids rework on both sides.

## 3. Open a PR

Once the approach is agreed:

- Run `npm run scaffold` to generate a new skill folder with correctly-shaped frontmatter, or copy an existing skill (e.g. `skills/onboarding/kickoff-prep`) as a starting point.
- Write the skill, following the description-quality standard below.
- Make sure every example is fabricated — see "Data safety" below.
- Fill out the PR template's checklist.

## 4. Validator and CI

CI runs three checks, in this order, on every PR that touches `skills/` or `tools/`:

1. `npm run validate` — checks every `SKILL.md`'s frontmatter and structure.
2. `npm run generate:registry` — regenerates `skills-registry.json`; CI fails if this produces a diff, which means the registry wasn't committed.
3. `npm run generate:catalog` — regenerates `docs/CATALOG.md` from the registry; CI fails the same way if it's stale.

Run all three locally before opening a PR, and commit any diff to `skills-registry.json` or `docs/CATALOG.md` along with your skill:

```
npm run validate
npm run generate:registry
npm run generate:catalog
```

### Description quality standard

A skill's `description` frontmatter field is what an agent reads to decide whether to reach for it, so it has to earn that on its own, without the rest of `SKILL.md` for context. Write it with three things in mind — what it does, when to use it, when not to:

- **What** — say plainly what the skill does.
- **When** — a clause starting `Use when ...`, naming the trigger phrases or situations that should surface it.
- **Not-when** — a clause starting `Do NOT use for ...`, naming the adjacent skills or scenarios it should *not* claim, so an agent doesn't reach for it by mistake.

The **When** and **Not-when** clauses aren't just good practice — `tools/validate-skills.mjs` checks for them: the description fails validation if it's missing a case-insensitive `use when` or `do not use for` substring. It also enforces a 1024-character limit and rejects `<`/`>` characters. See `skills/onboarding/kickoff-prep/SKILL.md` for a description that follows this shape.

The rest of `SKILL.md`'s required structure, also enforced by the validator:

- `name` must exactly match the skill's folder name (kebab-case: lowercase letters, digits, and hyphens only).
- `metadata.version`, `metadata.author`, and `metadata.audience` are all required (`audience` must be exactly `technical`, `non-technical`, or `both`).
- The file must be named `SKILL.md` (exact case) — no stray `README.md` inside a skill folder.
- The body (everything after the frontmatter) must be 500 lines or fewer.

### Attribution via `metadata.author`

Set `metadata.author` to your name or GitHub handle. That field is how contributors get credited — there's no separate contributors list to keep in sync; the credit lives on the skill itself.

## 5. Merge

Once CI is green and a maintainer has approved, the PR gets merged. There's no separate release step — skills are used directly off `main`.

## Data safety — no real customer data, ever

Nothing in `SKILL.md`, `references/`, or `assets/` may contain real customer data: no real company names, no real numbers (ARR, seat counts, usage figures), no real people. Every example in this catalog uses fabricated data — see any existing skill (e.g. `skills/onboarding/kickoff-prep`, which uses "Acme Corp") for the pattern.

This isn't optional style guidance. Skills in this repo get pasted into AI agents and can end up quoted back in a live conversation — a real customer's numbers baked into example content is a leak, not a hypothetical.

**Before opening a PR that touches `skills/`:**

- [ ] Every example account, company, and number in your change is fabricated.
- [ ] `npm run validate` passes locally.
- [ ] `npm run generate:registry` was re-run and the resulting `skills-registry.json` diff is included, if you added, removed, or edited a skill.

This checklist is also enforced by the PR template — see `.github/PULL_REQUEST_TEMPLATE.md`.
