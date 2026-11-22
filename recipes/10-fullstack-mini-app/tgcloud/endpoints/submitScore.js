import { createEndpoint, v } from 'gramless/endpoint';
import { db } from 'sdk';
import { scores } from '../schema.js';

export default createEndpoint({
  requireAuth: true,
  schema: v.object({
    score: v.number({ min: 1, max: 1000000 }),
  }),
}, async (ctx) => {
  const user = ctx.user; // Verified Telegram user
  const { score } = ctx.input;

  await db.insert(scores).values({
    id: `score_${user.id}_${Date.now()}`,
    userId: user.id,
    username: user.username || null,
    firstName: user.first_name || 'Player',
    score,
  }).run();

  return {
    success: true,
    score,
    player: user.first_name,
  };
});
