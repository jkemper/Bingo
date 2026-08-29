const LETTERS = ["B", "I", "N", "G", "O"];
const RANGES = { B: [1, 15], I: [16, 30], N: [31, 45], G: [46, 60], O: [61, 75] };
const STORAGE_KEY = "bingo-marker-state-v1";

const PRESET_PATTERNS = {
  1: {
    name: "Across",
    desc: "Any straight line across (any one full row).",
    type: "any-row",
    cells: [],
  },
  2: {
    name: "Letter L",
    desc: "Must match pattern exactly.",
    type: "exact",
    cells: unionCells(colCells(0), rowCells(4)),
  },
  3: {
    name: "Top & Bottom",
    desc: "Straight line across top and straight line across bottom. Must match exactly.",
    type: "exact",
    cells: unionCells(rowCells(0), rowCells(4)),
  },
  4: {
    name: "Block of 4",
    desc: "Block of 4 in any corner.",
    type: "any-corner",
    cells: [],
  },
  5: {
    name: "Plus Sign",
    desc: "Straight line across the middle and straight line up/down the middle. Must match exactly.",
    type: "exact",
    cells: unionCells(rowCells(2), colCells(2)),
  },
  6: {
    name: "Triple Bingo",
    desc: "2 straight lines across (top & bottom) and 1 straight line up/down the middle. Must match exactly.",
    type: "exact",
    cells: unionCells(unionCells(rowCells(0), rowCells(4)), colCells(2)),
  },
};

function rowCells(r) { return LETTERS.map((_, c) => [r, c]); }
function colCells(c) { return [0, 1, 2, 3, 4].map((r) => [r, c]); }
function unionCells(a, b) {
  const key = (p) => p[0] + "," + p[1];
  const map = new Map();
  [...a, ...b].forEach((p) => map.set(key(p), p));
  return [...map.values()];
}
function isFreeCell(r, c) { return r === 2 && c === 2; }

function emptyGrid(fill) {
  return [0, 1, 2, 3, 4].map((r) =>
    [0, 1, 2, 3, 4].map((c) => (isFreeCell(r, c) ? "FREE" : fill))
  );
}

