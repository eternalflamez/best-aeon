## Startup:

`npm install`  
`npx tsx startup-dev.ts` || `npx tsx startup-prod.ts`

The following env variables are needed:
ENVIRONMENT=develop (or production)

> Discord bot tokens

TOKEN=  
MANAGER_TOKEN=  
HT_MANAGER_TOKEN=

RESETCHANNEL=

GEMINI_KEY=

> Sell schedule (per guild) is stored in Firestore collection `sell_schedule_config`.
> Document ID = guild snowflake. Fields:
> - `sellChannels` (map: channelId → `{ region: string }`) **or** array of `{ channelId, region }`
> - `scheduleOutputs`: `{ id: string, regions: string[] }[]` (summary channels, same semantics as the old bot triplet)
>
> Migrate from legacy `.env` once: `GUILD_ID=<guild> npx tsx scripts/migrate-sell-schedule-config.ts` (needs `SELL_CHANNEL_BOTH`, `SELL_CHANNEL_EU`, `SELL_CHANNEL_NA` in `.env` for that run only).

> matching guild id with invite link

INVITE_1054032215446663278=  
INVITE_1281584783323041803=

> Google calendar integration stuff

CALENDAR_ID=  
CALENDAR_SECRET=  
CALENDAR_TOKEN=  
CALENDAR_EMAIL=  
CALENDAR_REFRESH_TOKEN=

CALENDAR_USER_0=  
CALENDAR_USER_1=  
CALENDAR_USER_2=  
CALENDAR_USER_3=

## Updating LEAF commands:

```
node leaf/commands/deploy-commands.ts
```
