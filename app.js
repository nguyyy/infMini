const SIZE = 5;

const PATTERNS = [
  [
    '.....',
    '.#.#.',
    '.....',
    '.#.#.',
    '.....',
  ],
  [
    '..#..',
    '.....',
    '#...#',
    '.....',
    '..#..',
  ],
  [
    '.....',
    '..#..',
    '#...#',
    '..#..',
    '.....',
  ],
];

const ENTRIES = [
  ['APPLE', 'Common fruit with a crisp bite'],
  ['BRAIN', 'Your thinking organ'],
  ['CLOUD', 'Where rain can form'],
  ['DREAM', 'Something you have while asleep'],
  ['EARTH', 'Our home planet'],
  ['FLAME', 'A visible part of fire'],
  ['GRAPE', 'Fruit that can become wine'],
  ['HONEY', 'Sweet syrup made by bees'],
  ['IVORY', 'Pale white color'],
  ['JOKER', 'Wild card in many decks'],
  ['KNIFE', 'Kitchen cutting tool'],
  ['LEMON', 'Sour yellow citrus'],
  ['MANGO', 'Tropical orange fruit'],
  ['NURSE', 'Hospital caregiver'],
  ['OCEAN', 'Huge body of saltwater'],
  ['PIZZA', 'Pie with crust, sauce, and cheese'],
  ['QUEEN', 'Female monarch'],
  ['ROBOT', 'Programmable machine'],
  ['SHEEP', 'Woolly farm animal'],
  ['TIGER', 'Striped big cat'],
  ['ULTRA', 'Prefix meaning beyond'],
  ['VIRUS', 'Tiny infectious agent'],
  ['WATER', 'H2O'],
  ['YEAST', 'Bread-rising microorganism'],
  ['ZEBRA', 'Black-and-white striped animal'],
  ['AIR', 'Invisible gas we breathe'],
  ['BEE', 'Honey-making insect'],
  ['CAT', 'Purring pet'],
  ['DOG', 'Barking pet'],
  ['EEL', 'Slippery fish'],
  ['FIG', 'Small soft fruit'],
  ['GEM', 'Valuable stone'],
  ['HAT', 'Headwear'],
  ['ICE', 'Frozen water'],
  ['JET', 'Fast airplane'],
  ['KEY', 'Lock opener'],
  ['LOG', 'Fallen tree trunk'],
  ['MAP', 'Navigation aid'],
  ['NUT', 'Hard-shelled snack'],
  ['OWL', 'Nocturnal bird'],
  ['PAN', 'Cooking vessel'],
  ['RUG', 'Floor covering'],
  ['SUN', 'Star at the center of our system'],
  ['TOP', 'Highest point'],
  ['URN', 'Decorative vase'],
  ['VAN', 'Boxy vehicle'],
  ['WEB', 'Internet network'],
  ['YAK', 'Long-haired bovine'],
  ['ZIP', 'Move quickly'],
  ['BIRD', 'Winged feathered animal'],
  ['MOON', 'Earth\'s natural satellite'],
  ['STAR', 'Twinkling object in the night sky'],
  ['WIND', 'Moving air'],
  ['FROG', 'Amphibian that hops'],
  ['TREE', 'Tall plant with trunk'],
  ['RAIN', 'Water falling from clouds'],
  ['SNOW', 'Frozen precipitation'],
  ['FISH', 'Animal that swims with gills'],
  ['BOOK', 'Collection of written pages'],
];

const BY_LENGTH = ENTRIES.reduce((map, [word, clue]) => {
  const clean = word.toUpperCase();
  if (!map.has(clean.length)) map.set(clean.length, []);
  map.get(clean.length).push({ word: clean, clue });
  return map;
}, new Map());

const gridEl = document.getElementById('grid');
const acrossCluesEl = document.getElementById('acrossClues');
const downCluesEl = document.getElementById('downClues');
const seedEl = document.getElementById('seed');
const timerEl = document.getElementById('timer');
const autoCheckToggle = document.getElementById('autoCheckToggle');

