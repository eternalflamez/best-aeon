import { AttachmentBuilder, RawFile } from 'discord.js'
import ics from 'ics'

export default function generateIcs(schedule: ScheduleMessage[]) {
  const icsList = [] as AttachmentBuilder[]

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

    const event = ics.createEvent({
      start: scheduleItem.date * 1000,
      duration: { hours: 1 },
      title: `[${scheduleItem.region}] ${prunedTitle}`,
    })

    if (event.error) {
      console.error(event.error)
      return
    }

    icsList.push(new AttachmentBuilder(Buffer.from(event.value!), { name: `${prunedTitle}.ics` }))
  })

  return icsList
}
