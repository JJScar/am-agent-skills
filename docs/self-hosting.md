# Self-hosting on a Mac (Tailscale Funnel)

How to run `am-skills-mcp` as an always-on remote connector on a spare Mac, so
claude.ai and ChatGPT can reach it over HTTPS. Per DEC-6 / DEC-11 (see
`docs/project-docs/Tickets.md`): free tooling only, single user.

> **Current milestone: skills only, no sign-in.** The server exposes only the
> public skill catalog (`search_skills`, `read_skill`, `fetch_skill_files`), the
> same content that's on GitHub, so it's safe without authentication. **Account
> records never go on this server until OAuth sign-in exists (AM-048).** Don't
> point it at real customer data before then.

## How it fits together

```
claude.ai / ChatGPT ──HTTPS──▶ https://<laptop>.<tailnet>.ts.net/mcp
                                   │  Tailscale Funnel (TLS, public)
                                   ▼
                           http://127.0.0.1:8787/mcp   ← am-skills-mcp --http
                                                         (localhost only)
```

The server only listens on `127.0.0.1`, so nothing on your network can reach it
directly. Funnel is the only way in, and it only accepts requests for your
`*.ts.net` name.

## What you need

- The spare Mac, on power, with the lid **open** (a closed lid sleeps the Mac
  unless an external display is attached).
- **Node.js 18 or newer:** check with `node -v`. If it's missing, install the LTS
  from [nodejs.org](https://nodejs.org).
- **Tailscale.** Use the version from
  [tailscale.com/download/mac](https://tailscale.com/download/mac), not the App
  Store. Tailscale's Funnel docs say Funnel on macOS needs one of the non-App-Store
  variants (they're inconsistent about which; if `tailscale funnel` refuses to
  start, that's the first thing to check). A free Personal plan is enough: Funnel
  is available on all plans.

## 1. Get the code and test it locally

```bash
git clone git@github.com:JJScar/am-agent-skills.git
cd am-agent-skills
npm ci
npm test                  # should end with "pass 10, fail 0"
npm run start:http        # leave running for the next command, Ctrl+C when done
```

In a second terminal:

```bash
curl http://127.0.0.1:8787/health
# {"ok":true,"server":"am-skills-mcp","version":"1.1.0"}
```

## 2. Set up Tailscale Funnel

1. Install Tailscale and sign in. This creates your *tailnet* (free).
2. In the [admin console's DNS page](https://login.tailscale.com/admin/dns), make
   sure **MagicDNS** and **HTTPS Certificates** are both enabled.
3. Make the `tailscale` command available in Terminal. If `tailscale version`
   says "command not found", turn on the CLI from the Tailscale menu-bar app's
   settings, or call the binary inside `/Applications/Tailscale.app` directly.
4. Turn on Funnel for the server's port. It runs in the background and survives
   reboots:

   ```bash
   tailscale funnel --bg --https=443 localhost:8787
   ```

   The first time, it prints a link to approve Funnel for your tailnet. Open it
   and approve. That adds the `funnel` attribute to your policy file for you.
5. Find your public name:

   ```bash
   tailscale funnel status
   # https://my-laptop.tail1234.ts.net (Funnel on)
   # |-- / proxy http://127.0.0.1:8787
   ```

   The host name (here `my-laptop.tail1234.ts.net`) is what you need below. A new
   name can take up to 10 minutes to start resolving publicly.

## 3. Install the server as a background service

```bash
deploy/macos/install-service.sh my-laptop.tail1234.ts.net
```

This creates a LaunchAgent (`~/Library/LaunchAgents/com.amskills.mcp.plist`) that:

- starts the server when you log in, and restarts it if it crashes
- keeps the Mac awake while it's on power (`caffeinate -s`)
- accepts requests for your `*.ts.net` name (everything else gets a 403)
- logs to `~/Library/Logs/am-skills-mcp.log`

Run it with `--dry-run` first if you want to see exactly what it will install.

Then check it from **outside** your network, e.g. on your phone with Wi-Fi off:
`https://my-laptop.tail1234.ts.net/health` should show `{"ok":true,...}`.

> **After a reboot:** the server starts when you log in. With FileVault on (which
> AM-050 will require), the Mac waits at the login screen after a restart, so log
> in once and everything comes back by itself, including Funnel.

## 4. Connect your AI assistant

The connector URL is `https://my-laptop.tail1234.ts.net/mcp`. The bare
`https://my-laptop.tail1234.ts.net` works too, since the server answers MCP at both.

**claude.ai:** Settings → Connectors → **Add custom connector** → paste the URL →
Authentication: **No sign in**. On a Free plan you can have one custom connector.

> **Pick "No sign in" explicitly.** claude.ai's *recommended* option ("Use Claude's
> published identity" / "Register automatically") is OAuth, and this server has no
> sign-in yet. If you choose it, the connection fails, and the log shows
> `GET /.well-known/oauth-protected-resource → 404`, `GET /.well-known/oauth-authorization-server → 404`
> and `POST /register → 404`. The recommended option becomes the right one once AM-048
> adds OAuth.

**ChatGPT:** Settings → Connectors → Advanced → turn on **Developer mode**, then
**Create** a connector with the URL and **No authentication**. Developer mode needs
a paid plan; on Business/Enterprise an admin has to allow it first. Some sources say
Plus/Pro get read-only custom connectors, which doesn't matter for this milestone
but will once records can be saved (AM-056 confirms it).

Then try it in a new chat: *"Use my am-skills connector to find the skill for
triaging my accounts this week."* You should see a `search_skills` call, and the
request in the log.

## Reading the log

| You see | Meaning |
| --- | --- |
| `POST /mcp → 200` | An assistant is talking to the server. All good. |
| `… /.well-known/oauth-… → 404`, `POST /register → 404` | The connector was set up with OAuth sign-in. Re-add it with **No sign in**. |
| `POST … → 403` | The name passed to the install script doesn't match `tailscale funnel status`. |
| nothing at all when you connect | The request isn't reaching the laptop: check the URL, and that `tailscale funnel status` says `(Funnel on)`. |
| `GET / → 405`, `GET /favicon.ico → 404` | A browser opened the base address. Harmless. |

## Day to day

| Task | Command |
| --- | --- |
| Is it up? | `curl http://127.0.0.1:8787/health` and `tailscale funnel status` |
| Watch requests | `tail -f ~/Library/Logs/am-skills-mcp.log` |
| Restart | `launchctl kickstart -k gui/$(id -u)/com.amskills.mcp` |
| Update to the latest code | `git pull && npm ci && npm test`, then restart |
| After upgrading Node | re-run `deploy/macos/install-service.sh <host>` (the service stores Node's exact path) |
| Take it offline | `tailscale funnel --https=443 off` |
| Remove the service | `deploy/macos/install-service.sh --uninstall` |

## Security notes

- The URL is public: anyone who learns it can call the skills tools. That's fine
  while they only return public skill content. It's also why account data waits for
  OAuth (AM-048).
- Only `127.0.0.1` is bound, and Host-header checks block requests for any name
  other than localhost and your `*.ts.net` name.
- Logs record method, path and status only, never request bodies.
- Funnel traffic has bandwidth limits you can't configure, which is plenty for one
  user.