const state = {
  seed: Date.now(),
  puzzle: null,
  direction: 'across',
  active: null,
  timerStart: Date.now(),
  timerId: null,
};

function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function getSlots(pattern) {
  const slots = [];
  let num = 1;
  const numberMap = Array.from({ length: SIZE }, () => Array(SIZE).fill(null));

  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (pattern[r][c] === '#') continue;
      const startAcross = c === 0 || pattern[r][c - 1] === '#';
      const startDown = r === 0 || pattern[r - 1][c] === '#';
      if (startAcross || startDown) numberMap[r][c] = num++;
      if (startAcross) {
        let end = c;
        while (end + 1 < SIZE && pattern[r][end + 1] !== '#') end++;
        slots.push({ id: `A-${r}-${c}`, dir: 'across', row: r, col: c, len: end - c + 1, number: numberMap[r][c] });
      }
      if (startDown) {
        let end = r;
        while (end + 1 < SIZE && pattern[end + 1][c] !== '#') end++;
        slots.push({ id: `D-${r}-${c}`, dir: 'down', row: r, col: c, len: end - r + 1, number: numberMap[r][c] });
      }
    }
  }
  return { slots, numberMap };
}

function intersects(a, b) {
  for (let i = 0; i < a.len; i++) {
    const ar = a.row + (a.dir === 'down' ? i : 0);
    const ac = a.col + (a.dir === 'across' ? i : 0);
    for (let j = 0; j < b.len; j++) {
      const br = b.row + (b.dir === 'down' ? j : 0);
      const bc = b.col + (b.dir === 'across' ? j : 0);
      if (ar === br && ac === bc) return { i, j };
    }
  }
  return null;
}

function buildPuzzle(seed) {
  const rand = rng(seed);
  const pattern = PATTERNS[Math.floor(rand() * PATTERNS.length)];
  const { slots, numberMap } = getSlots(pattern);

  const slotOrder = [...slots].sort((a, b) => b.len - a.len);
  const assignment = new Map();

  function candidates(slot) {
    const words = BY_LENGTH.get(slot.len) || [];
    const pool = words.filter(entry => {
      for (const [other, value] of assignment) {
        if (value.word === entry.word) return false;
        const hit = intersects(slot, other);
        if (!hit) continue;
        if (entry.word[hit.i] !== value.word[hit.j]) return false;
      }
      return true;
    });

    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    return pool;
  }

  function solve(index = 0) {
    if (index >= slotOrder.length) return true;
    const slot = slotOrder[index];
    const options = candidates(slot);
    for (const option of options) {
      assignment.set(slot, option);
      if (solve(index + 1)) return true;
      assignment.delete(slot);
    }
    return false;
  }

  if (!solve()) return null;

  const solution = Array.from({ length: SIZE }, (_, r) =>
    Array.from({ length: SIZE }, (_, c) => (pattern[r][c] === '#' ? '#' : ''))
  );

  for (const [slot, value] of assignment) {
    for (let i = 0; i < slot.len; i++) {
      const r = slot.row + (slot.dir === 'down' ? i : 0);
      const c = slot.col + (slot.dir === 'across' ? i : 0);
      solution[r][c] = value.word[i];
    }
  }

  const clues = { across: [], down: [] };
  for (const [slot, value] of assignment) {
    clues[slot.dir].push({
      id: slot.id,
      number: slot.number,
      clue: value.clue,
      answer: value.word,
      row: slot.row,
      col: slot.col,
      len: slot.len,
      dir: slot.dir,
    });
  }

  clues.across.sort((a, b) => a.number - b.number);
  clues.down.sort((a, b) => a.number - b.number);

  return { pattern, solution, clues, numberMap };
}

function generatePuzzle() {
  let attempts = 0;
  while (attempts < 80) {
    const candidate = buildPuzzle(state.seed + attempts);
    if (candidate) {
      state.seed += attempts;
      return candidate;
    }
    attempts++;
  }
  throw new Error('Unable to generate puzzle.');
}

