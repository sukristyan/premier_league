/* ═══════════════════════════════════════════════════════════════
   Premier League Dashboard — Main JS
   ═══════════════════════════════════════════════════════════════ */

const API = '/api';

// ── State ─────────────────────────────────────────────────────
const state = {
  currentSection: 'standings',
  fixturesTeam: '',
  resultsTeam: '',
  teamsQuery: '',
  squadModalOpen: false,
};

// ── DOM Refs ──────────────────────────────────────────────────
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

// ── Navigation ────────────────────────────────────────────────
function initNav() {
  $$('.nav-item').forEach((item) => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const section = item.dataset.section;
      navigateTo(section);

      // Close mobile sidebar
      $('#sidebar').classList.remove('open');
    });
  });

  // Mobile menu toggle
  $('#menuToggle').addEventListener('click', () => {
    $('#sidebar').classList.toggle('open');
  });

  // Close sidebar on overlay click (mobile)
  document.addEventListener('click', (e) => {
    const sidebar = $('#sidebar');
    if (
      sidebar.classList.contains('open') &&
      !sidebar.contains(e.target) &&
      e.target !== $('#menuToggle')
    ) {
      sidebar.classList.remove('open');
    }
  });
}

function navigateTo(section) {
  state.currentSection = section;

  // Update nav active state
  $$('.nav-item').forEach((item) => {
    item.classList.toggle('active', item.dataset.section === section);
  });

  // Show/hide sections
  $$('.section').forEach((sec) => {
    sec.classList.toggle('active', sec.id === `section-${section}`);
  });

  // Update header
  const titles = {
    standings: ['Standings', '2025/26 Premier League Table'],
    fixtures: ['Fixtures', 'Upcoming Premier League Matches'],
    results: ['Results', 'Recent Premier League Results'],
    scorers: ['Top Scorers', 'Golden Boot Race 2025/26'],
    assists: ['Top Assists', 'Most Assists 2025/26'],
    teams: ['Teams', 'All Premier League Clubs'],
  };

  const [title, subtitle] = titles[section] || ['Dashboard', ''];
  $('#pageTitle').textContent = title;
  $('#pageSubtitle').textContent = subtitle;

  // Load section data
  loadSection(section);
}

// ── Data Loaders ───────────────────────────────────────────────
const loaded = new Set();

async function loadSection(section) {
  // Don't reload sections that haven't changed filters
  if (section === 'standings' && loaded.has('standings')) return;
  if (section === 'scorers' && loaded.has('scorers')) return;
  if (section === 'assists' && loaded.has('assists')) return;

  switch (section) {
    case 'standings': await loadStandings(); break;
    case 'fixtures':  await loadFixtures(); break;
    case 'results':   await loadResults(); break;
    case 'scorers':   await loadTopScorers(); break;
    case 'assists':   await loadTopAssists(); break;
    case 'teams':     await loadTeams(); break;
  }
}

