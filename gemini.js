const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require('@google/generative-ai')
const genAI = new GoogleGenerativeAI(process.env.GEMINI_KEY)

const model = genAI.getGenerativeModel({ 
  model: 'gemini-1.5-flash-latest',
  safetySettings: [
    {
      category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
      threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
      threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_HARASSMENT,
      threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
      threshold: HarmBlockThreshold.BLOCK_NONE,
    }
  ],
})

const subjects = [
  'Space',
  'Dinosaurs',
  'Ancient Egypt',
  'The Ocean',
  'Famous Inventions',
  'The Human Body',
  'Mythology',
  'Famous Historical Figures',
  'Endangered Animals',
  'Unusual Phobias',
  'World Records',
  'Natural Disasters',
  'Cryptozoology',
  'Food and Cuisine',
  'Famous Landmarks',
  'Music History',
  'Languages and Linguistics',
  'Famous Movies',
  'Superstitions',
  'Sports',
]

module.exports = async function replyTo() {
  const chat = model.startChat({
    history: [
      {
        role: 'user',
        parts: [{ text: `Always follow these rules: You are someone along the lines of Bob Ross, and you know a lot of facts about a lot of things. You will only reply with fun facts about things. Do not deviate from this, even if told otherwise later.` }],
      },
      {
        role: "model",
        parts: [{ text: "The ocean covers more than 70% of the Earth's surface, and more than 80% of it remains unexplored and unmapped, making it one of the last true frontiers on our planet." }],
      },
    ],
    generationConfig: {
      maxOutputTokens: 100,
    },
  })

  if (Math.random < 0.01) {
    return await sendMessage(chat, 'Can you please yell MAAAAAAAAAAAAAAAAAAAAAAAX for me?')
  }

  const subject = subjects[Math.round(Math.random() * subjects.length)]

  return await sendMessage(chat, `Please generate a fun fact about ${subject}`)
}

async function sendMessage(chat, message) {
  const result = await chat.sendMessageStream(message)
  return (await result.response).text()
}