function loadState() {
  let saved = null;
  try {
    saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
  } catch (e) {
    saved = null;
  }
  const defaults = {
    cards: [],
    customPatterns: {},
    currentGame: 1,
    calledNumbers: [],
    marks: {},
  };
  return Object.assign(defaults, saved || {});
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

let state = loadState();

function getPattern(gameId) {
  const custom = state.customPatterns[gameId];
  if (custom) {
    return Object.assign({}, PRESET_PATTERNS[gameId], { type: "exact", cells: custom });
  }
  return PRESET_PATTERNS[gameId];
}

function getMarks(cardId) {
  if (!state.marks[cardId]) {
    state.marks[cardId] = emptyGrid(false).map((row) =>
      row.map((v) => v === "FREE")
    );
  }
  return state.marks[cardId];
}

function checkPattern(marksGrid, pattern) {
  const isMarked = (r, c) => marksGrid[r][c] === true;
  if (pattern.type === "any-row") {
    for (let r = 0; r < 5; r++) {
      if ([0, 1, 2, 3, 4].every((c) => isMarked(r, c))) return true;
    }
    return false;
  }
  if (pattern.type === "any-corner") {
    const corners = [
      [[0, 0], [0, 1], [1, 0], [1, 1]],
      [[0, 3], [0, 4], [1, 3], [1, 4]],
      [[3, 0], [3, 1], [4, 0], [4, 1]],
      [[3, 3], [3, 4], [4, 3], [4, 4]],
    ];
    return corners.some((block) => block.every(([r, c]) => isMarked(r, c)));
  }
  return pattern.cells.every(([r, c]) => isMarked(r, c));
}

function cellsToGridSet(cells) {
  const set = new Set(cells.map(([r, c]) => r + "," + c));
  return (r, c) => set.has(r + "," + c);
}

function cellsNeededRemaining(marksGrid, pattern) {
  if (pattern.type === "any-row") {
    let best = 5;
    for (let r = 0; r < 5; r++) {
      const remaining = [0, 1, 2, 3, 4].filter((c) => !marksGrid[r][c]).length;
      best = Math.min(best, remaining);
    }
    return best;
  }
  if (pattern.type === "any-corner") {
    const corners = [
      [[0, 0], [0, 1], [1, 0], [1, 1]],
      [[0, 3], [0, 4], [1, 3], [1, 4]],
      [[3, 0], [3, 1], [4, 0], [4, 1]],
      [[3, 3], [3, 4], [4, 3], [4, 4]],
    ];
    return Math.min(
      ...corners.map((block) => block.filter(([r, c]) => !marksGrid[r][c]).length)
    );
  }
  return pattern.cells.filter(([r, c]) => !marksGrid[r][c]).length;
}

let selectedLetter = "B";
let bingoAlerted = {};

function init() {
  if (state.cards.length === 0) {
    state.cards.push(makeBlankCard("Card 1"));
    saveState();
  }
  setupTabs();
  setupGameBar();
  setupCallerPanel();
  renderCardsDisplay();
  renderCardsEditor();
  renderPatternsEditor();
  document.getElementById("bingo-dismiss").addEventListener("click", () => {
    document.getElementById("bingo-overlay").classList.add("hidden");
  });
  document.getElementById("add-card-btn").addEventListener("click", () => {
    state.cards.push(makeBlankCard("Card " + (state.cards.length + 1)));
    saveState();
    renderCardsEditor();
    renderCardsDisplay();
  });
}

function makeBlankCard(name) {
  return { id: "c" + Date.now() + Math.random().toString(36).slice(2, 7), name, grid: emptyGrid(null) };
}

function setupTabs() {
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
      document.querySelectorAll(".tab-panel").forEach((p) => p.classList.remove("active"));
      btn.classList.add("active");
      document.getElementById("tab-" + btn.dataset.tab).classList.add("active");
      if (btn.dataset.tab === "play") renderCardsDisplay();
    });
  });
}

function setupGameBar() {
  const select = document.getElementById("game-select");
  select.innerHTML = "";
  for (let g = 1; g <= 6; g++) {
    const opt = document.createElement("option");
    opt.value = g;
    opt.textContent = "Game " + g + " - " + PRESET_PATTERNS[g].name;
    select.appendChild(opt);
  }
  select.value = state.currentGame;
  select.addEventListener("change", () => {
    state.currentGame = Number(select.value);
    saveState();
    updatePatternNameLabel();
    renderCardsDisplay();
  });
  document.getElementById("new-game-btn").addEventListener("click", () => {
    if (!confirm("Start a new game? This clears all marks and called numbers.")) return;
    state.marks = {};
    state.calledNumbers = [];
    bingoAlerted = {};
    saveState();
    renderNumberGrid();
    renderCalledList();
    renderCardsDisplay();
  });
  updatePatternNameLabel();
}

function updatePatternNameLabel() {
  const p = getPattern(state.currentGame);
  document.getElementById("pattern-name").textContent = p.name + (state.customPatterns[state.currentGame] ? " (custom)" : "");
}

function setupCallerPanel() {
  const letterRow = document.getElementById("letter-row");
  letterRow.innerHTML = "";
  LETTERS.forEach((letter) => {
    const btn = document.createElement("button");
    btn.className = "letter-btn" + (letter === selectedLetter ? " selected" : "");
    btn.dataset.letter = letter;
    btn.textContent = letter;
    btn.addEventListener("click", () => {
      selectedLetter = letter;
      letterRow.querySelectorAll(".letter-btn").forEach((b) => b.classList.remove("selected"));
      btn.classList.add("selected");
      renderNumberGrid();
    });
    letterRow.appendChild(btn);
  });
  renderNumberGrid();
  renderCalledList();
  document.getElementById("undo-btn").addEventListener("click", undoLastCall);
}

