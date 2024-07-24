import {
  Client,
  CategoryChannel,
  ChannelType,
  userMention,
  Role,
  GuildMember,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  TextChannel,
  channelMention,
  ButtonInteraction,
  GatewayIntentBits,
  Partials,
} from 'discord.js'
import translations from '../constants/translations.ts'

interface LanguageByChannel {
  [key: string]: string
}

interface PingByUser {
  [key: string]: number
}

export default function setup() {
  const categoryChannelId = '1264584201823322253'
  const buyerManagementChannelId = '1264584361034911856'
  const guildId = '1054032215446663278'
  const roleName = '[Rise] Seller'

  const languageByChannel: LanguageByChannel = {}
  const lastCtaPings: PingByUser = {}

  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.DirectMessages,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.GuildMessageReactions,
    ],
    partials: [Partials.Message, Partials.Channel, Partials.Reaction],
  })

  client.login(process.env.MANAGER_TOKEN)

  client.once('ready', () => {
    console.log(`Logged in as ${client.user?.tag}`)
  })

  client.on('guildMemberAdd', async (member) => {
    try {
      if (guildId !== member.guild.id) {
        return
      }

      const categoryChannel = await client.channels.fetch(categoryChannelId)

      if (!categoryChannel || !(categoryChannel instanceof CategoryChannel)) {
        return
      }

      const adminRole = member.guild.roles.cache.find((role) => role.name === roleName)

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

      const english = new ButtonBuilder().setCustomId('english').setLabel('English').setStyle(ButtonStyle.Primary)
      const french = new ButtonBuilder().setCustomId('french').setLabel('Francais').setStyle(ButtonStyle.Primary)
      const german = new ButtonBuilder().setCustomId('german').setLabel('Deutsch').setStyle(ButtonStyle.Primary)
      const spanish = new ButtonBuilder().setCustomId('spanish').setLabel('Español').setStyle(ButtonStyle.Primary)

      const languageRow = new ActionRowBuilder<ButtonBuilder>().addComponents(english, french, german, spanish)

      await channel.send({
        content: `Hello and welcome to [Rise] ${userMention(member.id)}! 🌟
  
I am a bot, here to assist you in finding and purchasing Guild Wars 2 services. Let's get started!

**__STEP 1: Choose a Language, Elige un idioma, Wähle eine Sprache, Choisir une langue 🌐__**`,
        components: [languageRow],
      })
    } catch (e) {
      console.error(e)
    }
  })

  client.on('guildMemberRemove', async (member) => {
    try {
      if (guildId !== member.guild.id) {
        return
      }

      const categoryChannel = await client.channels.fetch(categoryChannelId)

      if (!categoryChannel || !(categoryChannel instanceof CategoryChannel)) {
        return
      }

      const userChannel = categoryChannel.children.cache.find((channel) => {
        if (!(channel instanceof TextChannel)) {
          return
        }

        return channel.topic?.includes(`${member.id} `) && channel.name.startsWith('welcome')
      })

      if (!userChannel) {
        return
      }

      try {
        userChannel.edit({
          name: `🚩goodbye-${member.displayName}`,
        })
      } catch {
        userChannel.edit({
          name: `🚩goodbye`,
        })
      }
    } catch (e) {
      console.error(e)
    }
  })

  client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) {
      return
    }

    try {
      const id = interaction.customId

      if (id === 'english' || id === 'french' || id === 'german' || id === 'spanish' || id === 'go-back') {
        if (id !== 'go-back') {
          setLanguage(interaction)
        }

        postSellTypes(interaction)
        return
      }

      if (id === 'raids') {
        postRaidList(interaction)
        return
      }

      if (id.startsWith('raid-') || id === 'strikes' || id === 'fractals') {
        let embeds

        if (id === 'raid-boss') {
          embeds = await readPriceEmbed(client, '1264596066444115969')
        } else if (id === 'raid-achievements') {
          embeds = await readPriceEmbed(client, '1264596103995723829')
        } else if (id === 'strikes') {
          embeds = await readPriceEmbed(client, '1264596122710573130')
        } else if (id === 'fractals') {
          embeds = await readPriceEmbed(client, '1264596136778268772')
        }

        if (!embeds) {
          interaction.reply({
            content: getTranslation('generic_error', interaction),
            ephemeral: true,
          })
          return
        }

        await interaction.reply({
          embeds,
          ephemeral: true,
        })

        postCTA(interaction)
        return
      }

      if (id.startsWith('go-contact-us')) {
        const buyerManagementChannel = client.channels.cache.get(buyerManagementChannelId)

        if (!buyerManagementChannel || !(buyerManagementChannel instanceof TextChannel)) {
          return
        }

        interaction.reply({
          content: getTranslation('staff_called', interaction),
          ephemeral: true,
        })

        if (!lastCtaPings[interaction.channelId] || Date.now() - lastCtaPings[interaction.channelId] > 60000) {
          lastCtaPings[interaction.channelId] = Date.now()

          buyerManagementChannel.send(
            `@here The buyer at ${channelMention(interaction.channelId)} clicked on ${id}. Their preferred language is ${getLanguage(interaction)}`,
          )
        }
        return
      }
    } catch (e: any) {
      console.error(e.rawError?.message || 'Something went wrong?')

      try {
        interaction.reply({
          content: getTranslation('generic_error', interaction),
          ephemeral: true,
        })
        return
      } catch {
        console.error('--- ERROR: Was not allowed to reply to interaction ---')
      }
    }
  })

  function setLanguage(interaction: ButtonInteraction) {
    const channel = client.channels.cache.get(interaction.channelId)

    if (!channel || !(channel instanceof TextChannel)) {
      return
    }

    languageByChannel[channel.id] = interaction.customId

    return channel.edit({
      topic: `${interaction.user.id} ${interaction.customId}`,
    })
  }

  function getLanguage(interaction: ButtonInteraction) {
    const channel = client.channels.cache.get(interaction.channelId)

    if (!channel || !(channel instanceof TextChannel)) {
      return 'english'
    }

    return languageByChannel[channel.id] || channel.topic?.split(' ')[1]!
  }

  function getTranslation(id: string, interaction: ButtonInteraction) {
    const language = getLanguage(interaction)

    if (language !== 'english' && language !== 'german' && language !== 'french' && language !== 'spanish') {
      return translations[id]['english']
    }

    return translations[id][language]
  }

  function postSellTypes(interaction: ButtonInteraction) {
    const raids = new ButtonBuilder().setCustomId('raids').setLabel('Raids').setStyle(ButtonStyle.Primary)
    const strikes = new ButtonBuilder().setCustomId('strikes').setLabel('Strikes').setStyle(ButtonStyle.Primary)
    const fractals = new ButtonBuilder().setCustomId('fractals').setLabel('Fractals').setStyle(ButtonStyle.Primary)

    const sellRow = new ActionRowBuilder<ButtonBuilder>().addComponents(raids, strikes, fractals)

    return interaction.reply({
      content: getTranslation('available_services', interaction),
      components: [sellRow],
    })
  }

  function postRaidList(interaction: ButtonInteraction) {
    const boss = new ButtonBuilder().setCustomId('raid-boss').setLabel('Boss Kills').setStyle(ButtonStyle.Primary)
    const achievements = new ButtonBuilder()
      .setCustomId('raid-achievements')
      .setLabel('Achievements')
      .setStyle(ButtonStyle.Primary)

    const sellRow = new ActionRowBuilder<ButtonBuilder>().addComponents(boss, achievements)

    return interaction.reply({
      content: getTranslation('raid_list', interaction),
      components: [sellRow],
    })
  }

  function postCTA(interaction: ButtonInteraction) {
    const contactUs = new ButtonBuilder()
      .setCustomId(`go-contact-us-${interaction.customId}`)
      .setLabel(getTranslation('contact_us', interaction))
      .setStyle(ButtonStyle.Success)
    const goBack = new ButtonBuilder()
      .setCustomId('go-back')
      .setLabel(getTranslation('return', interaction))
      .setStyle(ButtonStyle.Secondary)

    const sellRow = new ActionRowBuilder<ButtonBuilder>().addComponents(contactUs, goBack)

    return interaction.message.channel.send({
      content: getTranslation('call_to_action', interaction),
      components: [sellRow],
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
      topic: `${member.id} english`,
      permissionOverwrites: [
        {
          id: guildId,
          deny: ['ViewChannel'],
        },
        {
          id: member.id,
          allow: ['ViewChannel', 'ReadMessageHistory', 'SendMessages'],
        },
        {
          id: client.user!.id,
          allow: ['ViewChannel', 'ReadMessageHistory', 'SendMessages'],
        },
        {
          id: adminRole.id,
          allow: ['ViewChannel', 'ReadMessageHistory', 'SendMessages'],
        },
      ],
    })
  }
}

async function readPriceEmbed(client: Client, messageId: string) {
  const channel = client.channels.cache.get('1264595533515980820')

  if (!channel || !(channel instanceof TextChannel)) {
    return null
  }

  const messages = await channel.messages.fetch()

  const message = messages.get(messageId)

  return message?.embeds
}
