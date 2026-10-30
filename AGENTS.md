# Dimetra — instructions for AI agents

## Neon Postgres (required for backend)

Setup follows [Neon agent setup for Cursor](https://neon.com/prompts/agent-setup.md).

### One-time (human or agent with network)

From the **repository root**:

```bash
npm install -g neon@latest
neon init --agent cursor
```

`neon init` installs Neon skills (if needed), configures the **Neon MCP server** for Cursor, and links or creates a Neon project.

If the project is already linked (`.neon` exists), run:

```bash
neon env pull
```

### Installed in this repo

| Artifact | Purpose |
|----------|---------|
| `.agents/skills/neon*` | Neon agent skills (see `skills-lock.json`) |
| `.cursor/mcp.json` | Project Neon MCP (`mcp-remote` → `https://mcp.neon.tech/mcp`) |
| `.cursor/rules/neon-dimetra.mdc` | Persistent Neon + Dimetra DB conventions |
| `NEON-LOCAL.md` | Local Express + Neon env files |

After pulling env, **enable the Neon MCP server in Cursor** (Settings → MCP) and complete OAuth if prompted.

### Backend database rules

1. Use **`DATABASE_URL`** only (no local SQLite).
2. On startup, `initDb()` ensures tables: `rooms`, `user_plants`, `care_history`, `user_settings`.
3. Use **pooled** `DATABASE_URL` for the Express app; use `DATABASE_URL_UNPOOLED` only for one-off migrations/dumps if needed.
4. Region for this project: **Frankfurt** (`aws-eu-central-1`) when creating new Neon resources.

### Scripts

| Command | Description |
|---------|-------------|
| `npm run build` | Compile backend (`tsc` → `dist/`) |
| `npm start` | Run API + Telegram bot |
| `npm run db:init` | Connect to Neon and run schema DDL |

### Frontend

Mini App reads API from `VITE_API_URL` at build time (Vercel/Netlify). See `CLOUD-DEPLOY.md`.
