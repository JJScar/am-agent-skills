# Account Manager Skills

Account memory and agent-ready skills for account managers — so Claude already knows your accounts when you ask it to prep a call, triage your week, or draft an escalation.

**Status:** early. The skills catalog, validator and local MCP server are live, and the repo is **open to external contributions** (see [Contributing](#contributing)). Now building **account memory**: a persistent record per account that Claude reads before answering and updates afterwards. See [`docs/account-memory-decision.md`](docs/account-memory-decision.md) for why and how.

## Why account memory?

Most AMs use AI by just chatting with it, and every chat starts from zero — Claude doesn't know who the champion is, what you promised last week, or which issue has been blocking the customer for a month. Each account gets one record (stakeholders, commitments, open issues, timeline, and where its emails and channels live), and the skills work from that record instead of asking you to paste context in every time. Delivery starts as a Claude Project template you copy, then a local MCP server, then a claude.ai connector you add with a single URL.

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

**Easiest: set up account memory in a Claude Project.** Follow [`templates/claude-project/SETUP.md`](templates/claude-project/SETUP.md): 5 steps, no installs, and Claude keeps a record of each of your accounts.

Or use a single skill on its own, with no install required:

1. Open the `SKILL.md` for the skill you want.
2. Paste its contents into your agent's custom instructions — a Claude Project, a Custom GPT, or a Claude Code/Cursor skills folder.

That's it.

## MCP server

Prefer your agent to pull skills in live during a chat instead of pasting them by hand? See [`mcp-server/README.md`](mcp-server/README.md). It runs locally for Claude Desktop, or as an always-on remote connector for claude.ai and ChatGPT, with passphrase-approved OAuth sign-in. [`docs/self-hosting.md`](docs/self-hosting.md) covers running it on a spare Mac. It serves skill content today; account-memory tools are next.

## Audience

The primary audience is **non-technical AMs** — people who chat with Claude and won't edit a config file. Technical AMs are covered too: anyone with a CRM/CS-platform tool already configured can use it alongside account memory.

Skills are tagged `metadata.audience: technical | non-technical | both`. `technical` skills may assume access to a configured CRM/CS-platform tool and degrade gracefully when one isn't available. `non-technical` skills assume nothing beyond a conversation — no setup, no CLI, no JSON.

## Contributing

Want to add or change a skill? See [`CONTRIBUTING.md`](CONTRIBUTING.md) for the propose → discuss → PR → validate → merge flow.

## License

- **Tooling/code** (scripts, CLI, MCP server): [MIT License](LICENSE).
- **Skill content** (`SKILL.md`, `references/`, `assets/`): [Creative Commons Attribution 4.0 International (CC-BY-4.0)](https://creativecommons.org/licenses/by/4.0/), unless a skill states otherwise.

## Credit

Format and tooling concepts adapted from [`tech-leads-club/agent-skills`](https://github.com/tech-leads-club/agent-skills).