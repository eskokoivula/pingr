/**
 * GramJS Session String Generator
 *
 * This script authenticates with Telegram's MTProto API and outputs
 * a session string. Run it once, save the output as GRAMJS_SESSION.
 *
 * Usage: cd apps/bot && npx tsx ../../scripts/generate-session.ts
 */

import { TelegramClient } from 'telegram'
import { StringSession } from 'telegram/sessions/index.js'
import * as readline from 'readline'
import 'dotenv/config'

const API_ID = Number(process.env.TELEGRAM_API_ID)
const API_HASH = process.env.TELEGRAM_API_HASH

if (!API_ID || !API_HASH) {
  console.error('\n❌ Missing TELEGRAM_API_ID or TELEGRAM_API_HASH in .env')
  console.error('   Make sure apps/bot/.env or server/.env has these values.\n')
  process.exit(1)
}

function ask(question: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close()
      resolve(answer.trim())
    })
  })
}

async function main() {
  console.log('\n🔐 GramJS Session Generator')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('This will log in to your Telegram account and generate')
  console.log('a session string for the pingr service.\n')

  const phone = await ask('📱 Enter your phone number (with country code, e.g. +358...): ')

  if (!phone.startsWith('+')) {
    console.error('❌ Phone number must start with + (e.g. +358401234567)')
    process.exit(1)
  }

  console.log('\n⏳ Connecting to Telegram...')

  const session = new StringSession('')
  const client = new TelegramClient(session, API_ID, API_HASH, {
    connectionRetries: 3,
  })

  await client.start({
    phoneNumber: () => Promise.resolve(phone),
    phoneCode: async () => {
      console.log('\n📨 Telegram sent you a verification code.')
      return await ask('🔑 Enter the code: ')
    },
    password: async () => {
      return await ask('🔒 Enter your 2FA password (if you have one): ')
    },
    onError: (err) => {
      console.error('❌ Error:', err.message)
    },
  })

  console.log('\n✅ Logged in successfully!')

  const sessionString = client.session.save() as unknown as string

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('📋 Your session string (copy everything between the lines):')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(sessionString)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
  console.log('📝 Save this as GRAMJS_SESSION in your server/.env file.')
  console.log('   It will be used to create group chats automatically.\n')

  await client.disconnect()
  process.exit(0)
}

main().catch((err) => {
  console.error('❌ Fatal error:', err.message)
  process.exit(1)
})
