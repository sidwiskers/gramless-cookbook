import { createBot, Filter } from 'gramless';

export const bot = createBot();

// 1. Launch Mini App & configure persistent chat MenuButton
bot.command('start', async (ctx) => {
  await ctx.setChatMenuButton({
    type: 'web_app',
    text: 'Play Game 🎮',
    url: 'https://app.tgcloud.ai',
  });

  await ctx.reply(`Welcome <b>${ctx.from?.first_name || 'Player'}</b>!\n\nTap the button below or the persistent menu button to launch the Mini App.`, {
    parse_mode: 'HTML',
    buttons: [
      [{ text: 'Launch Mini App 🚀', webApp: 'https://app.tgcloud.ai' }],
    ],
  });
});

// 2. Handle data sent back from the Mini App via Telegram.WebApp.sendData()
bot.webApp('game_completed', async (ctx) => {
  const payload = ctx.webAppPayload;
  await ctx.reply(
    `🎉 Congratulations <b>${ctx.from?.first_name}</b>!\n\nYou finished the game with <b>${payload.score} points</b>!`,
    { parse_mode: 'HTML' }
  );
});

// Fallback for any other web_app submission
bot.on(Filter.webAppData, async (ctx) => {
  await ctx.reply(`Mini App data received: <code>${ctx.webAppData?.data}</code>`, {
    parse_mode: 'HTML',
  });
});
