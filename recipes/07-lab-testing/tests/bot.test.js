import test from 'node:test';
import assert from 'node:assert/strict';
import { createLab, Sent, Edited, Answered } from 'gramless/testkit';
import { createTestBot } from '../bot.js';

test('Lab: full conversation, button click, and session mutation test', async () => {
  const bot = createTestBot();
  const lab = createLab(bot);
  const alice = lab.user(101, 'Alice');

  // 1. User sends /start
  const r1 = await alice.command('/start');
  r1.want(Sent('Welcome Alice!'));
  assert.equal(r1.calls.length, 1);

  // 2. User clicks "View Counter"
  const r2 = await alice.click('action:view');
  r2.want(Answered());
  r2.want(Edited('Current count: 0'));

  // 3. User clicks "+1 Increment"
  const r3 = await alice.click('action:inc');
  r3.want(Answered('Incremented!'));
  r3.want(Edited('Current count: 1'));

  // 4. User clicks "+1 Increment" again (verifying session persistence)
  const r4 = await alice.click('action:inc');
  r4.want(Answered('Incremented!'));
  r4.want(Edited('Current count: 2'));

  // 5. User clicks "Reset"
  const r5 = await alice.click('action:reset');
  r5.want(Answered());
  r5.want(Edited('Current count: 0'));
});

test('Lab: multiple isolated users maintain distinct sessions', async () => {
  const bot = createTestBot();
  const lab = createLab(bot);
  const alice = lab.user(101, 'Alice');
  const bob = lab.user(202, 'Bob');

  // Alice increments twice
  await alice.command('/start');
  await alice.click('action:inc');
  const rAlice = await alice.click('action:inc');
  rAlice.want(Edited('Current count: 2'));

  // Bob sends /start and views counter (should be 0, isolated from Alice)
  await bob.command('/start');
  const rBob = await bob.click('action:view');
  rBob.want(Edited('Current count: 0'));
});
