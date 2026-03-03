// ============================================================
// Fantasy Football League Website - Main Application
// ============================================================
let DATA = null;
const MGR_SLUGS = {};
const SLUG_TO_MGR = {};

// ============================================================
// DATA LOADING
// ============================================================
async function loadData() {
    const resp = await fetch('data.json');
    DATA = await resp.json();
    
    // Build slug maps
    DATA.managers.forEach(m => {
        const slug = m.toLowerCase().replace(/\s+/g, '-');
        MGR_SLUGS[m] = slug;
        SLUG_TO_MGR[slug] = m;
    });
    
    buildManagerDropdown();
    handleRoute();
}

function buildManagerDropdown() {
    const dd = document.getElementById('manager-dropdown');
    const mobile = document.getElementById('mobile-manager-links');
    DATA.managers.forEach(m => {
        const slug = MGR_SLUGS[m];
        const a = document.createElement('a');
        a.href = '#';
        a.textContent = m;
        a.onclick = (e) => { e.preventDefault(); navigateTo('manager', slug); };
        dd.appendChild(a);
        
        const a2 = a.cloneNode(true);
        a2.onclick = (e) => { e.preventDefault(); navigateTo('manager', slug); };
        mobile.appendChild(a2);
    });
}

// ============================================================
// ROUTING
// ============================================================
function navigateTo(page, param) {
    const hash = param ? `#${page}/${param}` : `#${page}`;
    window.location.hash = hash;
}

function handleRoute() {
    const hash = window.location.hash.slice(1) || 'home';
    const parts = hash.split('/');
    const page = parts[0];
    const param = parts[1] || null;
    
    // Update active nav
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    const activeLink = document.querySelector(`.nav-link[data-page="${page}"]`);
    if (activeLink) activeLink.classList.add('active');
    
    // Close mobile menu
    document.getElementById('mobile-nav').classList.remove('show');
    
    const content = document.getElementById('content');
    window.scrollTo(0, 0);
    
    switch(page) {
        case 'home': renderHome(content); break;
        case 'alltime': renderAllTime(content); break;
        case 'manager': renderManager(content, param); break;
        case 'leagueleaders': renderLeagueLeaders(content, param); break;
        case 'luck': renderLuck(content); break;
        case 'players': renderPlayers(content); break;
        default: renderHome(content);
    }
}

window.addEventListener('hashchange', handleRoute);

function toggleMobileMenu() {
    document.getElementById('mobile-nav').classList.toggle('show');
}

// ============================================================
// UTILITY FUNCTIONS
// ============================================================
function fmt(v, decimals = 2) {
    if (v === null || v === undefined || v === '') return '—';
    if (typeof v === 'number') return v.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
    return v;
}

function fmtInt(v) {
    if (v === null || v === undefined || v === '') return '—';
    if (typeof v === 'number') return Math.round(v).toLocaleString();
    return v;
}

function esc(s) {
    if (s === null || s === undefined) return '';
    const div = document.createElement('div');
    div.textContent = String(s);
    return div.innerHTML;
}

function makeTable(headers, rows, options = {}) {
    const id = options.id || 'table-' + Math.random().toString(36).slice(2, 8);
    let html = `<div class="table-container"><table id="${id}"><thead><tr>`;
    headers.forEach((h, i) => {
        const cls = options.colClasses && options.colClasses[i] ? options.colClasses[i] : '';
        html += `<th class="${cls}" onclick="sortTable('${id}', ${i})">${esc(h)} <span class="sort-arrow">▲▼</span></th>`;
    });
    html += '</tr></thead><tbody>';
    rows.forEach((row, ri) => {
        html += '<tr>';
        row.forEach((cell, ci) => {
            const cls = options.colClasses && options.colClasses[ci] ? options.colClasses[ci] : '';
            const rankCls = ci === 0 && options.ranked ? `rank-cell ${ri < 3 ? 'rank-' + (ri+1) : ''}` : '';
            html += `<td class="${cls} ${rankCls}">${typeof cell === 'number' ? fmt(cell) : esc(cell)}</td>`;
        });
        html += '</tr>';
    });
    html += '</tbody></table></div>';
    return html;
}

