'use strict';

// ── Tab Navigation ──────────────────────────────────────────────
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
  });
});

// ── State ───────────────────────────────────────────────────────
const state = {
  event: {},
};

// ── Helpers ─────────────────────────────────────────────────────
function val(id) { return document.getElementById(id)?.value.trim() ?? ''; }
function num(id, fallback = 0) { return parseFloat(document.getElementById(id)?.value) || fallback; }

function fmt(n, decimals = 0) {
  return n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function fmtMoney(n) {
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ── Event Details ────────────────────────────────────────────────
function saveEventDetails() {
  const guests   = num('guestCount');
  const duration = num('eventDuration');

  if (!guests || !duration) {
    alert('Please enter at least Guest Count and Event Duration.');
    return;
  }

  state.event = {
    name:       val('eventName') || 'Wedding Event',
    date:       val('eventDate'),
    venue:      val('venue'),
    guests,
    duration,
    cocktailHour:      num('cocktailHour', 1),
    serviceStyle:      val('serviceStyle'),
    drinkingIntensity: val('drinkingIntensity'),
  };

  renderEventSummary();
  updateStaffRecommendation();
  updateChecklist();

  // Advance to menu tab
  document.querySelector('[data-tab="menu"]').click();
}

function renderEventSummary() {
  const e = state.event;
  const dateStr = e.date ? new Date(e.date + 'T00:00:00').toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' }) : 'TBD';

  const serviceLabels = {
    full: 'Full Open Bar',
    'beer-wine': 'Beer & Wine Only',
    signature: 'Signature Cocktails Only',
    limited: 'Limited Bar',
  };

  const intensityLabels = {
    light: 'Light (1–1.5 drinks/hr)',
    moderate: 'Moderate (1.5–2 drinks/hr)',
    heavy: 'Heavy (2–2.5 drinks/hr)',
  };

  document.getElementById('eventSummaryContent').innerHTML = `
    <div class="summary-grid">
      <div class="summary-item"><div class="s-label">Event</div><div class="s-val">${e.name}</div></div>
      <div class="summary-item"><div class="s-label">Date</div><div class="s-val">${dateStr}</div></div>
      <div class="summary-item"><div class="s-label">Venue</div><div class="s-val">${e.venue || 'TBD'}</div></div>
      <div class="summary-item"><div class="s-label">Guests</div><div class="s-val">${fmt(e.guests)}</div></div>
      <div class="summary-item"><div class="s-label">Duration</div><div class="s-val">${e.duration} hrs</div></div>
      <div class="summary-item"><div class="s-label">Cocktail Hour</div><div class="s-val">${e.cocktailHour} hr${e.cocktailHour !== 1 ? 's' : ''}</div></div>
      <div class="summary-item"><div class="s-label">Service Style</div><div class="s-val">${serviceLabels[e.serviceStyle]}</div></div>
      <div class="summary-item"><div class="s-label">Drink Preference</div><div class="s-val">${intensityLabels[e.drinkingIntensity]}</div></div>
    </div>`;

  document.getElementById('eventSummary').style.display = '';
}

// ── Drink Menu ───────────────────────────────────────────────────
function addCocktail() {
  const row = document.createElement('div');
  row.className = 'cocktail-row';
  row.innerHTML = `
    <input type="text" placeholder="Cocktail name" class="cocktail-name" />
    <input type="text" placeholder="Ingredients" class="cocktail-ingredients" />
    <button class="btn-remove" onclick="removeCocktail(this)">Remove</button>`;
  document.getElementById('signatureCocktails').appendChild(row);
}
function removeCocktail(btn) { btn.closest('.cocktail-row').remove(); }

// ── Quantity Calculator ──────────────────────────────────────────

// Drinks per person per hour ranges
const INTENSITY = { light: 1.25, moderate: 1.75, heavy: 2.25 };

// Category distribution (fraction of total drinks)
const DIST = {
  full:       { spirits: .40, wine: .35, beer: .25 },
  'beer-wine':{ spirits: 0,   wine: .55, beer: .45 },
  signature:  { spirits: .60, wine: .25, beer: .15 },
  limited:    { spirits: .45, wine: .30, beer: .25 },
};

function getSelectedCheckboxes(name) {
  return [...document.querySelectorAll(`input[name="${name}"]:checked`)].map(c => c.value);
}

function calculateQuantities() {
  const e = state.event;
  if (!e.guests) {
    alert('Please complete Event Details first.');
    document.querySelector('[data-tab="event"]').click();
    return;
  }

  const dph        = INTENSITY[e.drinkingIntensity] || 1.75;
  const totalDrinks = Math.ceil(e.guests * e.duration * dph);
  const dist        = DIST[e.serviceStyle] || DIST.full;

  const spiritDrinks = Math.round(totalDrinks * dist.spirits);
  const wineDrinks   = Math.round(totalDrinks * dist.wine);
  const beerDrinks   = Math.round(totalDrinks * dist.beer);

  const spirits  = getSelectedCheckboxes('spirit');
  const wines    = getSelectedCheckboxes('wine');
  const beers    = getSelectedCheckboxes('beer');
  const mixers   = getSelectedCheckboxes('mixer');

  const spiritLabels = { vodka:'Vodka', whiskey:'Whiskey/Bourbon', gin:'Gin', rum:'Rum', tequila:'Tequila', scotch:'Scotch' };
  const wineLabels   = { red:'Red Wine', white:'White Wine', rose:'Rosé', prosecco:'Prosecco/Champagne' };
  const beerLabels   = { domestic:'Domestic Beer', craft:'Craft Beer', light:'Light Beer', 'nonalc-beer':'Non-Alcoholic Beer' };
  const mixerLabels  = { soda:'Sodas', juice:'Juices', tonic:'Tonic & Club Soda', water:'Sparkling & Still Water', mocktails:'Mocktail Station', coffee:'Coffee & Tea' };

  // Standard pour sizes:
  //   Spirit: 1.5 oz → 750ml bottle ≈ 17 drinks
  //   Wine:   5 oz glass → 750ml bottle ≈ 5 glasses
  //   Beer:   12 oz can/bottle
  const SPIRIT_PER_BOTTLE = 17;
  const WINE_PER_BOTTLE   = 5;

  function spiritTable(items) {
    if (!items.length) return '<p class="hint">No spirits selected.</p>';
    const perSpirit = Math.ceil(spiritDrinks / items.length);
    const rows = items.map(s => {
      const bottles = Math.ceil(perSpirit / SPIRIT_PER_BOTTLE);
      return `<tr>
        <td>${spiritLabels[s] || s}</td>
        <td>${fmt(perSpirit)} servings</td>
        <td>${fmt(bottles)} bottles (750ml)</td>
        <td>${fmtMoney(bottles * 22)}&ndash;${fmtMoney(bottles * 40)}</td>
      </tr>`;
    }).join('');
    return tableWrap(rows);
  }

  function wineTable(items) {
    if (!items.length) return '<p class="hint">No wines selected.</p>';
    const perWine = Math.ceil(wineDrinks / items.length);
    const rows = items.map(w => {
      const bottles = Math.ceil(perWine / WINE_PER_BOTTLE);
      const priceLow  = w === 'prosecco' ? bottles * 14 : bottles * 10;
      const priceHigh = w === 'prosecco' ? bottles * 25 : bottles * 20;
      return `<tr>
        <td>${wineLabels[w] || w}</td>
        <td>${fmt(perWine)} glasses</td>
        <td>${fmt(bottles)} bottles (750ml)</td>
        <td>${fmtMoney(priceLow)}&ndash;${fmtMoney(priceHigh)}</td>
      </tr>`;
    }).join('');
    return tableWrap(rows);
  }

  function beerTable(items) {
    if (!items.length) return '<p class="hint">No beers selected.</p>';
    const perBeer = Math.ceil(beerDrinks / items.length);
    const rows = items.map(b => {
      const cases = Math.ceil(perBeer / 24);
      const priceLow  = b === 'craft' ? cases * 28 : cases * 18;
      const priceHigh = b === 'craft' ? cases * 40 : cases * 26;
      return `<tr>
        <td>${beerLabels[b] || b}</td>
        <td>${fmt(perBeer)} cans/bottles</td>
        <td>${fmt(cases)} case${cases !== 1 ? 's' : ''} (24-pk)</td>
        <td>${fmtMoney(priceLow)}&ndash;${fmtMoney(priceHigh)}</td>
      </tr>`;
    }).join('');
    return tableWrap(rows);
  }

  function mixerSection(items) {
    if (!items.length) return '<p class="hint">No mixers selected.</p>';
    const mixerQty = {
      soda:      { qty: Math.ceil(e.guests * 0.8), unit: '12oz cans' },
      juice:     { qty: Math.ceil(e.guests * 0.3), unit: '64oz jugs' },
      tonic:     { qty: Math.ceil(e.guests * 0.4), unit: '1L bottles' },
      water:     { qty: Math.ceil(e.guests * 0.5), unit: '1L bottles' },
      mocktails: { qty: Math.ceil(e.guests * 0.15), unit: 'servings (est.)' },
      coffee:    { qty: Math.ceil(e.guests * 0.3), unit: 'servings (est.)' },
    };
    const rows = items.map(m => {
      const info = mixerQty[m] || { qty: '?', unit: '' };
      return `<tr><td>${mixerLabels[m] || m}</td><td>${fmt(info.qty)} ${info.unit}</td><td>&mdash;</td><td>&mdash;</td></tr>`;
    }).join('');
    return tableWrap(rows);
  }

  function tableWrap(rows) {
    return `<table class="qty-table">
      <thead><tr><th>Item</th><th>Quantity</th><th>Unit</th><th>Est. Cost</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
  }

  const cocktailRows = [...document.querySelectorAll('#signatureCocktails .cocktail-row')];
  const cocktailHTML = cocktailRows.length
    ? `<ul style="margin:.5rem 0 0 1.25rem">${cocktailRows.map(r => {
        const name = r.querySelector('.cocktail-name')?.value;
        const ing  = r.querySelector('.cocktail-ingredients')?.value;
        return name ? `<li><strong>${name}</strong>${ing ? ' — ' + ing : ''}</li>` : '';
      }).filter(Boolean).join('')}</ul>`
    : '<p class="hint">No signature cocktails added.</p>';

  // Garnishes & Ice estimate
  const icePerGuest = 1.5; // lbs
  const iceLbs = Math.ceil(e.guests * icePerGuest);

  document.getElementById('quantityResults').innerHTML = `
    <div class="qty-category">
      <h3>Overview</h3>
      <table class="qty-table">
        <thead><tr><th>Metric</th><th>Value</th></tr></thead>
        <tbody>
          <tr><td>Total estimated drinks</td><td><strong>${fmt(totalDrinks)}</strong></td></tr>
          <tr><td>Drinks from spirits</td><td>${fmt(spiritDrinks)} (${Math.round(dist.spirits * 100)}%)</td></tr>
          <tr><td>Drinks from wine</td><td>${fmt(wineDrinks)} (${Math.round(dist.wine * 100)}%)</td></tr>
          <tr><td>Drinks from beer</td><td>${fmt(beerDrinks)} (${Math.round(dist.beer * 100)}%)</td></tr>
        </tbody>
      </table>
    </div>
    <div class="qty-category"><h3>Spirits</h3>${spiritTable(spirits)}</div>
    <div class="qty-category"><h3>Wine</h3>${wineTable(wines)}</div>
    <div class="qty-category"><h3>Beer</h3>${beerTable(beers)}</div>
    <div class="qty-category"><h3>Signature Cocktails</h3>${cocktailHTML}</div>
    <div class="qty-category"><h3>Mixers &amp; Non-Alcoholic</h3>${mixerSection(mixers)}</div>
    <div class="qty-category">
      <h3>Ice &amp; Garnishes</h3>
      <table class="qty-table">
        <thead><tr><th>Item</th><th>Quantity</th><th>Unit</th><th>Est. Cost</th></tr></thead>
        <tbody>
          <tr><td>Ice</td><td>${fmt(iceLbs)} lbs</td><td>${Math.ceil(iceLbs / 20)} bags (20lb)</td><td>${fmtMoney(Math.ceil(iceLbs/20)*4)}&ndash;${fmtMoney(Math.ceil(iceLbs/20)*6)}</td></tr>
          <tr><td>Lemons &amp; Limes</td><td>${Math.ceil(e.guests * 0.5)} each</td><td>units</td><td>${fmtMoney(Math.ceil(e.guests*0.5)*0.25)}&ndash;${fmtMoney(Math.ceil(e.guests*0.5)*0.4)}</td></tr>
          <tr><td>Cocktail Napkins</td><td>${fmt(e.guests * 4)}</td><td>napkins</td><td>${fmtMoney(e.guests*0.03)}&ndash;${fmtMoney(e.guests*0.06)}</td></tr>
          <tr><td>Straws</td><td>${fmt(e.guests * 2)}</td><td>straws</td><td>${fmtMoney(e.guests*0.01)}&ndash;${fmtMoney(e.guests*0.02)}</td></tr>
        </tbody>
      </table>
    </div>`;

  // Save summary for budget
  state.quantities = { totalDrinks, spiritDrinks, wineDrinks, beerDrinks, spirits, wines, beers, SPIRIT_PER_BOTTLE, WINE_PER_BOTTLE, iceLbs };
}

// ── Staff Planning ───────────────────────────────────────────────
function updateStaffRecommendation() {
  const e = state.event;
  if (!e.guests) return;

  // General rule: 1 bartender per 50 guests; 1 barback per 2 bartenders
  const bartenders = Math.max(1, Math.ceil(e.guests / 50));
  const barbacks   = Math.max(1, Math.floor(bartenders / 2));
  const servers    = e.guests > 100 ? Math.ceil(e.guests / 75) : 0;

  document.getElementById('staffRecommendation').innerHTML = `
    <p class="hint">Based on ${fmt(e.guests)} guests over ${e.duration} hours:</p>
    <div class="staff-rec-grid">
      <div class="staff-rec-card"><span class="rec-num">${bartenders}</span><div class="rec-label">Bartender${bartenders !== 1 ? 's' : ''}</div></div>
      <div class="staff-rec-card"><span class="rec-num">${barbacks}</span><div class="rec-label">Barback${barbacks !== 1 ? 's' : ''}</div></div>
      ${servers ? `<div class="staff-rec-card"><span class="rec-num">${servers}</span><div class="rec-label">Server${servers !== 1 ? 's' : ''}</div></div>` : ''}
      <div class="staff-rec-card"><span class="rec-num">1</span><div class="rec-label">Lead Bartender</div></div>
    </div>
    <p class="hint" style="margin-top:.75rem">Tip: Add extra staff for the cocktail hour when demand is highest.</p>`;
}

function addStaff() {
  const row = document.createElement('div');
  row.className = 'staff-row';
  row.innerHTML = `
    <input type="text" placeholder="Name" class="staff-name" />
    <select class="staff-role">
      <option>Lead Bartender</option><option>Bartender</option><option>Barback</option><option>Server</option>
    </select>
    <input type="text" placeholder="Phone / Notes" class="staff-notes" />
    <button class="btn-remove" onclick="removeStaff(this)">Remove</button>`;
  document.getElementById('staffRoster').appendChild(row);
}
function removeStaff(btn) { btn.closest('.staff-row').remove(); }

// ── Timeline ─────────────────────────────────────────────────────
function addTimelineRow() {
  const row = document.createElement('div');
  row.className = 'timeline-row';
  row.innerHTML = `
    <input type="time" class="timeline-time" />
    <input type="text" class="timeline-event" placeholder="Event description" />
    <button class="btn-remove" onclick="removeTimelineRow(this)">Remove</button>`;
  document.getElementById('timeline').appendChild(row);
}
function removeTimelineRow(btn) { btn.closest('.timeline-row').remove(); }

// ── Budget ────────────────────────────────────────────────────────
function calculateBudget() {
  const e       = state.event;
  const q       = state.quantities;
  const budget  = num('totalBudget');

  if (!e.guests) {
    alert('Please complete Event Details first.');
    document.querySelector('[data-tab="event"]').click();
    return;
  }
  if (!q) {
    alert('Please calculate quantities first (Quantities tab).');
    document.querySelector('[data-tab="quantities"]').click();
    return;
  }

  // Mid-range estimates
  const spiritCost = q.spirits.length
    ? q.spirits.length * Math.ceil(q.spiritDrinks / q.spirits.length / q.SPIRIT_PER_BOTTLE) * 28
    : 0;
  const wineCost = q.wines.length
    ? q.wines.reduce((acc, w) => {
        const bottles = Math.ceil((q.wineDrinks / q.wines.length) / q.WINE_PER_BOTTLE);
        return acc + bottles * (w === 'prosecco' ? 18 : 14);
      }, 0)
    : 0;
  const beerCost = q.beers.length
    ? q.beers.reduce((acc, b) => {
        const cases = Math.ceil((q.beerDrinks / q.beers.length) / 24);
        return acc + cases * (b === 'craft' ? 34 : 22);
      }, 0)
    : 0;
  const iceCost      = Math.ceil(q.iceLbs / 20) * 5;
  const garnishCost  = Math.round(e.guests * 0.35);
  const suppliesCost = Math.round(e.guests * 0.5);

  const totalAlc   = spiritCost + wineCost + beerCost;
  const totalOther = iceCost + garnishCost + suppliesCost;
  const totalEst   = totalAlc + totalOther;
  const remaining  = budget ? budget - totalEst : null;
  const pct        = budget ? Math.min(Math.round((totalEst / budget) * 100), 100) : null;

  const overBudget = remaining !== null && remaining < 0;

  document.getElementById('budgetResults').innerHTML = `
    <div class="budget-summary">
      <h3 style="margin-bottom:.75rem">Cost Estimate</h3>
      ${budget ? `
        <div class="budget-bar-wrap">
          <div style="display:flex;justify-content:space-between;font-size:.8rem;color:var(--text-lt);margin-bottom:.3rem">
            <span>${fmtMoney(totalEst)} estimated</span><span>${fmtMoney(budget)} budget</span>
          </div>
          <div class="budget-bar">
            <div class="budget-bar-fill ${overBudget ? 'over' : ''}" style="width:${pct}%"></div>
          </div>
          <div style="text-align:right;font-size:.8rem;margin-top:.25rem;color:${overBudget ? 'var(--danger)' : 'var(--success)'}">
            ${overBudget ? `Over budget by ${fmtMoney(Math.abs(remaining))}` : `${fmtMoney(remaining)} remaining`}
          </div>
        </div>` : ''}
      <div class="budget-line"><span>Spirits</span><span>${fmtMoney(spiritCost)}</span></div>
      <div class="budget-line"><span>Wine</span><span>${fmtMoney(wineCost)}</span></div>
      <div class="budget-line"><span>Beer</span><span>${fmtMoney(beerCost)}</span></div>
      <div class="budget-line"><span>Ice</span><span>${fmtMoney(iceCost)}</span></div>
      <div class="budget-line"><span>Garnishes &amp; Citrus</span><span>${fmtMoney(garnishCost)}</span></div>
      <div class="budget-line"><span>Bar Supplies (napkins, straws, cups)</span><span>${fmtMoney(suppliesCost)}</span></div>
      <div class="budget-line" style="font-weight:700;border-top:2px solid var(--gold);margin-top:.5rem;padding-top:.5rem">
        <span>Total Estimate</span><span>${fmtMoney(totalEst)}</span>
      </div>
      <div class="budget-line"><span>Per Guest</span><span>${fmtMoney(totalEst / e.guests)}</span></div>
    </div>`;

  renderCustomBudgetTotal();
}

function addBudgetRow() {
  const row = document.createElement('div');
  row.className = 'budget-row';
  row.innerHTML = `
    <input type="text" placeholder="Item" class="budget-item-name" />
    <input type="number" placeholder="Cost ($)" class="budget-item-cost" min="0" oninput="renderCustomBudgetTotal()" />
    <button class="btn-remove" onclick="removeBudgetRow(this)">Remove</button>`;
  document.getElementById('budgetLineItems').appendChild(row);
}
function removeBudgetRow(btn) {
  btn.closest('.budget-row').remove();
  renderCustomBudgetTotal();
}

function renderCustomBudgetTotal() {
  const costs = [...document.querySelectorAll('.budget-item-cost')]
    .map(i => parseFloat(i.value) || 0);
  const total = costs.reduce((a, b) => a + b, 0);
  document.getElementById('customBudgetTotal').textContent =
    total > 0 ? `Custom Items Total: ${fmtMoney(total)}` : '';
}

// ── Checklist ─────────────────────────────────────────────────────
const DEFAULT_CHECKLIST = {
  'Before the Event': [
    'Confirm guest count and finalize quantities',
    'Order all alcohol and supplies',
    'Confirm staff schedule and roles',
    'Obtain required permits / liquor license',
    'Arrange alcohol delivery to venue',
    'Prepare signature cocktail recipes and batch mixes',
    'Create bar layout and station setup plan',
    'Confirm ice delivery or rental coolers',
    'Prepare garnish kit (citrus, olives, cherries, herbs)',
    'Pack bar tools (shakers, jiggers, strainers, muddlers)',
  ],
  'Day of Event': [
    'Arrive 2+ hours early for setup',
    'Set up bar stations with supplies and glassware',
    'Chill all beers, wines, and mixers',
    'Prepare garnishes and batch cocktails',
    'Brief all staff on menu, pacing, and house rules',
    'Set up non-alcoholic stations (water, coffee)',
    'Confirm ID-checking protocol with all staff',
    'Test all equipment (blenders, soda guns if applicable)',
  ],
  'During the Event': [
    'Monitor bar stock and restock as needed',
    'Track guest consumption and pace service',
    'Ensure designated-driver options are available',
    'Keep bar area clean and organized',
    'Communicate with catering staff on timing',
    'Remind guests of last call 30 minutes before close',
  ],
  'Post-Event': [
    'Conduct last-call and close bar at scheduled time',
    'Collect unopened alcohol for return/storage',
    'Break down bar stations and clean up',
    'Collect all rented equipment',
    'Pay and debrief staff',
    'Send thank-you notes to vendor partners',
  ],
};

function updateChecklist() {
  const container = document.getElementById('checklistContainer');
  if (container.innerHTML.trim()) return; // Only build once

  let html = '';
  for (const [section, items] of Object.entries(DEFAULT_CHECKLIST)) {
    html += `<div class="checklist-section"><h3>${section}</h3>`;
    items.forEach((item, i) => {
      const id = `cl_${section.replace(/\s+/g, '_')}_${i}`;
      html += `<div class="checklist-item" id="wrap_${id}">
        <input type="checkbox" id="${id}" onchange="toggleChecklistItem(this)" />
        <label for="${id}"><span>${item}</span></label>
      </div>`;
    });
    html += `</div>`;
  }
  container.innerHTML = html;
}

function toggleChecklistItem(checkbox) {
  checkbox.closest('.checklist-item').classList.toggle('done', checkbox.checked);
}

function addChecklistItem() {
  const text = prompt('Enter your custom task:');
  if (!text) return;
  const container = document.getElementById('checklistContainer');
  let section = container.querySelector('.checklist-section:last-of-type');
  if (!section) {
    section = document.createElement('div');
    section.className = 'checklist-section';
    section.innerHTML = '<h3>Custom Tasks</h3>';
    container.appendChild(section);
  }
  const id = 'cl_custom_' + Date.now();
  const div = document.createElement('div');
  div.className = 'checklist-item';
  div.innerHTML = `
    <input type="checkbox" id="${id}" onchange="toggleChecklistItem(this)" />
    <label for="${id}"><span>${text}</span></label>`;
  section.appendChild(div);
}

// Initialise checklist on load
updateChecklist();

// ── Export / Print ────────────────────────────────────────────────
function exportPlan() {
  const plan = {
    event: state.event,
    menu: {
      spirits: getSelectedCheckboxes('spirit'),
      wines:   getSelectedCheckboxes('wine'),
      beers:   getSelectedCheckboxes('beer'),
      mixers:  getSelectedCheckboxes('mixer'),
      signatureCocktails: [...document.querySelectorAll('#signatureCocktails .cocktail-row')].map(r => ({
        name:        r.querySelector('.cocktail-name')?.value,
        ingredients: r.querySelector('.cocktail-ingredients')?.value,
      })).filter(c => c.name),
    },
    quantities: state.quantities || null,
    staff: [...document.querySelectorAll('#staffRoster .staff-row')].map(r => ({
      name:  r.querySelector('.staff-name')?.value,
      role:  r.querySelector('.staff-role')?.value,
      notes: r.querySelector('.staff-notes')?.value,
    })).filter(s => s.name),
    timeline: [...document.querySelectorAll('#timeline .timeline-row')].map(r => ({
      time:  r.querySelector('.timeline-time')?.value,
      event: r.querySelector('.timeline-event')?.value,
    })).filter(t => t.event),
    checklist: [...document.querySelectorAll('.checklist-item')].map(item => ({
      task: item.querySelector('span')?.textContent,
      done: item.querySelector('input')?.checked,
    })),
    exportedAt: new Date().toISOString(),
  };

  const blob = new Blob([JSON.stringify(plan, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `wedding-bar-plan-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function printPlan() {
  // Show all panels for print
  document.querySelectorAll('.tab-panel').forEach(p => p.style.display = 'block');
  window.print();
  // Restore active panel
  document.querySelectorAll('.tab-panel').forEach(p => p.style.display = '');
  document.querySelector('.tab-panel.active').style.display = 'block';
}
