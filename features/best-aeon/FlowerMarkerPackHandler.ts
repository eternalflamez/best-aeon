import { Message } from 'discord.js'
import { MessageHandler } from '../../types/MessageHandler'

export default class FlowerMarkerPackHandler implements MessageHandler {
  private readonly FLOWER_PACK =
    'yJlbmFibGVkIjp0cnVlLCJuYW1lIjoiRmViZSBGbG93ZXIgdy8gTWltaWMiLCJkZXNjcmlwdGlvbiI6Ik1hcmtlcnMgZm9yIEZsb3dlciB3aXRoIERvdWJsZSBGbG93ZXIgYXQgNDAlIiwibWFwSWQiOjE1MjAsInRyaWdnZXIiOnsieCI6MC4wLCJ5IjowLjAsInoiOjAuMH0sIm1hcmtlcnMiOlt7ImkiOjEsImQiOiJzdyBzdGFjayIsIngiOi01LjE4NjM5MiwieSI6LTEwNi4xOTM3NDEsInoiOjE3OC42NzE0fSx7ImkiOjIsImQiOiJzZSBsb25nIG1hbGljZSIsIngiOjI5LjQ0MDYzLCJ5IjotMTQxLjE5ODk5LCJ6IjoxNzguNjc0MzMyfSx7ImkiOjMsImQiOiJuZSBzdGFjayIsIngiOjUuMTA2NTQ5LCJ5IjotOTUuMTY1MTEsInoiOjE3OC42NzE0fSx7ImkiOjQsImQiOiJuZSBsb25nIG1hbGljZSIsIngiOjQ0LjQ0MTAxLCJ5IjotNzQuOTc3OTYsInoiOjE3OC42NzAwNTl9LHsiaSI6NSwiZCI6IjQwJSBzY2cgcG9ydGFsIiwieCI6MTAuMjY3MDgyMiwieSI6LTEyNy40MDIwNDYsInoiOjE3OC42NzE0fSx7ImkiOjYsImQiOiJhZGQgcmFnZSIsIngiOi0xMC4yMDI5MDc2LCJ5IjotMTEyLjkxMDQxNiwieiI6MTc4LjY3MTV9LHsiaSI6NywiZCI6InRkcm9wIHNjZyBwb3J0YWwiLCJ4IjoyLjczNzIzNDU5LCJ5IjotODAuODY2MDIsInoiOjE3OC42NzQzMzJ9LHsiaSI6OCwiZCI6InRkcm9wIGNocm9ubyBwb3J0YWwiLCJ4IjozMC41MjUxMTc5LCJ5IjotNjUuMjkxMzEsInoiOjE3OC42NzE2NjF9XX0='

  private lastReplyTime: number | null = null
  private readonly REPLY_INTERVAL_MS = 5 * 60 * 1000

  async handle(message: Message) {
    const content = message.content.toLowerCase()

    if (content.includes('flower markerpack') || content.includes(this.FLOWER_PACK)) {
      const now = Date.now()

      if (this.lastReplyTime === null || now - this.lastReplyTime > this.REPLY_INTERVAL_MS) {
        await message.reply(`${this.FLOWER_PACK}\n\nFlower markerpack`)
        this.lastReplyTime = now
      }
    }

    return false
  }
}
