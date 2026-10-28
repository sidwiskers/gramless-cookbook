import { createBot, session, TgCloudSessionStore } from 'gramless';
import { db } from 'sdk';
import { eq, and, desc } from 'sdk/db';
import { tasks, sessions } from '../schema.js';

export const bot = createBot();

// Attach transactional session backed by SQLite
bot.use(session({
  store: new TgCloudSessionStore({ db, table: sessions, eq }),
  initial: () => ({ lastAction: null, totalAdded: 0 }),
}));

bot.command('start', async (ctx) => {
  await ctx.reply(
    `<b>Task Manager</b>\n\n` +
    `Manage personal tasks saved to SQLite:\n` +
    `• <code>/add &lt;text&gt;</code> - Create new task\n` +
    `• <code>/list</code> - View pending tasks\n` +
    `• <code>/stats</code> - View session metrics\n` +
    `• <code>/rollback_demo</code> - Demonstrate transactional rollback`,
    { parse_mode: 'HTML' }
  );
});

// Create task
bot.command('add', async (ctx) => {
  const title = ctx.payload.trim();
  if (!title) {
    return ctx.reply('Usage: <code>/add Buy groceries</code>', { parse_mode: 'HTML' });
  }

  // 1. Insert into SQLite
  await db.insert(tasks).values({
    userId: ctx.userId,
    title,
  }).run();

  // 2. Increment session counter (ACID protected)
  ctx.session.totalAdded = (ctx.session.totalAdded || 0) + 1;
  ctx.session.lastAction = 'add';

  await ctx.reply(`Added task: <b>${title}</b>`, {
    parse_mode: 'HTML',
    buttons: [
      [{ text: 'View tasks', data: 'action:list' }],
    ],
  });
});

// List pending tasks
bot.command('list', async (ctx) => {
  await renderTaskList(ctx);
});

bot.action('action:list', async (ctx) => {
  await ctx.answer();
  await renderTaskList(ctx, true);
});

async function renderTaskList(ctx, isEdit = false) {
  const pending = await db
    .select()
    .from(tasks)
    .where(and(eq(tasks.userId, ctx.userId), eq(tasks.isCompleted, false)))
    .orderBy(desc(tasks.createdAt))
    .all();

  if (pending.length === 0) {
    const text = 'No pending tasks. Use <code>/add &lt;title&gt;</code> to create one.';
    return isEdit ? ctx.edit(text, { parse_mode: 'HTML' }) : ctx.reply(text, { parse_mode: 'HTML' });
  }

  const buttons = pending.map((t) => [
    { text: t.title, data: `task:done:${t.id}` },
  ]);

  const text = `<b>Pending Tasks (${pending.length}):</b>\nClick a task below to mark it completed:`;

  return isEdit
    ? ctx.edit(text, { parse_mode: 'HTML', buttons })
    : ctx.reply(text, { parse_mode: 'HTML', buttons });
}

// Prefix action: mark task done
bot.action(/^task:done:(\d+)$/, async (ctx) => {
  const taskId = parseInt(ctx.match[1], 10);

  await db
    .update(tasks)
    .set({ isCompleted: true })
    .where(and(eq(tasks.id, taskId), eq(tasks.userId, ctx.userId)))
    .run();

  await ctx.answer({ text: 'Task completed' });
  await renderTaskList(ctx, true);
});

// Show session statistics
bot.command('stats', async (ctx) => {
  await ctx.reply(
    `<b>Session Metrics:</b>\n` +
    `• Total Tasks Added: <code>${ctx.session.totalAdded || 0}</code>\n` +
    `• Last Action: <code>${ctx.session.lastAction || 'none'}</code>`,
    { parse_mode: 'HTML' }
  );
});

// Transactional Rollback Demonstration
bot.command('rollback_demo', async (ctx) => {
  ctx.session.totalAdded += 1000; // Mutate working session copy

  // Simulate an unhandled fault (e.g. invalid external API call)
  throw new Error('Simulated panic mid-handler! Changes to ctx.session will be rolled back.');
});
