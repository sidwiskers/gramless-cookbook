import { createBot } from 'gramless';
import { db } from 'sdk';
import { eq } from 'sdk/db';
import { purchases } from '../schema.js';

export const bot = createBot();

bot.command('start', async (ctx) => {
  await ctx.reply(
    `<b>Digital Store</b>\n\n` +
    `Purchase digital products and memberships using Telegram Stars (XTR):\n` +
    `• <code>/buy</code> - Purchase VIP Membership (50 Stars)\n` +
    `• <code>/status</code> - Check active status`,
    { parse_mode: 'HTML' }
  );
});

// Issue Telegram Stars Invoice
bot.command('buy', async (ctx) => {
  await ctx.sendInvoice({
    title: 'VIP Community Membership',
    description: '30-day access to premium analytics and insider channels.',
    payload: `vip_membership_${ctx.userId}_${Date.now()}`,
    currency: 'XTR', // Official ISO code for Telegram Stars
    prices: [
      { label: 'VIP Membership (30 Days)', amount: 50 }, // 50 Telegram Stars
    ],
  });
});

// Pre-Checkout Query Verification (must respond within 10 seconds)
bot.on('pre_checkout_query', async (ctx) => {
  const query = ctx.raw.pre_checkout_query || ctx.raw;
  const payload = query.invoice_payload;

  // Validate payload or stock availability
  if (!payload || !payload.startsWith('vip_membership_')) {
    return ctx.answerPreCheckoutQuery(false, {
      error_message: 'This product is no longer available.',
    });
  }

  // Approve transaction
  await ctx.answerPreCheckoutQuery(true);
});

// Successful Payment Confirmation
bot.on('successful_payment', async (ctx) => {
  const payment = ctx.raw.successful_payment || ctx.raw.message?.successful_payment;
  const chargeId = payment.telegram_payment_charge_id;
  const amount = payment.total_amount;

  // Persist order in SQLite
  await db.insert(purchases).values({
    userId: ctx.userId,
    item: 'vip_membership',
    starsPaid: amount,
    telegramPaymentChargeId: chargeId,
  }).run();

  await ctx.reply(
    `<b>Payment Successful</b>\n\n` +
    `Paid: <b>${amount} Stars</b>\n` +
    `Status: Active\n` +
    `Charge ID: <code>${chargeId}</code>`,
    { parse_mode: 'HTML' }
  );
});

// Check membership status
bot.command('status', async (ctx) => {
  const row = await db
    .select()
    .from(purchases)
    .where(eq(purchases.userId, ctx.userId))
    .get();

  if (!row) {
    return ctx.reply('You do not have an active membership. Use /buy to upgrade.');
  }

  await ctx.reply(
    `<b>Active Membership:</b>\n\n` +
    `• Tier: <b>${row.item}</b>\n` +
    `• Amount Paid: <code>${row.starsPaid} Stars</code>\n` +
    `• Reference: <code>${row.telegramPaymentChargeId}</code>`,
    { parse_mode: 'HTML' }
  );
});
