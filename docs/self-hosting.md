# Self-hosting on a Mac (Tailscale Funnel)

How to run `am-skills-mcp` as an always-on remote connector on a spare Mac, so
claude.ai and ChatGPT can reach it over HTTPS. Per DEC-6 / DEC-11 (see
`docs/project-docs/Tickets.md`): free tooling only, single user.

> **Sign-in is on.** Every assistant has to be approved by you, with your
> passphrase, before it can use the server (OAuth, AM-048). Today the server only
> serves the public skill catalog (`search_skills`, `read_skill`, `fetch_skill_files`);
> account records come next (AM-039 onward) and will only ever be served with sign-in on.

**Already running the earlier no-sign-in version?** Go to
[Upgrading from the no-sign-in version](#upgrading-from-the-no-sign-in-version).

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
`*.ts.net` name. On top of that, every MCP request needs a sign-in token.

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
git clone https://github.com/JJScar/am-agent-skills.git
cd am-agent-skills
npm ci
npm test                  # should end with "fail 0"
```

## 2. Set your passphrase

This is what you'll type to approve an assistant. Use at least 12 characters; a
few random words works well.

```bash
npm run auth:set-passphrase
```

It asks twice and doesn't show what you type. Only a scrypt hash is stored, in
`~/.am-skills/auth.json`, which only your user account can read. Setting a new
passphrase later signs out every connected assistant.

## 3. Set up Tailscale Funnel

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

   It must say `(Funnel on)`, not `(tailnet only)`. The host name (here
   `my-laptop.tail1234.ts.net`) is what you need below. A new name can take up to
   10 minutes to start resolving publicly.

Optional check before installing the service: start the server by hand and test it.

```bash
export AM_SKILLS_PUBLIC_HOSTS=my-laptop.tail1234.ts.net
npm run start:http        # Ctrl+C to stop
```

`https://my-laptop.tail1234.ts.net/health` (from a phone with Wi-Fi **and** the
Tailscale app off) should show `{"ok":true,...,"auth":"oauth"}`.

## 4. Install the server as a background service

```bash
deploy/macos/install-service.sh my-laptop.tail1234.ts.net
```

This creates a LaunchAgent (`~/Library/LaunchAgents/com.amskills.mcp.plist`) that:

- starts the server when you log in, and restarts it if it crashes
- keeps the Mac awake while it's on power (`caffeinate -s`)
- accepts requests for your `*.ts.net` name (everything else gets a 403)
- requires sign-in (it refuses to install until you've done step 2)
- logs to `~/Library/Logs/am-skills-mcp.log`

Run it with `--dry-run` first if you want to see exactly what it will install.
It should end with `Running: … is OK`.

> **After a reboot:** the server starts when you log in. With FileVault on (which
> AM-050 will require), the Mac waits at the login screen after a restart, so log
> in once and everything comes back by itself, including Funnel.

## 5. Connect your AI assistant

The connector URL is `https://my-laptop.tail1234.ts.net/mcp`. The bare
`https://my-laptop.tail1234.ts.net` works too.

**claude.ai:** Settings → Connectors → **Add custom connector** → paste the URL →
leave Authentication on the **recommended** option. Click connect, and a page from
your laptop opens: **"Connect to your account memory?"** Type your passphrase and
press **Approve**. You're sent back to claude.ai, connected. (On a Free plan you can
have one custom connector.)

**ChatGPT:** Settings → Connectors → Advanced → turn on **Developer mode**, then
**Create** a connector with the URL and **OAuth** authentication, and approve on the
same page. Developer mode needs a paid plan; on Business/Enterprise an admin has to
allow it first. Some sources say Plus/Pro get read-only custom connectors, which will
matter once records can be saved (AM-056 confirms it).

Then try it in a new chat: *"Use my am-skills connector to find the skill for
triaging my accounts this week."* You should see a `search_skills` call, and the
request in the log.

Only approve the page when **you** just clicked connect. If it ever appears when you
didn't, press **Deny**.

