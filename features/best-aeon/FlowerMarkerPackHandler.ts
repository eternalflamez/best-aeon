import { Message } from 'discord.js'
import { MessageHandler } from '../../types/MessageHandler'

export default class FlowerMarkerPackHandler implements MessageHandler {
  private readonly FLOWER_PACK =
    'eyJlbmFibGVkIjp0cnVlLCJuYW1lIjoiTWVtZSIsImRlc2NyaXB0aW9uIjoiaHR0cHM6Ly93d3cueW91dHViZS5jb20vd2F0Y2g/dj1kUXc0dzlXZ1hjUSIsIm1hcElkIjoxMTU1LCJ0cmlnZ2VyIjp7IngiOjExNi45Mzk3MDUsInkiOi0zNjYuMDA2MDQyLCJ6IjozNC4xODM3OX0sIm1hcmtlcnMiOlt7ImkiOjEsImQiOiJOZXZlciIsIngiOjU5LjM3ODc0NiwieSI6LTM0Mi4zMjUwNzMsInoiOjM0LjE4NDQ4NjR9LHsiaSI6MiwiZCI6Ikdvbm5hIiwieCI6NjcuMTQyMzMsInkiOi0zNzAuMzIyNTcxLCJ6IjozOS41NjAzOH0seyJpIjozLCJkIjoiR2l2ZSIsIngiOjg2Ljc5NjE2NTUsInkiOi0zODUuMjc0MTM5LCJ6IjozNC4xODM4Mn0seyJpIjo0LCJkIjoiWW91ICIsIngiOjkzLjc1MzQ5NDMsInkiOi00MTMuMTM4Mjc1LCJ6IjozOS41OTczOX0seyJpIjo1LCJkIjoiVXAiLCJ4IjoxMjYuMTM0OTMzLCJ5IjotNDA3LjU2NjI1NCwieiI6MzQuMTgzODJ9LHsiaSI6NiwiZCI6Ik5ldmVyIiwieCI6MTYxLjgxNzU1MSwieSI6LTM4OC4zNTU1NiwieiI6MzQuMjA0MTMyMX0seyJpIjo3LCJkIjoiR29ubmEiLCJ4IjoxNTYuMTA1Nzg5LCJ5IjotNDExLjk1MzgyNywieiI6MzkuNjk4OTg2MX0seyJpIjo4LCJkIjoiTGV0IHlvdSBkb3duIiwieCI6MTk1LjUxMjU0MywieSI6LTMyNC4xMTEsInoiOjM5LjA3NTczMzJ9XX0='

  private lastReplyTime: number | null = null
  private readonly REPLY_INTERVAL_MS = 5 * 60 * 1000

  async handle(message: Message) {
    const content = message.content.toLowerCase()

    if (content.includes('flower markerpack') || content.includes(this.FLOWER_PACK.toLowerCase())) {
      const now = Date.now()

      if (this.lastReplyTime === null || now - this.lastReplyTime > this.REPLY_INTERVAL_MS) {
        await message.reply(`${this.FLOWER_PACK}\n\nFlower markerpack`)
        this.lastReplyTime = now
      }
    }

    return false
  }
}
