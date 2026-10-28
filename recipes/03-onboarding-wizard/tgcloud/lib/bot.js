import { createBot, session, createFSM } from 'gramless';

export const bot = createBot();

// Session is required for FSM state storage
bot.use(session({
  initial: () => ({ profile: {} }),
}));

// Create conversation wizard
const wizard = createFSM({
  cancelCommand: '/cancel',
  onCancel: async (ctx) => {
    await ctx.reply('Onboarding cancelled. You can restart anytime with /register.');
  },
});

// Step 1: Ask Full Name
wizard.step('ask_name', async (ctx) => {
  const name = ctx.text?.trim();
  ctx.fsm.data.name = name;

  await ctx.reply(`Hello <b>${name}</b>.\n\nStep 2/3: What is your age?`, {
    parse_mode: 'HTML',
  });

  ctx.fsm.goto('ask_age');
}, async (ctx) => {
  if (!ctx.text || ctx.text.trim().length < 2) {
    await ctx.reply('Please provide a valid name (at least 2 characters):');
    return false;
  }
  return true;
});

// Step 2: Ask Age with numeric validation guard
wizard.step('ask_age', async (ctx) => {
  const age = parseInt(ctx.text.trim(), 10);
  ctx.fsm.data.age = age;

  await ctx.reply(
    `Recorded age: <b>${age}</b>.\n\n` +
    `Step 3/3: What is your primary profession?`,
    {
      parse_mode: 'HTML',
      buttons: [
        [{ text: 'Software Engineer', data: 'role:dev' }],
        [{ text: 'Product Designer', data: 'role:design' }],
        [{ text: 'Founder / Builder', data: 'role:founder' }],
      ],
    }
  );

  ctx.fsm.goto('ask_role');
}, async (ctx) => {
  const val = parseInt(ctx.text?.trim() || '', 10);
  if (Number.isNaN(val) || val < 13 || val > 120) {
    await ctx.reply('Please enter a realistic age as a number between 13 and 120:');
    return false;
  }
  return true;
});

// Step 3: Select Role
wizard.step('ask_role', async (ctx) => {
  let role = 'Other';
  if (ctx.callbackQuery) {
    await ctx.answer();
    role = ctx.callbackData.replace('role:', '');
  } else if (ctx.text) {
    role = ctx.text.trim();
  }

  ctx.fsm.data.role = role;

  // Complete conversation
  const profile = { ...ctx.fsm.data };
  ctx.fsm.complete();

  // Save to persistent session
  ctx.session.profile = profile;

  await ctx.reply(
    `<b>Registration Complete</b>\n\n` +
    `• Name: <b>${profile.name}</b>\n` +
    `• Age: <code>${profile.age}</code>\n` +
    `• Role: <b>${profile.role}</b>\n\n` +
    `Use /profile to review your profile.`,
    { parse_mode: 'HTML' }
  );
});

// Attach FSM middleware
bot.use(wizard.middleware());

// Entry command
bot.command('start', async (ctx) => {
  await ctx.reply(
    'Welcome to the Onboarding Demo.\n\n' +
    'Type /register to begin registration, or /profile to view existing data.'
  );
});

bot.command('register', async (ctx) => {
  await ctx.reply(
    '<b>Onboarding Wizard</b> (Type /cancel anytime to abort)\n\n' +
    'Step 1/3: What is your full name?',
    { parse_mode: 'HTML' }
  );

  ctx.fsm.goto('ask_name');
});

bot.command('back', async (ctx) => {
  const previousStep = ctx.fsm.back();
  if (!previousStep) {
    return ctx.reply('No previous step to return to.');
  }
  await ctx.reply(`Returned to step: <code>${previousStep}</code>`, { parse_mode: 'HTML' });
});

bot.command('profile', async (ctx) => {
  if (!ctx.session.profile?.name) {
    return ctx.reply('You have not registered yet. Use /register to set up your profile.');
  }

  const { name, age, role } = ctx.session.profile;
  await ctx.reply(
    `<b>Profile:</b>\n` +
    `• Name: <b>${name}</b>\n` +
    `• Age: <code>${age}</code>\n` +
    `• Role: <b>${role}</b>`,
    { parse_mode: 'HTML' }
  );
});
