interface PriceDocument {
  title: string
  description: string
  fields: {
    name: string
    value: string
    inline: boolean
  }[]
}
