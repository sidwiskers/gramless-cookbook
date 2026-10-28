import { createBot, Filter } from 'gramless';

export const bot = createBot();

// Predicate: Detects suspicious spam links or telegram invite links
const hasSpamLink = (ctx) => {
  const text = ctx.text || ctx.caption || '';
  return /(?:https?:\/\/)?(?:t\.me\/(?:joinchat\/|[a-zA-Z0-9_]{5,})|discord\.gg\/|[a-zA-Z0-9-]+\.(?:xyz|top|click|link))/i.test(text);
};

// Predicate: Check if sender is a group admin
async function isSenderAdmin(ctx) {
  if (!ctx.chatId || !ctx.userId) return false;
  try {
    const member = await ctx.getChatMember(ctx.userId);
    return member && (member.status === 'creator' || member.status === 'administrator');
  } catch {
    return false;
  }
}

// 1. Automatic Spam Filter in Groups
bot.on(Filter.all(Filter.group, hasSpamLink), async (ctx) => {
  // If author is an administrator, permit the link
  if (await isSenderAdmin(ctx)) return;

  // Delete offending message
  await ctx.delete();

  // Mute sender for 1 hour
  const untilDate = Math.floor(Date.now() / 1000) + 3600;
  await ctx.restrictMember(ctx.userId, {
    permissions: { can_send_messages: false },
    until_date: untilDate,
  });

  await ctx.reply(`<b>Anti-Spam Action:</b> Message deleted and <b>${ctx.from?.first_name || 'User'}</b> muted for 1 hour.`, {
    parse_mode: 'HTML',
  });
});

// 2. /ban command (Reply to a message to ban the author)
bot.command('ban', async (ctx) => {
  if (!Filter.group(ctx)) {
    return ctx.reply('This command can only be used in groups.');
  }

  if (!(await isSenderAdmin(ctx))) {
    return ctx.reply('Only group administrators can use /ban.');
  }

  const targetMessage = ctx.message?.reply_to_message;
  if (!targetMessage || !targetMessage.from) {
    return ctx.reply('Reply to the message of the user you wish to ban.');
  }

  const targetUser = targetMessage.from;

  // Revoke all past messages from author and ban
  await ctx.banMember(targetUser.id, { revoke_messages: true });

  await ctx.reply(`Banned <b>${targetUser.first_name}</b> (ID: <code>${targetUser.id}</code>).`, {
    parse_mode: 'HTML',
  });
});

// 3. /mute command (Reply to mute for duration in minutes)
bot.command('mute', async (ctx) => {
  if (!Filter.group(ctx)) return;
  if (!(await isSenderAdmin(ctx))) {
    return ctx.reply('Only group administrators can use /mute.');
  }

  const targetMessage = ctx.message?.reply_to_message;
  if (!targetMessage || !targetMessage.from) {
    return ctx.reply('Reply to the message of the user you wish to mute.');
  }

  const minutes = parseInt(ctx.args[0] || '15', 10);
  const untilDate = Math.floor(Date.now() / 1000) + (minutes * 60);

  await ctx.restrictMember(targetMessage.from.id, {
    permissions: { can_send_messages: false },
    until_date: untilDate,
  });

  await ctx.reply(`Muted <b>${targetMessage.from.first_name}</b> for <b>${minutes} minutes</b>.`, {
    parse_mode: 'HTML',
  });
});

// 4. Bot Chat Status Updates (Added to group or promoted)
bot.on('my_chat_member', async (ctx) => {
  const update = ctx.raw.my_chat_member || ctx.raw;
  const newStatus = update.new_chat_member?.status;

  if (newStatus === 'administrator') {
    await ctx.reply('<b>Moderator active.</b> Ensure the bot has "Delete Messages" and "Ban Users" permissions.', {
      parse_mode: 'HTML',
    });
  }
});
