/* ============================================================
   SahayakBridge (सहायक ब्रिज) — app.js (v2 Vendor-Split + 1/2/3 Buyers)
   100% Vanilla JS · Zero-Backend · localStorage State
   ============================================================ */

'use strict';

// ─────────────────────────────────────────────────────────────
// 1. SEED DATA, VENDORS & STATE
// ─────────────────────────────────────────────────────────────

const ROOMS = {
  '102': { names: ['Priya', 'Nisha'], residents: ['Priya', 'Nisha'] },
  '104': { names: ['Arjun', 'Dev'], residents: ['Arjun', 'Dev'] },
  '205': { names: ['Sneha', 'Meera', 'Ritu'], residents: ['Sneha', 'Meera', 'Ritu'] },
  '302': { names: ['Sahil', 'Rohan', 'Kabir'], residents: ['Sahil', 'Rohan', 'Kabir'] },
};

// Each item belongs strictly to either 'tiffin' (Eatables) or 'laundry' (Kapde)
const ITEMS = [
  { id: 'thali', vendor: 'tiffin', emoji: '🍛', nameHi: 'थाली', nameEn: 'Special Thali', price: 80, aliases: ['thali', 'thaali', 'special thali', 'खाना', 'bhaat', 'dal chawal'] },
  { id: 'roti', vendor: 'tiffin', emoji: '🫓', nameHi: 'एक्स्ट्रा रोटी', nameEn: 'Extra Roti', price: 10, aliases: ['roti', 'chapati', 'extra roti', 'bread'] },
  { id: 'laundry', vendor: 'laundry', emoji: '👔', nameHi: 'कपड़े लॉन्ड्री', nameEn: 'Laundry/Press', price: 15, aliases: ['kapde', 'kapada', 'laundry', 'press', 'dhulai', 'wash', 'jeans'] },
  { id: 'chai', vendor: 'tiffin', emoji: '🍵', nameHi: 'मसाला चाय', nameEn: 'Masala Chai', price: 20, aliases: ['chai', 'chay', 'tea', 'masala chai', 'cutting'] },
  { id: 'maggi', vendor: 'tiffin', emoji: '🍜', nameHi: 'मैगी', nameEn: 'Maggi', price: 40, aliases: ['maggi', 'noodles', 'magi', 'maggie'] },
  { id: 'water', vendor: 'tiffin', emoji: '💧', nameHi: 'वाटर कैन', nameEn: 'Water Can', price: 50, aliases: ['water', 'paani', 'water can', 'jal'] },
  { id: 'coffee', vendor: 'tiffin', emoji: '☕', nameHi: 'कोल्ड कॉफ़ी', nameEn: 'Cold Coffee', price: 50, aliases: ['coffee', 'cold coffee', 'cappuccino', 'cafe'] },
];

const DEFAULT_VENDORS = {
  tiffin: {
    key: 'tiffin',
    badge: '🍛 Tiffin Chacha (Eatables)',
    shortBadge: '🍛 Tiffin Chacha',
    name: 'Ram Prasad (Tiffin Chacha)',
    shortName: 'Tiffin Chacha',
    upi: 'tiffin.chacha@paytm',
  },
  laundry: {
    key: 'laundry',
    badge: '👔 Laundry Chacha (Kapde)',
    shortBadge: '👔 Laundry Chacha',
    name: 'Ramesh Kumar (Laundry Chacha)',
    shortName: 'Laundry Chacha',
    upi: 'laundry.chacha@okicici',
  },
};

const HINDI_NUMBERS = {
  'ek': 1, 'do': 2, 'teen': 3, 'char': 4, 'chaar': 4, 'paanch': 5, 'panch': 5,
  'chheh': 6, 'chhe': 6, 'saat': 7, 'aath': 8, 'nau': 9, 'das': 10,
  'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5, 'six': 6, 'seven': 7,
  'eight': 8, 'nine': 9, 'ten': 10, 'dozen': 12, 'barah': 12,
  'ek sau': 100, 'do sau': 200, 'teen sau': 300, 'chaar sau': 400, 'panch sau': 500,
  'sau': 100, 'hazaar': 1000,
};

const DEMOS = {
  1: {
    text: 'Room 302 mein Sahil aur Rohan ke 2 Special Thali aur 4 Extra Roti likh do',
    room: '302',
    buyers: ['Sahil', 'Rohan'], // Split between 2 people
    items: [{ id: 'thali', qty: 2 }, { id: 'roti', qty: 4 }],
    type: 'order',
  },
  2: {
    text: 'Room 104 Arjun ka 10 kapde press aur 2 jeans wash',
    room: '104',
    buyers: ['Arjun'], // 1 person only
    items: [{ id: 'laundry', qty: 12 }],
    type: 'order',
  },
  3: {
    text: '3 Maggi aur 3 Masala Chai for Room 205',
    room: '205',
    buyers: ['Sneha', 'Meera', 'Ritu'], // Split among all 3
    items: [{ id: 'maggi', qty: 3 }, { id: 'chai', qty: 3 }],
    type: 'order',
  },
  4: {
    text: 'Room 302 ne Tiffin Chacha ko 200 rupaye cash de diye',
    room: '302',
    vendor: 'tiffin',
    amount: 200,
    type: 'payment',
  },
};

const STATE = {
  selectedRoom: '302',
  selectedBuyers: ['Sahil', 'Rohan', 'Kabir'], // Who is buying the next order (1, 2, or 3 people)
  studentRoom: '302',
  itemCounts: {},
  voiceActive: false,
  recognition: null,
  waveAnimFrame: null,
  currentOrderJson: null,
  ledger: {},
  balances: {},        // { roomId: { residentName: totalNet } }
  vendorBalances: {},  // { roomId: { tiffin: { total, byResident }, laundry: { total, byResident } } }
  activityCount: 0,
};

const STORAGE_KEY = 'sahayakbridge_state_v2';
const VENDOR_STORAGE_KEY = 'sahayakbridge_vendors_v2';

// ─────────────────────────────────────────────────────────────
// 2. LOCALSTORAGE & SEED DATA
// ─────────────────────────────────────────────────────────────

function getItemVendor(itemId) {
  const item = ITEMS.find(x => x.id === itemId);
  return item ? item.vendor : 'tiffin';
}

function getSavedVendors() {
  try {
    const saved = localStorage.getItem(VENDOR_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        tiffin: { ...DEFAULT_VENDORS.tiffin, ...(parsed.tiffin || {}) },
        laundry: { ...DEFAULT_VENDORS.laundry, ...(parsed.laundry || {}) },
      };
    }
  } catch (e) { /* ignore */ }
  return JSON.parse(JSON.stringify(DEFAULT_VENDORS));
}

function saveCustomVendorUpi(vendorKey, newUpi, newName) {
  const vendors = getSavedVendors();
  if (!vendors[vendorKey]) return;
  vendors[vendorKey].upi = newUpi.trim();
  vendors[vendorKey].name = newName.trim();
  vendors[vendorKey].shortName = newName.trim().split('(')[0].trim() || newName.trim();
  try {
    localStorage.setItem(VENDOR_STORAGE_KEY, JSON.stringify(vendors));
  } catch (e) { /* ignore */ }
}

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      STATE.ledger = parsed.ledger || {};
      STATE.activityCount = parsed.activityCount || 0;
    }
  } catch (e) { /* ignore */ }

  if (Object.keys(STATE.ledger).length === 0) {
    seedData();
  } else {
    for (const roomId in ROOMS) {
      recalcBalances(roomId);
    }
  }
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      ledger: STATE.ledger,
      activityCount: STATE.activityCount,
    }));
  } catch (e) { /* ignore */ }
}

function seedData() {
  const now = Date.now();

  // Room 302: Mix of 1-person, 2-person, and 3-person orders across Eatables & Laundry
  STATE.ledger['302'] = [
    createOrderEntry('302', [{ id: 'thali', qty: 3, price: 80 }, { id: 'roti', qty: 3, price: 10 }], ['Sahil', 'Rohan', 'Kabir'], now - 86400000 * 3, 'All 3 ordered dinner thali'),
    createOrderEntry('302', [{ id: 'laundry', qty: 6, price: 15 }], ['Sahil'], now - 86400000 * 2, 'Sahil personal laundry (1 person)'),
    createOrderEntry('302', [{ id: 'maggi', qty: 2, price: 40 }, { id: 'chai', qty: 2, price: 20 }], ['Rohan', 'Kabir'], now - 86400000 * 1, 'Rohan & Kabir late night snacks (2 people)'),
    createOrderEntry('302', [{ id: 'laundry', qty: 4, price: 15 }], ['Rohan', 'Kabir'], now - 3600000 * 6, 'Rohan & Kabir laundry press (2 people)'),
  ];

  // Room 104
  STATE.ledger['104'] = [
    createOrderEntry('104', [{ id: 'laundry', qty: 8, price: 15 }], ['Arjun'], now - 86400000 * 2, 'Arjun kapde press'),
    createOrderEntry('104', [{ id: 'thali', qty: 2, price: 80 }, { id: 'chai', qty: 2, price: 20 }], ['Arjun', 'Dev'], now - 86400000 * 1, 'Arjun & Dev lunch'),
  ];

  // Room 205
  STATE.ledger['205'] = [
    createOrderEntry('205', [{ id: 'maggi', qty: 2, price: 40 }], ['Sneha', 'Meera'], now - 86400000 * 1, 'Sneha & Meera Maggi'),
    createOrderEntry('205', [{ id: 'laundry', qty: 6, price: 15 }], ['Ritu'], now - 3600000 * 5, 'Ritu laundry'),
  ];

  STATE.ledger['102'] = [];

  for (const roomId in ROOMS) {
    recalcBalances(roomId);
  }
  saveState();
}

