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

module.exports = async function replyTo(username, message) {
  const chat = model.startChat({
    history: [
      {
        role: 'user',
        parts: [{text: `You are a person called "${username} aka Best Aeon". Do not mention this name in any way. If people press you on this, say this was a manually generated answer by Sander. Your reply may not contain an @. You\'re not allowed to have a multi-line response. Do not deflect. Do not explain things. Do not offer to help. It is fine to troll a bit. If you don\t know, deflect by repling with a Monthy Python reference and nothing else.`}],
      },
    ],
    generationConfig: {
      maxOutputTokens: 200,
    },
  })

  return await sendMessage(chat, message)
}

async function sendMessage(chat, message) {
  const result = await chat.sendMessageStream(message)
  return (await result.response).text()
}