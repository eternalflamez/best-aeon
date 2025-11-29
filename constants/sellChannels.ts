const sellChannels = {
  // scheduled-frogs
  '803274143311069204': { region: 'EU' },
  // scheduled-cms
  '982039087663951892': { region: 'EU' },
  // scheduled-practise
  '1444445198758187071': { region: 'EU' },
  // na-scheduled-frogs
  '1196920908842008728': { region: 'NA' },
  // na-scheduled-cms
  '1196923586791874640': { region: 'NA' },

  // BTB
  // instant-sales
  // '1249829604974268418': { region: 'EU' },
  // sells
  // '1263079097408688155': { region: 'NA' },
}

function isValidSellChannel(channelId: string): channelId is keyof typeof sellChannels {
  return channelId in sellChannels
}

function isInstantChannel(channelId: string) {
  return channelId === '1249829604974268418'
}

function getRegion(channelid: string) {
  if (isValidSellChannel(channelid)) {
    return sellChannels[channelid].region
  }

  return null
}

export { sellChannels, isValidSellChannel, isInstantChannel, getRegion }
