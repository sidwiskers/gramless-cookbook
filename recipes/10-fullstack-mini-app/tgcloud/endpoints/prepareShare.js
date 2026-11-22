import { createEndpoint, v } from 'gramless/endpoint';

export default createEndpoint({
  requireAuth: true,
  schema: v.object({
    score: v.number(),
  }),
}, async (ctx) => {
  const user = ctx.user;

  // Bot API 8.0+ prepared inline message card
  const prepared = await ctx.savePreparedInlineMessage({
    type: 'article',
    id: `share_${user.id}_${Date.now()}`,
    title: `🏆 ${user.first_name}'s High Score!`,
    description: `I scored ${ctx.input.score} points on MiniQuest!`,
    input_message_content: {
      message_text: `🎮 <b>High Score Alert!</b>\n\nI just scored <b>${ctx.input.score} points</b> in MiniQuest! Can you beat me?`,
      parse_mode: 'HTML',
    },
    reply_markup: {
      inline_keyboard: [
        [{ text: 'Play MiniQuest 🚀', url: 'https://t.me/MiniQuestBot/play' }],
      ],
    },
  }, {
    userId: user.id,
    allowUserChats: true,
    allowGroupChats: true,
  });

  return { id: prepared.id };
});
