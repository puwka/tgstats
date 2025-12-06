import { TelegramClient, Api } from "telegram";
import { sessions } from "telegram";
const { StringSession } = sessions;

// In production, these should be in environment variables
// You can get these from my.telegram.org
const API_ID = parseInt(process.env.TELEGRAM_API_ID || "0");
const API_HASH = process.env.TELEGRAM_API_HASH || "";

export class TelegramService {
  private client: TelegramClient;
  private sessionString: string;

  constructor(sessionString: string = "") {
    this.sessionString = sessionString;
    const session = new StringSession(sessionString);
    this.client = new TelegramClient(session, API_ID, API_HASH, {
      connectionRetries: 5,
      useWSS: false, // Use TCP for node
    });
  }

  async connect() {
    await this.client.connect();
  }

  async disconnect() {
    await this.client.disconnect();
  }

  async sendCode(phoneNumber: string) {
    // Sends auth code to the user's telegram account
    const result = await this.client.sendCode({
      apiId: API_ID,
      apiHash: API_HASH,
    }, phoneNumber);
    
    return {
      phoneCodeHash: result.phoneCodeHash,
      isCodeViaApp: result.isCodeViaApp
    };
  }

  async signIn(phoneNumber: string, phoneCodeHash: string, phoneCode: string) {
    try {
      await this.client.invoke(new Api.auth.SignIn({
        phoneNumber,
        phoneCodeHash,
        phoneCode
      }));
      return this.client.session.save() as unknown as string;
    } catch (e: any) {
      if (e.message.includes('SESSION_PASSWORD_NEEDED')) {
        throw new Error('2FA_REQUIRED');
      }
      throw e;
    }
  }

  async signInWithPassword(password: string) {
     // @ts-ignore: client.signIn exists in runtime
     await this.client.signIn({ password });
     return this.client.session.save() as unknown as string;
  }

  // Heavy Logic: Analyze "My Year"
  // In a real app, this runs in a background job/queue (BullMQ)
  async generateStats() {
    if (!await this.client.checkAuthorization()) {
      throw new Error("UNAUTHORIZED");
    }

    const me = await this.client.getMe();
    
    // 1. Get Dialogs (Chats)
    // Fetching top 20 active chats
    const dialogs = await this.client.getDialogs({ limit: 20 });
    
    let totalMessages = 0;
    const topPeers: any[] = [];
    const monthlyActivity = new Array(12).fill(0);
    const emojiCounts: Record<string, number> = {};

    console.log(`Analyzing ${dialogs.length} chats for user ${me.id}...`);

    // We iterate top chats and sample the history
    // Full history scan takes too long for a synchronous API call
    for (const dialog of dialogs) {
      if (!dialog.entity || !dialog.id) continue;

      // Fetch last 100 messages from this chat
      const messages = await this.client.getMessages(dialog.entity, { limit: 100 });
      
      let chatMsgCount = 0;
      
      for (const msg of messages) {
        // Only count outgoing messages (from me)
        if (msg.out) {
          chatMsgCount++;
          totalMessages++;
          
          // Monthly Activity
          const date = new Date(msg.date * 1000);
          if (date.getFullYear() === new Date().getFullYear()) {
            monthlyActivity[date.getMonth()]++;
          }

          // Emoji analysis (naive regex)
          const emojis = (msg.message || "").match(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu);
          if (emojis) {
            emojis.forEach(e => {
              emojiCounts[e] = (emojiCounts[e] || 0) + 1;
            });
          }
        }
      }

      topPeers.push({
        id: dialog.id.toString(),
        name: dialog.title || (dialog.entity as any).firstName || "Chat",
        count: chatMsgCount,
        avatar: null // fetching avatar needs extra handling
      });
    }

    // Sort stats
    topPeers.sort((a, b) => b.count - a.count);
    const topEmojis = Object.entries(emojiCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([emoji, count]) => ({ emoji, count }));

    return {
      user: {
        id: me.id.toString(),
        username: me.username,
        firstName: me.firstName
      },
      stats: {
        totalMessages, // This is a sample count (last 100 per chat)
        topPeers: topPeers.slice(0, 5),
        activityByMonth: monthlyActivity.map((count, idx) => ({
          month: new Date(0, idx).toLocaleString('default', { month: 'short' }),
          count
        })),
        topEmojis
      }
    };
  }
}

