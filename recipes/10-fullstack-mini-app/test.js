import test from 'node:test';
import assert from 'node:assert/strict';
import { createLab } from 'gramless/testkit';
import { bot } from './tgcloud/lib/bot.js';

test('Recipe 10: bot sets MenuButton and handles game_completed web_app submission', async () => {
  const lab = createLab(bot);
  const player = lab.actor({ id: 888, first_name: 'Jordan' });

  // 1. /start sets menu button
  const startExp = await player.command('/start');
  startExp.wantSent('Tap the button below or the persistent menu button');

  const menuCall = lab.api.calls.find(c => c.method === 'setChatMenuButton');
  assert.ok(menuCall);
  assert.equal(menuCall.params.menu_button.text, 'Play Game 🎮');

  // 2. Player finishes game and sends web_app_data
  const returnExp = await player.sendWebAppData({ action: 'game_completed', score: 250 });
  returnExp.wantSent('You finished the game with <b>250 points</b>!');
});
