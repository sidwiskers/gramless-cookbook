// Initialize Telegram WebApp
const tg = window.Telegram?.WebApp;
if (tg) {
  tg.ready();
  tg.expand();
}

const scoreInput = document.getElementById('scoreInput');
const submitBtn = document.getElementById('submitBtn');
const submitStatus = document.getElementById('submitStatus');
const leaderboardList = document.getElementById('leaderboardList');
const refreshBtn = document.getElementById('refreshBtn');

// Helper to invoke TGCloud serverless RPC endpoints
async function callEndpoint(name, params = {}) {
  if (tg?.Serverless?.call) {
    return tg.Serverless.call(name, params);
  }
  // Local fallback simulation
  const res = await fetch(`/_rpc/${name}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  return res.json();
}

async function loadLeaderboard() {
  leaderboardList.innerHTML = '<li>Refreshing scores...</li>';
  try {
    const res = await callEndpoint('getLeaderboard');
    const players = res.topPlayers || [];
    if (players.length === 0) {
      leaderboardList.innerHTML = '<li>No scores recorded yet. Be the first!</li>';
      return;
    }
    leaderboardList.innerHTML = players.map(p => `
      <li>
        <span><b>#${p.rank}</b> ${escapeHtml(p.name)}</span>
        <span><b>${p.score.toLocaleString()}</b> pts</span>
      </li>
    `).join('');
  } catch (err) {
    leaderboardList.innerHTML = `<li style="color: red;">Failed to load leaderboard: ${escapeHtml(err.message)}</li>`;
  }
}

submitBtn.addEventListener('click', async () => {
  const score = parseInt(scoreInput.value, 10);
  if (Number.isNaN(score) || score <= 0) {
    submitStatus.textContent = 'Please enter a positive number.';
    submitStatus.style.color = 'orange';
    return;
  }

  submitBtn.disabled = true;
  submitStatus.textContent = 'Submitting score to TGCloud...';
  submitStatus.style.color = '#666';

  try {
    const res = await callEndpoint('submitScore', { score });
    if (res.error) {
      submitStatus.textContent = res.error;
      submitStatus.style.color = 'red';
    } else {
      submitStatus.textContent = `Saved. Rank: #${res.currentRank} (${res.submittedScore} pts)`;
      submitStatus.style.color = 'green';
      scoreInput.value = '';
      await loadLeaderboard();
    }
  } catch (err) {
    submitStatus.textContent = `Error: ${err.message}`;
    submitStatus.style.color = 'red';
  } finally {
    submitBtn.disabled = false;
  }
});

refreshBtn.addEventListener('click', loadLeaderboard);

function escapeHtml(str) {
  return String(str || '').replace(/[&<>"']/g, (m) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[m]);
}

loadLeaderboard();
