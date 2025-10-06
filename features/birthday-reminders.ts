import { Client } from 'discord.js'
import { google } from 'googleapis'
import { config } from 'dotenv'
import cron from 'node-cron'

config()

async function authorize(): Promise<any> {
  const client = google.auth.fromJSON({
    type: 'authorized_user',
    client_id: process.env.CALENDAR_ID!,
    client_secret: process.env.CALENDAR_SECRET!,
    refresh_token: process.env.CALENDAR_REFRESH_TOKEN,
  })

  return client
}

async function checkForBirthdays(discordClient: Client): Promise<void> {
  const auth = await authorize()
  const calendar = google.calendar({ version: 'v3', auth })

  const today = new Date()
  const tomorrow = new Date()
  tomorrow.setDate(today.getDate() + 1)

  const res = await calendar.events.list({
    calendarId: process.env.CALENDAR_EMAIL,
    timeMin: today.toISOString(),
    timeMax: tomorrow.toISOString(),
    singleEvents: true,
    orderBy: 'startTime',
  })

  const birthdays = res.data.items || []

  if (birthdays.length > 0) {
    const authorizedUsers = []

    authorizedUsers.push(await discordClient.users.fetch(process.env.CALENDAR_USER_1!))
    authorizedUsers.push(await discordClient.users.fetch(process.env.CALENDAR_USER_2!))
    authorizedUsers.push(await discordClient.users.fetch(process.env.CALENDAR_USER_3!))

    let results: string[] = ["🎉 It's someone's birthday!"]

    birthdays.forEach((birthday) => {
      results.push(`Calendar title: ${birthday.summary}`)
    })

    for (let i = 0; i < authorizedUsers.length; i++) {
      await authorizedUsers[i].send(results.join('\r\n'))
    }
  }
}

export default function (discordClient: Client) {
  if (process.env.ENVIRONMENT !== 'production') {
    console.log('Birthday notifications are disabled in non-production environments')
    return
  }

  console.log('Set up birthday notifications')

  cron.schedule('0 7 * * *', () => {
    try {
      checkForBirthdays(discordClient)
    } catch (e: any) {
      console.error('[Error] Failed to notify birthdays: ')
      console.error(e)
    }
  })
}