// ── API Fetch Helper ───────────────────────────────────────────
async function fetchAPI(endpoint) {
  const res = await fetch(`${API}${endpoint}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  if (json.status !== 'success') throw new Error(json.message || 'Unknown error');
  return json.data;
}

// ── Format Helpers ─────────────────────────────────────────────
function formatDate(utcDate) {
  const d = new Date(utcDate);
  return d.toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', timeZone: 'UTC',
  });
}

function formatDateShort(utcDate) {
  const d = new Date(utcDate);
  return d.toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short',
    hour: '2-digit', minute: '2-digit', timeZone: 'UTC',
  });
}

function formatDOB(dob) {
  if (!dob) return '—';
  const d = new Date(dob);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function gdClass(gd) {
  if (gd > 0) return 'gd-positive';
  if (gd < 0) return 'gd-negative';
  return 'gd-neutral';
}

function gdText(gd) {
  if (gd > 0) return `+${gd}`;
  return `${gd}`;
}

function getZoneClass(pos) {
  if (pos <= 4) return 'zone-cl';
  if (pos === 5) return 'zone-el';
  if (pos === 6) return 'zone-ecl';
  if (pos >= 18) return 'zone-rel';
  return '';
}

function getPosClass(pos) {
  if (pos <= 4) return 'pos-top';
  if (pos >= 18) return 'pos-rel';
  return '';
}

function positionAbbr(pos) {
  if (!pos) return 'N/A';
  const map = {
    Goalkeeper: 'GK', Goalkeeper_GK: 'GK',
    Defender: 'DF', Centre_Back: 'DF', Left_Back: 'DF', Right_Back: 'DF',
    Midfielder: 'MF', Central_Midfield: 'MF', Defensive_Midfield: 'MF',
    Attacking_Midfield: 'MF', Left_Winger: 'MF', Right_Winger: 'MF',
    Forward: 'FW', Centre_Forward: 'FW',
  };
  const key = pos.replace(/\s+/g, '_');
  return map[key] || pos.slice(0, 2).toUpperCase();
}

function positionClass(pos) {
  const a = positionAbbr(pos);
  if (a === 'GK') return 'GK';
  if (a === 'DF') return 'DF';
  if (a === 'MF') return 'MF';
  if (a === 'FW') return 'FW';
  return '';
}

function crestImg(src, alt, cls) {
  return `<img src="${src || ''}" alt="${alt}" class="${cls}" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 40 40%22><circle cx=%2220%22 cy=%2220%22 r=%2220%22 fill=%22%237C3AED%22/><text x=%2250%25%22 y=%2255%25%22 text-anchor=%22middle%22 dominant-baseline=%22middle%22 fill=%22white%22 font-size=%2216%22 font-family=%22Arial%22>${alt.slice(0, 1)}</text></svg>'" />`;
}

// ── Standings ──────────────────────────────────────────────────
async function loadStandings() {
  const body = $('#standingsBody');
  body.innerHTML = `<div class="skeleton-rows">${Array(20).fill(skeletonRow()).join('')}</div>`;

  try {
    const data = await fetchAPI('/standings');
    loaded.add('standings');

    // Update stats strip
    const leader = data[0];
    const strip = $('#statsStrip');
    strip.innerHTML = `
      <div class="stat-card">
        <div class="stat-value">${leader?.playedGames ?? '—'}</div>
        <div class="stat-label">Matchday</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${leader?.team?.shortName || leader?.team?.name || '—'}</div>
        <div class="stat-label">Leader</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${leader?.points ?? '—'}</div>
        <div class="stat-label">Top Points</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${leader?.goalsFor ?? '—'}</div>
        <div class="stat-label">Leader Goals</div>
      </div>
    `;

    // Build rows
    body.innerHTML = data.map((row) => {
      const form = (row.form || '').split(',').filter(Boolean).slice(-5);
      const formDots = form.map((f) => `<span class="form-dot ${f}">${f}</span>`).join('');
      const zoneClass = getZoneClass(row.position);
      const posClass = getPosClass(row.position);

      return `
        <div class="table-row ${zoneClass}">
          <div class="col-pos ${posClass}">${row.position}</div>
          <div class="col-team">
            ${crestImg(row.team?.crest, row.team?.name || '', 'team-crest')}
            <span class="team-name">${row.team?.name || '—'}</span>
          </div>
          <div class="col-stat">${row.playedGames}</div>
          <div class="col-stat">${row.won}</div>
          <div class="col-stat">${row.draw}</div>
          <div class="col-stat">${row.lost}</div>
          <div class="col-stat">${row.goalsFor}</div>
          <div class="col-stat">${row.goalsAgainst}</div>
          <div class="col-stat ${gdClass(row.goalDifference)}">${gdText(row.goalDifference)}</div>
          <div class="col-pts">${row.points}</div>
          <div class="col-form">${formDots}</div>
        </div>
      `;
    }).join('');

    // Zone legend
    const tableCard = body.closest('.table-card');
    if (!tableCard.querySelector('.zone-legend')) {
      tableCard.insertAdjacentHTML('beforeend', `
        <div class="zone-legend">
          <div class="zone-legend-item"><div class="zone-dot cl"></div> Champions League</div>
          <div class="zone-legend-item"><div class="zone-dot el"></div> Europa League</div>
          <div class="zone-legend-item"><div class="zone-dot ecl"></div> Conference League</div>
          <div class="zone-legend-item"><div class="zone-dot rel"></div> Relegation</div>
        </div>
      `);
    }
  } catch (err) {
    body.innerHTML = errorState('Failed to load standings data.');
    console.error('[Standings]', err);
  }
}

function skeletonRow() {
  return `<div class="skeleton-row">
    <div class="skeleton-cell w-8"></div>
    <div class="skeleton-cell w-40"></div>
    <div class="skeleton-cell w-8"></div>
    <div class="skeleton-cell w-8"></div>
    <div class="skeleton-cell w-8"></div>
    <div class="skeleton-cell w-8"></div>
    <div class="skeleton-cell w-8"></div>
    <div class="skeleton-cell w-8"></div>
    <div class="skeleton-cell w-8"></div>
    <div class="skeleton-cell w-12"></div>
  </div>`;
}

// ── Fixtures ───────────────────────────────────────────────────
async function loadFixtures(teamFilter = '') {
  const list = $('#fixturesList');
  list.innerHTML = loadingState('Loading fixtures...');

  const endpoint = teamFilter
    ? `/fixtures?team=${encodeURIComponent(teamFilter)}`
    : '/fixtures';

  try {
    const data = await fetchAPI(endpoint);

    if (!data.length) {
      list.innerHTML = emptyState('No fixtures found.');
      return;
    }

    list.innerHTML = data.map((match) => matchCard(match, false)).join('');
  } catch (err) {
    list.innerHTML = errorState('Failed to load fixtures.');
    console.error('[Fixtures]', err);
  }
}

// ── Results ────────────────────────────────────────────────────
async function loadResults(teamFilter = '') {
  const list = $('#resultsList');
  list.innerHTML = loadingState('Loading results...');

  const endpoint = teamFilter
    ? `/results?team=${encodeURIComponent(teamFilter)}`
    : '/results';

  try {
    const data = await fetchAPI(endpoint);

    if (!data.length) {
      list.innerHTML = emptyState('No results found.');
      return;
    }

    list.innerHTML = data.map((match) => matchCard(match, true)).join('');
  } catch (err) {
    list.innerHTML = errorState('Failed to load results.');
    console.error('[Results]', err);
  }
}

function matchCard(match, isResult) {
  const home = match.homeTeam;
  const away = match.awayTeam;
  const score = match.score?.fullTime;
  const hasScore = score && (score.home !== null || score.away !== null);

  const scoreHtml = hasScore
    ? `<div class="match-score">${score.home ?? '?'} – ${score.away ?? '?'}</div>`
    : `<div class="match-vs-text">VS</div>`;

  const statusClass = isResult ? 'finished' : 'scheduled';
  const statusText = isResult ? 'Full Time' : formatDateShort(match.utcDate);

  return `
    <div class="match-card">
      <div class="match-date">${formatDate(match.utcDate)}</div>
      <div class="match-teams">
        <div class="match-team">
          ${crestImg(home?.crest, home?.name || '', 'match-team-crest')}
          <div class="match-team-name">${home?.shortName || home?.name || '—'}</div>
        </div>
        <div class="match-vs">
          ${scoreHtml}
        </div>
        <div class="match-team">
          ${crestImg(away?.crest, away?.name || '', 'match-team-crest')}
          <div class="match-team-name">${away?.shortName || away?.name || '—'}</div>
        </div>
      </div>
      <div class="match-status ${statusClass}">${statusText}</div>
      <div class="match-matchday">Matchday ${match.matchday}</div>
    </div>
  `;
}

// ── Top Scorers ────────────────────────────────────────────────
async function loadTopScorers() {
  const list = $('#scorersList');
  list.innerHTML = loadingState('Loading top scorers...');

  try {
    const data = await fetchAPI('/top-scorers');
    loaded.add('scorers');

    if (!data.length) {
      list.innerHTML = emptyState('No scorers data available.');
      return;
    }

    list.innerHTML = data.slice(0, 20).map((item, i) =>
      playerCard(item, i + 1, item.goals ?? 0, 'Goals', item.player?.nationality)
    ).join('');
  } catch (err) {
    list.innerHTML = errorState('Failed to load top scorers.');
    console.error('[TopScorers]', err);
  }
}

// ── Top Assists ────────────────────────────────────────────────
async function loadTopAssists() {
  const list = $('#assistsList');
  list.innerHTML = loadingState('Loading top assists...');

  try {
    const data = await fetchAPI('/top-assists');
    loaded.add('assists');

    if (!data.length) {
      list.innerHTML = emptyState('No assists data available.');
      return;
    }

    list.innerHTML = data.slice(0, 20).map((item, i) =>
      playerCard(item, i + 1, item.assists ?? 0, 'Assists', item.player?.nationality)
    ).join('');
  } catch (err) {
    list.innerHTML = errorState('Failed to load top assists.');
    console.error('[TopAssists]', err);
  }
}

function playerCard(item, rank, statValue, statLabel, nationality) {
  const player = item.player || {};
  const team = item.team || {};
  const rankClass = rank <= 3 ? `rank-${rank}` : '';

  return `
    <div class="player-card">
      <div class="player-rank ${rankClass}">${rank}</div>
      ${crestImg(team.crest, team.name || '', 'player-crest')}
      <div class="player-info">
        <div class="player-name">${player.name || '—'}</div>
        <div class="player-team">${team.name || '—'}</div>
        ${nationality ? `<div class="player-nationality">🌍 ${nationality}</div>` : ''}
      </div>
      <div class="player-stat-badge">
        <div class="player-stat-value">${statValue}</div>
        <div class="player-stat-label">${statLabel}</div>
      </div>
    </div>
  `;
}

// ── Teams ──────────────────────────────────────────────────────
async function loadTeams(teamFilter = '') {
  const list = $('#teamsList');
  list.innerHTML = loadingState('Loading teams...');

  const endpoint = teamFilter
    ? `/teams?team=${encodeURIComponent(teamFilter)}`
    : '/teams';

  try {
    const data = await fetchAPI(endpoint);

    if (!data.length) {
      list.innerHTML = emptyState('No teams found.');
      return;
    }

    list.innerHTML = data.map((team) => teamCard(team)).join('');

    // Attach squad button listeners
    list.querySelectorAll('.team-squad-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.dataset.teamId;
        const crest = btn.dataset.teamCrest;
        const name = btn.dataset.teamName;
        openSquadModal(id, crest, name);
      });
    });
  } catch (err) {
    list.innerHTML = errorState('Failed to load teams.');
    console.error('[Teams]', err);
  }
}

