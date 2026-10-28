import { createBot } from 'gramless';

export const bot = createBot();

bot.command('start', async (ctx) => {
  await ctx.chatAction('typing');

  await ctx.reply(`Welcome <b>${ctx.from?.first_name || 'User'}</b>!\n\nThis bot runs on Telegram Serverless via <b>Gramless</b>.`, {
    parse_mode: 'HTML',
    buttons: [
      [{ text: 'Ping isolate', data: 'action:ping' }],
      [{ text: 'Official documentation', url: 'https://github.com/sidwiskers/gramless' }],
    ],
  });
});

bot.command('help', async (ctx) => {
  await ctx.reply(
    '<b>Available Commands:</b>\n' +
    '/start - Launch the bot and view menu\n' +
    '/ping - Measure isolate response time\n' +
    '/help - Display this manual',
    { parse_mode: 'HTML' }
  );
});

bot.command('ping', async (ctx) => {
  await ctx.reply('Pong. Isolate active.');
});

bot.action('action:ping', async (ctx) => {
  await ctx.answer({ text: 'Pong received' });
  await ctx.edit(`<b>Pong</b>\n\nButton callback executed at <code>${new Date().toISOString()}</code>`, {
    parse_mode: 'HTML',
    buttons: [
      [{ text: 'Refresh', data: 'action:ping' }],
      [{ text: 'Main Menu', data: 'action:menu' }],
    ],
  });
});

bot.action('action:menu', async (ctx) => {
  await ctx.answer();
  await ctx.edit('<b>Main Menu</b>\nSelect an option below:', {
    parse_mode: 'HTML',
    buttons: [
      [{ text: 'Ping isolate', data: 'action:ping' }],
      [{ text: 'Visit TGCloud', url: 'https://tgcloud.ai' }],
    ],
  });
});

bot.on('message', async (ctx) => {
  if (ctx.text) {
    await ctx.reply(`Received: <i>${ctx.text}</i>`, { parse_mode: 'HTML' });
  }
});