function render() {
  gridEl.innerHTML = '';
  const puzzle = state.puzzle;
  const frag = document.createDocumentFragment();

  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.dataset.row = r;
      cell.dataset.col = c;
      if (puzzle.pattern[r][c] === '#') {
        cell.classList.add('block');
      } else {
        const num = puzzle.numberMap[r][c];
        if (num) {
          const n = document.createElement('span');
          n.className = 'num';
          n.textContent = num;
          cell.append(n);
        }
        const input = document.createElement('input');
        input.maxLength = 1;
        input.autocomplete = 'off';
        input.dataset.row = r;
        input.dataset.col = c;
        input.addEventListener('input', onInput);
        input.addEventListener('keydown', onKeyDown);
        input.addEventListener('focus', () => setActiveCell(r, c));
        cell.append(input);
      }
      frag.append(cell);
    }
  }
  gridEl.append(frag);

  renderClues('across', acrossCluesEl);
  renderClues('down', downCluesEl);
  seedEl.textContent = String(state.seed);

  const first = gridEl.querySelector('input');
  if (first) {
    first.focus();
    setActiveCell(Number(first.dataset.row), Number(first.dataset.col));
  }
}

function renderClues(dir, parent) {
  parent.innerHTML = '';
  for (const clue of state.puzzle.clues[dir]) {
    const li = document.createElement('li');
    li.textContent = `${clue.number}. ${clue.clue}`;
    li.dataset.id = clue.id;
    parent.append(li);
  }
}

function findSlotAt(row, col, dir = state.direction) {
  return state.puzzle.clues[dir].find(slot => {
    for (let i = 0; i < slot.len; i++) {
      const r = slot.row + (dir === 'down' ? i : 0);
      const c = slot.col + (dir === 'across' ? i : 0);
      if (r === row && c === col) return true;
    }
    return false;
  }) || null;
}

function setActiveCell(row, col) {
  state.active = { row, col };
  document.querySelectorAll('.cell.active').forEach(el => el.classList.remove('active'));
  const cell = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
  if (cell) cell.classList.add('active');

  const current = findSlotAt(row, col);
  if (!current) return;

  document.querySelectorAll('.clues li.active').forEach(el => el.classList.remove('active'));
  const clueEl = document.querySelector(`.clues li[data-id="${current.id}"]`);
  if (clueEl) clueEl.classList.add('active');
}

function moveWithinSlot(slot, indexOffset = 1) {
  if (!slot || !state.active) return;
  let idx = 0;
  for (let i = 0; i < slot.len; i++) {
    const r = slot.row + (slot.dir === 'down' ? i : 0);
    const c = slot.col + (slot.dir === 'across' ? i : 0);
    if (r === state.active.row && c === state.active.col) {
      idx = i;
      break;
    }
  }
  const next = Math.max(0, Math.min(slot.len - 1, idx + indexOffset));
  const nr = slot.row + (slot.dir === 'down' ? next : 0);
  const nc = slot.col + (slot.dir === 'across' ? next : 0);
  const input = document.querySelector(`input[data-row="${nr}"][data-col="${nc}"]`);
  if (input) input.focus();
}

function onInput(event) {
  const input = event.target;
  const row = Number(input.dataset.row);
  const col = Number(input.dataset.col);
  input.value = input.value.toUpperCase().replace(/[^A-Z]/g, '');
  setActiveCell(row, col);

  if (autoCheckToggle.checked) {
    const correct = state.puzzle.solution[row][col];
    input.parentElement.classList.toggle('wrong', Boolean(input.value) && input.value !== correct);
    input.parentElement.classList.toggle('correct', Boolean(input.value) && input.value === correct);
  } else {
    input.parentElement.classList.remove('wrong', 'correct');
  }

  if (input.value) {
    const slot = findSlotAt(row, col);
    moveWithinSlot(slot, 1);
  }

  if (isSolved()) {
    clearInterval(state.timerId);
    alert('Solved! Press “New Puzzle” for another mini.');
  }
}

