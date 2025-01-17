const sellChannels = {
  // instant-sells
  '821737329215275039': { region: 'EU' },
  // scheduled-raids
  '803274143311069204': { region: 'EU' },
  // scheduled-strikes
  '982039087663951892': { region: 'EU' },
  // scheduled-fractals
  '982039130047397988': { region: 'EU' },
  // na-instant-sells
  '1285719338371911832': { region: 'NA' },
  // na-scheduled-raids
  '1196920908842008728': { region: 'NA' },
  // na-scheduled-strikes
  '1196923586791874640': { region: 'NA' },
  // na-scheduled-fractals
  '1285376242597625927': { region: 'NA' },

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
  return (
    channelId === '821737329215275039' || channelId === '1285719338371911832' || channelId === '1249829604974268418'
  )
}

function getRegion(channelid: string) {
  if (isValidSellChannel(channelid)) {
    return sellChannels[channelid].region
  }

  return null
}

export { sellChannels, isValidSellChannel, isInstantChannel, getRegion }