function renderNumberGrid() {
  const grid = document.getElementById("number-grid");
  grid.innerHTML = "";
  const [lo, hi] = RANGES[selectedLetter];
  const calledSet = new Set(
    state.calledNumbers.filter((c) => c.letter === selectedLetter).map((c) => c.number)
  );
  for (let n = lo; n <= hi; n++) {
    const btn = document.createElement("button");
    btn.className = "number-btn" + (calledSet.has(n) ? " called" : "");
    btn.textContent = n;
    btn.addEventListener("click", () => callNumber(selectedLetter, n));
    grid.appendChild(btn);
  }
}

function callNumber(letter, number) {
  const already = state.calledNumbers.some((c) => c.letter === letter && c.number === number);
  if (already) return;
  state.calledNumbers.push({ letter, number, ts: Date.now() });
  markNumberOnAllCards(letter, number);
  saveState();
  renderNumberGrid();
  renderCalledList();
  renderCardsDisplay();
  checkAllCardsForBingo();
}

function undoLastCall() {
  const last = state.calledNumbers.pop();
  if (!last) return;
  unmarkNumberOnAllCards(last.letter, last.number);
  saveState();
  renderNumberGrid();
  renderCalledList();
  renderCardsDisplay();
}

function renderCalledList() {
  document.getElementById("called-count").textContent = state.calledNumbers.length;
  const list = document.getElementById("called-list");
  list.innerHTML = "";
  [...state.calledNumbers]
    .slice()
    .reverse()
    .forEach((c) => {
      const chip = document.createElement("span");
      chip.className = "called-chip";
      chip.style.background = colorForLetter(c.letter);
      chip.textContent = c.letter + c.number;
      list.appendChild(chip);
    });
}

function colorForLetter(letter) {
  return {
    B: "var(--b-color)",
    I: "var(--i-color)",
    N: "var(--n-color)",
    G: "var(--g-color)",
    O: "var(--o-color)",
  }[letter];
}

function letterForColumn(c) { return LETTERS[c]; }

function markNumberOnAllCards(letter, number) {
  const col = LETTERS.indexOf(letter);
  state.cards.forEach((card) => {
    const marks = getMarks(card.id);
    for (let r = 0; r < 5; r++) {
      if (card.grid[r][col] === number) marks[r][col] = true;
    }
  });
}

function unmarkNumberOnAllCards(letter, number) {
  const col = LETTERS.indexOf(letter);
  state.cards.forEach((card) => {
    const marks = getMarks(card.id);
    for (let r = 0; r < 5; r++) {
      if (card.grid[r][col] === number) marks[r][col] = false;
    }
  });
}

function renderCardsDisplay() {
  const container = document.getElementById("cards-display");
  container.innerHTML = "";
  const pattern = getPattern(state.currentGame);
  const patternHas = cellsToGridSet(pattern.type === "exact" ? pattern.cells : []);

  state.cards.forEach((card) => {
    const marks = getMarks(card.id);
    const wrapper = document.createElement("div");
    wrapper.className = "bingo-card";

    const header = document.createElement("div");
    header.className = "bingo-card-header";
    const nameEl = document.createElement("span");
    nameEl.className = "card-name";
    nameEl.textContent = card.name;
    header.appendChild(nameEl);

    const remaining = cellsNeededRemaining(marks, pattern);
    const badge = document.createElement("span");
    badge.className = "togo-badge" + (remaining === 0 ? " won" : remaining <= 1 ? " close" : "");
    badge.textContent = remaining === 0 ? "BINGO!" : remaining + " to go";
    header.appendChild(badge);
    wrapper.appendChild(header);

    const grid = document.createElement("div");
    grid.className = "bingo-grid";
    LETTERS.forEach((l) => {
      const head = document.createElement("div");
      head.className = "letter-head " + l;
      head.textContent = l;
      grid.appendChild(head);
    });

    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        const val = card.grid[r][c];
        const cell = document.createElement("div");
        cell.className = "cell editable";
        if (isFreeCell(r, c)) {
          cell.classList.add("free", "marked");
          cell.textContent = "FREE";
        } else {
          cell.textContent = val === null || val === undefined ? "" : val;
          if (marks[r][c]) cell.classList.add("marked");
          if (pattern.type === "exact" && patternHas(r, c)) cell.classList.add("needed");
          if (pattern.type === "any-row" || pattern.type === "any-corner") {
            cell.classList.add("needed-maybe");
          }
          cell.addEventListener("click", () => {
            marks[r][c] = !marks[r][c];
            saveState();
            renderCardsDisplay();
            checkAllCardsForBingo();
          });
        }
        grid.appendChild(cell);
      }
    }
    wrapper.appendChild(grid);
    container.appendChild(wrapper);
  });
}