## Upgrading from the no-sign-in version

If you set the server up before sign-in existed:

```bash
cd ~/am-agent-skills
git pull && npm ci && npm test
npm run auth:set-passphrase
deploy/macos/install-service.sh my-laptop.tail1234.ts.net
```

Then in claude.ai, **remove** the old connector (the one set to "No sign in") and
add it again as in step 5, leaving Authentication on the recommended option. The
old connector stops working as soon as the new server is running, because it has
no token.

## Reading the log

| You see | Meaning |
| --- | --- |
| `POST /mcp → 200` | A signed-in assistant is using the server. All good. |
| `POST /mcp → 401` | A request without a valid token. Normal right before sign-in, or when an assistant refreshes an expired token. If it keeps happening, remove and re-add the connector. |
| `GET /.well-known/… → 200`, `POST /register → 201`, `GET /authorize → 200` | An assistant is starting sign-in. Expect the approval page. |
| `POST /consent → 302` then `POST /token → 200` | You approved and the assistant got its token. |
| `POST /consent → 401` | Wrong passphrase on the approval page. |
| `POST /consent → 403` or `429` | Too many wrong passphrases: that request was cancelled (403), or sign-in is paused for 15 minutes (429). |
| `POST … → 403` with no sign-in involved | The name passed to the install script doesn't match `tailscale funnel status`. |
| nothing at all when you connect | The request isn't reaching the laptop: check the URL, and that `tailscale funnel status` says `(Funnel on)`. |
| `GET / → 405`, `GET /favicon.ico → 404` | A browser opened the base address. Harmless. |

## Day to day

| Task | Command |
| --- | --- |
| Is it up? | `curl http://127.0.0.1:8787/health` and `tailscale funnel status` |
| Watch requests | `tail -f ~/Library/Logs/am-skills-mcp.log` |
| Restart | `launchctl kickstart -k gui/$(id -u)/com.amskills.mcp` |
| Update to the latest code | `git pull && npm ci && npm test`, then restart |
| Sign every assistant out | `npm run auth:set-passphrase` (a new passphrase revokes all tokens), then restart |
| Forgot the passphrase | Same: set a new one and reconnect your assistants |
| After upgrading Node | re-run `deploy/macos/install-service.sh <host>` (the service stores Node's exact path) |
| Take it offline | `tailscale funnel --https=443 off` |
| Remove the service | `deploy/macos/install-service.sh --uninstall` |

## Security notes

- **Sign-in:** OAuth 2.1 with PKCE. Assistants register themselves automatically
  (dynamic client registration), and you approve each one with your passphrase. Access
  tokens last 1 hour; refresh tokens last 30 days and are replaced on every use. An
  authorization code works once and expires after 5 minutes.
- **Brute force:** 5 wrong passphrases cancel that sign-in request, and 10 in 15
  minutes pause sign-in entirely for 15 minutes. The SDK also rate-limits the OAuth
  endpoints per client IP (using Funnel's `X-Forwarded-For` when it sends one;
  otherwise every request counts against one shared limit, which is still safe).
- **Stored secrets:** `~/.am-skills/auth.json` (mode 600) holds the passphrase hash
  (scrypt), registered assistants, and tokens stored only as SHA-256 hashes. A copy of
  the file can't be replayed as a token. Back it up with the account data (AM-050).
- **The approval page** can't be embedded in another site (`frame-ancestors 'none'`),
  sends no referrer, and isn't cached.
- **Network:** only `127.0.0.1` is bound, and Host-header checks block requests for
  any name other than localhost and your `*.ts.net` name. `/health` and the sign-in
  metadata are public; nothing else is.
- **Logs** record method, path and status only, never bodies, query strings or tokens.
- **Turning sign-in off** (`install-service.sh <host> --no-auth`, or
  `AM_SKILLS_AUTH=none`) is only acceptable while the server serves nothing but public
  skill content. Never use it once account records are on the server.
- Funnel traffic has bandwidth limits you can't configure, which is plenty for one
  user.
