/* =============================================
   sheet.js
   Mobile Phone Collection Sheet — Logic
   ============================================= */

const FIXED_GROUP = 'Mr. Jamshaid Baloch F.p';
const FIXED_COMP  = 1000;
const MIN_INT     = 1000;
const STEP        = 100;

let rows   = [];
let nextId = 1;

/* ── HELPERS ── */
function fmt(n) {
  return 'Rs. ' + Number(n || 0).toLocaleString('en-PK');
}

function esc(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/* ── TOAST ── */
function showToast(msg, color) {
  const t = document.getElementById('toast');
  t.textContent     = msg;
  t.style.background = color || '#1a7a4a';
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2800);
}

/* ── RENDER TABLE ── */
function render() {
  const tbody = document.getElementById('tbody');
  tbody.innerHTML = '';

  rows.forEach((r, i) => {
    const tr = document.createElement('tr');
    tr.innerHTML =
      '<td class="sno">' + (i + 1) + '</td>' +
      '<td><input type="text" value="' + esc(r.name) + '" ' +
          'oninput="update(' + r.id + ',\'name\',this.value)" placeholder="Full name"></td>' +
      '<td class="fixed-cell">' + FIXED_GROUP + '</td>' +
      '<td class="fixed-amt">' + fmt(FIXED_COMP) + '</td>' +
      '<td>' +
        '<div class="stepper">' +
          '<button type="button" onclick="stepDown(' + r.id + ')">−</button>' +
          '<input type="number" value="' + r.interested + '" min="' + MIN_INT + '" step="' + STEP + '" ' +
              'oninput="updateInt(' + r.id + ',this)" onblur="snapInt(' + r.id + ',this)">' +
          '<button type="button" onclick="stepUp(' + r.id + ')">+</button>' +
        '</div>' +
      '</td>' +
      '<td><button class="del-btn" onclick="delRow(' + r.id + ')" title="Delete">🗑</button></td>';
    tbody.appendChild(tr);
  });

  updateTotals();
}

/* ── TOTALS ── */
function updateTotals() {
  const totalInt = rows.reduce((s, r) => s + Number(r.interested || MIN_INT), 0);

  document.getElementById('ft-members').textContent    = rows.length + ' members';
  document.getElementById('ft-compulsory').textContent = rows.length
    ? fmt(rows.length * FIXED_COMP) + ' (display)' : '—';
  document.getElementById('ft-interested').textContent = fmt(totalInt);
  document.getElementById('sum-members').textContent   = rows.length;
  document.getElementById('sum-interested').textContent = fmt(totalInt);
  document.getElementById('sum-grand').textContent     = fmt(totalInt);
}

/* ── UPDATE FIELD ── */
function update(id, field, val) {
  const r = rows.find(r => r.id === id);
  if (r) r[field] = val;
  updateTotals();
}

/* ── STEPPER HELPERS ── */
function getStepperInput(id) {
  const inputs = document.querySelectorAll('#tbody .stepper input');
  const idx    = rows.findIndex(r => r.id === id);
  return inputs[idx] || null;
}

function stepUp(id) {
  const r = rows.find(r => r.id === id);
  if (!r) return;
  r.interested = (r.interested || MIN_INT) + STEP;
  const inp = getStepperInput(id);
  if (inp) inp.value = r.interested;
  updateTotals();
}

function stepDown(id) {
  const r = rows.find(r => r.id === id);
  if (!r) return;
  const newVal = (r.interested || MIN_INT) - STEP;
  if (newVal < MIN_INT) {
    showToast('⚠️ Minimum Interested Amount is Rs. 1,000', '#c0392b');
    return;
  }
  r.interested = newVal;
  const inp = getStepperInput(id);
  if (inp) inp.value = r.interested;
  updateTotals();
}

function updateInt(id, input) {
  let val = Number(input.value) || MIN_INT;
  if (val < MIN_INT) val = MIN_INT;
  const r = rows.find(r => r.id === id);
  if (r) r.interested = val;
  updateTotals();
}

function snapInt(id, input) {
  // Snap to nearest Rs.100, minimum Rs.1000
  let val = Number(input.value) || MIN_INT;
  if (val < MIN_INT) val = MIN_INT;
  val = Math.round(val / STEP) * STEP;
  input.value = val;
  const r = rows.find(r => r.id === id);
  if (r) r.interested = val;
  updateTotals();
}

/* ── ADD / DELETE ROW ── */
function addRow() {
  rows.push({ id: nextId++, name: '', interested: MIN_INT });
  render();
  const inputs = document.querySelectorAll('#tbody tr:last-child input[type="text"]');
  if (inputs[0]) inputs[0].focus();
}

function delRow(id) {
  if (!confirm('Delete this row?')) return;
  rows = rows.filter(r => r.id !== id);
  render();
}

/* ── SAVE / LOAD (localStorage) ── */
function saveData() {
  try {
    localStorage.setItem('jamshaid_sheet', JSON.stringify({ rows, nextId }));
    const btn = document.getElementById('saveBtn');
    btn.textContent = '✓ Saved!';
    btn.classList.add('saved');
    showToast('✅ Data saved successfully!');
    setTimeout(() => { btn.innerHTML = '💾 Save'; btn.classList.remove('saved'); }, 2200);
  } catch (e) {
    showToast('❌ Could not save. Try exporting CSV.', '#c0392b');
  }
}

function loadLocal() {
  try {
    const d = JSON.parse(localStorage.getItem('jamshaid_sheet') || 'null');
    if (d && d.rows && d.rows.length > 0) {
      rows   = d.rows;
      nextId = d.nextId || rows.length + 1;
      showToast('📂 Previous data loaded!');
      return true;
    }
  } catch (e) {}
  return false;
}

/* ── EXPORT CSV ── */
function exportCSV() {
  const BOM    = '\uFEFF';
  const header = ['S.No', 'Name', 'Group Name', 'Compulsory (Rs.) - Display Only', 'Interested Amount (Rs.)'];
  const dataRows = rows.map((r, i) => [
    i + 1,
    '"' + r.name + '"',
    '"' + FIXED_GROUP + '"',
    FIXED_COMP,
    r.interested
  ]);
  const totalInt = rows.reduce((s, r) => s + Number(r.interested || MIN_INT), 0);
  const footer   = ['Total', rows.length + ' members', '', rows.length * FIXED_COMP + ' (display)', totalInt];
  const csv      = BOM + [header, ...dataRows, footer].map(r => r.join(',')).join('\n');
  const blob     = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const a        = document.createElement('a');
  a.href         = URL.createObjectURL(blob);
  a.download     = 'jamshaid_collection_sheet.csv';
  a.click();
  showToast('✅ CSV downloaded!');
}

/* ── INIT ── */
const loaded = loadLocal();
if (!loaded) {
  rows = [
    { id: nextId++, name: 'Ahmed Khan', interested: 1000 },
    { id: nextId++, name: 'Sara Malik', interested: 1200 },
    { id: nextId++, name: 'Usman Ali',  interested: 1500 },
  ];
}
render();
