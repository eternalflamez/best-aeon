type ScheduleMessage = {
  id: string
  guildId: string
  channelId: string
  reactors: ScheduleReaction[]
  region: string
  date: number
  text: string
}