function createOrderEntry(roomId, rawItems, buyers, ts = Date.now(), rawText = '') {
  const validBuyers = (buyers && buyers.length > 0) ? buyers : [...ROOMS[roomId].residents];
  const itemsWithDetails = rawItems.map(i => {
    const meta = ITEMS.find(x => x.id === i.id);
    const vendor = meta ? meta.vendor : 'tiffin';
    const price = i.price !== undefined ? i.price : (meta ? meta.price : 0);
    return {
      id: i.id,
      qty: i.qty,
      price,
      vendor,
      name: meta ? `${meta.nameHi} (${meta.nameEn})` : i.id,
    };
  });

  const total = itemsWithDetails.reduce((s, i) => s + i.qty * i.price, 0);
  const split = computeSplitMap(total, validBuyers);

  // Determine dominant vendor or 'mixed'
  const vendorsInOrder = [...new Set(itemsWithDetails.map(i => i.vendor))];
  const vendor = vendorsInOrder.length === 1 ? vendorsInOrder[0] : 'tiffin';

  return {
    id: genId(),
    ts,
    room: roomId,
    type: 'order',
    vendor,
    buyers: validBuyers,
    raw: rawText,
    text: itemsWithDetails.map(i => `${i.qty}× ${i.name}`).join(', '),
    items: itemsWithDetails,
    total,
    split,
  };
}

function computeSplitMap(totalAmount, buyersList) {
  const buyers = (buyersList && buyersList.length > 0) ? buyersList : ['Roommate'];
  const base = Math.floor(totalAmount / buyers.length);
  const rem = totalAmount - base * buyers.length;
  const split = {};
  buyers.forEach((name, idx) => {
    split[name] = base + (idx < rem ? 1 : 0);
  });
  return split;
}

function genId() {
  return Math.random().toString(36).substr(2, 9);
}

// ─────────────────────────────────────────────────────────────
// 3. UI INITIALISATION
// ─────────────────────────────────────────────────────────────

function init() {
  loadState();
  STATE.selectedBuyers = [...ROOMS[STATE.selectedRoom].residents];
  renderRoomPills();
  renderItemGrid();
  updateLiveClock();
  setInterval(updateLiveClock, 1000);
  setStudentRoom(STATE.studentRoom);
  refreshActivityFeed();
  initSpeechRecognition();
  showToast('🚀 SahayakBridge ready! Select 1, 2, or 3 buyers & place an order.', 'info');
}

function updateLiveClock() {
  const el = document.getElementById('live-clock');
  if (el) {
    const now = new Date();
    el.textContent = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
  }
}

// ─────────────────────────────────────────────────────────────
// 4. ROOM PILLS + BUYER SPLIT SELECTOR (1, 2, OR 3 PEOPLE)
// ─────────────────────────────────────────────────────────────