function sortTable(tableId, colIdx) {
    const table = document.getElementById(tableId);
    if (!table) return;
    const tbody = table.querySelector('tbody');
    const rows = Array.from(tbody.querySelectorAll('tr'));
    const th = table.querySelectorAll('thead th')[colIdx];
    
    // Determine sort direction
    const currentDir = th.getAttribute('data-sort-dir') || 'none';
    const newDir = currentDir === 'asc' ? 'desc' : 'asc';
    
    // Reset all headers
    table.querySelectorAll('thead th').forEach(h => {
        h.classList.remove('sorted');
        h.removeAttribute('data-sort-dir');
    });
    th.classList.add('sorted');
    th.setAttribute('data-sort-dir', newDir);
    
    rows.sort((a, b) => {
        let va = a.cells[colIdx].textContent.trim();
        let vb = b.cells[colIdx].textContent.trim();
        
        // Try numeric sort
        const na = parseFloat(va.replace(/,/g, ''));
        const nb = parseFloat(vb.replace(/,/g, ''));
        
        if (!isNaN(na) && !isNaN(nb)) {
            return newDir === 'asc' ? na - nb : nb - na;
        }
        
        // String sort
        return newDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
    });
    
    rows.forEach(r => tbody.appendChild(r));
}

function getInitials(name) {
    return name.split(' ').map(w => w[0]).join('').toUpperCase();
}

// ============================================================
// HOME PAGE
// ============================================================
function renderHome(el) {
    const winners = DATA.boz_cup_winners;
    const years = Object.keys(winners).map(Number).sort();
    
    // Count championships per manager
    const champCounts = {};
    years.forEach(y => {
        const champ = winners[y].champion;
        champCounts[champ] = (champCounts[champ] || 0) + 1;
    });
    const champRanking = Object.entries(champCounts).sort((a, b) => b[1] - a[1]);
    
    let html = `
        <div class="hero">
            <h1>🏈 Fantasy Football League</h1>
            <p>24 Seasons of Competition &bull; 2002 – 2025</p>
        </div>
    `;
    
    // Championship Counts
    html += `<div class="section-header"><span class="icon">🏆</span><h2>Boz Cup Championships</h2></div>`;
    html += `<div class="stats-grid">`;
    champRanking.forEach(([mgr, count]) => {
        html += `<div class="stat-card" style="cursor:pointer" onclick="navigateTo('manager','${MGR_SLUGS[mgr]}')">
            <div class="stat-value">${count}</div>
            <div class="stat-label">${esc(mgr)}</div>
        </div>`;
    });
    html += `</div>`;
    
    // Boz Cup Timeline
    html += `<div class="section-header"><span class="icon">📅</span><h2>Boz Cup Winners by Year</h2></div>`;
    const playoffs = DATA.playoff_winners || {};
    const seeds = DATA.number_one_seeds || {};
    html += `<div class="timeline">`;
    for (let y = 2002; y <= 2025; y++) {
        const w = winners[y];
        const p = playoffs[y];
        const s = seeds[y];
        if (w) {
            let extra = '';
            if (p && p.champion !== w.champion) extra = `<span class="timeline-extra">Playoff Champ: ${esc(p.champion)}</span>`;
            if (s && s.manager !== w.champion) extra = `<span class="timeline-extra">#1 Seed: ${esc(s.manager)}</span>`;
            html += `<div class="timeline-item">
                <span class="timeline-year">${y}</span>
                <span class="timeline-champ">${esc(w.champion)}</span>
                ${extra}
            </div>`;
        } else {
            html += `<div class="timeline-item" style="opacity:0.4">
                <span class="timeline-year">${y}</span>
                <span class="timeline-champ">—</span>
            </div>`;
        }
    }
    html += `</div>`;
    
    // All-Time Standings Summary
    html += `<div class="section-header"><span class="icon">📊</span><h2>All-Time Standings</h2></div>`;
    html += `<div class="card-grid">`;
    
    // Records card
    html += `<div class="card"><h3>📋 Win-Loss Records</h3>`;
    html += makeTable(['#', 'Manager', 'Record'], 
        DATA.records.map(r => [r.rank, r.name, r.record]),
        { ranked: true }
    );
    html += `</div>`;
    
    // Points For card
    html += `<div class="card"><h3>🎯 Total Points For</h3>`;
    html += makeTable(['#', 'Manager', 'Points'],
        DATA.points_for.map(r => [r.rank, r.name, r.points]),
        { ranked: true, colClasses: ['', '', 'number'] }
    );
    html += `</div>`;
    
    // Points Against card
    html += `<div class="card"><h3>🛡️ Total Points Against</h3>`;
    html += makeTable(['#', 'Manager', 'Points'],
        DATA.points_against.map(r => [r.rank, r.name, r.points]),
        { ranked: true, colClasses: ['', '', 'number'] }
    );
    html += `</div>`;
    
    html += `</div>`;
    
    // Manager Quick Links
    html += `<div class="section-header"><span class="icon">👤</span><h2>Managers</h2></div>`;
    html += `<div class="card-grid">`;
    DATA.managers.forEach(m => {
        const rec = DATA.records.find(r => r.name === m);
        const pf = DATA.points_for.find(r => r.name === m);
        const champs = champCounts[m] || 0;
        html += `<div class="manager-link" onclick="navigateTo('manager','${MGR_SLUGS[m]}')">
            <div class="name">${esc(m)}</div>
            <div class="record">${rec ? rec.record : '—'} &bull; ${pf ? fmt(pf.points, 2) + ' pts' : ''} &bull; ${champs} title${champs !== 1 ? 's' : ''}</div>
        </div>`;
    });
    html += `</div>`;
    
    // Weekly Win Leaders
    html += `<div class="section-header"><span class="icon">🏅</span><h2>Total Weekly High Scores</h2></div>`;
    const winsArr = Object.entries(DATA.total_weekly_wins)
        .filter(([k]) => DATA.managers.includes(k))
        .sort((a, b) => b[1] - a[1]);
    html += makeTable(['#', 'Manager', 'Weekly Wins'],
        winsArr.map(([name, wins], i) => [i + 1, name, wins]),
        { ranked: true, colClasses: ['', '', 'number'] }
    );
    
    el.innerHTML = html;
}

