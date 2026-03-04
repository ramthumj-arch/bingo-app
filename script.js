/* --------------------------------------------------------- FIREBASE SETUP (MUST BE AT TOP) --------------------------------------------------------- */
const firebaseConfig = {
    apiKey: "AIzaSyBNq30kO9C38ARmcMXrmooN7o06QTpHi0c",
    authDomain: "bingo-app-2411a.firebaseapp.com",
    databaseURL: "https://bingo-app-2411a-default-rtdb.firebaseio.com",
    projectId: "bingo-app-2411a",
    storageBucket: "bingo-app-2411a.firebasestorage.app",
    messagingSenderId: "422075669233",
    appId: "1:422075669233:web:d9719e10e4e5bf50ebe750",
    measurementId: "G-68WJ8P5L1P"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

/* --------------------------------------------------------- SCREEN ELEMENTS --------------------------------------------------------- */
const homeScreen = document.getElementById("homeScreen");
const hostScreen = document.getElementById("hostScreen");
const joinScreen = document.getElementById("joinScreen");
const playerScreen = document.getElementById("playerScreen");

const hostBtn = document.getElementById("hostBtn");
const joinBtn = document.getElementById("joinBtn");
const backFromHost = document.getElementById("backFromHost");
const backFromJoin = document.getElementById("backFromJoin");
const backFromPlayer = document.getElementById("backFromPlayer");

const hostGameCode = document.getElementById("hostGameCode");
const callNumberBtn = document.getElementById("callNumberBtn");
const lastNumberDiv = document.getElementById("lastNumber");
const calledList = document.getElementById("calledList");

const playerNameInput = document.getElementById("playerNameInput");
const joinCodeInput = document.getElementById("joinCodeInput");
const joinGameStartBtn = document.getElementById("joinGameStartBtn");

const cardGrid = document.getElementById("cardGrid");
const calledListPlayer = document.getElementById("calledListPlayer");
const bingoMessage = document.getElementById("bingoMessage");

/* --------------------------------------------------------- GAME STATE --------------------------------------------------------- */
let gameId = null;
let playerName = "";
let card = [];
let marked = [];
let calledNumbers = [];

/* --------------------------------------------------------- NAVIGATION --------------------------------------------------------- */
function show(screen) {
    homeScreen.classList.add("hidden");
    hostScreen.classList.add("hidden");
    joinScreen.classList.add("hidden");
    playerScreen.classList.add("hidden");
    screen.classList.remove("hidden");
}

/* --------------------------------------------------------- GAME ID GENERATOR --------------------------------------------------------- */
function generateGameId() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

/* --------------------------------------------------------- HOST GAME --------------------------------------------------------- */
hostBtn.addEventListener("click", () => {
    gameId = generateGameId();
    hostGameCode.textContent = gameId;

    // Create Firebase session
    db.ref("games/" + gameId).set({
        calledNumbers: [],
        players: {}
    });

    calledNumbers = [];
    lastNumberDiv.textContent = "";
    calledList.innerHTML = "";

    show(hostScreen);
});

/* --------------------------------------------------------- JOIN GAME --------------------------------------------------------- */
joinBtn.addEventListener("click", () => show(joinScreen));

joinGameStartBtn.addEventListener("click", () => {
    playerName = playerNameInput.value.trim();
    gameId = joinCodeInput.value.trim();

    if (!playerName || !gameId) {
        alert("Enter your name and join code.");
        return;
    }

    generateCard();

    // Register player in Firebase
    db.ref(`games/${gameId}/players/${playerName}`).set({
        card: card,
        marked: marked
    });

    // Listen for called numbers
    db.ref(`games/${gameId}/calledNumbers`).on("value", snapshot => {
        const nums = snapshot.val() || [];
        calledNumbers = nums;
        renderCalledNumbersPlayer();
    });

    show(playerScreen);
});

/* --------------------------------------------------------- HOST CALLS NEXT NUMBER --------------------------------------------------------- */
callNumberBtn.addEventListener("click", () => {
    if (calledNumbers.length === 75) return;

    let n;
    do {
        n = Math.floor(Math.random() * 75) + 1;
    } while (calledNumbers.includes(n));

    calledNumbers.push(n);

    // Sync to Firebase
    db.ref(`games/${gameId}/calledNumbers`).set(calledNumbers);

    lastNumberDiv.textContent = n;

    const div = document.createElement("div");
    div.classList.add("called-number");
    div.textContent = n;
    calledList.appendChild(div);
});

/* --------------------------------------------------------- BINGO CARD GENERATION --------------------------------------------------------- */
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

/* --------------------------------------------------------- RENDER CARD --------------------------------------------------------- */
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

                // Sync marked squares
                db.ref(`games/${gameId}/players/${playerName}/marked`).set(marked);

                if (checkBingo()) bingoMessage.classList.remove("hidden");
            });

            cardGrid.appendChild(cell);
        }
    }
}

/* --------------------------------------------------------- RENDER CALLED NUMBERS FOR PLAYER --------------------------------------------------------- */
function renderCalledNumbersPlayer() {
    calledListPlayer.innerHTML = "";
    calledNumbers.forEach(n => {
        const div = document.createElement("div");
        div.classList.add("called-number");
        div.textContent = n;
        calledListPlayer.appendChild(div);
    });
}

/* --------------------------------------------------------- BINGO CHECK --------------------------------------------------------- */
function checkBingo() {
    // Check rows
    for (let r = 0; r < 5; r++) {
        if (marked[r].every(m => m)) return true;
    }

    // Check columns
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

    // Check diagonals
    let diag1 = true;
    let diag2 = true;
    for (let i = 0; i < 5; i++) {
        if (!marked[i][i]) diag1 = false;
        if (!marked[i][4 - i]) diag2 = false;
    }

    return diag1 || diag2;
}

/* --------------------------------------------------------- BACK BUTTONS --------------------------------------------------------- */
backFromHost.addEventListener("click", () => show(homeScreen));
backFromJoin.addEventListener("click", () => show(homeScreen));
backFromPlayer.addEventListener("click", () => show(homeScreen));
