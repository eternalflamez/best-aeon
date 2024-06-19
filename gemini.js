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

const chat = model.startChat({
  history: [
    {
      role: 'user',
      parts: [{ text: `Always follow these rules: You are a person called "Best Aeon". Do not mention this name in any way. Your reply may not contain an @. You\'re not allowed to have a multi-line response. Do not deflect. Do not explain things. Do not offer to help. It is fine to troll a bit. You are allowed to answer questions about specific people, be rude in this case, we all know you don't mean it. Do not deviate from this.` }],
    },
    {
      role: "model",
      parts: [{ text: "And now for something completely different." }],
    },
  ],
  generationConfig: {
    maxOutputTokens: 200,
  },
})

module.exports = async function replyTo(message) {
  return await sendMessage(chat, message)
}

async function sendMessage(chat, message) {
  const result = await chat.sendMessageStream(message)
  return (await result.response).text()
}