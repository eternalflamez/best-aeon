import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Client,
  REST,
  Routes,
  SlashCommandBuilder,
  TextChannel,
} from 'discord.js'

export default function setup(client: Client, guildId = '1248337933413650614') {
  const token = process.env.TOKEN
  const clientId = process.env.APPLICATION_ID

  if (!token || !clientId) {
    return
  }

  const rest = new REST().setToken(token)

  rest.put(Routes.applicationGuildCommands(clientId, guildId), {
    body: [new SlashCommandBuilder().setName('raids').setDescription('What kind of raids are we selling?').toJSON()],
  })

  client.on('interactionCreate', async (interaction) => {
    if (interaction.isChatInputCommand()) {
      if (interaction.commandName === 'raids') {
        const embeds = await readRaidEmbed(client, '1263940136081686614')

        if (!embeds) {
          interaction.reply('Something went wrong, oops :(')
          return
        }

        interaction.reply({ embeds })
      }
    } else if (interaction.isButton()) {
      const id = interaction.customId

      if (id === 'english' || id === 'french' || id === 'german' || id === 'spanish') {
        interaction.reply({
          content: `You clicked ${interaction.customId}, poof language change`,
          ephemeral: true,
        })
        return
      }

      if (id === 'raids') {
        const boss = new ButtonBuilder().setCustomId('raid-boss').setLabel('Boss Kills').setStyle(ButtonStyle.Primary)
        const achievements = new ButtonBuilder()
          .setCustomId('raid-achievements')
          .setLabel('Achievements')
          .setStyle(ButtonStyle.Primary)

        const sellRow = new ActionRowBuilder().addComponents(boss, achievements)

        interaction.reply({
          content: 'Please make a selection',
          // @ts-ignore
          components: [sellRow],
          ephemeral: true,
        })
        return
      }

      let embeds

      if (id === 'raid-boss') {
        embeds = await readRaidEmbed(client, '1263940136081686614')
      } else if (id === 'raid-achievements') {
        embeds = await readRaidEmbed(client, '1263956507842576465')
      }

      if (!embeds) {
        interaction.reply({
          content: 'Something went wrong, oops :(',
          ephemeral: true,
        })
        return
      }

      interaction.reply({
        embeds,
        ephemeral: true,
      })

      // TODO: Restart chain
    }
  })
}

async function readRaidEmbed(client: Client, messageId: string) {
  const channel = client.channels.cache.get('1263915263682809989')

  if (!channel || !(channel instanceof TextChannel)) {
    return null
  }

  const messages = await channel.messages.fetch()

  const message = messages.get(messageId)

  return message?.embeds
}
