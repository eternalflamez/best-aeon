type ScheduleMessage = {
  id: string
  channelId: string
  reactors: ScheduleReaction[]
  region: string
  date: number
  text: string
}
