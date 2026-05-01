import { Bot } from 'grammy'
import 'dotenv/config'

const token = process.env.BOT_TOKEN
if (!token) {
  throw new Error('BOT_TOKEN is required')
}

const bot = new Bot(token)

bot.command('start', (ctx) => {
  ctx.reply('👋 Welcome to pingr!\n\nOpen the app to start networking:', {
    reply_markup: {
      inline_keyboard: [[
        { text: '🚀 Open pingr', web_app: { url: process.env.FRONTEND_URL || 'https://pingr.app' } }
      ]]
    }
  })
})

bot.start({
  onStart: () => console.log('🤖 pingr bot is running'),
})
