// --- FIREBASE SETUP (TOP OF FILE) ---
const firebaseConfig = {
  apiKey: "AIzaSyBNq30kO9C38ARmcMXrmooN7o06QTpHi0c",
  authDomain: "bingo-app-2411a.firebaseapp.com",
  projectId: "bingo-app-2411a",
  storageBucket: "bingo-app-2411a.firebasestorage.app",
  messagingSenderId: "422075669233",
  appId: "1:422075669233:web:d9719e10e4e5bf50ebe750",
  measurementId: "G-68WJ8P5L1P"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// Screens
const homeScreen = document.getElementById("homeScreen");
const hostScreen = document.getElementById("hostScreen");
const joinScreen = document.getElementById("joinScreen");
const playerScreen = document.getElementById("playerScreen");

// Buttons
const hostBtn = document.getElementById("hostBtn");
const joinBtn = document.getElementById("joinBtn");
const backFromHost = document.getElementById("backFromHost");
const backFromJoin = document.getElementById("backFromJoin");
const backFromPlayer = document.getElementById("backFromPlayer");

// Host elements
const hostGameCode = document.getElementById("hostGameCode");
const callNumberBtn = document.getElementById("callNumberBtn");
const lastNumberDiv = document.getElementById("lastNumber");
const calledList = document.getElementById("calledList");

// Join elements
const playerNameInput = document.getElementById("playerNameInput");
const joinCodeInput = document.getElementById("joinCodeInput");
const joinGameStartBtn = document.getElementById("joinGameStartBtn");

// Player elements
const cardGrid = document.getElementById("cardGrid");
const calledListPlayer = document.getElementById("calledListPlayer");
const bingoMessage = document.getElementById("bingoMessage");

// Game state
let gameId = null;
let playerName = "";
let card = [];
let marked = [];
let calledNumbers = [];

// Navigation helpers
function show(screen) {
  homeScreen.classList.add("hidden");
  hostScreen.classList.add("hidden");
  joinScreen.classList.add("hidden");
  playerScreen.classList.add("hidden");
  screen.classList.remove("hidden");
}

// Generate 6-digit code
function generateGameId() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Host a game
hostBtn.addEventListener("click", () => {
  gameId = generateGameId();
  hostGameCode.textContent = gameId;
  calledNumbers = [];
  lastNumberDiv.textContent = "";
  calledList.innerHTML = "";
  show(hostScreen);
});

// Join a game
joinBtn.addEventListener("click", () => show(joinScreen));

joinGameStartBtn.addEventListener("click", () => {
  playerName = playerNameInput.value.trim();
  gameId = joinCodeInput.value.trim();

  if (!playerName || !gameId) {
    alert("Enter your name and join code.");
    return;
  }

  generateCard();
  show(playerScreen);
});

// Host calls next number
callNumberBtn.addEventListener("click", () => {
  if (calledNumbers.length === 75) return;

  let n;
  do {
    n = Math.floor(Math.random() * 75) + 1;
  } while (calledNumbers.includes(n));

  calledNumbers.push(n);
  lastNumberDiv.textContent = n;

  const div = document.createElement("div");
  div.classList.add("called-number");
  div.textContent = n;
  calledList.appendChild(div);

  const div2 = document.createElement("div");
  div2.classList.add("called-number");
  div2.textContent = n;
  calledListPlayer.appendChild(div2);
});

// Bingo card generation
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

  for (let r = 0; r < 5; r++) {
    card[r] = [];
    marked[r] = [];
    for (let c = 0; c < 5; c++) {
      let v = [b, i, n, g, o][c][r];
      card[r][c] = v;
      marked[r][c] = false;
    }
  }

  card[2][2] = "FREE";
  marked[2][2] = true;

  renderCard();
}

function renderCard() {
  cardGrid.innerHTML = "";
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      const cell = document.createElement("div");
      cell.classList.add("cell");
      if (r === 2 && c === 2) cell.classList.add("free");
      if (marked[r][c]) cell.classList.add("marked");
      cell.textContent = card[r][c];

      cell.addEventListener("click", () => {
        if (card[r][c] === "FREE") return;
        marked[r][c] = !marked[r][c];
        renderCard();
        if (checkBingo()) bingoMessage.classList.remove("hidden");
      });

      cardGrid.appendChild(cell);
    }
  }
}

function checkBingo() {
  for (let r = 0; r < 5; r++) if (marked[r].every(m => m)) return true;
  for (let c = 0; c < 5; c++) if (marked.every(row => row[c])) return true;
  if ([0,1,2,3,4].every(i => marked[i][i])) return true;
  if ([0,1,2,3,4].every(i => marked[i][4-i])) return true;
  return false;
}

// Back buttons
backFromHost.addEventListener("click", () => show(homeScreen));
backFromJoin.addEventListener("click", () => show(homeScreen));
backFromPlayer.addEventListener("click", () => show(homeScreen));
