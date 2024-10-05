import { AttachmentBuilder } from 'discord.js'
import ics from 'ics'

export default function generateIcs(schedule: ScheduleMessage[]) {
  const events = [] as {
    start: number
    duration: { hours: number }
    title: string
  }[]

  schedule.forEach((scheduleItem) => {
    const timestampPattern = /<t:\d+:[a-zA-Z]>/
    const urlPattern = /https:\/\/discord\.com\/channels\/\d+\/\d+\/\d+/

    const prunedTitle = scheduleItem.text
      .replaceAll('@everyone', '')
      .replaceAll('@', '')
      .replaceAll('  ', ' ')
      .replace(timestampPattern, '')
      .replace(urlPattern, '')
      .trim()

    events.push({
      start: scheduleItem.date * 1000,
      duration: { hours: 1 },
      title: `[${scheduleItem.region}] ${prunedTitle}`,
    })
  })

  const data = ics.createEvents(events)

  if (data.error) {
    console.error(data.error)
    return undefined
  }

  return new AttachmentBuilder(Buffer.from(data.value!), { name: 'sells.ics' })
}