function renderRoomPills() {
  const container = document.getElementById('room-pills');
  if (!container) return;
  container.innerHTML = '';

  Object.entries(ROOMS).forEach(([id, room]) => {
    const vBal = STATE.vendorBalances[id] || { tiffin: { total: 0 }, laundry: { total: 0 } };
    const totalOwed = getRoomBalance(id);
    const pill = document.createElement('div');
    pill.className = `room-pill ${id === STATE.selectedRoom ? 'selected' : ''}`;
    pill.id = `room-pill-${id}`;
    pill.onclick = () => selectRoom(id);
    pill.innerHTML = `
      <div class="room-number">${id}</div>
      <div class="room-names">
        <div class="text-xs font-bold text-gray-200">Room ${id}</div>
        <div>${room.names.join(', ')}</div>
        <div class="text-[9px] text-brand-muted mt-0.5">🍛 ₹${vBal.tiffin.total} · 👔 ₹${vBal.laundry.total}</div>
      </div>
      <div class="room-balance">₹${totalOwed}</div>
      <i class="fa-solid fa-chevron-right text-brand-muted text-xs"></i>
    `;
    container.appendChild(pill);
  });

  // Render the "Who is buying? (1, 2, or All)" selector right below the room pills
  const activeRoom = ROOMS[STATE.selectedRoom];
  if (activeRoom) {
    const buyerBox = document.createElement('div');
    buyerBox.className = 'mt-2 p-2.5 rounded-xl border border-orange-500/30 bg-orange-950/20';

    const residents = activeRoom.residents;
    // Ensure selectedBuyers only contains residents of the current room
    STATE.selectedBuyers = STATE.selectedBuyers.filter(b => residents.includes(b));
    if (STATE.selectedBuyers.length === 0) STATE.selectedBuyers = [...residents];

    const presetButtonsHtml = `
      <div class="flex gap-1 mb-2">
        <button type="button" onclick="setBuyerPreset(1)"
          class="flex-1 py-1 px-1.5 rounded-lg text-[10px] font-bold border transition-all ${STATE.selectedBuyers.length === 1
        ? 'bg-orange-500 text-white border-orange-400'
        : 'bg-brand-darker text-brand-muted border-brand-border hover:text-gray-200'
      }">👤 1 Person</button>
        <button type="button" onclick="setBuyerPreset(2)"
          class="flex-1 py-1 px-1.5 rounded-lg text-[10px] font-bold border transition-all ${STATE.selectedBuyers.length === 2
        ? 'bg-orange-500 text-white border-orange-400'
        : 'bg-brand-darker text-brand-muted border-brand-border hover:text-gray-200'
      }">👥 Split by 2</button>
        ${residents.length >= 3 ? `
        <button type="button" onclick="setBuyerPreset(3)"
          class="flex-1 py-1 px-1.5 rounded-lg text-[10px] font-bold border transition-all ${STATE.selectedBuyers.length === 3
          ? 'bg-orange-500 text-white border-orange-400'
          : 'bg-brand-darker text-brand-muted border-brand-border hover:text-gray-200'
        }">🏠 All 3</button>` : ''}
      </div>
    `;

    const residentChipsHtml = residents.map(name => {
      const isSelected = STATE.selectedBuyers.includes(name);
      return `<button type="button" onclick="toggleBuyer('${name}')"
        class="flex-1 py-1.5 px-2 rounded-lg text-[11px] font-bold border transition-all flex items-center justify-center gap-1 ${isSelected
          ? 'bg-orange-500/20 border-orange-500 text-orange-300'
          : 'bg-brand-card border-brand-border text-brand-muted opacity-60 hover:opacity-100'
        }">
        <i class="fa-solid ${isSelected ? 'fa-check-circle text-orange-400' : 'fa-circle text-gray-600'} text-[9px]"></i>
        <span>${name}</span>
      </button>`;
    }).join('');

    const splitSummaryText = STATE.selectedBuyers.length === 1
      ? `100% billed only to ${STATE.selectedBuyers[0]}`
      : `Splitting equally among ${STATE.selectedBuyers.length}: ${STATE.selectedBuyers.join(' & ')}`;

    buyerBox.innerHTML = `
      <div class="text-[10px] font-bold text-orange-300 mb-1.5 flex items-center justify-between">
        <span><i class="fa-solid fa-user-check mr-1"></i>किसका ऑर्डर है? / Who is buying?</span>
        <span class="text-[9px] text-brand-muted">Tap names</span>
      </div>
      ${presetButtonsHtml}
      <div class="flex gap-1.5">${residentChipsHtml}</div>
      <div class="text-[10px] text-orange-200/80 mt-1.5 text-center font-medium">${splitSummaryText}</div>
    `;
    container.appendChild(buyerBox);
  }
}

function selectRoom(id) {
  STATE.selectedRoom = id;
  STATE.selectedBuyers = [...(ROOMS[id]?.residents || [])];
  renderRoomPills();
  showToast(`Room ${id} selected — Choose 1, 2, or all buyers below`, 'info');
}

function toggleBuyer(name) {
  const residents = ROOMS[STATE.selectedRoom]?.residents || [];
  if (!residents.includes(name)) return;

  if (STATE.selectedBuyers.includes(name)) {
    if (STATE.selectedBuyers.length === 1) {
      showToast('At least 1 person must be selected for the order!', 'warning');
      return;
    }
    STATE.selectedBuyers = STATE.selectedBuyers.filter(n => n !== name);
  } else {
    STATE.selectedBuyers.push(name);
  }
  renderRoomPills();
}

function setBuyerPreset(count) {
  const residents = ROOMS[STATE.selectedRoom]?.residents || [];
  STATE.selectedBuyers = residents.slice(0, Math.min(count, residents.length));
  renderRoomPills();
}

function getRoomBalance(roomId) {
  const vBal = STATE.vendorBalances[roomId];
  if (!vBal) return 0;
  return (vBal.tiffin?.total || 0) + (vBal.laundry?.total || 0);
}

// ─────────────────────────────────────────────────────────────
// 5. ITEM GRID
// ─────────────────────────────────────────────────────────────

function renderItemGrid() {
  const grid = document.getElementById('item-grid');
  if (!grid) return;
  grid.innerHTML = '';
  ITEMS.forEach(item => {
    STATE.itemCounts[item.id] = STATE.itemCounts[item.id] || 0;
    const vendorTag = item.vendor === 'laundry'
      ? '<span class="text-[8px] px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-300 border border-blue-500/30">👔 Laundry Chacha</span>'
      : '<span class="text-[8px] px-1.5 py-0.5 rounded bg-orange-500/15 text-orange-300 border border-orange-500/30">🍛 Tiffin Chacha</span>';

    const card = document.createElement('div');
    card.className = `item-card ${STATE.itemCounts[item.id] > 0 ? 'has-count' : ''}`;
    card.id = `item-card-${item.id}`;
    card.innerHTML = `
      <div class="item-badge" id="badge-${item.id}">${STATE.itemCounts[item.id]}</div>
      <div class="item-emoji">${item.emoji}</div>
      <div class="item-name-hi">${item.nameHi}</div>
      <div class="item-name-en">${item.nameEn}</div>
      ${vendorTag}
      <div class="item-price">₹${item.price}</div>
      <div class="item-counter">
        <button class="counter-btn" onclick="event.stopPropagation(); changeCount('${item.id}', -1)">−</button>
        <span class="counter-value" id="count-${item.id}">${STATE.itemCounts[item.id]}</span>
        <button class="counter-btn" onclick="event.stopPropagation(); changeCount('${item.id}', 1)">+</button>
      </div>
    `;
    card.onclick = () => changeCount(item.id, 1);
    grid.appendChild(card);
  });
}

function changeCount(itemId, delta) {
  STATE.itemCounts[itemId] = Math.max(0, (STATE.itemCounts[itemId] || 0) + delta);
  const countEl = document.getElementById(`count-${itemId}`);
  const badgeEl = document.getElementById(`badge-${itemId}`);
  const cardEl = document.getElementById(`item-card-${itemId}`);
  if (countEl) countEl.textContent = STATE.itemCounts[itemId];
  if (badgeEl) badgeEl.textContent = STATE.itemCounts[itemId];
  if (cardEl) {
    cardEl.classList.toggle('has-count', STATE.itemCounts[itemId] > 0);
  }
}

function resetItemCounts() {
  ITEMS.forEach(i => { STATE.itemCounts[i.id] = 0; });
  renderItemGrid();
}

// ─────────────────────────────────────────────────────────────
// 6. VOICE RECOGNITION & WAVEFORM
// ─────────────────────────────────────────────────────────────

function initSpeechRecognition() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) return;

  STATE.recognition = new SR();
  STATE.recognition.continuous = true;
  STATE.recognition.interimResults = true;
  STATE.recognition.lang = 'en-IN';
  STATE.recognition.maxAlternatives = 3;

  let silenceTimer = null;
  let accumulatedText = '';

  STATE.recognition.onstart = () => {
    STATE.voiceActive = true;
    accumulatedText = '';
    updateMicUI(true);
    startWaveAnimation();
  };

  STATE.recognition.onresult = (e) => {
    let interimText = '';
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const t = e.results[i][0].transcript;
      if (e.results[i].isFinal) accumulatedText += ' ' + t;
      else interimText += t;
    }

    const display = (accumulatedText + ' ' + interimText).trim();
    const transcriptEl = document.getElementById('voice-transcript');
    if (transcriptEl) {
      transcriptEl.textContent = display;
      transcriptEl.classList.remove('hidden');
    }

    clearTimeout(silenceTimer);
    silenceTimer = setTimeout(() => {
      if (display) processHinglishText(display, 'voice');
      stopVoice();
    }, 3000);
  };

  STATE.recognition.onerror = (e) => {
    stopVoice();
    if (e.error !== 'no-speech') showToast('Voice error: ' + e.error + '. Use manual input.', 'warning');
  };

  STATE.recognition.onend = () => stopVoice();
}

function toggleVoice() {
  STATE.voiceActive ? stopVoice() : startVoice();
}

function startVoice() {
  if (!STATE.recognition) {
    showToast('Speech recognition not supported. Use manual input.', 'warning');
    return;
  }
  try { STATE.recognition.start(); } catch (e) { }
}

function stopVoice() {
  STATE.voiceActive = false;
  updateMicUI(false);
  stopWaveAnimation();
  if (STATE.recognition) {
    try { STATE.recognition.stop(); } catch (e) { }
  }
}

function updateMicUI(active) {
  const btn = document.getElementById('mic-btn');
  const icon = document.getElementById('mic-icon');
  const stat = document.getElementById('mic-status');
  const wave = document.getElementById('voice-wave-canvas');

  if (active) {
    btn?.classList.add('listening');
    if (icon) icon.className = 'fa-solid fa-stop text-white text-2xl';
    if (stat) {
      stat.innerHTML = `<div class="text-xs font-semibold text-red-400 font-devanagari animate-pulse">🔴 सुन रहा हूँ... (Listening)</div>
        <div class="text-[10px] text-brand-muted">Speak now in Hindi/Hinglish</div>`;
    }
    if (wave) wave.style.opacity = '1';
  } else {
    btn?.classList.remove('listening');
    if (icon) icon.className = 'fa-solid fa-microphone text-white text-2xl';
    if (stat) {
      stat.innerHTML = `<div class="text-xs font-semibold text-orange-300 font-devanagari">माइक दबाओ और बोलो</div>
        <div class="text-[10px] text-brand-muted">Press mic & speak in Hindi/English</div>`;
    }
    if (wave) wave.style.opacity = '0';
  }
}

function startWaveAnimation() {
  const canvas = document.getElementById('voice-wave-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let frame = 0;

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = 'rgba(255,107,53,0.8)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let x = 0; x < canvas.width; x++) {
      const freq = 3 + Math.sin(frame * 0.05) * 2;
      const amp = 10 + Math.sin(frame * 0.03 + x * 0.1) * 8;
      const y = canvas.height / 2 + Math.sin(x * freq * 0.05 + frame * 0.15) * amp;
      x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();
    frame++;
    STATE.waveAnimFrame = requestAnimationFrame(draw);
  }
  draw();
}

function stopWaveAnimation() {
  if (STATE.waveAnimFrame) {
    cancelAnimationFrame(STATE.waveAnimFrame);
    STATE.waveAnimFrame = null;
  }
  const canvas = document.getElementById('voice-wave-canvas');
  if (canvas) canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
}

// ─────────────────────────────────────────────────────────────
// 7. HINGLISH NLP PARSER (DETECTS ROOM, BUYERS, VENDOR & ITEMS)
// ─────────────────────────────────────────────────────────────

function parseHinglish(text) {
  const lower = text.toLowerCase().trim();
  const log = [];

  log.push({ type: 'info', msg: `[INPUT] "${text}"` });
  log.push({ type: 'hinglish', msg: `[LANG-DETECT] Hinglish/Hindi detected — running bilingual tokenizer` });

  // 1. Room & Resident Name Detection
  let detectedRoom = null;
  const roomMatch = lower.match(/room\s*(\d{3})/i) || lower.match(/\b(102|104|205|302)\b/);
  if (roomMatch && ROOMS[roomMatch[1]]) {
    detectedRoom = roomMatch[1];
  }

  // Check if specific resident names were spoken in the text
  let mentionedBuyers = [];
  for (const [rId, rObj] of Object.entries(ROOMS)) {
    rObj.residents.forEach(resName => {
      if (new RegExp(`\\b${resName.toLowerCase()}\\b`, 'i').test(lower)) {
        if (!detectedRoom) detectedRoom = rId;
        if (detectedRoom === rId && !mentionedBuyers.includes(resName)) {
          mentionedBuyers.push(resName);
        }
      }
    });
  }

  if (!detectedRoom) detectedRoom = STATE.selectedRoom;
  log.push({ type: 'success', msg: `[ROOM] Resolved: Room ${detectedRoom}` });

  // Determine buyers for this order (mentioned in text OR currently selected on Side A)
  const buyers = mentionedBuyers.length > 0
    ? mentionedBuyers
    : (detectedRoom === STATE.selectedRoom && STATE.selectedBuyers.length > 0
      ? [...STATE.selectedBuyers]
      : [...ROOMS[detectedRoom].residents]);

  log.push({
    type: 'info',
    msg: `[BUYERS] ${buyers.length === 1 ? `Individual order (${buyers[0]} only)` : `Split among ${buyers.length} (${buyers.join(', ')})`}`,
  });

  // 2. Payment Detection
  const paymentMatch = lower.match(/(\d+|[a-z\s]+)\s*(rupay?e?|rs\.?|₹|bucks?)/i);
  const hasPaid = /(de diye|paid|diya|payment|cash|upi|bheja)/i.test(lower);
  if (paymentMatch && hasPaid) {
    let amount = parseInt(paymentMatch[1], 10);
    if (isNaN(amount)) amount = resolveHindiNumber(paymentMatch[1].trim());
    const payVendor = /(laundry|kapde|press|dhulai)/i.test(lower) ? 'laundry' : 'tiffin';
    log.push({ type: 'success', msg: `[PAYMENT] ₹${amount} to ${payVendor === 'laundry' ? 'Laundry Chacha' : 'Tiffin Chacha'} for Room ${detectedRoom}` });
    return { type: 'payment', room: detectedRoom, vendor: payVendor, buyers, amount, log, raw: text };
  }

  // 3. Item & Quantity Extraction
  const parsedItems = [];
  ITEMS.forEach(item => {
    let itemMatched = false;
    let totalItemQty = 0;
    const sortedAliases = [...item.aliases].sort((a, b) => b.length - a.length);

    for (const alias of sortedAliases) {
      if (itemMatched) break;
      const regexStr = `(${Object.keys(HINDI_NUMBERS).join('|')}|\\d+)\\s*(${alias})`
        + `|(${alias})\\s*(${Object.keys(HINDI_NUMBERS).join('|')}|\\d+)`;
      const re = new RegExp(regexStr, 'gi');
      let m;
      while ((m = re.exec(lower)) !== null) {
        const rawQty = m[1] || m[4] || '1';
        totalItemQty += resolveQty(rawQty);
        itemMatched = true;
      }
    }

    if (!itemMatched) {
      const matchedAlias = sortedAliases.find(alias => new RegExp(`\\b${alias}\\b`, 'i').test(lower));
      if (matchedAlias) {
        totalItemQty = 1;
        itemMatched = true;
      }
    }

    if (itemMatched) {
      const qty = totalItemQty > 0 ? totalItemQty : 1;
      const vLabel = item.vendor === 'laundry' ? 'Laundry Chacha' : 'Tiffin Chacha';
      log.push({ type: 'success', msg: `[NLP] ${item.nameHi} (${item.nameEn}) × ${qty} → Payable to ${vLabel}` });
      parsedItems.push({ id: item.id, qty, price: item.price, vendor: item.vendor });
    }
  });

  if (parsedItems.length === 0) {
    log.push({ type: 'error', msg: '[PARSE] No items detected. Check input and try again.' });
    return { type: 'error', log, raw: text };
  }

  return { type: 'order', room: detectedRoom, buyers, items: parsedItems, log, raw: text };
}

function resolveQty(raw) {
  if (!raw) return 1;
  const cleanRaw = raw.toString().toLowerCase().trim();
  if (['water', 'the', 'a', 'an'].includes(cleanRaw)) return 1;
  const n = parseInt(cleanRaw, 10);
  if (!isNaN(n)) return n;
  for (const [word, val] of Object.entries(HINDI_NUMBERS)) {
    if (cleanRaw === word) return val;
  }
  return 1;
}

function resolveHindiNumber(str) {
  const lower = str.toLowerCase().trim();
  for (const [word, val] of Object.entries(HINDI_NUMBERS)) {
    if (lower.includes(word)) return val;
  }
  return parseInt(str, 10) || 0;
}

// ─────────────────────────────────────────────────────────────
// 8. ORDER PROCESSING & BRIDGE PIPELINE
// ─────────────────────────────────────────────────────────────

function processHinglishText(text, source = 'manual') {
  const parsed = parseHinglish(text);
  if (!parsed || parsed.type === 'error') {
    renderPipelineError(parsed?.log || [], text);
    return;
  }
  runBridgePipeline(parsed, source);
}

function processManualInput() {
  const input = document.getElementById('manual-input');
  if (!input) return;
  const text = input.value.trim();
  if (!text) {
    showToast('Kuch type karo pehle! / Please type something first.', 'warning');
    return;
  }
  processHinglishText(text, 'manual');
  input.value = '';
}

async function runBridgePipeline(parsed, source = 'voice') {
  setEngineStatus('⚙️ Processing...', 'yellow');

  activateStep(1);
  updatePipe1(parsed.raw);
  await delay(350);

  activateStep(2);
  renderConfidenceLog(parsed.log);
  await delay(500);

  let orderEntry = null;

  if (parsed.type === 'payment') {
    updatePipe2Payment(parsed);
    await delay(350);
    activateStep(3, true);
    updatePipe3Payment(parsed);
    await delay(350);
    orderEntry = finalizePayment(parsed);
  } else if (parsed.type === 'order') {
    updatePipe2Order(parsed);
    await delay(350);

    activateStep(3);
    const total = parsed.items.reduce((s, i) => s + i.qty * i.price, 0);
    const splitResult = computeSplitMap(total, parsed.buyers);
    updatePipe3Split(parsed, splitResult);
    await delay(350);
    orderEntry = finalizeOrder(parsed);
  }

  activateStep(4);
  updatePipe4(orderEntry);

  STATE.currentOrderJson = orderEntry;
  renderJsonPreview(orderEntry);

  renderRoomPills();
  updateStudentDashboard();
  addActivityEvent(parsed, orderEntry);

  setEngineStatus('✅ Done', 'green');
  setTimeout(() => setEngineStatus('Idle', 'purple'), 3000);

  showToast(
    parsed.type === 'payment'
      ? `💰 Payment of ₹${parsed.amount} recorded for Room ${parsed.room}!`
      : `✅ Order added for ${parsed.buyers.join(', ')} (Room ${parsed.room})!`,
    'success'
  );
}

function activateStep(n, skipActive = false) {
  for (let i = 1; i <= 4; i++) {
    const el = document.getElementById(`pipe-step-${i}`);
    if (!el) continue;
    if (i < n) {
      el.classList.remove('active');
      el.classList.add('done');
    } else if (i === n && !skipActive) {
      el.classList.add('active');
      el.classList.remove('done');
    } else {
      el.classList.remove('active', 'done');
    }
  }
}

function updatePipe1(text) {
  const el = document.getElementById('pipe1-content');
  if (el) el.innerHTML = `<span class="text-orange-300 font-devanagari">"${text}"</span>`;
}

function updatePipe2Order(parsed) {
  const el = document.getElementById('pipe2-content');
  if (!el) return;
  const itemsHtml = parsed.items.map(i => {
    const item = ITEMS.find(x => x.id === i.id);
    const vBadge = (item?.vendor === 'laundry')
      ? '<span class="text-[9px] text-blue-300">(👔 Laundry Chacha)</span>'
      : '<span class="text-[9px] text-orange-300">(🍛 Tiffin Chacha)</span>';
    return `<div class="flex items-center gap-1.5 py-0.5">
      <span>${item?.emoji || '📦'}</span>
      <span class="text-purple-300 font-semibold">${item ? item.nameEn : i.id}</span>
      ${vBadge}
      <span class="text-brand-muted ml-auto">×${i.qty} = ₹${i.qty * i.price}</span>
    </div>`;
  }).join('');
  el.innerHTML = `
    <div class="mb-1 text-purple-400 font-semibold text-[10px]">
      Room <span class="text-white">${parsed.room}</span> · Buyers: <span class="text-orange-300">${parsed.buyers.join(', ')}</span>
    </div>
    ${itemsHtml}`;
}

function updatePipe2Payment(parsed) {
  const el = document.getElementById('pipe2-content');
  const vName = parsed.vendor === 'laundry' ? '👔 Laundry Chacha' : '🍛 Tiffin Chacha';
  if (el) el.innerHTML = `
    <div class="text-green-400 font-semibold">💰 Payment to ${vName}</div>
    <div class="text-white mt-1">Room ${parsed.room} → ₹${parsed.amount} received</div>`;
}

function updatePipe3Split(parsed, split) {
  const el = document.getElementById('pipe3-content');
  if (!el) return;
  const total = parsed.items.reduce((s, i) => s + i.qty * i.price, 0);
  const count = Object.keys(split).length;
  const modeLabel = count === 1
    ? `Individual Order (1 Person Only)`
    : `Split equally among ${count} selected people`;

  const html = Object.entries(split).map(([name, amt]) =>
    `<div class="flex justify-between py-0.5 border-b border-brand-border last:border-0">
      <span class="text-gray-300">${name}</span>
      <span class="text-yellow-300 font-bold">₹${amt}</span>
    </div>`).join('');
  el.innerHTML = `<div class="text-[10px] text-orange-300 font-semibold mb-1">${modeLabel} — Total ₹${total}</div>${html}`;
}

function updatePipe3Payment(parsed) {
  const el = document.getElementById('pipe3-content');
  const vName = parsed.vendor === 'laundry' ? 'Laundry Chacha' : 'Tiffin Chacha';
  if (el) el.innerHTML = `<div class="text-green-300">₹${parsed.amount} deducted from Room ${parsed.room}'s ${vName} Khata</div>`;
}

