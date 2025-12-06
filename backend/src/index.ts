import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { supabase } from './db.js'
import { TelegramService } from './telegramService.js'
import { validateTelegramWebAppData, parseInitData } from './utils.js'
import dotenv from 'dotenv'

dotenv.config()

export const app = new Hono()

app.use('/*', cors())

// 1. Check if user is already authenticated (has session in DB)
app.post('/auth/init', async (c) => {
  const { initData } = await c.req.json()
  
  if (!process.env.BOT_TOKEN) return c.json({ error: 'Env not set' }, 500)

  if (!validateTelegramWebAppData(initData, process.env.BOT_TOKEN)) {
    return c.json({ error: 'Invalid initData' }, 401)
  }

  const user = parseInitData(initData)
  if (!user) return c.json({ error: 'Invalid user data' }, 400)
  
  const { data } = await supabase
    .from('users')
    .select('session_string')
    .eq('id', user.id)
    .single()

  return c.json({ 
    hasSession: !!data?.session_string,
    user 
  })
})

// 2. Start MTProto Login (Send Code)
app.post('/auth/login/send-code', async (c) => {
  const { phone } = await c.req.json()
  const service = new TelegramService()
  await service.connect()
  
  try {
    const result = await service.sendCode(phone)
    return c.json(result)
  } catch (e: any) {
    return c.json({ error: e.message }, 400)
  }
})

// 3. Complete MTProto Login (Sign In)
app.post('/auth/login/sign-in', async (c) => {
  const { phone, code, hash, initData } = await c.req.json()
  
  if (!validateTelegramWebAppData(initData, process.env.BOT_TOKEN!)) {
    return c.json({ error: 'Invalid initData' }, 401)
  }
  const user = parseInitData(initData)

  const service = new TelegramService()
  await service.connect()

  try {
    const sessionString = await service.signIn(phone, hash, code)
    
    // Save session linked to WebApp User ID
    const { error } = await supabase.from('users').upsert({
      id: user.id,
      first_name: user.first_name,
      username: user.username,
      session_string: sessionString,
      last_login: new Date().toISOString()
    })

    if (error) throw error

    return c.json({ success: true })
  } catch (e: any) {
    return c.json({ error: e.message }, 400)
  }
})

// 4. Get Stats (Cached or Fresh)
app.get('/stats', async (c) => {
  const initData = c.req.header('Authorization')
  if (!initData || !validateTelegramWebAppData(initData, process.env.BOT_TOKEN!)) {
    return c.json({ error: 'Unauthorized' }, 401)
  }
  
  const user = parseInitData(initData)

  // Check Cache
  const { data: cached } = await supabase
    .from('user_stats')
    .select('*')
    .eq('user_id', user.id)
    .single()

  // Return cached if recent (e.g., < 1 hour for demo, 24h real)
  if (cached && new Date(cached.updated_at).getTime() > Date.now() - 3600000) {
    return c.json({
        user: { id: user.id, firstName: user.first_name },
        stats: {
            totalMessages: cached.total_messages,
            topPeers: cached.top_peers,
            activityByMonth: cached.activity_by_month,
            topEmojis: cached.top_emojis
        }
    })
  }

  // Get Session
  const { data: userData } = await supabase
    .from('users')
    .select('session_string')
    .eq('id', user.id)
    .single()

  if (!userData?.session_string) {
    return c.json({ error: 'No session' }, 403)
  }

  // Calculate Fresh Stats
  const service = new TelegramService(userData.session_string)
  await service.connect()
  
  try {
    const result = await service.generateStats()
    
    // Cache it
    await supabase.from('user_stats').upsert({
      user_id: user.id,
      total_messages: result.stats.totalMessages,
      top_peers: result.stats.topPeers,
      activity_by_month: result.stats.activityByMonth,
      top_emojis: result.stats.topEmojis,
      updated_at: new Date().toISOString()
    })

    return c.json(result)
  } catch (e: any) {
    console.error(e)
    return c.json({ error: 'Failed to generate stats: ' + e.message }, 500)
  }
})

// Local server entry
if (process.env.NODE_ENV !== 'production' && process.env.VERCEL !== '1') {
    const port = 3000
    console.log(`Server is running on port ${port}`)
    
    serve({
      fetch: app.fetch,
      port
    })
}

export default app