// ============================================================
// ALL-TIME STATS PAGE
// ============================================================
function renderAllTime(el) {
    let html = `<div class="section-header"><span class="icon">📊</span><h2>All-Time Statistics</h2></div>`;
    
    // Tabs
    html += `<div class="tabs">
        <button class="tab-btn active" onclick="showAllTimeTab('records')">Records</button>
        <button class="tab-btn" onclick="showAllTimeTab('usage')">Player Usage</button>
        <button class="tab-btn" onclick="showAllTimeTab('luck')">Luck Index</button>
    </div>`;
    
    html += `<div id="alltime-records">`;
    
    // Combined standings table
    html += `<div class="section-header" style="border:none;margin-top:0"><h2>Combined Standings</h2></div>`;
    const combined = DATA.managers.map(m => {
        const rec = DATA.records.find(r => r.name === m) || {};
        const pf = DATA.points_for.find(r => r.name === m) || {};
        const pa = DATA.points_against.find(r => r.name === m) || {};
        const luck = DATA.luck_alltime.find(r => m.startsWith(r.manager) || m.includes(r.manager)) || {};
        const wins = DATA.total_weekly_wins[m] || 0;
        return {
            name: m,
            record: rec.record || '—',
            winRank: rec.rank || 99,
            pf: pf.points || 0,
            pa: pa.points || 0,
            weeklyWins: wins,
            luck: luck.luck_number || 0
        };
    }).sort((a, b) => a.winRank - b.winRank);
    
    html += makeTable(
        ['#', 'Manager', 'Record', 'Points For', 'Points Against', 'Weekly Wins', 'Luck Index'],
        combined.map((r, i) => [i + 1, r.name, r.record, r.pf, r.pa, r.weeklyWins, r.luck]),
        { ranked: true, colClasses: ['', '', '', 'number', 'number', 'number', 'number'] }
    );
    html += `</div>`;
    
    html += `<div id="alltime-usage" style="display:none">`;
    // Player usage by position
    Object.entries(DATA.player_usage).forEach(([pos, players]) => {
        html += `<div class="section-header" style="border:none"><h2>${esc(pos)}</h2></div>`;
        html += makeTable(
            ['#', 'Player', 'Starts', 'Points', 'Avg'],
            players.map(p => [p.rank, p.player, p.starts, p.points, p.avg]),
            { ranked: true, colClasses: ['', '', 'number', 'number', 'number'] }
        );
    });
    html += `</div>`;
    
    html += `<div id="alltime-luck" style="display:none">`;
    html += `<div class="section-header" style="border:none"><h2>All-Time Luck Index</h2></div>`;
    html += `<p style="color:#888;margin-bottom:1rem;">The Luck Index measures the difference between normalized wins (based on scoring rank each week) and actual wins. Positive = lucky (won more than expected), Negative = unlucky.</p>`;
    html += makeTable(
        ['Manager', 'Normalized Wins', 'Actual Wins', 'Luck Number'],
        DATA.luck_alltime.map(r => [r.manager, r.normalized_wins, r.actual_wins, r.luck_number]),
        { colClasses: ['', 'number', 'number', 'number'] }
    );
    
    // Visual luck bars
    html += `<div style="margin-top:2rem">`;
    const maxLuck = Math.max(...DATA.luck_alltime.map(r => Math.abs(r.luck_number)));
    DATA.luck_alltime.sort((a, b) => b.luck_number - a.luck_number).forEach(r => {
        const pct = (Math.abs(r.luck_number) / maxLuck) * 50;
        const isPos = r.luck_number >= 0;
        html += `<div style="display:flex;align-items:center;margin:0.5rem 0;gap:1rem">
            <div style="width:100px;text-align:right;font-weight:600;color:#adb5bd">${esc(r.manager)}</div>
            <div class="luck-bar-container" style="flex:1">
                <div class="luck-bar ${isPos ? 'luck-positive' : 'luck-negative'}" 
                     style="width:${pct}%;${!isPos ? 'margin-left:auto' : ''}"></div>
                <span class="luck-label" style="${isPos ? 'left:8px;right:auto' : ''}">${r.luck_number > 0 ? '+' : ''}${fmt(r.luck_number)}</span>
            </div>
        </div>`;
    });
    html += `</div></div>`;
    
    el.innerHTML = html;
}

