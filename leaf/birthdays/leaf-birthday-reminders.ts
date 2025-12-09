import { Client, Events, TextChannel, userMention } from 'discord.js'
import { config } from 'dotenv'
import cron from 'node-cron'
import leafDb from '../leaf-firestore.ts'

config()

function getDateInfo() {
  const now = new Date()
  const month = now.getUTCMonth() + 1
  const day = now.getUTCDate()

  return {
    month,
    day,
  }
}

async function getTodaysBirthdays() {
  const { day, month } = getDateInfo()

  const snapshot = await leafDb?.collection('birthdays').where('month', '==', month).where('day', '==', day).get()

  return snapshot?.docs.map((doc) => doc.data())
}

async function checkForBirthdays(client: Client) {
  const birthdays = await getTodaysBirthdays()

  if (!birthdays) {
    return
  }

  const snapshot = await leafDb?.collection('util').doc('birthday-channel').get()
  const bdayChannel = snapshot?.data()

  if (!bdayChannel || !bdayChannel.id) {
    console.log('No birthday channel set up!')
    return
  }

  let channel

  try {
    channel = await client.channels.fetch(bdayChannel.id)
  } catch {
    console.log('No access to the bday channel!')
  }

  if (!channel || !(channel instanceof TextChannel)) {
    return
  }

  const alreadySent = await hasSentBirthdayToday()

  if (alreadySent) {
    console.log('Already sent bday wishes today, skipping')
    return
  }

  const doc = await leafDb?.collection('util').doc('birthday-message').get()

  if (!doc || !doc.exists) {
    return false
  }

  const birthdayMessage = doc.data()!.message as string

  for (const b of birthdays) {
    await channel.send(birthdayMessage.replaceAll('{MENTION}', userMention(b.id)))
  }

  const { day, month } = getDateInfo()

  await leafDb?.collection('util').doc('last-sent-birthdays-date').update({
    day,
    month,
  })
}

async function hasSentBirthdayToday() {
  const doc = await leafDb?.collection('util').doc('last-sent-birthdays-date').get()

  if (!doc || !doc.exists) {
    return false
  }

  const lastSent = doc.data()!

  const now = new Date()
  const month = now.getUTCMonth() + 1
  const day = now.getUTCDate()

  return lastSent['day'] === day && lastSent['month'] === month
}

export default async function (discordClient: Client) {
  console.log('Set up birthday notifications for LEAF')

  await checkForBirthdays(discordClient)

  cron.schedule('0 7 * * *', async () => {
    try {
      await checkForBirthdays(discordClient)
    } catch (e: any) {
      console.error('[Error] Failed to notify birthdays: ')
      console.error(e)
    }
  })

  discordClient.on(Events.GuildMemberRemove, async (user) => {
    await leafDb?.collection('birthdays').doc(user.id).delete()
  })
}