function updatePipe4(entry) {
  const el = document.getElementById('pipe4-content');
  if (!el) return;
  el.innerHTML = `
    <div class="flex items-center gap-2 text-blue-300">
      <i class="fa-solid fa-check-circle text-green-400"></i>
      <span>Vendor-specific Khata updated · Audio ready</span>
    </div>
    <button onclick="speakHindiReceipt()" class="mt-1.5 px-3 py-1 rounded-lg bg-indigo-600/30 text-indigo-200 text-[10px] font-bold border border-indigo-500/30 hover:bg-indigo-600/50 transition-colors">
      <i class="fa-solid fa-volume-high text-[9px]"></i> सुनो रसीद / Play Audio Receipt
    </button>`;
}

function renderPipelineError(log, text) {
  activateStep(1);
  updatePipe1(text);
  renderConfidenceLog(log);
  const el2 = document.getElementById('pipe2-content');
  if (el2) el2.innerHTML = `<div class="text-red-400">⚠️ Could not parse items. Try again or use icon grid.</div>`;
  setEngineStatus('Error', 'red');
  showToast('Koi item nahi mila. Icon se order karo ya dobara bolo.', 'warning');
}

function renderConfidenceLog(logLines) {
  const el = document.getElementById('confidence-log');
  if (!el) return;
  el.innerHTML = '';
  logLines.forEach((line, i) => {
    setTimeout(() => {
      const div = document.createElement('div');
      div.className = `log-line log-${line.type}`;
      div.textContent = line.msg;
      el.appendChild(div);
      el.scrollTop = el.scrollHeight;
    }, i * 70);
  });
}