function showAllTimeTab(tab) {
    ['records', 'usage', 'luck'].forEach(t => {
        const el = document.getElementById(`alltime-${t}`);
        if (el) el.style.display = t === tab ? 'block' : 'none';
    });
    document.querySelectorAll('.tabs .tab-btn').forEach(b => {
        b.classList.toggle('active', b.textContent.toLowerCase().includes(tab.slice(0, 4)));
    });
}

// ============================================================
// MANAGER PAGE
// ============================================================
function renderManager(el, slug) {
    const name = SLUG_TO_MGR[slug];
    if (!name) { el.innerHTML = '<p>Manager not found.</p>'; return; }
    
    const rec = DATA.records.find(r => r.name === name) || {};
    const pf = DATA.points_for.find(r => r.name === name) || {};
    const pa = DATA.points_against.find(r => r.name === name) || {};
    const wins = DATA.total_weekly_wins[name] || 0;
    const luck = DATA.luck_alltime.find(r => name.startsWith(r.manager) || name.includes(r.manager)) || {};
    const capsule = DATA.manager_capsules[name] || {};
    const champCount = Object.values(DATA.boz_cup_winners).filter(w => w.champion === name).length;
    const champYears = Object.entries(DATA.boz_cup_winners).filter(([y, w]) => w.champion === name).map(([y]) => y);
    const hardware = DATA.hardware_by_manager[name] || [];
    const playoffWins = hardware.filter(h => h.type === 'Playoffs');
    const seedWins = hardware.filter(h => h.type === '#1 Seed');
    
    let html = `
        <div class="manager-profile">
            <div class="manager-avatar">${getInitials(name)}</div>
            <div class="manager-info">
                <h1>${esc(name)}</h1>
                <div class="subtitle">${rec.record || '—'} &bull; ${champCount} Boz Cup${champCount !== 1 ? 's' : ''} ${champYears.length ? '(' + champYears.join(', ') + ')' : ''}</div>
            </div>
        </div>
    `;
    
    // Quick Stats
    html += `<div class="stats-grid">
        <div class="stat-card"><div class="stat-value">${rec.record || '—'}</div><div class="stat-label">Overall Record</div></div>
        <div class="stat-card"><div class="stat-value">${pf.points ? fmt(pf.points) : '—'}</div><div class="stat-label">Total Points For</div></div>
        <div class="stat-card"><div class="stat-value">${pa.points ? fmt(pa.points) : '—'}</div><div class="stat-label">Total Points Against</div></div>
        <div class="stat-card"><div class="stat-value">${wins}</div><div class="stat-label">Weekly High Scores</div></div>
        <div class="stat-card"><div class="stat-value">${champCount}</div><div class="stat-label">Boz Cups</div></div>
        <div class="stat-card"><div class="stat-value">${luck.luck_number !== undefined ? (luck.luck_number > 0 ? '+' : '') + fmt(luck.luck_number) : '—'}</div><div class="stat-label">Luck Index</div></div>
    </div>`;
    
    // Hardware section
    if (hardware.length > 0) {
        html += `<div class="section-header"><span class="icon">🏆</span><h2>Hardware</h2></div>`;
        html += `<div class="hardware-list">`;
        hardware.forEach(h => {
            let icon = '🏆';
            if (h.type === 'Playoffs') icon = '🥇';
            if (h.type === '#1 Seed') icon = '🥇';
            html += `<div class="hardware-item"><span class="hw-icon">${icon}</span><span class="hw-year">${h.year}</span><span class="hw-type">${esc(h.type)}</span></div>`;
        });
        html += `</div>`;
    }
    
    // Season-by-Season Position Scoring
    if (capsule.QB) {
        html += `<div class="section-header"><span class="icon">📈</span><h2>Season-by-Season Scoring</h2></div>`;
        const positions = ['QB', 'RB', 'WR', 'TE', 'K', 'D', 'Total'];
        const years = [];
        // Collect all years across positions
        positions.forEach(pos => {
            if (capsule[pos]) Object.keys(capsule[pos]).forEach(y => { if (!years.includes(y)) years.push(y); });
        });
        years.sort();
        
        const headers = ['Year', ...positions];
        const rows = years.map(y => {
            const row = [y];
            positions.forEach(pos => {
                row.push(capsule[pos] && capsule[pos][y] !== undefined ? capsule[pos][y] : '—');
            });
            return row;
        });
        
        html += makeTable(headers, rows, { colClasses: ['', 'number', 'number', 'number', 'number', 'number', 'number', 'number'] });
    }
    
    // Season Records
    if (capsule.records) {
        html += `<div class="section-header"><span class="icon">📋</span><h2>Season Records</h2></div>`;
        const recYears = Object.keys(capsule.records).sort();
        html += makeTable(['Year', 'Record & Finish'],
            recYears.map(y => [y, capsule.records[y]]),
            {}
        );
    }
    
    // Player Usage for this manager
    const usageKey = Object.keys(DATA.player_usage_per_manager).find(k => k === name);
    if (usageKey) {
        const usage = DATA.player_usage_per_manager[usageKey];
        html += `<div class="section-header"><span class="icon">🎮</span><h2>Most-Used Players (All-Time)</h2></div>`;
        
        // Group by position
        const byPos = {};
        usage.forEach(u => {
            if (!byPos[u.position]) byPos[u.position] = [];
            byPos[u.position].push(u);
        });
        
        html += `<div class="tabs" id="mgr-pos-tabs">`;
        html += `<button class="tab-btn active" onclick="showMgrPosTab('all')">All</button>`;
        Object.keys(byPos).forEach(pos => {
            html += `<button class="tab-btn" onclick="showMgrPosTab('${pos}')">${esc(pos)}</button>`;
        });
        html += `</div>`;
        
        html += `<div id="mgr-pos-all">`;
        html += makeTable(
            ['#', 'Player', 'Position', 'Starts', 'Points', 'Avg'],
            usage.slice(0, 50).map(u => [u.rank, u.player, u.position, u.starts, u.points, u.avg]),
            { ranked: true, colClasses: ['', '', '', 'number', 'number', 'number'] }
        );
        html += `</div>`;
        
        Object.entries(byPos).forEach(([pos, players]) => {
            html += `<div id="mgr-pos-${pos}" style="display:none">`;
            html += makeTable(
                ['#', 'Player', 'Starts', 'Points', 'Avg'],
                players.map((p, i) => [i + 1, p.player, p.starts, p.points, p.avg]),
                { ranked: true, colClasses: ['', '', 'number', 'number', 'number'] }
            );
            html += `</div>`;
        });
    }
    
    // League Leaders appearances for this manager
    html += renderManagerLeagueLeaders(name);
    
    el.innerHTML = html;
}

