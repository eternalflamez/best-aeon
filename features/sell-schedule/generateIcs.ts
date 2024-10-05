import { AttachmentBuilder } from 'discord.js'
import ics, { DurationObject } from 'ics'

export default function generateIcs(schedule: ScheduleMessage[]) {
  const events = [] as {
    start: number
    duration: DurationObject
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

    const defaultDuration = { hours: 1 } as DurationObject
    let duration = defaultDuration

    const readableTitle = prunedTitle.toLowerCase()

    if (readableTitle.includes('lcm') || readableTitle.includes('cerus cm')) {
      duration = { minutes: 30 }
    }

    events.push({
      start: scheduleItem.date * 1000,
      title: `[${scheduleItem.region}] ${prunedTitle}`,
      duration,
    })
  })

  const data = ics.createEvents(events)

  if (data.error) {
    console.error(data.error)
    return undefined
  }

  return new AttachmentBuilder(Buffer.from(data.value!), { name: 'sells.ics' })
}