function renderJsonPreview(entry) {
  const el = document.getElementById('json-preview');
  if (!el || !entry) return;
  el.innerHTML = syntaxHighlightJson(JSON.stringify(entry, null, 2));
}

function syntaxHighlightJson(json) {
  return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, match => {
    let cls = 'text-blue-300';
    if (/^"/.test(match)) cls = /:$/.test(match) ? 'text-purple-300' : 'text-green-300';
    else if (/true|false/.test(match)) cls = 'text-yellow-300';
    else if (/null/.test(match)) cls = 'text-red-400';
    else cls = 'text-orange-300';
    return `<span class="${cls}">${match}</span>`;
  });
}

function setEngineStatus(text, color) {
  const el = document.getElementById('engine-status');
  if (!el) return;
  const colors = {
    yellow: 'text-yellow-300 border-yellow-500/30 bg-yellow-500/10',
    green: 'text-green-300 border-green-500/30 bg-green-500/10',
    red: 'text-red-300 border-red-500/30 bg-red-500/10',
    purple: 'text-purple-300 border-purple-500/30 bg-purple-500/10',
  };
  el.className = `ml-auto px-2 py-1 rounded-lg border text-[10px] font-medium flex items-center gap-1 ${colors[color] || colors.purple}`;
  el.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-current animate-pulse inline-block"></span>${text}`;
}

// ─────────────────────────────────────────────────────────────
// 9. FINALISE ORDERS, PAYMENTS & VENDOR-SEPARATED BALANCES
// ─────────────────────────────────────────────────────────────

function finalizeOrder(parsed) {
  // If user added both Eatables and Laundry in one order, split into vendor-specific entries so Tiffin Chacha & Laundry Chacha stay 100% separate
  const tiffinItems = parsed.items.filter(i => getItemVendor(i.id) === 'tiffin');
  const laundryItems = parsed.items.filter(i => getItemVendor(i.id) === 'laundry');

  if (!STATE.ledger[parsed.room]) STATE.ledger[parsed.room] = [];
  let lastCreated = null;

  if (tiffinItems.length > 0) {
    lastCreated = createOrderEntry(parsed.room, tiffinItems, parsed.buyers, Date.now(), parsed.raw);
    STATE.ledger[parsed.room].unshift(lastCreated);
  }
  if (laundryItems.length > 0) {
    lastCreated = createOrderEntry(parsed.room, laundryItems, parsed.buyers, Date.now() + 1, parsed.raw);
    STATE.ledger[parsed.room].unshift(lastCreated);
  }

  recalcBalances(parsed.room);
  saveState();
  return lastCreated;
}

function finalizePayment(parsed) {
  const vendor = parsed.vendor || 'tiffin';
  const residents = (parsed.buyers && parsed.buyers.length > 0)
    ? parsed.buyers
    : (ROOMS[parsed.room]?.residents || []);
  const num = residents.length || 1;
  const base = Math.floor(parsed.amount / num);
  const rem = parsed.amount - base * num;
  const split = {};
  residents.forEach((name, idx) => {
    split[name] = -(base + (idx < rem ? 1 : 0));
  });

  const vLabel = vendor === 'laundry' ? 'Laundry Chacha' : 'Tiffin Chacha';
  const entry = {
    id: genId(),
    ts: Date.now(),
    room: parsed.room,
    type: 'payment',
    vendor,
    buyers: residents,
    raw: parsed.raw,
    text: `Paid ₹${parsed.amount} to ${vLabel}`,
    amount: parsed.amount,
    total: -parsed.amount,
    split,
  };

  if (!STATE.ledger[parsed.room]) STATE.ledger[parsed.room] = [];
  STATE.ledger[parsed.room].unshift(entry);
  recalcBalances(parsed.room);
  saveState();
  return entry;
}

// Calculates exact separate balances for Tiffin Chacha vs. Laundry Chacha per resident
function recalcBalances(roomId) {
  const residents = ROOMS[roomId]?.residents || [];
  const overall = {};
  const vBal = {
    tiffin: { total: 0, byResident: {} },
    laundry: { total: 0, byResident: {} },
  };

  residents.forEach(r => {
    overall[r] = 0;
    vBal.tiffin.byResident[r] = 0;
    vBal.laundry.byResident[r] = 0;
  });

  (STATE.ledger[roomId] || []).forEach(entry => {
    const buyers = (entry.buyers && entry.buyers.length > 0) ? entry.buyers : residents;

    if (entry.type === 'order') {
      // Group items in this entry by vendor so eatables only go to Tiffin Chacha and kapde only go to Laundry Chacha
      const byVendor = { tiffin: 0, laundry: 0 };
      (entry.items || []).forEach(it => {
        const vKey = it.vendor || getItemVendor(it.id);
        byVendor[vKey] = (byVendor[vKey] || 0) + (it.qty * it.price);
      });

      ['tiffin', 'laundry'].forEach(vKey => {
        if (byVendor[vKey] > 0) {
          const splitMap = computeSplitMap(byVendor[vKey], buyers);
          Object.entries(splitMap).forEach(([rName, amt]) => {
            if (vBal[vKey].byResident[rName] !== undefined) {
              vBal[vKey].byResident[rName] += amt;
              overall[rName] += amt;
            }
          });
        }
      });
    } else if (entry.type === 'payment') {
      const vKey = entry.vendor || 'tiffin';
      if (entry.split) {
        Object.entries(entry.split).forEach(([rName, amt]) => {
          if (vBal[vKey]?.byResident[rName] !== undefined) {
            vBal[vKey].byResident[rName] += amt; // amt is negative
            overall[rName] += amt;
          }
        });
      }
    }
  });

  // Clamp vendor totals at 0 minimum
  ['tiffin', 'laundry'].forEach(vKey => {
    const netSum = Object.values(vBal[vKey].byResident).reduce((s, v) => s + v, 0);
    vBal[vKey].total = Math.max(0, netSum);
  });

  STATE.balances[roomId] = overall;
  STATE.vendorBalances[roomId] = vBal;
}

// Allows clicking the Split badge on any row in the Ledger Table to change between 1, 2, or All 3 buyers!
function cycleEntryBuyers(roomId, entryId) {
  const entries = STATE.ledger[roomId] || [];
  const entry = entries.find(e => e.id === entryId);
  const residents = ROOMS[roomId]?.residents || [];
  if (!entry || residents.length === 0) return;

  // Build all possible combinations: [All], [Person 1], [Person 2], [Person 3], [Person 1+2], [Person 2+3]
  const combos = [residents];
  residents.forEach(r => combos.push([r]));
  if (residents.length >= 2) {
    combos.push([residents[0], residents[1]]);
    if (residents.length >= 3) {
      combos.push([residents[1], residents[2]]);
      combos.push([residents[0], residents[2]]);
    }
  }

  const currentKey = (entry.buyers || residents).join(',');
  const idx = combos.findIndex(c => c.join(',') === currentKey);
  const nextBuyers = combos[(idx + 1) % combos.length];

  entry.buyers = [...nextBuyers];
  if (entry.type === 'order') {
    entry.split = computeSplitMap(entry.total, entry.buyers);
  }
  recalcBalances(roomId);
  saveState();
  renderRoomPills();
  updateStudentDashboard();
  showToast(`Split updated → ${entry.buyers.join(' & ')} (${entry.buyers.length === 1 ? '1 Person' : `${entry.buyers.length} People`})`, 'info');
}

// ─────────────────────────────────────────────────────────────
// 10. VENDOR SUBMIT (ICON GRID)
// ─────────────────────────────────────────────────────────────

function submitVendorOrder() {
  const items = ITEMS.filter(i => (STATE.itemCounts[i.id] || 0) > 0)
    .map(i => ({ id: i.id, qty: STATE.itemCounts[i.id], price: i.price, vendor: i.vendor }));

  if (items.length === 0) {
    showToast('Pehle items add karo! / Add items first using the icon grid.', 'warning');
    return;
  }

  const buyers = STATE.selectedBuyers.length > 0
    ? [...STATE.selectedBuyers]
    : [...ROOMS[STATE.selectedRoom].residents];

  const text = items.map(i => {
    const item = ITEMS.find(x => x.id === i.id);
    return `${i.qty} ${item ? item.nameEn : i.id}`;
  }).join(', ');

  const parsed = {
    type: 'order',
    room: STATE.selectedRoom,
    buyers,
    items,
    raw: `[Icon Order] Room ${STATE.selectedRoom} (${buyers.join(', ')}): ${text}`,
    log: [
      { type: 'info', msg: `[INPUT] Icon Grid Order — Room ${STATE.selectedRoom}` },
      { type: 'info', msg: `[BUYERS] ${buyers.length === 1 ? `1 Person (${buyers[0]})` : `Split among ${buyers.length} (${buyers.join(', ')})`}` },
      ...items.map(i => {
        const item = ITEMS.find(x => x.id === i.id);
        const vLabel = item?.vendor === 'laundry' ? 'Laundry Chacha' : 'Tiffin Chacha';
        return { type: 'success', msg: `[ITEM] ${item?.nameEn} × ${i.qty} = ₹${i.qty * i.price} → ${vLabel}` };
      }),
    ],
  };

  runBridgePipeline(parsed, 'icon');
  resetItemCounts();
}

