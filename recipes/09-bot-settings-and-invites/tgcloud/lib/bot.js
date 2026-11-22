import { createBot, Filter } from 'gramless';

export const bot = createBot();

// 1. Programmatic Bot Setup (Bot API 10.5 setMySettings & getMe)
bot.command('setup', async (ctx) => {
  await ctx.chatAction('typing');

  // Configure bot settings directly from code without @BotFather
  await ctx.setMySettings({
    supports_inline_queries: true,
    inline_query_placeholder: 'Search topics or commands...',
    has_topics_enabled: true,
    has_topic_sidebar: true,
    can_communicate_with_bots: true,
    callback_query_mode: 'inline', // Callback buttons return inline_message_id
  });

  const me = await ctx.getMe();
  await ctx.reply(
    `<b>Bot Settings Configured!</b>\n\n` +
    `• Username: @${me.username}\n` +
    `• Active Usernames: <code>${(me.active_usernames || [me.username]).join(', ')}</code>\n` +
    `• Topics Enabled: <code>${me.has_topics_enabled ? 'Yes' : 'No'}</code>\n` +
    `• Topic Sidebar: <code>${me.has_topic_sidebar ? 'Yes' : 'No'}</code>\n` +
    `• Inline Queries: <code>${me.supports_inline_queries ? 'Enabled' : 'Disabled'}</code>\n` +
    `• Callback Query Mode: <code>inline</code>`,
    {
      parse_mode: 'HTML',
      buttons: [
        [{ text: 'Interactive Action', data: 'action:interact' }],
      ],
    }
  );
});

// 2. Callback queries outside inline mode with automatic inline_message_id support
bot.action('action:interact', async (ctx) => {
  await ctx.answer({ text: 'Updating message...' });

  // Dispatches transparently using inline_message_id or chat_id/message_id:
  await ctx.edit(
    `<b>Callback Query Processed!</b>\n\n` +
    `Target: <code>${ctx.inlineMessageId ? 'inline_message_id (' + ctx.inlineMessageId + ')' : 'chat_id (' + ctx.chatId + ')'}</code>\n` +
    `Timestamp: <code>${new Date().toISOString()}</code>`,
    {
      parse_mode: 'HTML',
      buttons: [
        [{ text: 'Refresh', data: 'action:interact' }],
      ],
    }
  );
});

// 3. Dedicated Bot Invite Service Messages (Bot API 10.5 WriteAccessAllowed.inviter)
// Triggers when a user joins private chat via https://t.me/botinvite/<bot_username>
bot.on(Filter.invitedUser, async (ctx) => {
  const inviter = ctx.inviter;
  const username = inviter?.username ? `@${inviter.username}` : (inviter?.first_name || 'the team admin');

  await ctx.reply(
    `👋 <b>Welcome to the Team, ${ctx.from?.first_name || 'there'}!</b>\n\n` +
    `You were invited to this private chat directly by <b>${username}</b> via dedicated onboarding invite link.`,
    { parse_mode: 'HTML' }
  );
});

bot.command('start', async (ctx) => {
  await ctx.reply(
    `Welcome <b>${ctx.from?.first_name || 'User'}</b>!\n\n` +
    `Send /setup to automate bot configuration (Bot API 10.5).`,
    { parse_mode: 'HTML' }
  );
});
