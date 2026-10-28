import { createEndpoint, v } from 'gramless/endpoint';
import { db } from 'sdk';
import { eq, desc, sql } from 'sdk/db';
import { leaderboard } from '../schema.js';

export default createEndpoint({
  requireAuth: true,
  schema: v.object({
    score: v.number({ min: 1, max: 1000000 }),
  }),
}, async (ctx) => {
  const user = ctx.user; // Verified Telegram user from initData
  const { score } = ctx.input;

  // Insert or update on conflict of tg_id
  await db
    .insert(leaderboard)
    .values({
      tgId: user.id,
      username: user.username || null,
      firstName: user.first_name || 'Player',
      score,
    })
    .onConflictDoUpdate({
      target: leaderboard.tgId,
      set: {
        score: sql`MAX(leaderboard.score, ${score})`,
        username: user.username || null,
        firstName: user.first_name || 'Player',
        updatedAt: sql`(unixepoch())`,
      },
    })
    .run();

  // Query updated player position
  const rankRow = await db
    .select({ count: sql`COUNT(*)` })
    .from(leaderboard)
    .where(sql`score > (SELECT score FROM leaderboard WHERE tg_id = ${user.id})`)
    .get();

  const rank = (rankRow?.count || 0) + 1;

  return {
    success: true,
    playerId: user.id,
    playerName: user.first_name,
    submittedScore: score,
    currentRank: rank,
  };
});
