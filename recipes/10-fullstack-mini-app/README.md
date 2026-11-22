# Recipe 10: Full-Stack Mini App with Client SDK & Bot WebApp Routing

Demonstrates an end-to-end Telegram Mini App (TMA) architecture using **Gramless Full-Stack Suite**:
- Frontend RPC client (`gramless/client`) with automatic `initData` auth.
- Backend serverless RPC endpoints (`tgcloud/endpoints/*.js`) with zero-dependency schema validation.
- Bot API 8.0+ prepared inline message sharing (`shareMessage`).
- Persistent Chat MenuButton configuration (`ctx.setChatMenuButton`).
- Bot-side Mini App service message routing (`bot.webApp` / `ctx.webAppData`).
- Promisified Telegram `CloudStorage` persistence.

---

## Architecture Overview

```text
10-fullstack-mini-app/
├── public/
│   └── index.html               # Mini App frontend using gramless/client
├── tgcloud/
│   ├── endpoints/
│   │   ├── submitScore.js       # Authenticated RPC: saves score to SQLite
│   │   └── prepareShare.js      # Prepared inline message sharing (Bot API 8.0+)
│   ├── handlers/
│   │   └── message.js           # export default bot.handler();
│   ├── lib/
│   │   └── bot.js               # Bot commands, MenuButton & bot.webApp() routes
│   └── schema.js                # SQLite schema (sdk/db)
├── package.json
└── tgcloud.jsonc                # "static": "public"
```

---

## Key Concepts & Code

### 1. Launching Mini App & Configuring MenuButton (`tgcloud/lib/bot.js`)

```javascript
import { createBot } from 'gramless';

export const bot = createBot();

bot.command('start', async (ctx) => {
  // Configures the bottom-left Telegram menu button to launch the Mini App
  await ctx.setChatMenuButton({
    type: 'web_app',
    text: 'Play Game 🎮',
    url: 'https://app.tgcloud.ai',
  });

  await ctx.reply('Welcome! Tap below or the menu button to play:', {
    buttons: [
      [{ text: 'Launch Mini App 🚀', webApp: 'https://app.tgcloud.ai' }],
    ],
  });
});
```

### 2. Frontend RPC & CloudStorage (`public/index.html`)

```javascript
import { createClient } from 'gramless/client';

const client = createClient();
client.ready().expand();

// 1. Promisified CloudStorage
const saved = await client.cloudStorage.getItem('high_score');

// 2. Authenticated RPC Call with automatic initData injection
const result = await client.call('submitScore', { score: 1500 });
client.haptic.notification('success');

// 3. Bot API 8.0+ Prepared Inline Message Sharing
const prep = await client.call('prepareShare', { score: 1500 });
await client.shareMessage(prep.id);

// 4. Return Data to Bot via Service Message
client.sendData({ action: 'game_completed', score: 1500 });
```

### 3. Backend RPC Endpoint (`tgcloud/endpoints/submitScore.js`)

```javascript
import { createEndpoint, v } from 'gramless/endpoint';
import { db } from 'sdk';
import { scores } from '../schema.js';

export default createEndpoint({
  requireAuth: true,
  schema: v.object({
    score: v.number({ min: 1, max: 1000000 }),
  }),
}, async (ctx) => {
  const user = ctx.user; // Verified Telegram caller identity
  const { score } = ctx.input; // Validated payload

  await db.insert(scores).values({
    id: `score_${user.id}_${Date.now()}`,
    userId: user.id,
    score,
  }).run();

  return { success: true, score };
});
```

### 4. Handling Return Data in Bot (`tgcloud/lib/bot.js`)

```javascript
bot.webApp('game_completed', async (ctx) => {
  const payload = ctx.webAppPayload;
  await ctx.reply(`🎉 Great job! You finished with ${payload.score} points!`);
});
```
