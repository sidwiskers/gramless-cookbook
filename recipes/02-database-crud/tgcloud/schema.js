import { table, integer, text, boolean, json, index, sql } from 'sdk/db';

export const tasks = table('tasks', {
  id:          integer('id').primaryKey({ autoIncrement: true }),
  userId:      integer('user_id').notNull(),
  title:       text('title').notNull(),
  isCompleted: boolean('is_completed').default(false),
  createdAt:   integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
}, (t) => ({
  userStatusIdx: index('idx_tasks_user_status').on(t.userId, t.isCompleted),
}));

export const sessions = table('sessions', {
  id:        text('id').primaryKey(),
  data:      json('data'),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
});
