import { FieldValue } from 'firebase-admin/firestore'
import { Message, TextChannel } from 'discord.js'
import db from '../../firestore/setupFirestore.ts'
import { MessageHandler } from '../../types/MessageHandler.ts'

export default class BestMaxHandler implements MessageHandler {
  async handle(message: Message) {
    const messageText = message.content.toLowerCase()

    if (/ma+x/i.test(messageText) || message.stickers.hasAny('1110247288166678649')) {
      if (Math.random() < 0.7) {
        return false
      }

      const maxCounterRef = db?.collection('utils').doc('max_counter')

      await maxCounterRef?.update({
        value: FieldValue.increment(1),
      })

      const doc = await maxCounterRef?.get()

      if (!doc || !doc.exists) {
        return false
      }

      const maxCounter = doc.data()!

      await (message.channel as TextChannel).send(`M${'A'.repeat(maxCounter['value'] % 55)}X!`)

      return true
    }

    return false
  }
}
