import { table, text, integer, sql } from 'sdk/db';

export const scores = table('scores', {
  id: text('id').primaryKey(),
  userId: integer('user_id').notNull(),
  username: text('username'),
  firstName: text('first_name'),
  score: integer('score').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
});