function showMgrPosTab(pos) {
    // Hide all position divs
    document.querySelectorAll('[id^="mgr-pos-"]').forEach(d => d.style.display = 'none');
    document.getElementById(`mgr-pos-${pos}`).style.display = 'block';
    document.querySelectorAll('#mgr-pos-tabs .tab-btn').forEach(b => {
        b.classList.toggle('active', b.textContent === (pos === 'all' ? 'All' : pos));
    });
}

function renderManagerLeagueLeaders(name) {
    let html = `<div class="section-header"><span class="icon">📊</span><h2>Yearly Stats</h2></div>`;
    
    const yearsWithData = [];
    Object.entries(DATA.league_leaders_years).forEach(([year, ld]) => {
        if (ld.manager_stats) {
            // Find matching manager name in the sheets
            const matchKey = Object.keys(ld.manager_stats).find(k => {
                const kl = k.toLowerCase();
                const nl = name.toLowerCase();
                return nl.includes(kl) || kl.includes(nl.split(' ')[0].toLowerCase());
            });
            if (matchKey && ld.manager_stats[matchKey].length > 0) {
                yearsWithData.push({ year, key: matchKey, stats: ld.manager_stats[matchKey] });
            }
        }
    });
    
    if (yearsWithData.length === 0) {
        html += `<p style="color:#888">No yearly breakdown data available.</p>`;
        return html;
    }
    
    // Year selector
    html += `<select class="year-select" onchange="showManagerYear(this.value, '${name.replace(/'/g, "\\'")}')">`;
    yearsWithData.forEach(yd => {
        html += `<option value="${yd.year}">${yd.year}</option>`;
    });
    html += `</select>`;
    
    yearsWithData.forEach((yd, idx) => {
        html += `<div class="manager-year-data" id="mgr-year-${yd.year}" style="${idx > 0 ? 'display:none' : ''}">`;
        html += makeTable(
            ['Player', 'Games', 'Points', 'Avg'],
            yd.stats.map(s => [s.player, s.games, s.points, s.avg]),
            { colClasses: ['', 'number', 'number', 'number'] }
        );
        html += `</div>`;
    });
    
    return html;
}

