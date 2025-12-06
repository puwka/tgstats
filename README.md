# My Year in Telegram - Mini App

A Telegram Mini App that analyzes your messaging history to create a "Spotify Wrapped" style summary.

## Architecture

- **Frontend**: React, Vite, Tailwind CSS, Framer Motion. (Located in `/frontend`)
- **Backend**: Node.js, Hono, gram.js (MTProto Client). (Located in `/backend`)
- **Database**: Supabase (PostgreSQL).

## Setup

### 1. Database (Supabase)

1. Create a new project on Supabase.
2. Go to the SQL Editor and run the contents of `database.sql`.
3. Copy your `SUPABASE_URL` and `SUPABASE_SERVICE_KEY`.

### 2. Backend

1. Navigate to `/backend`.
2. Create a `.env` file:
   ```
   TELEGRAM_API_ID=your_api_id
   TELEGRAM_API_HASH=your_api_hash
   BOT_TOKEN=your_bot_token
   SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_KEY=your_service_key
   ```
   (Get API ID/Hash from https://my.telegram.org)
3. Install dependencies: `npm install`
4. Run: `npm run dev` (Starts on port 3000)

### 3. Frontend

1. Navigate to `/frontend`.
2. Create `.env`:
   ```
   VITE_API_URL=http://localhost:3000
   ```
3. Install dependencies: `npm install`
4. Run: `npm run dev`

## How it Works

1. User opens WebApp. Frontend sends `initData` to Backend.
2. Backend checks if this Telegram user has a saved MTProto session in Supabase.
3. **If No Session**:
   - Frontend shows Phone Login screen.
   - User enters phone -> Backend calls `client.sendCode`.
   - User enters code -> Backend calls `client.signIn`.
   - Session string is encrypted and saved to Supabase linked to the User ID.
4. **If Session Exists**:
   - Backend initializes `gram.js` client with the saved session.
   - Backend fetches last 20 active chats and samples last 100 messages from each.
   - Calculates statistics (Top Friends, Total Messages, Activity Graph).
   - Caches results in Supabase `user_stats` table.
   - Frontend renders the Bento Grid dashboard.

## Notes

- **Security**: The session string gives full access to the user's account. In a production app, this must be encrypted at rest (AES) and the backend must be secured.
- **Performance**: Parsing full history takes time. This demo samples the last 100 messages per chat for speed. For a full year analysis, use a background job queue (BullMQ) and notify the user when ready.

