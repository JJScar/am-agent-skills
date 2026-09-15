# AM Skills

Packaged, agent-ready skills for account managers — kickoff prep, churn triage, QBR prep, renewal prep, escalation emails, and more.

**Status:** early / foundation. Starting with **technical AMs** (comfortable with an AI agent that has a CRM/CS-platform tool configured); a non-technical-AM path is planned once the format and tooling are proven out.

## What's a skill?

A `SKILL.md` file with YAML frontmatter plus an instructions body, optionally paired with reference docs, scripts, or templates:

```
skills/category-name/skill-name/
├── SKILL.md           # required — YAML frontmatter + instructions body
├── references/        # optional — docs the agent reads on demand
├── scripts/           # optional — deterministic helpers
└── assets/            # optional — templates that end up in the output
```

Point your AI agent at a skill and it picks up the relevant one automatically based on what you're trying to do — no need to remember exact commands.

## Using a skill today

No install required:

1. Open the `SKILL.md` for the skill you want.
2. Paste its contents into your agent's custom instructions — a Claude Project, a Custom GPT, or a Claude Code/Cursor skills folder.

That's it. A CLI installer and/or MCP server are planned for later once there's enough of a catalog to justify them.

## Audience

Skills are tagged `metadata.audience: technical | non-technical | both`. `technical` skills may assume access to a configured CRM/CS-platform tool and degrade gracefully when one isn't available. `non-technical` skills assume nothing beyond a conversation — no setup, no CLI, no JSON.

## License

- **Tooling/code** (scripts, CLI, MCP server): [MIT License](LICENSE).
- **Skill content** (`SKILL.md`, `references/`, `assets/`): [Creative Commons Attribution 4.0 International (CC-BY-4.0)](https://creativecommons.org/licenses/by/4.0/), unless a skill states otherwise.

## Credit

Format and tooling concepts adapted from [`tech-leads-club/agent-skills`](https://github.com/tech-leads-club/agent-skills).