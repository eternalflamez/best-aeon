## Startup

```bash
npm install
cp .env.example .env   # if you don't already have a .env
# fill in .env (see below)
npm run dev            # or: npm run start-prod
```

## Environment variables

Copy `.env.example` → `.env` and fill the values. `.env` is gitignored.

With the Env Switcher addon, use presets under `env-presets/` (`dev.env` / `prod.env`). Those files are also gitignored — fill them locally after cloning.

### Core

| Variable      | How to fill                                                                                                                                     |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `ENVIRONMENT` | Use `develop` locally. Use `production` only on the server. Controls Firestore init, self-destruct keys, birthday jobs, and some LEAF behavior. |

### Discord bot tokens

Create/manage apps at [Discord Developer Portal](https://discord.com/developers/applications) → your app → **Bot** → token.

| Variable        | Bot                                                              |
| --------------- | ---------------------------------------------------------------- |
| `TOKEN`         | Main Best Aeon / Gemini bot (`bot.ts`)                           |
| `MANAGER_TOKEN` | Buyer-management bot (Rise / primary guild in `startup-prod.ts`) |
| `LEAF_TOKEN`    | LEAF bot                                                         |

### Gemini

| Variable     | How to fill                                                                 |
| ------------ | --------------------------------------------------------------------------- |
| `GEMINI_KEY` | Create an API key at [Google AI Studio](https://aistudio.google.com/apikey) |

### Buyer management

| Variable           | How to fill                                                                                                                                                 |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `PRICE_UPDATE_URL` | Full URL opened by the price-list embed button                                                                                                              |
| `INVITE_<guildId>` | Discord invite **code** only (the part after `discord.gg/`). Guild id is the snowflake in the variable name. Used when kicking users and linking them back. |

### Google Calendar (birthday reminders)

Used by `features/birthday-reminders.ts` (production only).

| Variable                        | How to fill                                                                 |
| ------------------------------- | --------------------------------------------------------------------------- |
| `CALENDAR_ID`                   | OAuth **client ID** from Google Cloud Console (Desktop / installed app)     |
| `CALENDAR_SECRET`               | OAuth **client secret** for that client                                     |
| `CALENDAR_REFRESH_TOKEN`        | Refresh token from the OAuth consent flow for the calendar account          |
| `CALENDAR_EMAIL`                | Calendar id passed to the Calendar API (often the calendar’s email address) |
| `CALENDAR_USER_1` / `_2` / `_3` | Discord **user snowflakes** that should receive birthday DMs                |

### LEAF

| Variable                      | How to fill                                                    |
| ----------------------------- | -------------------------------------------------------------- |
| `LEAF_DISCORD_GUILD_ID`       | Discord guild snowflake for the LEAF server                    |
| `LEAF_DISCORD_CHANNEL`        | Channel id for guild event / log posts                         |
| `LEAF_GUILD_NEW_USER_CHANNEL` | Channel id for new-user / invite approval flow                 |
| `LEAF_GUILD_ID`               | Guild Wars 2 **guild UUID** (from the GW2 API / guild tooling) |
| `LEAF_GUILD_BEARER`           | GW2 API bearer token with guild permissions                    |

Optional: `PORT` for the LEAF invite HTTP API (defaults to `80`).

### Firestore credentials (not env vars)

Firebase Admin SDK JSON keys live under `etc/secrets/` locally, or `/etc/secrets/` on the server. See `firestore/setupFirestore.ts` and `leaf/leaf-firestore.ts`.

### One-time sell schedule migration

Sell schedule config lives in Firestore (`sell_schedule_config`). To migrate from legacy channel env vars once:

```bash
# temporarily set in .env:
# GUILD_ID=<discord guild snowflake>
# SELL_CHANNEL_BOTH=<channel id>
# SELL_CHANNEL_EU=<channel id>
# SELL_CHANNEL_NA=<channel id>
npx tsx scripts/migrate-sell-schedule-config.ts
```

Document shape after migration:

- Document ID = guild snowflake
- `sellChannels`: map `channelId → { region }` **or** array of `{ channelId, region }`
- `scheduleOutputs`: `{ id: string, regions: string[] }[]`

## Updating LEAF commands

```bash
node leaf/commands/deploy-commands.ts
```
