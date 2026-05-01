import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { auth } from './routes/auth.js'

const app = new Hono()

app.use('/*', cors({
  origin: (origin) => origin || '*',
}))

app.get('/', (c) => c.json({ status: 'ok', service: 'pingr-api' }))
app.get('/api/health', (c) => c.json({ status: 'ok' }))

// Routes
app.route('/api/auth', auth)

export default app
