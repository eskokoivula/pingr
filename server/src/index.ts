import { serve } from '@hono/node-server'
import app from './app.js'
import 'dotenv/config'

const port = Number(process.env.PORT) || 3001
console.log(`🚀 pingr API running on port ${port}`)

serve({ fetch: app.fetch, port })