// ─────────────────────────────────────────────────────────────
// 11. STUDENT DASHBOARD (SIDE B)
// ─────────────────────────────────────────────────────────────

function setStudentRoom(id) {
  STATE.studentRoom = id;

  document.querySelectorAll('.student-room-btn').forEach(btn => {
    btn.classList.remove('active-room', 'border-teal-500/40', 'bg-teal-500/10', 'text-teal-300');
    btn.classList.add('border-brand-border', 'bg-brand-card', 'text-brand-muted');
    btn.textContent = btn.textContent.replace(' ✓', '').trim();
  });

  const activeBtn = document.getElementById(`sroom-${id}`);
  if (activeBtn) {
    activeBtn.classList.remove('border-brand-border', 'bg-brand-card', 'text-brand-muted');
    activeBtn.classList.add('active-room', 'border-teal-500/40', 'bg-teal-500/10', 'text-teal-300');
    activeBtn.textContent = `Room ${id} ✓`;
  }

  const room = ROOMS[id];
  const headerSub = document.querySelector('#student-panel .sticky .text-brand-muted');
  if (headerSub && room) {
    headerSub.textContent = `Hostel Ledger · Room ${id} — ${room.names.join(', ')}`;
  }

  updateStudentDashboard();
}

function updateStudentDashboard() {
  const roomId = STATE.studentRoom;
  const room = ROOMS[roomId];
  if (!room) return;

  recalcBalances(roomId);

  const label = document.getElementById('ledger-room-label');
  if (label) label.textContent = `— Room ${roomId} (${room.names.join(', ')})`;

  // Update the 3 resident cards with total + vendor breakdown tooltip
  const slots = ['Sahil', 'rohan', 'kabir'];
  const balances = STATE.balances[roomId] || {};
  const vBal = STATE.vendorBalances[roomId] || { tiffin: { total: 0, byResident: {} }, laundry: { total: 0, byResident: {} } };

  slots.forEach((slotKey, idx) => {
    const card = document.getElementById(`balance-${slotKey}`);
    if (!card) return;
    const residentName = room.residents[idx];
    if (residentName) {
      card.classList.remove('hidden');
      const initialsEl = card.querySelector('span');
      const nameEl = card.querySelector('.text-brand-muted');
      if (initialsEl) initialsEl.textContent = residentName.slice(0, 2).toUpperCase();
      if (nameEl) {
        const tifAmt = Math.max(0, vBal.tiffin.byResident[residentName] || 0);
        const lauAmt = Math.max(0, vBal.laundry.byResident[residentName] || 0);
        nameEl.innerHTML = `<div class="font-bold text-gray-200">${residentName}</div>
          <div class="text-[8px] text-brand-muted">🍛₹${tifAmt} · 👔₹${lauAmt}</div>`;
      }
      updateBalanceEl(slotKey, Math.max(0, balances[residentName] || 0));
    } else {
      card.classList.add('hidden');
    }
  });

  // Update Monthly Khata Box with Separate Clickable Vendor Pay Buttons
  const net = getRoomBalance(roomId);
  const tiffinDue = vBal.tiffin?.total || 0;
  const laundryDue = vBal.laundry?.total || 0;

  const totalEl = document.getElementById('monthly-total');
  const breakEl = document.getElementById('monthly-breakdown');
  if (totalEl) totalEl.textContent = `₹${net}`;
  if (breakEl) {
    breakEl.innerHTML = `
      <div class="flex flex-wrap gap-1.5 mt-1">
        <button onclick="openSettlementModal('tiffin')"
          class="px-2 py-1 rounded-lg bg-orange-500/15 border border-orange-500/40 text-orange-300 text-[10px] font-bold hover:bg-orange-500/25 transition-all">
          🍛 Pay Tiffin Chacha: ₹${tiffinDue}
        </button>
        <button onclick="openSettlementModal('laundry')"
          class="px-2 py-1 rounded-lg bg-blue-500/15 border border-blue-500/40 text-blue-300 text-[10px] font-bold hover:bg-blue-500/25 transition-all">
          👔 Pay Laundry Chacha: ₹${laundryDue}
        </button>
      </div>
    `;
  }

  renderLedgerTable(roomId);
}

function updateBalanceEl(key, amount) {
  const el = document.getElementById(`bal-${key}`);
  if (!el) return;
  el.textContent = `₹${amount}`;
  el.className = `text-sm font-black ${amount > 0 ? 'text-red-400' : 'text-green-400'}`;
}

function renderLedgerTable(roomId) {
  const tbody = document.getElementById('ledger-tbody');
  if (!tbody) return;
  const entries = STATE.ledger[roomId] || [];
  if (entries.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" class="text-center py-6 text-brand-muted italic">No entries yet. Place an order!</td></tr>`;
    return;
  }

  tbody.innerHTML = entries.slice(0, 20).map((e, idx) => {
    const time = new Date(e.ts).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    const isNew = idx === 0 && (Date.now() - e.ts) < 5000;
    const rowClass = `${e.type === 'payment' ? 'credit-row' : ''} ${isNew ? 'new-entry' : ''}`;

    const vBadge = e.vendor === 'laundry'
      ? '<span class="text-[8px] px-1 py-0.5 rounded bg-blue-500/15 text-blue-300 border border-blue-500/30 mr-1">👔 Laundry</span>'
      : '<span class="text-[8px] px-1 py-0.5 rounded bg-orange-500/15 text-orange-300 border border-orange-500/30 mr-1">🍛 Tiffin</span>';

    const buyers = e.buyers || Object.keys(e.split || {});
    const splitStr = e.split ? Object.entries(e.split).map(([n, v]) => `${n}: ₹${Math.abs(v)}`).join(', ') : '';
    const buyerLabel = buyers.length === 1
      ? `👤 ${buyers[0]}`
      : (buyers.length === 2 ? `👥 ${buyers.join('+')}` : `🏠 All ${buyers.length}`);

    const totalColor = e.type === 'payment' ? 'text-green-400' : 'text-red-400';
    const totalVal = e.type === 'payment' ? `-₹${e.amount}` : `₹${e.total}`;

    return `<tr class="${rowClass}">
      <td class="px-2 py-1.5 text-brand-muted whitespace-nowrap text-[9px]">${time}</td>
      <td class="px-2 py-1.5 text-gray-300">${vBadge}${e.text}</td>
      <td class="px-2 py-1.5 text-right font-bold ${totalColor}">${totalVal}</td>
      <td class="px-2 py-1.5 text-right">
        <button onclick="cycleEntryBuyers('${roomId}', '${e.id}')" title="Click to change who pays (${splitStr})"
          class="px-1.5 py-0.5 rounded bg-brand-darker border border-brand-border hover:border-orange-400 text-[9px] font-semibold text-orange-300 whitespace-nowrap transition-all">
          ${buyerLabel} ↻
        </button>
      </td>
    </tr>`;
  }).join('');
}

function clearLedger() {
  if (!confirm(`Clear all ledger entries for Room ${STATE.studentRoom}?`)) return;
  STATE.ledger[STATE.studentRoom] = [];
  recalcBalances(STATE.studentRoom);
  saveState();
  updateStudentDashboard();
  renderRoomPills();
  showToast(`Ledger cleared for Room ${STATE.studentRoom}`, 'info');
}

// ─────────────────────────────────────────────────────────────
// 12. SPEECH SYNTHESIS — HINDI AUDIO RECEIPT
// ─────────────────────────────────────────────────────────────

function speakHindiReceipt() {
  if (!window.speechSynthesis) {
    showToast('Speech synthesis not supported in this browser.', 'warning');
    return;
  }
  if (window.speechSynthesis.speaking) {
    window.speechSynthesis.cancel();
    showToast('Audio stopped 🔇', 'info');
    return;
  }

  const roomId = STATE.studentRoom;
  recalcBalances(roomId);
  const vBal = STATE.vendorBalances[roomId] || { tiffin: { total: 0 }, laundry: { total: 0 } };
  const tiffinDue = vBal.tiffin.total;
  const laundryDue = vBal.laundry.total;

  const text = `Room ${roomId} ki raseed. Tiffin Chacha ka khane ka hisaab ${tiffinDue} rupaye hai, aur Laundry Chacha ka kapde ka hisaab ${laundryDue} rupaye hai. Dhanyavaad!`;

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  const voices = window.speechSynthesis.getVoices();
  const hindiVoice = voices.find(v => v.lang === 'hi-IN') || voices.find(v => v.lang.startsWith('hi'));
  if (hindiVoice) utterance.voice = hindiVoice;
  utterance.lang = 'hi-IN';
  utterance.rate = 0.88;

  window.speechSynthesis.speak(utterance);
  showToast('🔊 Speaking vendor-wise Hindi receipt aloud!', 'info');
}