function onKeyDown(event) {
  const input = event.target;
  const row = Number(input.dataset.row);
  const col = Number(input.dataset.col);
  setActiveCell(row, col);

  if (event.key === 'Backspace' && !input.value) {
    const slot = findSlotAt(row, col);
    moveWithinSlot(slot, -1);
  } else if (event.key === ' ') {
    event.preventDefault();
    state.direction = state.direction === 'across' ? 'down' : 'across';
    setActiveCell(row, col);
  } else if (event.key === 'ArrowRight') {
    event.preventDefault();
    state.direction = 'across';
    moveByVector(0, 1);
  } else if (event.key === 'ArrowLeft') {
    event.preventDefault();
    state.direction = 'across';
    moveByVector(0, -1);
  } else if (event.key === 'ArrowDown') {
    event.preventDefault();
    state.direction = 'down';
    moveByVector(1, 0);
  } else if (event.key === 'ArrowUp') {
    event.preventDefault();
    state.direction = 'down';
    moveByVector(-1, 0);
  }
}

function moveByVector(dr, dc) {
  if (!state.active) return;
  let r = state.active.row + dr;
  let c = state.active.col + dc;
  while (r >= 0 && r < SIZE && c >= 0 && c < SIZE) {
    if (state.puzzle.pattern[r][c] !== '#') {
      const input = document.querySelector(`input[data-row="${r}"][data-col="${c}"]`);
      if (input) input.focus();
      return;
    }
    r += dr;
    c += dc;
  }
}

function cellsForSlot(slot) {
  const cells = [];
  for (let i = 0; i < slot.len; i++) {
    cells.push({
      row: slot.row + (slot.dir === 'down' ? i : 0),
      col: slot.col + (slot.dir === 'across' ? i : 0),
    });
  }
  return cells;
}

function checkSlot(slot, reveal = false) {
  for (const { row, col } of cellsForSlot(slot)) {
    const input = document.querySelector(`input[data-row="${row}"][data-col="${col}"]`);
    if (!input) continue;
    const cell = input.parentElement;
    const answer = state.puzzle.solution[row][col];
    if (reveal) input.value = answer;
    const match = input.value === answer;
    cell.classList.toggle('wrong', !match);
    cell.classList.toggle('correct', match);
  }
}

function checkPuzzle(reveal = false) {
  for (const dir of ['across', 'down']) {
    for (const slot of state.puzzle.clues[dir]) checkSlot(slot, reveal);
  }
}

function isSolved() {
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (state.puzzle.pattern[r][c] === '#') continue;
      const input = document.querySelector(`input[data-row="${r}"][data-col="${c}"]`);
      if (!input || input.value !== state.puzzle.solution[r][c]) return false;
    }
  }
  return true;
}

function resetTimer() {
  clearInterval(state.timerId);
  state.timerStart = Date.now();
  state.timerId = setInterval(() => {
    const elapsed = Math.floor((Date.now() - state.timerStart) / 1000);
    const mm = String(Math.floor(elapsed / 60)).padStart(2, '0');
    const ss = String(elapsed % 60).padStart(2, '0');
    timerEl.textContent = `${mm}:${ss}`;
  }, 250);
}

function newPuzzle() {
  state.seed = Date.now();
  state.puzzle = generatePuzzle();
  state.direction = 'across';
  render();
  resetTimer();
}

function bindButtons() {
  document.getElementById('newPuzzleBtn').addEventListener('click', newPuzzle);
  document.getElementById('checkWordBtn').addEventListener('click', () => {
    if (!state.active) return;
    const slot = findSlotAt(state.active.row, state.active.col);
    if (slot) checkSlot(slot, false);
  });
  document.getElementById('checkPuzzleBtn').addEventListener('click', () => checkPuzzle(false));
  document.getElementById('revealWordBtn').addEventListener('click', () => {
    if (!state.active) return;
    const slot = findSlotAt(state.active.row, state.active.col);
    if (slot) checkSlot(slot, true);
  });
  document.getElementById('revealPuzzleBtn').addEventListener('click', () => checkPuzzle(true));
}

bindButtons();
newPuzzle();