function showManagerYear(year, name) {
    document.querySelectorAll('.manager-year-data').forEach(d => d.style.display = 'none');
    const el = document.getElementById(`mgr-year-${year}`);
    if (el) el.style.display = 'block';
}

// ============================================================
// LEAGUE LEADERS PAGE
// ============================================================
function renderLeagueLeaders(el, selectedYear) {
    const years = Object.keys(DATA.league_leaders_years).sort().reverse();
    const currentYear = selectedYear || years[0];
    
    let html = `<div class="section-header"><span class="icon">🏅</span><h2>League Leaders</h2></div>`;
    
    // Year tabs
    html += `<div class="tabs">`;
    years.forEach(y => {
        html += `<button class="tab-btn ${y === currentYear ? 'active' : ''}" onclick="navigateTo('leagueleaders','${y}')">${y}</button>`;
    });
    html += `</div>`;
    
    const yearData = DATA.league_leaders_years[currentYear];
    if (!yearData) {
        html += '<p style="color:#888">No data available for this year.</p>';
        el.innerHTML = html;
        return;
    }
    
    // League Leaders (position leaders)
    if (yearData.league_leaders && yearData.league_leaders.length > 0) {
        html += `<div class="section-header" style="border:none"><h2>Position Leaders – ${currentYear}</h2></div>`;
        html += makeTable(
            ['#', 'QB', 'QB Avg', 'RB', 'RB Avg', 'WR', 'WR Avg'],
            yearData.league_leaders.map(r => [r.rank, r.qb, r.qb_avg, r.rb, r.rb_avg, r.wr, r.wr_avg]),
            { ranked: true, colClasses: ['', '', 'number', '', 'number', '', 'number'] }
        );
    }
    
    // Team Leaders (points for/against)
    if (yearData.team_leaders && yearData.team_leaders.length > 0) {
        html += `<div class="section-header" style="border:none"><h2>Team Standings – ${currentYear}</h2></div>`;
        html += makeTable(
            ['#', 'Team (PF)', 'Avg PF', 'Team (PA)', 'Avg PA'],
            yearData.team_leaders.map(r => [r.rank, r.team_pf || '', r.pf_avg, r.team_pa || '', r.pa_avg]),
            { ranked: true, colClasses: ['', '', 'number', '', 'number'] }
        );
    }
    
    // Per-manager stats for that year
    if (yearData.manager_stats && Object.keys(yearData.manager_stats).length > 0) {
        html += `<div class="section-header" style="border:none"><h2>Manager Rosters – ${currentYear}</h2></div>`;
        
        html += `<div class="tabs" id="ll-mgr-tabs">`;
        const mgrs = Object.keys(yearData.manager_stats);
        mgrs.forEach((m, i) => {
            html += `<button class="tab-btn ${i === 0 ? 'active' : ''}" onclick="showLLManager('${m.replace(/'/g, "\\'")}')">${esc(m)}</button>`;
        });
        html += `</div>`;
        
        mgrs.forEach((m, i) => {
            html += `<div class="ll-mgr-data" id="ll-mgr-${m.replace(/\s+/g, '-')}" style="${i > 0 ? 'display:none' : ''}">`;
            html += makeTable(
                ['Player', 'Games', 'Points', 'Avg'],
                yearData.manager_stats[m].map(s => [s.player, s.games, s.points, s.avg]),
                { colClasses: ['', 'number', 'number', 'number'] }
            );
            html += `</div>`;
        });
    }
    
    el.innerHTML = html;
}