// ─────────────────────────────────────────────────────────────
// 13. VENDOR-SPECIFIC UPI SETTLEMENT MODAL
// ─────────────────────────────────────────────────────────────

let qrInstance = null;
let activeVendorKey = 'tiffin';
let editingUpi = false;

function detectRoomVendor(roomId) {
  const vBal = STATE.vendorBalances[roomId];
  if (!vBal) return 'tiffin';
  if (vBal.tiffin.total === 0 && vBal.laundry.total > 0) return 'laundry';
  const lastEntry = (STATE.ledger[roomId] || [])[0];
  if (lastEntry && lastEntry.vendor === 'laundry') return 'laundry';
  return 'tiffin';
}

function openSettlementModal(forceVendorKey = null) {
  const roomId = STATE.studentRoom;
  recalcBalances(roomId);
  activeVendorKey = forceVendorKey || detectRoomVendor(roomId);
  editingUpi = false;
  renderSettlementModalContent();

  const modal = document.getElementById('settlement-modal');
  modal.classList.add('show');
  modal.style.display = 'flex';
}

function selectSettlementVendor(vendorKey) {
  activeVendorKey = vendorKey;
  editingUpi = false;
  renderSettlementModalContent();
}

function toggleEditUpi() {
  editingUpi = !editingUpi;
  renderSettlementModalContent();
}

function saveManualUpi() {
  const upiInput = document.getElementById('manual-upi-input');
  const nameInput = document.getElementById('manual-name-input');
  if (!upiInput || !nameInput) return;

  const newUpi = upiInput.value.trim();
  const newName = nameInput.value.trim();
  if (!newUpi.includes('@')) {
    showToast('Please enter a valid UPI ID with @ (e.g. name@paytm)', 'warning');
    return;
  }

  saveCustomVendorUpi(activeVendorKey, newUpi, newName || 'Campus Vendor');
  editingUpi = false;
  renderSettlementModalContent();
  showToast('✅ UPI ID saved permanently!', 'success');
}

function renderSettlementModalContent() {
  const roomId = STATE.studentRoom;
  recalcBalances(roomId);
  const vBal = STATE.vendorBalances[roomId] || { tiffin: { total: 0, byResident: {} }, laundry: { total: 0, byResident: {} } };

  const vendors = getSavedVendors();
  const vendor = vendors[activeVendorKey] || vendors.tiffin;
  const currentVendorData = vBal[activeVendorKey] || { total: 0, byResident: {} };
  const net = currentVendorData.total;

  // Per-resident breakdown strictly for this vendor (Eatables OR Laundry)
  const residentBreakdown = Object.entries(currentVendorData.byResident)
    .map(([rName, amt]) => `${rName}: ₹${Math.max(0, amt)}`)
    .join(' · ');

  const refCode = `NSUT-${roomId}-${activeVendorKey.toUpperCase()}-OCT26`;

  document.getElementById('modal-room-label').textContent = `Room ${roomId} — ${vendor.badge}`;
  document.getElementById('modal-amount').textContent = `₹${net}`;
  document.getElementById('modal-split').textContent = `${vendor.shortName} Share: ${residentBreakdown}`;

  let detailsBox = document.getElementById('upi-details-box');
  if (!detailsBox) {
    const refEl = document.getElementById('modal-ref');
    if (refEl) {
      detailsBox = refEl.closest('.rounded-xl');
      if (detailsBox) detailsBox.id = 'upi-details-box';
    }
  }

  if (detailsBox) {
    const tiffinTotal = vBal.tiffin?.total || 0;
    const laundryTotal = vBal.laundry?.total || 0;

    const tabsHtml = `
      <div class="flex gap-2 mb-3">
        <button onclick="selectSettlementVendor('tiffin')"
          class="flex-1 py-2 px-2 rounded-xl text-[11px] font-bold border transition-all ${activeVendorKey === 'tiffin'
        ? 'bg-orange-500/20 border-orange-500 text-orange-300 shadow-md'
        : 'bg-brand-card border-brand-border text-brand-muted hover:text-gray-200'
      }">
          🍛 Tiffin Chacha (Eatables)<br><span class="text-xs font-black">₹${tiffinTotal}</span>
        </button>
        <button onclick="selectSettlementVendor('laundry')"
          class="flex-1 py-2 px-2 rounded-xl text-[11px] font-bold border transition-all ${activeVendorKey === 'laundry'
        ? 'bg-blue-500/20 border-blue-500 text-blue-300 shadow-md'
        : 'bg-brand-card border-brand-border text-brand-muted hover:text-gray-200'
      }">
          👔 Laundry Chacha (Kapde)<br><span class="text-xs font-black">₹${laundryTotal}</span>
        </button>
      </div>
    `;

    if (editingUpi) {
      detailsBox.innerHTML = `
        ${tabsHtml}
        <div class="flex flex-col gap-2 bg-brand-card p-2.5 rounded-lg border border-teal-500/30">
          <div class="text-[10px] font-bold text-teal-300">✏️ Edit ${vendor.shortBadge} UPI (Saves Permanently)</div>
          <input id="manual-upi-input" type="text" value="${vendor.upi}" placeholder="e.g. name@paytm"
            class="w-full bg-brand-darker border border-brand-border rounded-lg px-2.5 py-1.5 text-xs text-teal-300 font-mono focus:outline-none focus:border-teal-400" />
          <input id="manual-name-input" type="text" value="${vendor.name}" placeholder="Receiver Name"
            class="w-full bg-brand-darker border border-brand-border rounded-lg px-2.5 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-teal-400" />
          <div class="flex gap-2 mt-1">
            <button onclick="saveManualUpi()" class="flex-1 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-bold text-[11px]">
              💾 Save Permanently
            </button>
            <button onclick="toggleEditUpi()" class="px-3 py-1.5 rounded-lg border border-brand-border text-brand-muted hover:text-white text-[11px]">
              Cancel
            </button>
          </div>
        </div>
        <span id="modal-ref" class="hidden">${refCode}</span>
      `;
    } else {
      detailsBox.innerHTML = `
        ${tabsHtml}
        <div class="flex justify-between items-center mb-1">
          <span class="text-brand-muted">Payable To:</span>
          <span class="text-gray-100 font-bold">${vendor.name}</span>
        </div>
        <div class="flex justify-between items-center mb-1">
          <span class="text-brand-muted">UPI ID:</span>
          <div class="flex items-center gap-2">
            <span class="text-teal-300 font-mono">${vendor.upi}</span>
            <button onclick="toggleEditUpi()" class="text-[10px] px-1.5 py-0.5 rounded bg-teal-500/10 border border-teal-500/30 text-teal-300 hover:bg-teal-500/20">
              ✏️ Edit UPI
            </button>
          </div>
        </div>
        <div class="flex justify-between">
          <span class="text-brand-muted">Ref:</span>
          <span id="modal-ref" class="text-gray-200 font-mono">${refCode}</span>
        </div>
      `;
    }
  }

  const waText = buildWhatsAppText(roomId, net, currentVendorData.byResident, vendor);
  document.getElementById('whatsapp-card').textContent = waText;
  generateQR(net, roomId, vendor);
}

function closeSettlementModal() {
  const modal = document.getElementById('settlement-modal');
  modal.classList.remove('show');
  modal.style.display = 'none';
  qrInstance = null;
}

function generateQR(amount, roomId, vendorObj = null) {
  const container = document.getElementById('qr-code-container');
  if (!container) return;
  container.innerHTML = '';

  const vendors = getSavedVendors();
  const vendor = vendorObj || vendors[activeVendorKey] || vendors.tiffin;
  const upiUrl = `upi://pay?pa=${encodeURIComponent(vendor.upi)}&pn=${encodeURIComponent(vendor.shortName)}&am=${amount}&cu=INR&tn=${encodeURIComponent(`NSUT-${roomId}-${vendor.key}`)}`;

  try {
    if (typeof QRCode !== 'undefined') {
      qrInstance = new QRCode(container, {
        text: upiUrl,
        width: 180,
        height: 180,
        colorDark: '#000000',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.M,
      });
    } else {
      container.innerHTML = `<div class="text-xs text-gray-600 text-center p-2 break-all">UPI: ${vendor.upi}<br>₹${amount}</div>`;
    }
  } catch (e) {
    container.innerHTML = `<div class="text-xs text-gray-600 text-center p-2">UPI: ${vendor.upi}</div>`;
  }
}

// Replace buildWhatsAppText and sendWhatsApp in app.js with this block:

function buildWhatsAppText(roomId, net, residentMap, vendor) {
  const entries = (STATE.ledger[roomId] || []).filter(e => e.type === 'order' && e.vendor === vendor.key);
  const resLines = Object.entries(residentMap || {})
    .map(([name, amt]) => `  • ${name}: ₹${Math.max(0, amt)}`)
    .join('\n');

  const upiDeepLink = `upi://pay?pa=${encodeURIComponent(vendor.upi)}&pn=${encodeURIComponent(vendor.shortName)}&am=${net}&cu=INR&tn=${encodeURIComponent(`NSUT-${roomId}-${vendor.key}`)}`;

  return `🏠 *NSUT Hostel — Room ${roomId} (${vendor.shortBadge})*
🧾 *${vendor.shortName} Orders:* ${entries.length}
💰 *Payable to ${vendor.shortName}:* ₹${net}

👥 *Individual Share for ${vendor.shortName}:*
${resLines}

💳 *UPI ID:* ${vendor.upi} (${vendor.name})
📲 *1-Tap UPI Pay Link:* ${upiDeepLink}

_📸 (Press Cmd+V / Paste to attach the QR Code Card copied to your clipboard!)_
_Powered by SahayakBridge 🌉_`;
}