function checkAllCardsForBingo() {
  const pattern = getPattern(state.currentGame);
  state.cards.forEach((card) => {
    const marks = getMarks(card.id);
    const won = checkPattern(marks, pattern);
    const key = card.id + "-" + state.currentGame;
    if (won && !bingoAlerted[key]) {
      bingoAlerted[key] = true;
      announceBingo(card.name);
    }
    if (!won) bingoAlerted[key] = false;
  });
}

function announceBingo(cardName) {
  document.getElementById("bingo-detail").textContent = cardName + " has a bingo!";
  document.getElementById("bingo-overlay").classList.remove("hidden");
  try {
    if (navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 400]);
  } catch (e) {}
  try {
    playBeep();
  } catch (e) {}
}

function playBeep() {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const notes = [880, 1046, 1318];
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(ctx.destination);
    const start = ctx.currentTime + i * 0.18;
    gain.gain.setValueAtTime(0.2, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.16);
    osc.start(start);
    osc.stop(start + 0.17);
  });
}

// ---- Cards editor ----

function renderCardsEditor() {
  const container = document.getElementById("cards-editor");
  container.innerHTML = "";
  state.cards.forEach((card, idx) => {
    container.appendChild(buildCardEditor(card, idx));
  });
}

function buildCardEditor(card, idx) {
  const block = document.createElement("div");
  block.className = "card-editor";

  const header = document.createElement("div");
  header.className = "card-editor-header";
  const nameInput = document.createElement("input");
  nameInput.type = "text";
  nameInput.value = card.name;
  nameInput.addEventListener("input", () => {
    card.name = nameInput.value;
    saveState();
    renderCardsDisplay();
  });
  header.appendChild(nameInput);

  if (state.cards.length > 1) {
    const delBtn = document.createElement("button");
    delBtn.className = "btn danger small";
    delBtn.textContent = "Delete";
    delBtn.addEventListener("click", () => {
      if (!confirm("Delete " + card.name + "?")) return;
      state.cards.splice(idx, 1);
      delete state.marks[card.id];
      saveState();
      renderCardsEditor();
      renderCardsDisplay();
    });
    header.appendChild(delBtn);
  }
  block.appendChild(header);

  const gridInput = document.createElement("div");
  gridInput.className = "grid-input";
  LETTERS.forEach((l) => {
    const head = document.createElement("div");
    head.className = "letter-head " + l;
    head.textContent = l;
    gridInput.appendChild(head);
  });

  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      if (isFreeCell(r, c)) {
        const free = document.createElement("div");
        free.className = "free-cell";
        free.textContent = "FREE";
        gridInput.appendChild(free);
        continue;
      }
      const input = document.createElement("input");
      input.type = "number";
      input.min = RANGES[LETTERS[c]][0];
      input.max = RANGES[LETTERS[c]][1];
      input.value = card.grid[r][c] === null ? "" : card.grid[r][c];
      input.addEventListener("change", () => {
        const v = input.value === "" ? null : Number(input.value);
        card.grid[r][c] = v;
        saveState();
        renderCardsDisplay();
      });
      gridInput.appendChild(input);
    }
  }
  block.appendChild(gridInput);

  const quickfill = document.createElement("div");
  quickfill.className = "quickfill-row";
  quickfill.innerHTML = "<label>Paste all 24 numbers (reading order: B column top-bottom, I column, N column excl. FREE, G column, O column):</label>";
  const textarea = document.createElement("textarea");
  textarea.placeholder = "e.g. 5,9,11,2,14, 24,29,44,30,23, 21,16, 68,54,31,25, 65,70,57,69,60, 67,3,7,73...";
  quickfill.appendChild(textarea);
  const fillBtn = document.createElement("button");
  fillBtn.className = "btn small";
  fillBtn.style.marginTop = "6px";
  fillBtn.textContent = "Fill grid from pasted numbers";
  fillBtn.addEventListener("click", () => {
    const nums = textarea.value
      .split(/[\s,]+/)
      .filter((s) => s.length)
      .map(Number)
      .filter((n) => !Number.isNaN(n));
    if (nums.length !== 24) {
      alert("Expected 24 numbers, got " + nums.length + ". Please check and try again.");
      return;
    }
    let i = 0;
    for (let c = 0; c < 5; c++) {
      for (let r = 0; r < 5; r++) {
        if (isFreeCell(r, c)) continue;
        card.grid[r][c] = nums[i++];
      }
    }
    saveState();
    renderCardsEditor();
    renderCardsDisplay();
  });
  quickfill.appendChild(fillBtn);
  block.appendChild(quickfill);

  return block;
}

