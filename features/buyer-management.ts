import {
  Client,
  CategoryChannel,
  ChannelType,
  userMention,
  roleMention,
  Role,
  GuildMember,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
} from 'discord.js'

export default function setup(client: Client, guildId = '1248337933413650614') {
  const categoryChannelId = '1263790639070445568'

  client.on('guildMemberAdd', async (member) => {
    try {
      if (guildId !== member.guild.id) {
        return
      }

      const categoryChannel = await client.channels.fetch(categoryChannelId)

      if (!categoryChannel || !(categoryChannel instanceof CategoryChannel)) {
        return
      }

      const adminRole = member.guild.roles.cache.find((role) => role.name === 'Gamer')

      if (!adminRole) {
        return
      }

      let channel

      try {
        channel = await createChannel(`welcome-${member.displayName}`, categoryChannel, member, adminRole, guildId)
      } catch (e: any) {
        channel = await createChannel('welcome', categoryChannel, member, adminRole, guildId)
      }

      if (!channel) {
        console.error(`--- Failed to create channel for user! ${member.displayName} ---`)
        return
      }

      await channel.send(
        `Hey ${userMention(member.id)}. \n\nThis is gonna be such a cool message, showing you our sell list, ${roleMention(adminRole.id)}`,
      )

      const english = new ButtonBuilder().setCustomId('english').setLabel('English').setStyle(ButtonStyle.Primary)
      const french = new ButtonBuilder().setCustomId('french').setLabel('French').setStyle(ButtonStyle.Primary)
      const german = new ButtonBuilder().setCustomId('german').setLabel('German').setStyle(ButtonStyle.Primary)
      const spanish = new ButtonBuilder().setCustomId('spanish').setLabel('Spanish').setStyle(ButtonStyle.Primary)

      const languageRow = new ActionRowBuilder().addComponents(english, french, german, spanish)

      channel.send({
        content: 'Choose a language',
        // @ts-ignore
        components: [languageRow],
      })

      const raids = new ButtonBuilder().setCustomId('raids').setLabel('Raids').setStyle(ButtonStyle.Primary)
      const strikes = new ButtonBuilder()
        .setCustomId('strikes')
        .setLabel('Strikes')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(true)
      const fractals = new ButtonBuilder()
        .setCustomId('fractals')
        .setLabel('Fractals')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(true)

      const sellRow = new ActionRowBuilder().addComponents(raids, strikes, fractals)

      await channel.send({
        content: 'choose your content',
        // @ts-ignore
        components: [sellRow],
      })
    } catch (e) {
      console.error(e)
    }
  })
}

function createChannel(
  name: string,
  categoryChannel: CategoryChannel,
  member: GuildMember,
  adminRole: Role,
  guildId: string,
) {
  return categoryChannel.children.create({
    name,
    type: ChannelType.GuildText,
    topic: member.id,
    permissionOverwrites: [
      {
        id: guildId,
        deny: ['ViewChannel'],
      },
      {
        id: member.id,
        allow: ['ViewChannel'],
      },
      {
        id: adminRole.id,
        allow: ['ViewChannel'],
      },
    ],
  })
}
