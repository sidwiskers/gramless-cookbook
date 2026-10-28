import { table, integer, text, index, sql } from 'sdk/db';

export const purchases = table('purchases', {
  id:                      integer('id').primaryKey({ autoIncrement: true }),
  userId:                  integer('user_id').notNull(),
  item:                    text('item').notNull(),
  starsPaid:               integer('stars_paid').notNull(),
  telegramPaymentChargeId: text('telegram_payment_charge_id').unique().notNull(),
  createdAt:               integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
}, (t) => ({
  userItemIdx: index('idx_purchases_user_item').on(t.userId, t.item),
}));
