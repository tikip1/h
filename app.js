const API = 'https://api.exchangerate.host';
const CACHE_KEY = 'fxCache';
const CACHE_MIN = 30; // minutes

const $ = sel => document.querySelector(sel);
const fromSel = $('#from');
const toSel   = $('#to');
const amountI = $('#amount');
const resultP = $('#result');

let rates = {}; // raw rates (USD base)

// -----------------------------
// 1. Load & populate dropdowns
// -----------------------------
async function init() {
  const data = await getRates('USD');
  rates = data.rates;

  const list = Object.keys(rates).sort();
  populateSelect(fromSel, list, 'USD');
  populateSelect(toSel,   list, 'EUR');

  $('#converter').addEventListener('submit', convert);
  $('#swap').addEventListener('click', swap);

  convert(); // initial conversion
}

function populateSelect(select, arr, selected) {
  select.innerHTML = arr.map(c => `<option ${c===selected?'selected':''}>${c}</option>`).join('');
}

// -----------------------------
// 2. Fetch with 30-min cache
// -----------------------------
async function getRates(base) {
  const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
  if (cached.base === base && Date.now() - cached.ts < CACHE_MIN*60_000) {
    return cached.data;
  }

  const res = await fetch(`${API}/latest?base=${base}`);
  const data = await res.json();
  localStorage.setItem(CACHE_KEY, JSON.stringify({ base, data, ts: Date.now() }));
  return data;
}

// -----------------------------
// 3. Convert
// -----------------------------
function convert(e) {
  if (e) e.preventDefault();
  const amt = parseFloat(amountI.value);
  if (isNaN(amt) || amt < 0) return;

  const from = fromSel.value;
  const to   = toSel.value;

  const rate = rates[to] / rates[from];
  const result = amt * rate;

  resultP.textContent = `${amt.toLocaleString()} ${from} = ${result.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})} ${to}`;
}

function swap() {
  [fromSel.value, toSel.value] = [toSel.value, fromSel.value];
  convert();
}

init();