function teamCard(team) {
  const colors = team.clubColors
    ? parseColors(team.clubColors)
    : [];

  const colorSwatches = colors.slice(0, 3).map((c) =>
    `<div class="color-swatch" style="background:${c}" title="${c}"></div>`
  ).join('');

  return `
    <div class="team-card">
      ${crestImg(team.crest, team.name || '', 'team-card-crest')}
      <div class="team-card-name">${team.name || '—'}</div>
      <div class="team-card-short">${team.shortName || ''}</div>
      ${colorSwatches ? `<div class="team-colors">${colorSwatches}</div>` : ''}
      <div class="team-card-meta">
        ${team.venue ? `<div class="team-card-meta-item"><strong>🏟</strong> ${team.venue}</div>` : ''}
        ${team.founded ? `<div class="team-card-meta-item"><strong>📅</strong> Est. ${team.founded}</div>` : ''}
      </div>
      <button class="team-squad-btn"
        data-team-id="${team.id}"
        data-team-crest="${team.crest || ''}"
        data-team-name="${team.name || ''}">
        View Squad
      </button>
    </div>
  `;
}

function parseColors(colorString) {
  // "Red / White" → try to map to CSS colors
  const parts = colorString.split(/\s*[\/,&]\s*/);
  const colorMap = {
    red: '#ef4444', blue: '#3b82f6', white: '#ffffff', black: '#000000',
    yellow: '#fbbf24', green: '#22c55e', purple: '#a855f7', orange: '#f97316',
    navy: '#1e3a5f', 'sky blue': '#38bdf8', amber: '#f59e0b', maroon: '#9b1c1c',
    claret: '#7f1d1d', gold: '#d97706',
  };
  return parts.map((p) => colorMap[p.trim().toLowerCase()] || p.trim()).filter(Boolean);
}

