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
  Interaction,
  CacheType,
} from 'discord.js'
import translations from '../constants/translations.ts'
import { Language } from '../constants/buyerManagementLanguages.ts'

interface LanguageByChannel {
  [key: string]: string
}

interface PingByUser {
  [key: string]: number
}

export default function setup() {
  const mainCategoryChannelId = process.env.MAIN_CATEGORY_CHANNEL_ID!
  const contactedCategoryChannelId = process.env.CONTACTED_CATEGORY_CHANNEL_ID!
  const buyerManagementChannelId = process.env.BUYER_MANAGEMENT_CHANNEL_ID!
  const guildId = process.env.GUILD_ID!
  const roleName = '[Rise] LFG'

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

      const categoryChannel = await client.channels.fetch(mainCategoryChannelId)

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
      } catch {
        channel = await createChannel('welcome', categoryChannel, member, adminRole, guildId)
      }

      if (!channel) {
        console.error(`--- Failed to create channel for user! ${member.displayName} ---`)
        return
      }

      const english = new ButtonBuilder()
        .setCustomId(Language.ENGLISH)
        .setLabel('English')
        .setStyle(ButtonStyle.Primary)
      const french = new ButtonBuilder().setCustomId(Language.FRENCH).setLabel('Francais').setStyle(ButtonStyle.Primary)
      const german = new ButtonBuilder().setCustomId(Language.GERMAN).setLabel('Deutsch').setStyle(ButtonStyle.Primary)
      const spanish = new ButtonBuilder()
        .setCustomId(Language.SPANISH)
        .setLabel('Español')
        .setStyle(ButtonStyle.Primary)

      const languageRow = new ActionRowBuilder<ButtonBuilder>().addComponents(english, french, german, spanish)

      await channel.send({
        content: `Hello and welcome to [Rise] ${userMention(member.id)}! 🌟
  
I am a bot, here to assist you in finding and purchasing Guild Wars 2 services. Let's get started!

**__STEP 1: Choose a Language, Elige un idioma, Wähle eine Sprache, Choisir une langue 🌐__**`,
        components: [languageRow],
      })
    } catch (e) {
      console.error(`--- something failed when setting up for ${member.displayName} ---`)
      console.error(e)
    }
  })

  client.on('guildMemberRemove', async (member) => {
    try {
      if (guildId !== member.guild.id) {
        return
      }

      const channels = await member.guild.channels.fetch()

      const userChannel = channels.find((channel) => {
        if (!(channel instanceof TextChannel)) {
          return
        }

        return channel.topic?.includes(`${member.id} `) && channel.name.startsWith('welcome')
      })

      if (!userChannel) {
        console.log(`${member.user.displayName} left but could not find a channel for them.`)
        return
      }

      try {
        userChannel.edit({
          name: `🚩goodbye-${member.displayName}`,
          position: userChannel.parent!.children.cache.size - 1,
        })
      } catch {
        userChannel.edit({
          name: `🚩goodbye`,
          position: userChannel.parent!.children.cache.size - 1,
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

      if (id.startsWith('management-')) {
        await onManagementInteract(interaction)
        return
      }

      if (
        id === Language.ENGLISH ||
        id === Language.GERMAN ||
        id === Language.FRENCH ||
        id === Language.SPANISH ||
        id === 'go-back'
      ) {
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
          embeds = await readPriceEmbed('1264596066444115969')
        } else if (id === 'raid-achievements') {
          embeds = await readPriceEmbed('1264596103995723829')
        } else if (id === 'strikes') {
          embeds = await readPriceEmbed('1264596122710573130')
        } else if (id === 'fractals') {
          embeds = await readPriceEmbed('1264596136778268772')
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

          const callDibs = new ButtonBuilder()
            .setCustomId('management-dibs')
            .setLabel('Dibs')
            .setStyle(ButtonStyle.Primary)

          const row = new ActionRowBuilder<ButtonBuilder>().addComponents(callDibs)

          buyerManagementChannel.send({
            content: `@here The buyer at ${channelMention(interaction.channelId)} clicked on ${id}.
  Their preferred language is ${getLanguagePrettyPrint(interaction)}`,
            components: [row],
          })
        }
        return
      }
    } catch (e: any) {
      console.error(e.rawError?.message || 'Something went wrong?')
      console.error(e)

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
      return Language.ENGLISH
    }

    return languageByChannel[channel.id] || channel.topic?.split(' ')[1]!
  }

  function getLanguagePrettyPrint(interaction: ButtonInteraction) {
    const language = getLanguage(interaction)
    switch (language) {
      case Language.GERMAN:
        return `:flag_de: ${Language.GERMAN.toUpperCase()}`
      case Language.FRENCH:
        return `:flag_fr: ${Language.FRENCH.toUpperCase()}`
      case Language.SPANISH:
        return `:flag_es: ${Language.SPANISH.toUpperCase()}`
      case Language.ENGLISH:
      default:
        return `:flag_gb: ${Language.ENGLISH.toUpperCase()}`
    }
  }

  function getTranslation(id: string, interaction: ButtonInteraction) {
    const language = getLanguage(interaction)

    if (
      language !== Language.ENGLISH &&
      language !== Language.GERMAN &&
      language !== Language.FRENCH &&
      language !== Language.SPANISH
    ) {
      return translations[id][Language.ENGLISH]
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
    everyoneRoleId: string,
  ) {
    return categoryChannel.children.create({
      name,
      type: ChannelType.GuildText,
      topic: `${member.id} ${Language.ENGLISH}`,
      position: 0,
      permissionOverwrites: [
        {
          id: everyoneRoleId,
          deny: ['ViewChannel'],
        },
        {
          id: member.id,
          allow: ['ViewChannel'],
        },
        {
          // Bot Role
          id: '1264588777121382527',
          allow: ['ViewChannel'],
        },
        {
          id: adminRole.id,
          allow: ['ViewChannel'],
        },
      ],
    })
  }

  async function onManagementInteract(interaction: Interaction<CacheType>) {
    const buttonInteraction = interaction as ButtonInteraction
    const message = buttonInteraction.message
    const channelId = message.content.match(/<#(\d+)>/)![1]
    const channel = client.channels.cache.get(channelId) as TextChannel

    if (buttonInteraction.customId === 'management-dibs') {
      if (!message.content.includes('Contacted by')) {
        message.edit(`~~${message.content}~~\r\nContacted by ${userMention(interaction.user.id)}`)

        await buttonInteraction.reply({
          content: `You called dibs!\r\nPlease move the channel to ${channelMention(contactedCategoryChannelId)}`,
          ephemeral: true,
        })
      } else if (message.content.includes(interaction.user.id)) {
        await buttonInteraction.reply({
          content: '⚠️ You already called dibs! ⚠️',
          ephemeral: true,
        })
      } else {
        await buttonInteraction.reply({
          content: 'Oops, too slow!',
          ephemeral: true,
        })
      }
    }
  }

  async function readPriceEmbed(messageId: string) {
    const channel = client.channels.cache.get('1264595533515980820')

    if (!channel || !(channel instanceof TextChannel)) {
      return null
    }

    const messages = await channel.messages.fetch()

    const message = messages.get(messageId)

    return message?.embeds
  }
}
