const cardGrid = document.getElementById("cardGrid");
const newCardBtn = document.getElementById("newCardBtn");
const callNumberBtn = document.getElementById("callNumberBtn");
const lastNumberDiv = document.getElementById("lastNumber");
const calledListDiv = document.getElementById("calledList");
const bingoMessage = document.getElementById("bingoMessage");

let card = [];          // 5x5 numbers
let marked = [];        // 5x5 booleans
let calledNumbers = []; // numbers 1–75

function generateColumn(min, max, count) {
  const nums = [];
  while (nums.length < count) {
    const n = Math.floor(Math.random() * (max - min + 1)) + min;
    if (!nums.includes(n)) nums.push(n);
  }
  return nums;
}

function generateCard() {
  const b = generateColumn(1, 15, 5);
  const i = generateColumn(16, 30, 5);
  const n = generateColumn(31, 45, 5);
  const g = generateColumn(46, 60, 5);
  const o = generateColumn(61, 75, 5);

  card = [];
  marked = [];

  for (let row = 0; row < 5; row++) {
    card[row] = [];
    marked[row] = [];
    for (let col = 0; col < 5; col++) {
      let value;
      if (col === 0) value = b[row];
      if (col === 1) value = i[row];
      if (col === 2) value = n[row];
      if (col === 3) value = g[row];
      if (col === 4) value = o[row];

      card[row][col] = value;
      marked[row][col] = false;
    }
  }

  // Free space in center
  card[2][2] = "FREE";
  marked[2][2] = true;

  renderCard();
  bingoMessage.classList.add("hidden");
}

function renderCard() {
  cardGrid.innerHTML = "";
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 5; col++) {
      const cell = document.createElement("div");
      cell.classList.add("cell");
      if (row === 2 && col === 2) cell.classList.add("free");
      if (marked[row][col]) cell.classList.add("marked");
      cell.textContent = card[row][col];

      cell.addEventListener("click", () => {
        if (card[row][col] === "FREE") return;
        marked[row][col] = !marked[row][col];
        renderCard();
        if (checkBingo()) {
          bingoMessage.classList.remove("hidden");
        }
      });

      cardGrid.appendChild(cell);
    }
  }
}

function callNextNumber() {
  if (calledNumbers.length === 75) return;

  let n;
  do {
    n = Math.floor(Math.random() * 75) + 1;
  } while (calledNumbers.includes(n));

  calledNumbers.push(n);
  lastNumberDiv.textContent = n;
  renderCalledNumbers();
}

function renderCalledNumbers() {
  calledListDiv.innerHTML = "";
  calledNumbers.forEach((n) => {
    const div = document.createElement("div");
    div.classList.add("called-number");
    div.textContent = n;
    calledListDiv.appendChild(div);
  });
}

function checkBingo() {
  // Rows
  for (let r = 0; r < 5; r++) {
    if (marked[r].every((m) => m)) return true;
  }
  // Columns
  for (let c = 0; c < 5; c++) {
    let all = true;
    for (let r = 0; r < 5; r++) {
      if (!marked[r][c]) {
        all = false;
        break;
      }
    }
    if (all) return true;
  }
  // Diagonals
  let diag1 = true;
  let diag2 = true;
  for (let i = 0; i < 5; i++) {
    if (!marked[i][i]) diag1 = false;
    if (!marked[i][4 - i]) diag2 = false;
  }
  return diag1 || diag2;
}

newCardBtn.addEventListener("click", () => {
  generateCard();
  calledNumbers = [];
  lastNumberDiv.textContent = "";
  calledListDiv.innerHTML = "";
});

callNumberBtn.addEventListener("click", callNextNumber);

// Initial
generateCard();