// ── Squad Modal ────────────────────────────────────────────────
async function openSquadModal(teamId, crest, teamName) {
  const modal = $('#squadModal');
  const squadBody = $('#squadBody');
  const modalCrest = $('#modalTeamCrest');
  const modalName = $('#modalTeamName');
  const modalCoach = $('#modalCoach');

  modalCrest.src = crest;
  modalCrest.alt = teamName;
  modalName.textContent = teamName;
  modalCoach.textContent = 'Coach: Loading...';
  squadBody.innerHTML = `<div class="loading-state" style="padding:40px"><div class="spinner"></div><p>Loading squad...</p></div>`;

  modal.classList.add('open');
  document.body.style.overflow = 'hidden';

  try {
    const res = await fetch(`${API}/squad/${teamId}`);
    const json = await res.json();

    if (json.status !== 'success') throw new Error(json.message);

    modalCoach.textContent = `Coach: ${json.coach || 'Unknown'}`;

    const squad = json.data || [];
    const grouped = groupByPosition(squad);
    const posOrder = ['Goalkeeper', 'Defender', 'Midfielder', 'Forward'];

    if (!squad.length) {
      squadBody.innerHTML = `<div class="loading-state"><p>No squad data available.</p></div>`;
      return;
    }

    squadBody.innerHTML = posOrder.flatMap((pos) => {
      const players = grouped[pos] || [];
      if (!players.length) return [];
      return players.map((p, idx) => {
        const abbr = positionAbbr(p.position);
        const cls = positionClass(p.position);
        return `
          <div class="squad-row">
            <div class="squad-number">${p.shirtNumber !== 'N/A' ? p.shirtNumber : '—'}</div>
            <div class="squad-name">${p.name}</div>
            <div class="squad-position"><span class="position-badge ${cls}">${abbr}</span></div>
            <div class="squad-nationality">${p.nationality || '—'}</div>
            <div class="squad-dob">${formatDOB(p.dateOfBirth)}</div>
          </div>
        `;
      });
    }).join('');

  } catch (err) {
    squadBody.innerHTML = `<div class="error-state"><div class="error-icon">⚠️</div><h3>Failed to load squad</h3><p>${err.message}</p></div>`;
    console.error('[Squad]', err);
  }
}

