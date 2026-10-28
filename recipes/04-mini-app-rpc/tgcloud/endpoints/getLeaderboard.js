import { createEndpoint } from 'gramless/endpoint';
import { db } from 'sdk';
import { desc } from 'sdk/db';
import { leaderboard } from '../schema.js';

export default createEndpoint({
  requireAuth: false,
}, async () => {
  const topPlayers = await db
    .select({
      rank: leaderboard.id,
      name: leaderboard.firstName,
      username: leaderboard.username,
      score: leaderboard.score,
    })
    .from(leaderboard)
    .orderBy(desc(leaderboard.score))
    .limit(10)
    .all();

  return {
    topPlayers: topPlayers.map((p, idx) => ({
      rank: idx + 1,
      name: p.name,
      username: p.username ? `@${p.username}` : '',
      score: p.score,
    })),
  };
});
