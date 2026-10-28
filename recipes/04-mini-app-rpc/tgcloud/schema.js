import { table, integer, text, index, sql } from 'sdk/db';

export const leaderboard = table('leaderboard', {
  id:        integer('id').primaryKey({ autoIncrement: true }),
  tgId:      integer('tg_id').unique().notNull(),
  username:  text('username'),
  firstName: text('first_name').notNull(),
  score:     integer('score').notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
}, (t) => ({
  scoreIdx: index('idx_leaderboard_score').on(t.score),
}));