// Draws a complete shareable PNG card combining the QR code + Bill Details
function createShareableQrCardCanvas(roomId, net, residentMap, vendor) {
  const qrSourceCanvas = document.querySelector('#qr-code-container canvas');
  const qrSourceImg = document.querySelector('#qr-code-container img');

  const canvas = document.createElement('canvas');
  canvas.width = 520;
  canvas.height = 640;
  const ctx = canvas.getContext('2d');

  // 1. Dark Card Background
  ctx.fillStyle = '#0D1117';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Border
  ctx.strokeStyle = vendor.key === 'laundry' ? '#3B82F6' : '#FF6B35';
  ctx.lineWidth = 6;
  ctx.strokeRect(12, 12, canvas.width - 24, canvas.height - 24);

  // 2. Header Title
  ctx.fillStyle = '#FF9F1C';
  ctx.font = 'bold 24px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('SahayakBridge · NSUT Hostel Khata', canvas.width / 2, 58);

  // Room & Vendor Subtitle
  ctx.fillStyle = '#E2E8F0';
  ctx.font = 'bold 20px Inter, sans-serif';
  ctx.fillText(`Room ${roomId} — ${vendor.shortName}`, canvas.width / 2, 92);

  // Total Amount
  ctx.fillStyle = '#2EC4B6';
  ctx.font = '900 44px Inter, sans-serif';
  ctx.fillText(`₹${net}`, canvas.width / 2, 148);

  // 3. White QR Box in Center
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(140, 170, 240, 240);

  const source = qrSourceCanvas || qrSourceImg;
  if (source) {
    ctx.drawImage(source, 155, 185, 210, 210);
  }

  // 4. UPI ID & Receiver Name
  ctx.fillStyle = '#94A3B8';
  ctx.font = 'bold 15px monospace';
  ctx.fillText(`UPI ID: ${vendor.upi}`, canvas.width / 2, 445);

  ctx.fillStyle = '#F8FAFC';
  ctx.font = 'bold 16px Inter, sans-serif';
  ctx.fillText(`Payable To: ${vendor.name}`, canvas.width / 2, 472);

  // 5. Per-Person Split Footer
  const splitLine = Object.entries(residentMap || {})
    .map(([name, amt]) => `${name}: ₹${Math.max(0, amt)}`)
    .join('  |  ');

  ctx.fillStyle = '#FDBA74';
  ctx.font = 'bold 15px Inter, sans-serif';
  ctx.fillText(splitLine, canvas.width / 2, 515);

  ctx.fillStyle = '#64748B';
  ctx.font = '13px Inter, sans-serif';
  ctx.fillText('Scan with GPay · PhonePe · Paytm · BHIM', canvas.width / 2, 595);

  return canvas;
}

async function sendWhatsApp() {
  const roomId = STATE.studentRoom;
  recalcBalances(roomId);
  const vBal = STATE.vendorBalances[roomId] || { tiffin: { total: 0, byResident: {} }, laundry: { total: 0, byResident: {} } };
  const vendors = getSavedVendors();
  const vendor = vendors[activeVendorKey] || vendors.tiffin;
  const currentData = vBal[activeVendorKey] || { total: 0, byResident: {} };

  const text = buildWhatsAppText(roomId, currentData.total, currentData.byResident, vendor);

  try {
    const cardCanvas = createShareableQrCardCanvas(roomId, currentData.total, currentData.byResident, vendor);
    const blob = await new Promise(resolve => cardCanvas.toBlob(resolve, 'image/png'));

    // 1. Copy the QR Receipt Image directly into the Mac Clipboard!
    if (navigator.clipboard && window.ClipboardItem && blob) {
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      showToast('📸 QR Receipt Image copied! Press Cmd+V inside WhatsApp to paste the QR!', 'success');
    }

    // 2. Also download a backup PNG so you can drag-and-drop it if needed
    const link = document.createElement('a');
    link.download = `NSUT-Room-${roomId}-${vendor.key}-QR.png`;
    link.href = cardCanvas.toDataURL('image/png');
    link.click();
  } catch (err) {
    showToast('Opening WhatsApp with settlement summary...', 'info');
  }

  // 3. Open WhatsApp after a brief moment so the toast is visible
  setTimeout(() => {
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  }, 500);
}

function speakSettlement() {
  if (!window.speechSynthesis) return;
  const roomId = STATE.studentRoom;
  recalcBalances(roomId);
  const vBal = STATE.vendorBalances[roomId] || { tiffin: { total: 0 }, laundry: { total: 0 } };
  const vendors = getSavedVendors();
  const vendor = vendors[activeVendorKey] || vendors.tiffin;
  const net = vBal[activeVendorKey]?.total || 0;

  const text = `Room ${roomId} ka ${vendor.shortName} ka hisaab ${net} rupaye hai. UPI se ${vendor.shortName} ko bhejo. Dhanyavaad.`;
  window.speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(text);
  utt.lang = 'hi-IN';
  utt.rate = 0.88;
  window.speechSynthesis.speak(utt);
}

function copyJson() {
  if (!STATE.currentOrderJson) { showToast('No order to copy yet.', 'info'); return; }
  navigator.clipboard?.writeText(JSON.stringify(STATE.currentOrderJson, null, 2))
    .then(() => showToast('JSON copied to clipboard!', 'success'))
    .catch(() => showToast('Copy failed.', 'warning'));
}

// ─────────────────────────────────────────────────────────────
// 14. DEMO BUTTONS & ACTIVITY FEED
// ─────────────────────────────────────────────────────────────

async function runDemo(n) {
  const demo = DEMOS[n];
  if (!demo) return;

  const btn = document.getElementById(`demo-btn-${n}`);
  if (btn) btn.classList.add('running');

  selectRoom(demo.room || '302');
  if (demo.buyers) {
    STATE.selectedBuyers = [...demo.buyers];
    renderRoomPills();
  }

  const input = document.getElementById('manual-input');
  if (input) {
    input.value = '';
    for (let i = 0; i < demo.text.length; i++) {
      input.value += demo.text[i];
      await delay(20);
    }
  }

  const transcript = document.getElementById('voice-transcript');
  if (transcript) {
    transcript.textContent = demo.text;
    transcript.classList.remove('hidden');
  }

  processHinglishText(demo.text, 'demo');
  setStudentRoom(demo.room || '302');

  if (btn) btn.classList.remove('running');
  if (input) input.value = '';
}

function addActivityEvent(parsed, entry) {
  STATE.activityCount++;
  const feed = document.getElementById('activity-feed');
  const countEl = document.getElementById('activity-count');
  if (countEl) countEl.textContent = `${STATE.activityCount} events`;
  if (!feed) return;

  const placeholder = feed.querySelector('.italic');
  if (placeholder) placeholder.remove();

  const dot = parsed.type === 'payment' ? '#4ade80' : '#60a5fa';
  const icon = parsed.type === 'payment' ? '💰' : '🧾';
  const time = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  const text = parsed.type === 'payment'
    ? `Room ${parsed.room} paid ₹${parsed.amount}`
    : `Room ${parsed.room} (${(parsed.buyers || []).join(', ')}): ${entry?.text || ''}`;

  const item = document.createElement('div');
  item.className = 'activity-item';
  item.innerHTML = `
    <div class="activity-dot" style="background:${dot}"></div>
    <div class="flex-1 min-w-0">
      <div class="text-[10px] text-gray-300 truncate">${icon} ${text}</div>
      <div class="text-[9px] text-brand-muted">${time}</div>
    </div>
    ${entry?.total ? `<div class="text-[10px] font-bold ${parsed.type === 'payment' ? 'text-green-400' : 'text-orange-400'} flex-shrink-0">
      ${parsed.type === 'payment' ? '-' : ''}₹${Math.abs(entry.total)}
    </div>` : ''}
  `;
  feed.insertBefore(item, feed.firstChild);
}

function refreshActivityFeed() {
  const countEl = document.getElementById('activity-count');
  if (countEl) countEl.textContent = `${STATE.activityCount} events`;
}

function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const icons = { success: 'fa-check-circle', info: 'fa-circle-info', warning: 'fa-triangle-exclamation', error: 'fa-circle-xmark' };
  const colors = { success: 'text-green-400', info: 'text-blue-400', warning: 'text-yellow-400', error: 'text-red-400' };

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <i class="fa-solid ${icons[type] || icons.info} ${colors[type] || colors.info} text-sm flex-shrink-0"></i>
    <span class="flex-1">${message}</span>
    <button onclick="this.parentElement.remove()" class="text-brand-muted hover:text-white flex-shrink-0 ml-2">
      <i class="fa-solid fa-xmark text-xs"></i>
    </button>
  `;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('hide');
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

window.addEventListener('DOMContentLoaded', init);
window.speechSynthesis?.addEventListener('voiceschanged', () => { });
