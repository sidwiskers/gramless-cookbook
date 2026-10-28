import { createBot } from 'gramless';

export const bot = createBot();

bot.command('start', async (ctx) => {
  await ctx.reply(`Welcome <b>${ctx.from?.first_name || 'Player'}</b>!\n\nOpen the Game Mini App below to submit your score:`, {
    parse_mode: 'HTML',
    buttons: [
      [{ text: 'Play Game', webApp: 'https://app.tgcloud.ai/' }],
    ],
  });
});

export default bot.handler();