function showLLManager(name) {
    document.querySelectorAll('.ll-mgr-data').forEach(d => d.style.display = 'none');
    const el = document.getElementById(`ll-mgr-${name.replace(/\s+/g, '-')}`);
    if (el) el.style.display = 'block';
    document.querySelectorAll('#ll-mgr-tabs .tab-btn').forEach(b => {
        b.classList.toggle('active', b.textContent === name);
    });
}

// ============================================================
// LUCK INDEX PAGE
// ============================================================
function renderLuck(el) {
    let html = `<div class="section-header"><span class="icon">🍀</span><h2>Luck Index</h2></div>`;
    html += `<p style="color:#888;margin-bottom:1.5rem;">The Luck Index measures the difference between "normalized wins" (how many wins a manager <em>should</em> have based on weekly scoring rank) and actual wins. Positive = lucky, Negative = unlucky.</p>`;
    
    // All-time luck
    html += `<div class="section-header" style="border:none"><h2>All-Time Luck</h2></div>`;
    html += makeTable(
        ['Manager', 'Normalized Wins', 'Actual Wins', 'Luck Number'],
        DATA.luck_alltime.map(r => [r.manager, r.normalized_wins, r.actual_wins, r.luck_number]),
        { colClasses: ['', 'number', 'number', 'number'] }
    );
    
    // Visual bars
    html += `<div style="margin:2rem 0">`;
    const maxLuck = Math.max(...DATA.luck_alltime.map(r => Math.abs(r.luck_number)));
    [...DATA.luck_alltime].sort((a, b) => b.luck_number - a.luck_number).forEach(r => {
        const pct = Math.max(5, (Math.abs(r.luck_number) / maxLuck) * 80);
        const isPos = r.luck_number >= 0;
        html += `<div style="display:flex;align-items:center;margin:0.75rem 0;gap:1rem">
            <div style="width:120px;text-align:right;font-weight:600;color:#adb5bd;font-size:0.95rem">${esc(r.manager)}</div>
            <div style="flex:1;display:flex;align-items:center">
                <div style="width:${pct}%;height:28px;border-radius:6px;background:${isPos ? 'linear-gradient(90deg,#28a745,#34d058)' : 'linear-gradient(90deg,#dc3545,#e4606d)'};display:flex;align-items:center;padding:0 10px;justify-content:${isPos ? 'flex-end' : 'flex-start'}">
                    <span style="font-size:0.8rem;font-weight:700;color:#fff">${r.luck_number > 0 ? '+' : ''}${fmt(r.luck_number)}</span>
                </div>
            </div>
        </div>`;
    });
    html += `</div>`;
    
    // Season-by-season luck
    if (DATA.luck_seasons && DATA.luck_seasons.length > 0) {
        html += `<div class="section-header" style="border:none"><h2>Season-by-Season Luck</h2></div>`;
        
        // Group by season
        const bySeason = {};
        DATA.luck_seasons.forEach(r => {
            if (!bySeason[r.season]) bySeason[r.season] = [];
            bySeason[r.season].push(r);
        });
        
        const seasons = Object.keys(bySeason).sort();
        html += `<select class="year-select" onchange="showLuckSeason(this.value)">`;
        seasons.forEach(s => {
            html += `<option value="${s}">${s}</option>`;
        });
        html += `</select>`;
        
        seasons.forEach((s, idx) => {
            html += `<div class="luck-season-data" id="luck-${s.replace(/\s+/g, '-')}" style="${idx > 0 ? 'display:none' : ''}">`;
            html += makeTable(
                ['Manager', 'Normalized Wins', 'Actual Wins', 'Luck Number'],
                bySeason[s].map(r => [r.manager, r.normalized_wins, r.actual_wins, r.luck_number]),
                { colClasses: ['', 'number', 'number', 'number'] }
            );
            html += `</div>`;
        });
    }
    
    el.innerHTML = html;
}

