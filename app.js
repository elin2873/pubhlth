(function () {
  'use strict';

  const KEY = 'identityMirror.v1';
  const DISCLAIMER = 'This application is a class project for educational purposes and is not medical or psychological advice.';
  const DAY = 86400000;
  const FONT = '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif';

  // ---------- Storage ----------
  const store = (function () {
    let ok = false;
    const mem = {};
    try {
      localStorage.setItem('__im_test', '1');
      localStorage.removeItem('__im_test');
      ok = true;
    } catch (e) { ok = false; }
    return {
      persistent: () => ok,
      get(k) {
        try {
          const raw = ok ? localStorage.getItem(k) : mem[k];
          return raw ? JSON.parse(raw) : null;
        } catch (e) { return null; }
      },
      set(k, v) {
        const s = JSON.stringify(v);
        mem[k] = s;
        if (ok) { try { localStorage.setItem(k, s); } catch (e) {} }
      },
      remove(k) {
        delete mem[k];
        if (ok) { try { localStorage.removeItem(k); } catch (e) {} }
      }
    };
  })();

  function defaults() {
    return {
      identities: [],
      actions: [],
      preCommits: [],
      reckonings: [],
      audits: [],
      settings: {
        theme: 'dark', fontSize: 100, showPercentages: true, wallpaperSize: 'screen', name: 'My Mirror',
        showVote: true, clockSpace: true, mode: 'daily'
      },
      onboarded: false,
      disclaimerAcknowledged: false,
      startedAt: null,
      graduatedAt: null
    };
  }

  function load() {
    const s = store.get(KEY);
    const d = defaults();
    if (!s || typeof s !== 'object') return d;
    const out = Object.assign(d, s);
    out.settings = Object.assign(defaults().settings, s.settings || {});
    ['identities', 'actions', 'preCommits', 'reckonings', 'audits'].forEach(k => {
      if (!Array.isArray(out[k])) out[k] = [];
    });
    return out;
  }

  let S = load();
  function save() { store.set(KEY, S); }

  function freshUi() {
    return {
      logOpen: false, logPrefill: null, changePc: false,
      reck: { step: 'ask' }, auditOpen: false,
      pendingMsg: null, onboardAdd: false
    };
  }
  let ui = freshUi();
  function freshOb(step) { return { step, prefix: 'someone who', rest: '' }; }
  let ob = freshOb(null);

  // ---------- Helpers ----------
  const $ = sel => document.querySelector(sel);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const pad = n => (n < 10 ? '0' : '') + n;
  const plural = (n, w) => n + ' ' + w + (n === 1 ? '' : 's');

  function dateKey(d) {
    d = d || new Date();
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }
  function weekOf(d) {
    d = new Date(d || Date.now());
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    return dateKey(d);
  }
  const fmtDay = ts => new Date(ts).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  const fmtLong = ts => new Date(ts).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });

  const identity = id => S.identities.find(i => i.id === id) || null;
  const idText = id => (identity(id) ? identity(id).text : 'a removed identity');

  function getPc(date) { return S.preCommits.find(p => p.date === date) || null; }
  function todayPcId() { const pc = getPc(dateKey()); return pc && identity(pc.identityId) ? pc.identityId : null; }  function setPc(id) {
    const today = dateKey();
    S.preCommits = S.preCommits.filter(p => p.date !== today);
    S.preCommits.push({ date: today, identityId: id });
    save();
  }

  // Largest-remainder rounding so whole-number percentages always sum to 100.
  function normalize(weights) {
    const ids = Object.keys(weights);
    const total = ids.reduce((s, id) => s + weights[id], 0);
    const pct = {};
    if (!total) { ids.forEach(id => { pct[id] = 0; }); return pct; }
    const raw = ids.map(id => ({ id, v: weights[id] * 100 / total }));
    raw.forEach(r => { pct[r.id] = Math.floor(r.v); });
    let rem = 100 - raw.reduce((s, r) => s + pct[r.id], 0);
    raw.sort((a, b) => (b.v - Math.floor(b.v)) - (a.v - Math.floor(a.v)));
    for (let i = 0; rem > 0; i = (i + 1) % raw.length, rem--) pct[raw[i].id]++;
    return pct;
  }

  function shares(actions) {
    const counts = {};
    S.identities.forEach(i => { counts[i.id] = 0; });
    actions.forEach(a => { if (a.identityId in counts) counts[a.identityId]++; });
    const total = Object.keys(counts).reduce((s, id) => s + counts[id], 0);
    return { counts, total, pct: normalize(counts) };
  }
  const since = ms => S.actions.filter(a => a.timestamp >= Date.now() - ms);

  function lastEvidence(id) {
    let t = 0;
    S.actions.forEach(a => { if (a.identityId === id && a.timestamp > t) t = a.timestamp; });
    return t;
  }
  function starved() {
    const now = Date.now();
    return S.identities.filter(i => now - (lastEvidence(i.id) || i.createdAt) >= 5 * DAY);
  }
  function gradEligible() {
    return S.startedAt && Date.now() - S.startedAt >= 28 * DAY && S.settings.mode !== 'weekly';
  }

  function view(html) { $('#view').innerHTML = html; }
  function announce(msg) {
    $('#liveWrap').hidden = !msg;
    $('#live').textContent = msg || '';
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  // ---------- Constants ----------
  const SUGGESTIONS = [
    'shows up for friends', 'keeps learning', 'makes things with care', 'tells the truth kindly',
    'takes care of people', 'builds community', 'explores new ideas', 'stays steady under pressure'
  ];
  const EXAMPLES = {
    others: ['Send a two-line check-in to someone', 'Offer ten minutes of help to someone nearby', 'Thank someone for something specific'],
    self: ['Spend ten minutes on it with a timer', 'Do the smallest possible first step', 'Write one sentence about what you learned or made']
  };
  const CAUSES = [
    { id: 'busy', label: 'Too busy' },
    { id: 'avoidance', label: 'Avoidance' },
    { id: 'fear', label: 'Fear' },
    { id: 'noticed', label: "Didn't notice" },
    { id: 'other', label: 'Other' }
  ];
  const causeLabel = id => (CAUSES.find(c => c.id === id) || { label: id }).label;

  const REFRAMES = [
    t => `One more vote for "${t}."`,
    t => `That's evidence. You acted like ${t} today.`,
    t => `Another small proof that you're becoming ${t}.`
  ];
  function reframe(identityId, why, costId) {
    let msg = REFRAMES[S.actions.length % REFRAMES.length](idText(identityId));
    if (why) msg += ` You noted why it mattered: "${why}${/[.!?]$/.test(why) ? '' : '.'}"`;
    if (costId) msg += ` It took some time from "${idText(costId)}." That's a trade, not a failure, and it's in your ledger.`;
    return msg;
  }

  // ---------- Onboarding ----------
  function composeIdentity(prefix, rest) {
    let r = rest.trim().replace(/[.]+$/, '');
    if (prefix === 'own') return r;
    if (r.toLowerCase().startsWith(prefix + ' ')) r = r.slice(prefix.length + 1);
    return r ? prefix + ' ' + r : '';
  }

  function renderOnboarding() {
    if (!ob.step) ob.step = !S.disclaimerAcknowledged ? 'disclaimer' : (S.identities.length ? 'list' : 'phrase');
    const n = S.identities.length;
    let h = '';

    if (ob.step === 'disclaimer') {
      h = `<h1>Identity Mirror</h1>
        <p class="lead">Small daily actions are votes for the person you're becoming. This app helps you notice them.</p>
        <div class="disclaimer">${esc(DISCLAIMER)}</div>
        <p>You'll write 2 to 4 short identity statements, like "someone who shows up for friends." Each day you log small actions and tag them to an identity. The app shows how your evidence is spread across them. No streaks, no scores, no comparing you to anyone.</p>
        <p class="muted small">Everything stays in this browser on this device.</p>
        <button class="btn block" data-act="ackDisclaimer">I understand, let's begin</button>`;
    } else if (ob.step === 'phrase') {
      h = `<p class="step">Identity ${n + 1} of up to 4</p>
        <h1>Add an identity</h1>
        <p>Who do you want to be? What do you want to do, achieve, and accomplish?</p>
        <form data-form="obPhrase">
          <div class="phrase">
            <label class="sr-only" for="obPrefix">Starts with</label>
            <select id="obPrefix" name="prefix">
              ${['someone who', 'a', 'an'].map(p => `<option value="${p}"${ob.prefix === p ? ' selected' : ''}>${p}</option>`).join('')}
              <option value="own"${ob.prefix === 'own' ? ' selected' : ''}>(my own words)</option>
            </select>
            <label class="sr-only" for="obRest">The rest of your identity statement</label>
            <input type="text" id="obRest" name="rest" maxlength="70" required autocomplete="off" placeholder="shows up for friends" value="${esc(ob.rest)}">
          </div>
          <p class="muted small" style="margin-top:12px">Ideas, if you're stuck:</p>
          <div class="chips">${SUGGESTIONS.map(s => `<button type="button" class="chip" data-act="obSuggest" data-text="${esc(s)}">${esc(s)}</button>`).join('')}</div>
          <p class="preview-line">I'm becoming <strong id="obPreview">${esc(composeIdentity(ob.prefix, ob.rest) || '...')}</strong></p>
          <div id="obError" class="small" style="color:var(--danger)" role="alert"></div>
          <div class="row">
            <button class="btn" type="submit">Add this identity</button>
            ${n ? '<button class="btn ghost" type="button" data-act="obToList">Back to my list</button>' : ''}
          </div>
        </form>`;
    } else {
      h = `<h1>Your identities</h1>
        <p class="lead">${n < 2 ? 'Add at least two. You can have up to four.' : n < 4 ? 'You can add up to four, or start now.' : "That's four. You're ready."}</p>
        <ul class="list card">${S.identities.map(i => `<li><span><strong>${esc(i.text)}</strong></span>
          <button class="link danger" data-act="obRemove" data-id="${i.id}" aria-label="Remove ${esc(i.text)}">Remove</button></li>`).join('') || '<li class="muted">None yet.</li>'}</ul>
        ${n < 4 ? '<button class="btn ghost block" data-act="obAddAnother">Add another identity</button>' : ''}
        ${n >= 2 ? `<button class="btn block" data-act="obFinish">${ui.onboardAdd ? 'Done' : 'Start mirroring'}</button>` : ''}`;
    }
    view(h);
  }

  // ---------- Today ----------
  function logForm() {
    const f = ui.logPrefill || {};
    const sel = f.identityId || todayPcId() || S.identities[0].id;
    return `<form class="card" data-form="log">
      <h2>Log an action</h2>
      <label for="logId">Which identity did this feed?</label>
      <select id="logId" name="identityId">${S.identities.map(i => `<option value="${i.id}"${i.id === sel ? ' selected' : ''}>${esc(i.text)}</option>`).join('')}</select>
      <label for="logText">What did you do? <span class="muted">(one line)</span></label>
      <input type="text" id="logText" name="text" maxlength="120" required autocomplete="off" value="${esc(f.text || '')}">
      <label for="logWhy">Why it mattered <span class="muted">(optional)</span></label>
      <input type="text" id="logWhy" name="why" maxlength="140" autocomplete="off">
      <fieldset>
        <legend>Trade-off <span class="muted">(optional)</span></legend>
        <label class="check"><input type="checkbox" id="hasCost" name="hasCost"> This action took time from another identity</label>
        <div id="costWrap" hidden>
          <label for="costId">Took time from</label>
          <select id="costId" name="costId"></select>
        </div>
      </fieldset>
      <div class="row">
        <button class="btn" type="submit">Log it</button>
        <button class="btn ghost" type="button" data-act="closeLog">Cancel</button>
      </div>
    </form>`;
  }

  function updateCostOptions() {
    const sel = $('#logId'), cost = $('#costId'), wrap = $('#costWrap'), box = $('#hasCost');
    if (!sel || !cost) return;
    wrap.hidden = !box.checked;
    const prev = cost.value;
    cost.innerHTML = S.identities.filter(i => i.id !== sel.value)
      .map(i => `<option value="${i.id}"${i.id === prev ? ' selected' : ''}>${esc(i.text)}</option>`).join('');
  }

  function renderToday() {
    const weekly = S.settings.mode === 'weekly';
    const pcId = todayPcId();
    const sh = shares(S.actions);
    let h = '<h1>Today</h1>';

    if (weekly) {
      h += `<div class="card soft"><p><strong>Weekly mode.</strong> No daily check-ins needed. Ask yourself the three questions when you like, and log evidence whenever it happens.</p>
        <a class="btn ghost" href="#graduate">See the three questions</a></div>`;
    } else if (gradEligible()) {
      h += `<div class="card soft"><p>It's been four weeks since you started. Want to see the version of this that doesn't need an app?</p>
        <a class="btn ghost" href="#graduate">Take a look</a></div>`;
    }

    h += '<section class="card" aria-labelledby="pcTitle">';
    if (pcId && !ui.changePc) {
      h += `<h2 id="pcTitle">Today's focus</h2><p class="vote">"${esc(idText(pcId))}"</p>
        <button class="link" data-act="changePc">Change</button>`;
    } else {
      h += `<h2 id="pcTitle">Which identity do you want to feed today?</h2>
        <p class="muted small">Pick a focus to start logging actions.</p>
        <div class="chips">${S.identities.map(i => `<button class="chip" data-act="pc" data-id="${i.id}" aria-pressed="${i.id === pcId}">${esc(i.text)}</button>`).join('')}</div>`;
    }
    h += '</section>';

    if (pcId) h += ui.logOpen ? logForm() : '<button class="btn block" data-act="openLog">Log an action</button>';

    if (!weekly) {
      starved().forEach(i => {
        const ex = i.selfTranscending ? EXAMPLES.others : EXAMPLES.self;
        h += `<section class="card nudge"><p>You haven't acted like <strong>${esc(i.text)}</strong> this week. One small action?</p>
          <div class="chips">${ex.map(x => `<button class="chip" data-act="nudgeLog" data-id="${i.id}" data-text="${esc(x)}">${esc(x)}</button>`).join('')}</div></section>`;
      });
    }

    h += `<h2>Your evidence</h2>
      <p class="muted small">Each bar is that identity's share of all the actions you've logged. It's a mirror, not a score.</p>`;
    S.identities.forEach(i => {
      const p = sh.pct[i.id];
      h += `<div class="card">
        <div class="idrow"><span class="idtext">${esc(i.text)}</span><span class="pct">${sh.total ? p + '%' : '&ndash;'}</span></div>
        <div class="bar" role="img" aria-label="${sh.total ? p + ' percent of your evidence' : 'No evidence yet'}"><span style="width:${p}%"></span></div>
        <p class="muted small">${plural(sh.counts[i.id], 'action')} &middot; share of evidence</p></div>`;
    });
    if (!sh.total) h += '<p class="muted">No evidence yet. Your first logged action will show up here.</p>';

    const recent = S.actions.slice().sort((a, b) => b.timestamp - a.timestamp).slice(0, 6);
    if (recent.length) {
      h += '<h2>Recent evidence</h2><ul class="list card">' + recent.map(a => `<li>
        <div><strong>${esc(a.text)}</strong>
        <div class="muted small">${esc(idText(a.identityId))} &middot; ${fmtDay(a.timestamp)}${a.why ? ' &middot; ' + esc(a.why) : ''}${a.costIdentityId ? ' &middot; took time from ' + esc(idText(a.costIdentityId)) : ''}</div></div>
        <button class="link danger" data-act="delAction" data-id="${a.id}" aria-label="Remove ${esc(a.text)}">Remove</button></li>`).join('') + '</ul>';
    }
    view(h);
    updateCostOptions();
  }

  // ---------- Weekly Reckoning ----------
  function weekCounts() {
    const c = {};
    S.identities.forEach(i => { c[i.id] = 0; });
    since(7 * DAY).forEach(a => { if (a.identityId in c) c[a.identityId]++; });
    return c;
  }
  function leastId(c) {
    let best = null;
    S.identities.forEach(i => {
      if (best === null || c[i.id] < c[best] || (c[i.id] === c[best] && lastEvidence(i.id) < lastEvidence(best))) best = i.id;
    });
    return best;
  }

  function barrierProfile() {
    let h = '<section class="card"><h2>Your barrier profile</h2>';
    if (!S.reckonings.length) {
      return h + '<p class="muted">After your first reckoning, you\'ll see which barriers tend to show up for each identity.</p></section>';
    }
    const prof = {};
    let max = 1;
    S.reckonings.forEach(r => {
      prof[r.identityId] = prof[r.identityId] || {};
      prof[r.identityId][r.cause] = (prof[r.identityId][r.cause] || 0) + 1;
      max = Math.max(max, prof[r.identityId][r.cause]);
    });
    h += '<p class="muted small">How often each barrier came up, by identity. Patterns, not judgments.</p>';
    Object.keys(prof).forEach(id => {
      h += `<h3>${esc(idText(id))}</h3>`;
      CAUSES.forEach(c => {
        const n = prof[id][c.id];
        if (n) h += `<div class="hbar"><span>${c.label}</span><div class="bar alt"><span style="width:${n / max * 100}%"></span></div><span>${n}</span></div>`;
      });
    });
    const recent = S.reckonings.slice(-3).reverse();
    h += '<h3>Recent notes</h3><ul class="list">' + recent.map(r =>
      `<li><span>"${esc(r.note)}"<br><span class="muted small">${esc(causeLabel(r.cause))} &middot; ${esc(idText(r.identityId))} &middot; week of ${esc(r.weekOf)}</span></span></li>`).join('') + '</ul>';
    return h + '</section>';
  }

  function renderReckoning() {
    const c = weekCounts();
    const least = leastId(c);
    const r = ui.reck;
    let h = `<h1>Weekly reckoning</h1>
      <p class="muted">About five minutes. This is about what got in the way, not about what's wrong with you.</p>`;

    if (r.step === 'reframe') {
      h += `<section class="card">
        <p class="big">That's a barrier, not a verdict.</p>
        <p>Which identity could you feed instead this week?</p>
        <div class="chips">${S.identities.map(i => `<button class="chip" data-act="feedInstead" data-id="${i.id}">${esc(i.text)}</button>`).join('')}</div>
        <button class="link" data-act="reckAgain">Do another reckoning</button></section>`;
    } else {
      h += '<section class="card"><h2>This week\'s evidence</h2><p class="muted small">Actions logged in the last 7 days.</p>' +
        S.identities.map(i => `<div class="idrow"><span>${esc(i.text)}</span><span class="pct">${c[i.id]}</span></div>`).join('') + '</section>';
      const doneThisWeek = S.reckonings.filter(x => x.weekOf === weekOf()).length;
      h += `<form class="card" data-form="reckon">
        <h2>Least evidence this week</h2>
        <p class="vote">"${esc(idText(least))}"</p>
        <p class="muted small">${plural(c[least], 'action')} in the last 7 days.</p>
        <label for="reckId">Reflecting on</label>
        <select id="reckId" name="identityId">${S.identities.map(i => `<option value="${i.id}"${i.id === least ? ' selected' : ''}>${esc(i.text)}</option>`).join('')}</select>
        <fieldset><legend>What got in the way this week?</legend>
          ${CAUSES.map((x, k) => `<label class="check"><input type="radio" name="cause" value="${x.id}"${k === 0 ? ' required' : ''}> ${x.label}</label>`).join('')}
        </fieldset>
        <label for="reckNote">In one sentence, what happened?</label>
        <input type="text" id="reckNote" name="note" maxlength="180" required autocomplete="off">
        <button class="btn block" type="submit">Save reckoning</button>
        ${doneThisWeek ? `<p class="muted small">You've done ${plural(doneThisWeek, 'reckoning')} this week. Another is fine if something else is on your mind.</p>` : ''}
      </form>`;
    }
    h += barrierProfile();
    view(h);
  }

  // ---------- Trade-off ledger + audit ----------
  function compareHTML(stated, revealed, hasEvidence) {
    return '<div class="compare">' + S.identities.map(i => `
      <div class="who">${esc(i.text)}</div>
      <div class="hbar"><span class="muted">Said</span><div class="bar alt"><span style="width:${stated[i.id] || 0}%"></span></div><span>${stated[i.id] || 0}%</span></div>
      <div class="hbar"><span class="muted">Lived</span><div class="bar"><span style="width:${revealed[i.id] || 0}%"></span></div><span>${hasEvidence ? (revealed[i.id] || 0) + '%' : '&ndash;'}</span></div>`).join('') +
      '</div><p class="muted small">"Said" is how much you rated each identity. "Lived" is its share of your evidence in the last 30 days.</p>';
  }
  function revealedShares() {
    const recent = since(30 * DAY);
    const sh = shares(recent.length ? recent : S.actions);
    return { pct: sh.pct, total: sh.total };
  }
  function statedFromForm(form) {
    const w = {};
    S.identities.forEach(i => {
      const el = form.querySelector(`[name="r_${i.id}"]`);
      w[i.id] = el ? +el.value : 3;
    });
    return normalize(w);
  }

  function renderLedger() {
    const costs = {};
    S.identities.forEach(i => { costs[i.id] = 0; });
    const weekTrades = since(7 * DAY).filter(a => a.costIdentityId);
    weekTrades.forEach(a => { if (a.costIdentityId in costs) costs[a.costIdentityId]++; });
    const max = Math.max(1, ...Object.values(costs));

    let h = `<h1>Trade-off ledger</h1>
      <p class="muted">When you log an action, you can note which identity it took time from. Trades aren't mistakes. They show what you chose.</p>
      <section class="card"><h2>Who's been getting the short end</h2>
      <p class="muted small">Times each identity gave up time, last 7 days.</p>`;
    if (!weekTrades.length) h += '<p>No trades logged this week.</p>';
    else S.identities.forEach(i => {
      h += `<div class="hbar"><span>${esc(i.text)}</span><div class="bar alt" role="img" aria-label="${plural(costs[i.id], 'trade')}"><span style="width:${costs[i.id] / max * 100}%"></span></div><span>${costs[i.id]}</span></div>`;
    });
    h += '</section>';

    const trades = S.actions.filter(a => a.costIdentityId).sort((a, b) => b.timestamp - a.timestamp).slice(0, 10);
    if (trades.length) {
      h += '<section class="card"><h2>Recent trades</h2><ul class="list">' + trades.map(a =>
        `<li><span><strong>${esc(a.text)}</strong><br><span class="muted small">Fed ${esc(idText(a.identityId))}, took time from ${esc(idText(a.costIdentityId))} &middot; ${fmtDay(a.timestamp)}</span></span></li>`).join('') + '</ul></section>';
    }

    const last = S.audits[S.audits.length - 1];
    const due = !last || Date.now() - last.date >= 30 * DAY;
    h += '<section class="card"><h2>Monthly purpose audit</h2>';
    h += due ? '<p>Your monthly audit is ready.</p>'
      : `<p class="muted">Last audit: ${fmtDay(last.date)}. The next one is suggested after ${fmtDay(last.date + 30 * DAY)}, but you can run it any time.</p>`;
    if (ui.auditOpen) {
      const rev = revealedShares();
      const even = {};
      S.identities.forEach(i => { even[i.id] = 3; });
      h += `<form data-form="audit">
        <p class="big">Looking at your trades, what does your life say you actually value? Does it match what you said?</p>
        <p>First, how much do you <em>say</em> each identity matters? (1 = a little, 5 = a lot)</p>
        ${S.identities.map(i => `<label for="r_${i.id}">${esc(i.text)}: <output id="o_${i.id}">3</output></label>
          <input type="range" id="r_${i.id}" name="r_${i.id}" min="1" max="5" step="1" value="3" data-audit>`).join('')}
        <h3>Said vs. lived</h3>
        <div id="auditCompare">${compareHTML(normalize(even), rev.pct, rev.total > 0)}</div>
        <label for="auditNote">Your answer</label>
        <textarea id="auditNote" name="note" maxlength="600" required></textarea>
        <div class="row"><button class="btn" type="submit">Save audit</button><button class="btn ghost" type="button" data-act="closeAudit">Cancel</button></div>
      </form>`;
    } else {
      h += `<button class="btn block" data-act="openAudit">${due ? 'Start the audit' : 'Run it now'}</button>`;
      if (last) {
        h += `<h3>Your last audit (${fmtDay(last.date)})</h3>${compareHTML(last.stated, last.revealed, true)}
          <blockquote>${esc(last.note)}</blockquote>`;
      }
    }
    h += '</section>';
    view(h);
  }

  // ---------- Wallpaper Studio ----------
  const THEMES = {
    dark: { label: 'Dark', bg: '#111418', fg: '#F3F4F6', muted: '#A7AFBA', track: '#2B313A', bar: '#9DB8FF' },
    light: { label: 'Light', bg: '#F7F7F5', fg: '#1B1D20', muted: '#5A5F66', track: '#E0E2E5', bar: '#2F5D8C' },
    warm: { label: 'Warm', bg: '#F3EADF', fg: '#3A2E24', muted: '#6E5C4B', track: '#E2D3C1', bar: '#9C5F37' },
    contrast: { label: 'High contrast', bg: '#000000', fg: '#FFFFFF', muted: '#FFFFFF', track: '#4D4D4D', bar: '#FFD400' }
  };
  const SIZES = [
    { id: '1170x2532', w: 1170, h: 2532, label: 'iPhone 12 to 15' },
    { id: '1290x2796', w: 1290, h: 2796, label: 'iPhone 14/15 Pro Max' },
    { id: '1080x2400', w: 1080, h: 2400, label: 'Common Android' },
    { id: '1440x3120', w: 1440, h: 3120, label: 'Android QHD' }
  ];
  function screenSize() {
    const dpr = window.devicePixelRatio || 1;
    let w = Math.round(window.screen.width * dpr), h = Math.round(window.screen.height * dpr);
    if (w > h) { const t = w; w = h; h = t; }
    return { w, h };
  }
  function sizeFor(id) {
    if (id === 'screen') return screenSize();
    const s = SIZES.find(x => x.id === id) || SIZES[0];
    return { w: s.w, h: s.h };
  }

  function wrapText(ctx, text, maxW) {
    const words = String(text).split(/\s+/).filter(Boolean);
    const lines = [];
    let line = '';
    words.forEach(w => {
      const t = line ? line + ' ' + w : w;
      if (ctx.measureText(t).width > maxW && line) { lines.push(line); line = w; } else line = t;
    });
    if (line) lines.push(line);
    return lines;
  }
  function roundRect(ctx, x, y, w, h, r) {
    r = Math.min(r, h / 2, w / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function wallpaperData() {
    const sh = shares(S.actions);
    const pcId = todayPcId();
    return {
      title: (S.settings.name || '').trim() || 'My Mirror',
      items: S.identities.map(i => ({ text: i.text, pct: sh.pct[i.id] })),
      total: sh.total,
      vote: pcId ? idText(pcId) : null
    };
  }

  function paintContent(ctx, x, y, cw, u, opts, th, data, dry) {
    const y0 = y;
    ctx.font = `700 ${80 * u}px ${FONT}`;
    wrapText(ctx, data.title, cw).forEach(l => {
      if (!dry) { ctx.fillStyle = th.fg; ctx.fillText(l, x, y); }
      y += 96 * u;
    });
    ctx.font = `400 ${34 * u}px ${FONT}`;
    if (!dry) { ctx.fillStyle = th.muted; ctx.fillText(data.total ? 'Share of my evidence' : 'Collecting evidence', x, y); }
    y += 106 * u;
    data.items.forEach((it, idx) => {
      ctx.font = `600 ${50 * u}px ${FONT}`;
      const pw = opts.showPercentages ? ctx.measureText('100%').width + 28 * u : 0;
      wrapText(ctx, it.text, cw - pw).forEach((l, i) => {
        if (!dry) {
          ctx.fillStyle = th.fg;
          ctx.fillText(l, x, y);
          if (i === 0 && opts.showPercentages) {
            ctx.textAlign = 'right';
            ctx.fillText(it.pct + '%', x + cw, y);
            ctx.textAlign = 'left';
          }
        }
        y += 64 * u;
      });
      y += 12 * u;
      const bh = 14 * u;
      if (!dry) {
        ctx.fillStyle = th.track;
        roundRect(ctx, x, y, cw, bh, bh / 2);
        ctx.fill();
        if (it.pct > 0) {
          ctx.fillStyle = th.bar;
          roundRect(ctx, x, y, Math.max(bh, cw * it.pct / 100), bh, bh / 2);
          ctx.fill();
        }
      }
      y += bh;
      if (idx < data.items.length - 1) y += 72 * u;
    });
    return y - y0;
  }

  // Draws in logical pixels (W x H); `scale` shrinks the backing store for the live preview.
  function setupCanvas(canvas, W, H, scale, th) {
    canvas.width = Math.max(1, Math.round(W * scale));
    canvas.height = Math.max(1, Math.round(H * scale));
    const ctx = canvas.getContext('2d');
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    ctx.fillStyle = th.bg;
    ctx.fillRect(0, 0, W, H);
    ctx.textBaseline = 'top';
    ctx.textAlign = 'left';
    return ctx;
  }

  function drawFooter(ctx, W, H, th, lines) {
    const base = W / 1170, mx = W * 0.09, cw = W - 2 * mx;
    let fy = H * 0.85 - 40 * base;
    lines.slice().reverse().forEach(ln => {
      ctx.font = ln.font;
      wrapText(ctx, ln.text, cw).reverse().forEach(l => {
        fy -= ln.lh;
        ctx.fillStyle = ln.color;
        ctx.fillText(l, mx, fy);
      });
    });
    return fy;
  }

  function drawWallpaper(canvas, W, H, scale, opts, data) {
    const th = THEMES[opts.theme] || THEMES.dark;
    const ctx = setupCanvas(canvas, W, H, scale, th);
    const base = W / 1170, mx = W * 0.09, cw = W - 2 * mx;
    const contentTop = opts.clockSpace ? H * 0.30 : H * 0.12 + 60 * base;

    const footer = [];
    if (opts.showVote && data.vote) footer.push({ text: "Today's focus: " + data.vote, font: `600 ${36 * base}px ${FONT}`, color: th.fg, lh: 48 * base });
    footer.push({ text: fmtLong(Date.now()) + '  \u00B7  Identity Mirror', font: `400 ${30 * base}px ${FONT}`, color: th.muted, lh: 42 * base });
    const footerTop = drawFooter(ctx, W, H, th, footer);

    const avail = footerTop - 60 * base - contentTop;
    let fs = (opts.fontSize || 100) / 100;
    let hgt = paintContent(ctx, mx, 0, cw, base * fs, opts, th, data, true);
    while (hgt > avail && fs > 0.4) {
      fs *= 0.92;
      hgt = paintContent(ctx, mx, 0, cw, base * fs, opts, th, data, true);
    }
    paintContent(ctx, mx, contentTop + Math.max(0, (avail - hgt) / 2), cw, base * fs, opts, th, data, false);
  }

  function drawProtocol(canvas, W, H, scale, theme) {
    const th = THEMES[theme] || THEMES.dark;
    const ctx = setupCanvas(canvas, W, H, scale, th);
    const base = W / 1170, mx = W * 0.1, cw = W - 2 * mx;
    let y = H * 0.32;
    ctx.font = `400 ${36 * base}px ${FONT}`;
    ctx.fillStyle = th.muted;
    ctx.fillText('EVERY EVENING', mx, y);
    y += 90 * base;
    ['Which identity did I feed?', 'Which did I starve?', 'One vote tomorrow?'].forEach((q, i) => {
      ctx.font = `700 ${66 * base}px ${FONT}`;
      ctx.fillStyle = th.fg;
      wrapText(ctx, (i + 1) + '.  ' + q, cw).forEach(l => { ctx.fillText(l, mx, y); y += 84 * base; });
      y += 56 * base;
    });
    drawFooter(ctx, W, H, th, [{ text: 'Identity Mirror', font: `400 ${30 * base}px ${FONT}`, color: th.muted, lh: 42 * base }]);
  }

  const canCopyImage = !!(navigator.clipboard && navigator.clipboard.write && window.ClipboardItem);

  function wpSummary(W, H, data) {
    let s = `Wallpaper preview, ${W} by ${H} pixels. Title: ${data.title}. `;
    s += data.total
      ? data.items.map(it => `${it.text}: ${it.pct}% of evidence`).join('; ') + '.'
      : 'No evidence logged yet, so every identity shows 0%.';
    if (S.settings.showVote && data.vote) s += ` Today's focus: ${data.vote}.`;
    return s;
  }

  function drawPreview() {
    const phone = $('#phone'), canvas = $('#wpCanvas');
    if (!phone || !canvas) return;
    const { w, h } = sizeFor(S.settings.wallpaperSize);
    $('#clockGuide').hidden = !S.settings.clockSpace;
    const scale = Math.min(1, (phone.clientWidth || 250) * (window.devicePixelRatio || 1) / w);
    const data = wallpaperData();
    drawWallpaper(canvas, w, h, scale, S.settings, data);
    $('#wpSummary').textContent = wpSummary(w, h, data);
    $('#fsOut').textContent = S.settings.fontSize + '%';
  }

  function renderStudio() {
    const s = S.settings;
    const scr = screenSize();
    const sizeOpts = [`<option value="screen"${s.wallpaperSize === 'screen' ? ' selected' : ''}>My screen (${scr.w} \u00D7 ${scr.h})</option>`]
      .concat(SIZES.map(z => `<option value="${z.id}"${s.wallpaperSize === z.id ? ' selected' : ''}>${z.w} \u00D7 ${z.h} &middot; ${z.label}</option>`)).join('');
    view(`<h1>Wallpaper Studio</h1>
      <p class="muted">Turn your mirror into a phone wallpaper so it's with you all day. It's drawn right here on your device. Nothing is uploaded.</p>
      <div class="studio">
        <div class="preview-col">
          <div class="phone" id="phone">
            <canvas id="wpCanvas" role="img" aria-describedby="wpSummary"></canvas>
            <div class="guide top"><span>Status bar / notch</span></div>
            <div class="guide clock" id="clockGuide"><span>Lock-screen clock</span></div>
            <div class="guide bottom"><span>Home indicator</span></div>
          </div>
          <p class="muted small center">Dashed areas are kept free of text. The guides aren't in the exported image.</p>
          <p id="wpSummary" class="small"></p>
        </div>
        <div class="card">
          <label for="wpName">Title</label>
          <input type="text" id="wpName" maxlength="40" data-setting="name" value="${esc(s.name)}">
          <fieldset><legend>Theme</legend><div class="themes">
            ${Object.keys(THEMES).map(k => `<label><input type="radio" name="wpTheme" value="${k}" data-setting="theme"${s.theme === k ? ' checked' : ''}><span class="swatch" style="background:${THEMES[k].bg}"></span>${THEMES[k].label}</label>`).join('')}
          </div></fieldset>
          <label for="wpFont">Text size: <output id="fsOut">${s.fontSize}%</output></label>
          <input type="range" id="wpFont" min="70" max="140" step="5" value="${s.fontSize}" data-setting="fontSize">
          <label class="check"><input type="checkbox" data-setting="showPercentages"${s.showPercentages ? ' checked' : ''}> Show percentages</label>
          <label class="check"><input type="checkbox" data-setting="showVote"${s.showVote ? ' checked' : ''}> Show today's focus</label>
          <label class="check"><input type="checkbox" data-setting="clockSpace"${s.clockSpace ? ' checked' : ''}> Leave room for the lock-screen clock</label>
          <label for="wpSize">Size</label>
          <select id="wpSize" data-setting="wallpaperSize">${sizeOpts}</select>
          <div class="row">
            <button class="btn" data-act="exportPng">Download PNG</button>
            ${canCopyImage ? '<button class="btn ghost" data-act="copyPng">Copy image</button>' : ''}
          </div>
          <p id="wpStatus" class="small muted" role="status" aria-live="polite"></p>
        </div>
      </div>
      <details class="card">
        <summary>How to set it as your wallpaper</summary>
        <p><strong>A browser can't change your wallpaper for you.</strong> That's a phone security rule, not a bug. You'll need to save the image, then set it yourself. It takes about a minute.</p>
        <h3>iPhone</h3>
        <ol>
          <li>Tap <strong>Download PNG</strong>. In Safari, tap the download icon in the address bar, open the file, then tap Share and <strong>Save Image</strong>. (If it opens in a tab instead, press and hold the image and choose Save to Photos.)</li>
          <li>Open <strong>Photos</strong>, open the image, tap Share, and choose <strong>Use as Wallpaper</strong>.</li>
          <li>Pinch to fit if needed, tap <strong>Add</strong>, then choose lock screen, home screen, or both.</li>
        </ol>
        <h3>Android</h3>
        <ol>
          <li>Tap <strong>Download PNG</strong>. It saves to your Downloads folder.</li>
          <li>Open it in <strong>Photos</strong> or <strong>Files</strong>, tap the three-dot menu, and choose <strong>Set as wallpaper</strong> (sometimes "Use as").</li>
          <li>Pick home screen, lock screen, or both. Exact wording varies by phone brand.</li>
        </ol>
        <p class="muted small">Your percentages change as you log. Export a fresh wallpaper whenever you want it to catch up.</p>
      </details>`);
    drawPreview();
  }

  function exportCanvas(kind) {
    const { w, h } = sizeFor(S.settings.wallpaperSize);
    const c = document.createElement('canvas');
    if (kind === 'protocol') drawProtocol(c, w, h, 1, S.settings.theme);
    else drawWallpaper(c, w, h, 1, S.settings, wallpaperData());
    return { c, w, h };
  }

  function exportPng(kind) {
    const status = $('#wpStatus') || $('#gradStatus');
    const { c, w, h } = exportCanvas(kind);
    c.toBlob(blob => {
      if (!blob) { if (status) status.textContent = 'Sorry, the image could not be created in this browser.'; return; }
      downloadBlob(blob, `identity-mirror${kind === 'protocol' ? '-questions' : ''}-${dateKey()}.png`);
      if (status) status.textContent = `Saved a ${w} \u00D7 ${h} PNG. Check your downloads.`;
    }, 'image/png');
  }

  function copyPng() {
    const status = $('#wpStatus');
    const { c } = exportCanvas('wallpaper');
    const item = new ClipboardItem({ 'image/png': new Promise(res => c.toBlob(res, 'image/png')) });
    navigator.clipboard.write([item])
      .then(() => { status.textContent = 'Image copied.'; })
      .catch(() => { status.textContent = "Couldn't copy here. Use Download PNG instead."; });
  }

  // ---------- Graduation ----------
  function portfolioHTML() {
    const sh = shares(S.actions);
    const first = S.actions.length ? Math.min(...S.actions.map(a => a.timestamp)) : S.startedAt || Date.now();
    const costs = {};
    S.actions.forEach(a => { if (a.costIdentityId) costs[a.costIdentityId] = (costs[a.costIdentityId] || 0) + 1; });
    const name = (S.settings.name || '').trim() || 'My Mirror';

    let body = `<h1>Evidence portfolio</h1>
      <p class="sub">${esc(name)} &middot; ${fmtLong(first)} to ${fmtLong(Date.now())} &middot; ${plural(sh.total, 'action')}</p>
      <h2>Who I'm becoming</h2><table><tr><th>Identity</th><th>Actions</th><th>Share of evidence</th></tr>` +
      S.identities.map(i => `<tr><td>${esc(i.text)}</td><td>${sh.counts[i.id]}</td><td>${sh.pct[i.id]}%</td></tr>`).join('') + '</table>';

    S.identities.forEach(i => {
      const acts = S.actions.filter(a => a.identityId === i.id).sort((a, b) => a.timestamp - b.timestamp);
      body += `<h2>Evidence for "${esc(i.text)}"</h2>`;
      body += acts.length ? '<ul>' + acts.map(a => `<li><span class="d">${fmtDay(a.timestamp)}</span> ${esc(a.text)}${a.why ? ` <em>(${esc(a.why)})</em>` : ''}</li>`).join('') + '</ul>' : '<p class="sub">No actions logged.</p>';
    });

    if (Object.keys(costs).length) {
      body += '<h2>Trades</h2><ul>' + Object.keys(costs).map(id => `<li>"${esc(idText(id))}" gave up time for another identity ${costs[id] === 1 ? 'once' : costs[id] + ' times'}</li>`).join('') + '</ul>';
    }
    if (S.reckonings.length) {
      body += '<h2>Barriers I noticed</h2><ul>' + S.reckonings.map(r => `<li><span class="d">Week of ${esc(r.weekOf)}</span> ${esc(causeLabel(r.cause))}, for "${esc(idText(r.identityId))}": ${esc(r.note)}</li>`).join('') + '</ul>';
    }
    if (S.audits.length) {
      body += '<h2>Purpose audits</h2>' + S.audits.map(a => `<h3>${fmtLong(a.date)}</h3><table><tr><th>Identity</th><th>Said</th><th>Lived</th></tr>` +
        S.identities.map(i => `<tr><td>${esc(i.text)}</td><td>${a.stated[i.id] || 0}%</td><td>${a.revealed[i.id] || 0}%</td></tr>`).join('') +
        `</table><p>${esc(a.note)}</p>`).join('');
    }
    body += `<div class="box"><strong>The three questions</strong><ol><li>Which identity did I feed?</li><li>Which did I starve?</li><li>One vote tomorrow?</li></ol></div>
      <p class="sub">Percentages are share of my own logged evidence, not a score or grade.<br>${esc(DISCLAIMER)}</p>`;

    return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Evidence portfolio - ${esc(name)}</title><style>
      body{font-family:${FONT};color:#1E2227;max-width:760px;margin:0 auto;padding:32px 24px;line-height:1.5}
      h1{margin:0 0 4px;font-size:30px}h2{margin:28px 0 8px;font-size:20px;border-bottom:1px solid #D9DCE0;padding-bottom:4px}
      .sub{color:#565D66;font-size:14px}.d{color:#565D66;font-size:13px;display:inline-block;min-width:110px}
      table{border-collapse:collapse;width:100%;font-size:15px}th,td{text-align:left;padding:6px 8px;border-bottom:1px solid #E1E5EA}
      li{margin-bottom:4px}.box{background:#E9EFF5;border-radius:12px;padding:14px 18px;margin-top:28px}
      .noprint{margin-bottom:20px}.noprint button{font:inherit;padding:10px 16px;border-radius:8px;border:0;background:#2F5D8C;color:#fff;cursor:pointer}
      @media print{.noprint{display:none}body{padding:0}}
      </style></head><body><div class="noprint"><button onclick="window.print()">Print or save as PDF</button></div>${body}</body></html>`;
  }

  function renderGraduate() {
    const days = S.startedAt ? Math.max(1, Math.round((Date.now() - S.startedAt) / DAY)) : 0;
    const weekly = S.settings.mode === 'weekly';
    view(`<h1>You can do this without me</h1>
      <p class="lead">${days >= 28 ? `You've been collecting evidence for ${days} days. ` : ''}The mirror was never really the app. It was three questions you can ask anywhere.</p>
      <div class="lockcard" role="img" aria-label="Lock-screen card with three questions: 1. Which identity did I feed? 2. Which did I starve? 3. One vote tomorrow?">
        <p class="kicker">Every evening</p>
        <ol><li>Which identity did I feed?</li><li>Which did I starve?</li><li>One vote tomorrow?</li></ol>
        <p class="foot">Identity Mirror</p>
      </div>
      <p class="muted small center">Screenshot this card, or save it as a full-size wallpaper image.</p>
      <button class="btn block" data-act="exportProtocol">Save the questions as a wallpaper image</button>
      <section class="card">
        <h2>Your evidence portfolio</h2>
        <p>A one-page record of your identities, the actions you logged for each, your barriers, and your audits.</p>
        <div class="row">
          <button class="btn" data-act="printPortfolio">Print or save as PDF</button>
          <button class="btn ghost" data-act="downloadPortfolio">Download as a web page</button>
        </div>
      </section>
      <p id="gradStatus" class="small muted" role="status" aria-live="polite"></p>
      <section class="card">
        <h2>${weekly ? 'Weekly mode is on' : 'Switch to weekly mode'}</h2>
        ${weekly
          ? `<p>Daily prompts and nudges are off. The app is here when you want it.</p><button class="btn ghost block" data-act="dailyMode">Go back to daily mode</button>`
          : `<p>Weekly mode turns off daily prompts and nudges. You can still log evidence, do your weekly reckoning, and update your wallpaper whenever you like.</p><button class="btn block" data-act="weeklyMode">Switch to weekly mode</button>`}
      </section>`);
  }

  // ---------- About ----------
  function renderAbout() {
    const n = S.identities.length;
    view(`<h1>About and ethics</h1>
      <div class="disclaimer">${esc(DISCLAIMER)}</div>
      <section class="card">
        <h2>Your data never leaves this device</h2>
        <p>Everything you enter is saved in this browser's local storage under one key (<code>${KEY}</code>). There are no accounts, no analytics, and no network requests. If you clear your browser data or switch devices, it's gone, so export your portfolio from the graduation screen if you want a copy.</p>
        ${store.persistent() ? '' : '<p><strong>This browser is blocking storage, so your data only lasts until you close this page.</strong></p>'}
      </section>
      <section class="card">
        <h2>What this app won't do</h2>
        <p>Identity Mirror contains no medical, diagnostic, calorie, weight, or supplement advice. It doesn't rank you, compare you to anyone, or use streaks, points, or badges. Percentages are each identity's share of your own logged evidence. They're not a score or a grade.</p>
        <p class="muted small">If you're struggling, please reach out to your campus counseling center, or call or text 988 (US).</p>
      </section>
      <section class="card">
        <h2>Your identities</h2>
        ${S.identities.map(i => `<form data-form="editIdentity" data-id="${i.id}">
          <label for="e_${i.id}" class="sr-only">Edit identity</label>
          <div class="row" style="margin-top:8px"><input type="text" id="e_${i.id}" name="text" maxlength="80" required value="${esc(i.text)}" style="flex:3 1 200px">
          <button class="btn ghost" type="submit" style="flex:1 1 80px">Save</button>
          ${n > 2 ? `<button class="btn ghost" type="button" data-act="removeIdentity" data-id="${i.id}" style="flex:1 1 80px">Remove</button>` : ''}</div>
        </form>`).join('')}
        ${n < 4 ? '<button class="btn ghost block" data-act="addIdentity">Add an identity</button>' : ''}
      </section>
      <section class="card">
        <h2>Graduation</h2>
        <p>The graduation screen normally appears after 28 days, but you can go there whenever you feel ready.</p>
        <a class="btn ghost block" href="#graduate">Graduate now</a>
      </section>
      <section class="card">
        <h2>Reset</h2>
        <p>Delete every identity, action, reckoning, and setting from this device.</p>
        <button class="btn danger block" data-act="reset">Reset all data</button>
      </section>`);
  }

  // ---------- Routing ----------
  const ROUTES = {
    today: renderToday, reckoning: renderReckoning, ledger: renderLedger,
    studio: renderStudio, graduate: renderGraduate, about: renderAbout
  };
  let current = null;

  function rerender() {
    if (!S.disclaimerAcknowledged || !S.onboarded || ui.onboardAdd) return renderOnboarding();
    (ROUTES[current] || renderToday)();
  }

  function route() {
    const onboarding = !S.disclaimerAcknowledged || !S.onboarded || ui.onboardAdd;
    $('#tabs').hidden = onboarding;
    const r = (location.hash || '#today').slice(1);
    current = ROUTES[r] ? r : 'today';
    announce(ui.pendingMsg);
    ui.pendingMsg = null;
    document.querySelectorAll('#tabs a').forEach(a => {
      if (a.dataset.route === current) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
    rerender();
    window.scrollTo(0, 0);
    $('#view').focus({ preventScroll: true });
  }
  function go(r) {
    if (location.hash === '#' + r) route();
    else location.hash = '#' + r;
  }

  // ---------- Actions ----------
  const ACT = {
    dismissLive: () => announce(''),

    ackDisclaimer() { S.disclaimerAcknowledged = true; save(); ob.step = S.identities.length ? 'list' : 'phrase'; rerender(); },
    obToList() { ob.step = 'list'; rerender(); },
    obAddAnother() { ob = freshOb('phrase'); rerender(); },
    obSuggest(el) {
      $('#obPrefix').value = 'someone who';
      $('#obRest').value = el.dataset.text;
      ob.prefix = 'someone who';
      ob.rest = el.dataset.text;
      $('#obPreview').textContent = composeIdentity(ob.prefix, ob.rest);
      $('#obRest').focus();
    },
    obRemove(el) { S.identities = S.identities.filter(i => i.id !== el.dataset.id); save(); rerender(); },
    obFinish() {
      S.onboarded = true;
      S.startedAt = S.startedAt || Date.now();
      save();
      const back = ui.onboardAdd;
      ui.onboardAdd = false;
      ob.step = null;
      go(back ? 'about' : 'today');
    },

    pc(el) { setPc(el.dataset.id); ui.changePc = false; announce(`Today's focus: "${idText(el.dataset.id)}." One small action is enough.`); rerender(); },
    changePc() { ui.changePc = true; rerender(); },
    openLog() { ui.logOpen = true; ui.logPrefill = null; rerender(); const t = $('#logText'); if (t) t.focus(); },
    closeLog() { ui.logOpen = false; ui.logPrefill = null; rerender(); },
    nudgeLog(el) {
      if (!todayPcId()) setPc(el.dataset.id);
      ui.logOpen = true;
      ui.logPrefill = { identityId: el.dataset.id, text: el.dataset.text };
      rerender();
      const f = $('form[data-form="log"]');
      if (f) { f.scrollIntoView({ behavior: 'smooth', block: 'start' }); $('#logText').focus({ preventScroll: true }); }
    },
    delAction(el) {
      if (!confirm('Remove this action from your evidence?')) return;
      S.actions = S.actions.filter(a => a.id !== el.dataset.id);
      save();
      rerender();
    },

    feedInstead(el) {
      setPc(el.dataset.id);
      ui.reck = { step: 'ask' };
      ui.pendingMsg = `Today's focus: "${idText(el.dataset.id)}." One small action this week is enough.`;
      go('today');
    },
    reckAgain() { ui.reck = { step: 'ask' }; rerender(); },

    openAudit() { ui.auditOpen = true; rerender(); },
    closeAudit() { ui.auditOpen = false; rerender(); },

    exportPng: () => exportPng('wallpaper'),
    copyPng,
    exportProtocol: () => exportPng('protocol'),
    printPortfolio() {
      const w = window.open('', '_blank');
      if (!w) { ACT.downloadPortfolio(); return; }
      w.document.open();
      w.document.write(portfolioHTML());
      w.document.close();
      w.focus();
      setTimeout(() => { try { w.print(); } catch (e) {} }, 400);
    },
    downloadPortfolio() {
      downloadBlob(new Blob([portfolioHTML()], { type: 'text/html' }), `identity-mirror-portfolio-${dateKey()}.html`);
      const st = $('#gradStatus');
      if (st) st.textContent = 'Portfolio downloaded. Open it and use Print to save it as a PDF.';
    },
    weeklyMode() { S.settings.mode = 'weekly'; S.graduatedAt = S.graduatedAt || Date.now(); save(); rerender(); announce('Weekly mode is on. The app will stay quiet until you want it.'); },
    dailyMode() { S.settings.mode = 'daily'; save(); rerender(); announce('Daily mode is back on.'); },

    addIdentity() { ui.onboardAdd = true; ob = freshOb('phrase'); route(); },
    removeIdentity(el) {
      const i = identity(el.dataset.id);
      if (!i || !confirm(`Remove "${i.text}"? Actions already logged for it stay in your history but no longer count toward percentages.`)) return;
      S.identities = S.identities.filter(x => x.id !== i.id);
      save();
      rerender();
    },
    reset() {
      if (!confirm('Reset all data? This permanently deletes every identity, action, reckoning, and setting on this device.')) return;
      store.remove(KEY);
      S = defaults();
      ui = freshUi();
      ob = freshOb(null);
      announce('');
      go('today');
    }
  };

  const FORMS = {
    obPhrase(f) {
      ob.prefix = f.elements.prefix.value;
      ob.rest = f.elements.rest.value;
      const text = composeIdentity(ob.prefix, ob.rest);
      const err = $('#obError');
      if (!text) { err.textContent = 'Finish the sentence first.'; return; }
      if (S.identities.some(i => i.text.toLowerCase() === text.toLowerCase())) { err.textContent = 'You already have that one.'; return; }
      S.identities.push({ id: uid(), text, createdAt: Date.now(), selfTranscending: false });
      save();
      ob = freshOb('list');
      rerender();
    },
    log(f) {
      const text = f.text.value.trim();
      if (!text) { f.text.focus(); return; }
      const identityId = f.identityId.value;
      const why = f.why.value.trim();
      const cost = f.hasCost.checked && f.costId.value ? f.costId.value : null;
      S.actions.push({ id: uid(), identityId, text, why, costIdentityId: cost, timestamp: Date.now() });
      save();
      ui.logOpen = false;
      ui.logPrefill = null;
      rerender();
      announce(reframe(identityId, why, cost));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    reckon(f) {
      const cause = f.querySelector('input[name="cause"]:checked');
      const note = f.note.value.trim();
      if (!cause || !note) return;
      S.reckonings.push({ weekOf: weekOf(), identityId: f.identityId.value, cause: cause.value, note });
      save();
      ui.reck = { step: 'reframe' };
      rerender();
      announce("That's a barrier, not a verdict.");
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    audit(f) {
      const note = f.note.value.trim();
      if (!note) return;
      const rev = revealedShares();
      S.audits.push({ date: Date.now(), stated: statedFromForm(f), revealed: rev.pct, note });
      save();
      ui.auditOpen = false;
      rerender();
      announce('Audit saved. Noticing the gap is the point, not closing it overnight.');
    },
    editIdentity(f) {
      const i = identity(f.dataset.id);
      const text = f.text.value.trim();
      if (!i || !text) return;
      i.text = text;
      save();
      announce('Identity updated.');
    }
  };

  document.addEventListener('click', e => {
    const el = e.target.closest('[data-act]');
    if (el && ACT[el.dataset.act]) { e.preventDefault(); ACT[el.dataset.act](el); }
  });

  document.addEventListener('submit', e => {
    const f = e.target;
    if (f.dataset.form && FORMS[f.dataset.form]) { e.preventDefault(); FORMS[f.dataset.form](f); }
  });

  function onField(e) {
    const t = e.target;
    if (t.id === 'logId' || t.id === 'hasCost') updateCostOptions();
    if (t.id === 'obPrefix' || t.id === 'obRest') {
      ob.prefix = $('#obPrefix').value;
      ob.rest = $('#obRest').value;
      $('#obPreview').textContent = composeIdentity(ob.prefix, ob.rest) || '...';
    }
    if (t.hasAttribute('data-audit')) {
      $('#o_' + t.id.slice(2)).textContent = t.value;
      const rev = revealedShares();
      $('#auditCompare').innerHTML = compareHTML(statedFromForm(t.form), rev.pct, rev.total > 0);
    }
    const key = t.dataset.setting;
    if (key) {
      if (t.type === 'checkbox') S.settings[key] = t.checked;
      else if (t.type === 'range') S.settings[key] = +t.value;
      else if (t.type === 'radio') { if (!t.checked) return; S.settings[key] = t.value; }
      else S.settings[key] = t.value;
      save();
      drawPreview();
    }
  }
  document.addEventListener('input', onField);
  document.addEventListener('change', onField);

  let resizeTimer = null;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(drawPreview, 150);
  });
  window.addEventListener('hashchange', route);

  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }

  route();
})();
