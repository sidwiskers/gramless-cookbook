import { createBot, session } from 'gramless';

export function createTestBot() {
  const bot = createBot();

  bot.use(session({
    initial: () => ({ counter: 0 }),
  }));

  bot.command('start', async (ctx) => {
    await ctx.reply(`Welcome ${ctx.from?.first_name || 'Friend'}!`, {
      buttons: [
        [{ text: 'View Counter', data: 'action:view' }],
      ],
    });
  });

  bot.action('action:view', async (ctx) => {
    await ctx.answer();
    await ctx.edit(`Current count: ${ctx.session.counter}`, {
      buttons: [
        [{ text: '+1 Increment', data: 'action:inc' }],
        [{ text: 'Reset', data: 'action:reset' }],
      ],
    });
  });

  bot.action('action:inc', async (ctx) => {
    ctx.session.counter += 1;
    await ctx.answer({ text: 'Incremented!' });
    await ctx.edit(`Current count: ${ctx.session.counter}`, {
      buttons: [
        [{ text: '+1 Increment', data: 'action:inc' }],
        [{ text: 'Reset', data: 'action:reset' }],
      ],
    });
  });

  bot.action('action:reset', async (ctx) => {
    ctx.session.counter = 0;
    await ctx.answer();
    await ctx.edit('Current count: 0', {
      buttons: [
        [{ text: '+1 Increment', data: 'action:inc' }],
      ],
    });
  });

  return bot;
}
