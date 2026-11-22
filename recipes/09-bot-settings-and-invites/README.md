# Recipe 09: Bot Settings Automation & Dedicated Invite Links

Demonstrates how to use Telegram Bot API 10.5 features in Gramless to automate bot settings and handle multi-user invite onboarding in private chats.

---

## What This Recipe Demonstrates

1. **Programmatic Bot Settings (`ctx.setMySettings`)**:
   - Enables topic sidebars in private chats (`has_topic_sidebar: true`).
   - Enables forum topics in private chats (`has_topics_enabled: true`).
   - Configures `callback_query_mode: 'inline'` so button callback queries return `inline_message_id`.
   - Enables inline queries and sets custom query placeholders.
2. **Inspecting Bot Full Information (`ctx.getMe`)**:
   - Returns a `BotFullInfo` object containing `active_usernames`, `has_topic_sidebar`, and configuration status.
3. **Handling Dedicated Bot Invite Links (`write_access_allowed.inviter`)**:
   - Bot owners can invite up to 10 users at once via `https://t.me/botinvite/<bot_username>`.
   - The bot receives a service message with write access granted and extracts `ctx.inviter`.
   - Uses `Filter.invitedUser` to greet newly invited users immediately with personalized messages.
4. **Callback Query Editing outside Inline Mode**:
   - `ctx.edit()`, `ctx.editCaption()`, and `ctx.editKeyboard()` transparently route through `inline_message_id`.

---

## Project Structure

```text
09-bot-settings-and-invites/
├── package.json
├── tgcloud.jsonc
└── tgcloud/
    ├── handlers/
    │   ├── message.js
    │   └── callback_query.js
    └── lib/
        └── bot.js
```

---

## Key Code Snippets

### 1. Setting Up the Bot Programmatically

```javascript
import { createBot, Filter } from 'gramless';

export const bot = createBot();

bot.command('setup', async (ctx) => {
  await ctx.setMySettings({
    supports_inline_queries: true,
    inline_query_placeholder: 'Search topics...',
    has_topics_enabled: true,
    has_topic_sidebar: true,
    can_communicate_with_bots: true,
    callback_query_mode: 'inline',
  });

  const me = await ctx.getMe();
  await ctx.reply(`Bot configured! Active usernames: ${me.active_usernames.join(', ')}`);
});
```

### 2. Onboarding Users Invited via Dedicated Links

```javascript
bot.on(Filter.invitedUser, async (ctx) => {
  const inviter = ctx.inviter;
  await ctx.reply(
    `Welcome ${ctx.from.first_name}! You were invited by @${inviter.username || inviter.first_name}.`
  );
});
```

### 3. Editing Callback Buttons with `inline_message_id`

```javascript
bot.action('action:interact', async (ctx) => {
  await ctx.answer();
  // Works automatically whether ctx contains message or inline_message_id:
  await ctx.edit('Updated content via inline_message_id!');
});
```