function groupByPosition(players) {
  const groups = {};
  players.forEach((p) => {
    const pos = p.position || 'Unknown';
    const group = pos.includes('Goalkeeper') ? 'Goalkeeper'
      : pos.includes('Defender') || pos.includes('Back') ? 'Defender'
      : pos.includes('Midfielder') || pos.includes('Winger') ? 'Midfielder'
      : pos.includes('Forward') || pos.includes('Centre_Forward') ? 'Forward'
      : 'Unknown';
    if (!groups[group]) groups[group] = [];
    groups[group].push(p);
  });
  return groups;
}

function closeSquadModal() {
  const modal = $('#squadModal');
  modal.classList.remove('open');
  document.body.style.overflow = '';
}

// ── Filters / Toolbar ──────────────────────────────────────────
function initFilters() {
  // Fixtures filter
  $('#fixturesFilterBtn').addEventListener('click', () => {
    state.fixturesTeam = $('#fixturesTeamFilter').value.trim();
    loadFixtures(state.fixturesTeam);
  });

  $('#fixturesTeamFilter').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') $('#fixturesFilterBtn').click();
  });

  $('#fixturesClearBtn').addEventListener('click', () => {
    $('#fixturesTeamFilter').value = '';
    state.fixturesTeam = '';
    loadFixtures();
  });

  // Results filter
  $('#resultsFilterBtn').addEventListener('click', () => {
    state.resultsTeam = $('#resultsTeamFilter').value.trim();
    loadResults(state.resultsTeam);
  });

  $('#resultsTeamFilter').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') $('#resultsFilterBtn').click();
  });

  $('#resultsClearBtn').addEventListener('click', () => {
    $('#resultsTeamFilter').value = '';
    state.resultsTeam = '';
    loadResults();
  });

  // Teams filter
  $('#teamsFilterBtn').addEventListener('click', () => {
    state.teamsQuery = $('#teamsTeamFilter').value.trim();
    loadTeams(state.teamsQuery);
  });

  $('#teamsTeamFilter').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') $('#teamsFilterBtn').click();
  });

  $('#teamsClearBtn').addEventListener('click', () => {
    $('#teamsTeamFilter').value = '';
    state.teamsQuery = '';
    loadTeams();
  });
}

// ── Modal Events ───────────────────────────────────────────────
function initModal() {
  $('#modalClose').addEventListener('click', closeSquadModal);

  $('#squadModal').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeSquadModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeSquadModal();
  });
}

// ── State Templates ────────────────────────────────────────────
function loadingState(msg = 'Loading...') {
  return `<div class="loading-state"><div class="spinner"></div><p>${msg}</p></div>`;
}

function emptyState(msg = 'No data found.') {
  return `<div class="loading-state"><div style="font-size:32px;opacity:0.3">📭</div><p>${msg}</p></div>`;
}

function errorState(msg = 'Something went wrong.') {
  return `<div class="error-state"><div class="error-icon">⚠️</div><h3>Error</h3><p>${msg}</p></div>`;
}

// ── Boot ───────────────────────────────────────────────────────
function init() {
  initNav();
  initFilters();
  initModal();

  // Load initial section
  loadSection('standings');

  // Pre-load fixtures and results in background after initial load
  setTimeout(() => {
    loadFixtures();
    loadResults();
    loadTeams();
  }, 600);
}

init();