function showLuckSeason(season) {
    document.querySelectorAll('.luck-season-data').forEach(d => d.style.display = 'none');
    const el = document.getElementById(`luck-${season.replace(/\s+/g, '-')}`);
    if (el) el.style.display = 'block';
}

// ============================================================
// PLAYER USAGE PAGE
// ============================================================
function renderPlayers(el) {
    let html = `<div class="section-header"><span class="icon">🎮</span><h2>All-Time Player Usage</h2></div>`;
    html += `<p style="color:#888;margin-bottom:1.5rem;">Players ranked by total starts across all managers and seasons.</p>`;
    
    // Position tabs
    const positions = Object.keys(DATA.player_usage);
    html += `<div class="tabs" id="player-pos-tabs">`;
    positions.forEach((pos, i) => {
        html += `<button class="tab-btn ${i === 0 ? 'active' : ''}" onclick="showPlayerPos('${pos}')">${esc(pos)}</button>`;
    });
    html += `</div>`;
    
    // Search
    html += `<div class="filter-bar"><input type="text" class="search-input" placeholder="Search players..." oninput="filterPlayerTable(this.value)"></div>`;
    
    positions.forEach((pos, i) => {
        html += `<div class="player-pos-data" id="player-pos-${pos.replace(/\s+/g, '-')}" style="${i > 0 ? 'display:none' : ''}">`;
        html += makeTable(
            ['#', 'Player', 'Starts', 'Points', 'Avg'],
            DATA.player_usage[pos].map(p => [p.rank, p.player, p.starts, p.points, p.avg]),
            { ranked: true, colClasses: ['', '', 'number', 'number', 'number'], id: `player-table-${pos.replace(/\s+/g, '-')}` }
        );
        html += `</div>`;
    });
    
    el.innerHTML = html;
}

function showPlayerPos(pos) {
    document.querySelectorAll('.player-pos-data').forEach(d => d.style.display = 'none');
    document.getElementById(`player-pos-${pos.replace(/\s+/g, '-')}`).style.display = 'block';
    document.querySelectorAll('#player-pos-tabs .tab-btn').forEach(b => {
        b.classList.toggle('active', b.textContent === pos);
    });
}

function filterPlayerTable(query) {
    const q = query.toLowerCase();
    document.querySelectorAll('.player-pos-data table tbody tr').forEach(tr => {
        const text = tr.textContent.toLowerCase();
        tr.style.display = text.includes(q) ? '' : 'none';
    });
}

// ============================================================
// INIT
// ============================================================
loadData();