// ---- Patterns editor ----

function renderPatternsEditor() {
  const container = document.getElementById("patterns-editor");
  container.innerHTML = "";
  for (let g = 1; g <= 6; g++) {
    container.appendChild(buildPatternBlock(g));
  }
}

function buildPatternBlock(gameId) {
  const preset = PRESET_PATTERNS[gameId];
  const block = document.createElement("div");
  block.className = "pattern-block";

  const header = document.createElement("div");
  header.className = "pattern-block-header";
  header.innerHTML = "<h3>Game " + gameId + " - " + preset.name + "</h3>";
  const resetBtn = document.createElement("button");
  resetBtn.className = "btn tiny";
  resetBtn.textContent = "Reset to preset";
  resetBtn.addEventListener("click", () => {
    delete state.customPatterns[gameId];
    saveState();
    renderPatternsEditor();
    updatePatternNameLabel();
    renderCardsDisplay();
  });
  header.appendChild(resetBtn);
  block.appendChild(header);

  const desc = document.createElement("div");
  desc.className = "pattern-desc";
  desc.textContent = preset.desc;
  block.appendChild(desc);

  if (preset.type !== "exact" && !state.customPatterns[gameId]) {
    const note = document.createElement("div");
    note.className = "pattern-desc";
    note.textContent = "This game uses a flexible rule (not a fixed grid). Tap cells below only if you want to override it with an exact custom pattern instead.";
    block.appendChild(note);
  }

  const cells = state.customPatterns[gameId] || (preset.type === "exact" ? preset.cells : []);
  const cellSet = cellsToGridSet(cells);

  const grid = document.createElement("div");
  grid.className = "pattern-grid";
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      const cell = document.createElement("div");
      cell.className = "pattern-cell";
      if (isFreeCell(r, c)) {
        cell.classList.add("center");
      } else {
        if (cellSet(r, c)) cell.classList.add("on");
        cell.addEventListener("click", () => {
          const current = state.customPatterns[gameId] || cells.slice();
          const idx = current.findIndex(([rr, cc]) => rr === r && cc === c);
          if (idx >= 0) current.splice(idx, 1);
          else current.push([r, c]);
          state.customPatterns[gameId] = current;
          saveState();
          renderPatternsEditor();
          updatePatternNameLabel();
          renderCardsDisplay();
        });
      }
      grid.appendChild(cell);
    }
  }
  block.appendChild(grid);

  return block;
}

init();
