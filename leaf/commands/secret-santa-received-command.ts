import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  MessageFlags,
  userMention,
  Client,
  TextChannel,
} from 'discord.js'
import leafDb from '../leaf-firestore.ts'

const command = {
  data: new SlashCommandBuilder()
    .setName('secret-santa-received')
    .setDescription('This lets our team know you received a gift!')
    .addStringOption((option) =>
      option
        .setRequired(true)
        .setName('message')
        .setDescription('A confirmation message. This is read by LEAF councillors!'),
    )
    .addAttachmentOption((option) =>
      option.setRequired(false).setName('image').setDescription('An image attachment, if you like!'),
    ),
  async execute(interaction: ChatInputCommandInteraction, client: Client) {
    try {
      const doc = leafDb?.collection('santas').doc(interaction.user.id)
      const userInfo = await doc?.get()
      const data = userInfo?.data()

      if (!userInfo || !data || !doc) {
        await interaction.reply({
          content: "<:huh:1065613214513111061> You didn't sign up to the secret santa.",
          flags: MessageFlags.Ephemeral,
        })
        return
      }

      doc.set(
        {
          received: true,
        },
        {
          merge: true,
        },
      )

      const targetChannel = client.channels.cache.get('1424725731208069152') as TextChannel
      const attachment = interaction.options.getAttachment('image')
      let files = undefined

      if (attachment) {
        files = [attachment]
      }

      await targetChannel.send({
        content: `I received a confirmation message from ${userMention(interaction.user.id)} - ${interaction.user.displayName}. The message was:\n\n${interaction.options.getString('message')}`,
        files,
      })

      await interaction.reply({
        content: `Thanks for letting us know! <:leaf_helper:1433816388497309696>`,
        flags: MessageFlags.Ephemeral,
      })
    } catch (e) {
      console.log(`secret-santa-received Interaction error caused by: ${interaction.user.displayName}`)
      console.log(e)

      await interaction.reply({
        content: `There was an error letting us know you received your gift! Feel free to try again, and/or poke my overlord ${userMention('109707866629246976')}.`,
        flags: MessageFlags.Ephemeral,
      })
    }
  },
}

export default command
