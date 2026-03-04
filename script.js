document.addEventListener("DOMContentLoaded", () => {
  const firebaseConfig = {
    apiKey: "AIzaSyBNq30kO9C38ARmcMXrmooN7o06QTpHi0c",
    authDomain: "bingo-app-2411a.firebaseapp.com",
    databaseURL: "https://bingo-app-2411a-default-rtdb.firebaseio.com",
    projectId: "bingo-app-2411a",
    storageBucket: "bingo-app-2411a.firebasestorage.app",
    messagingSenderId: "422075669233",
    appId: "1:422075669233:web:d9719e10e4e5bf50ebe750"
  };

  if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
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

  // Host UI
  const hostGameCode = document.getElementById("hostGameCode");
  const callNumberBtn = document.getElementById("callNumberBtn");
  const lastNumberDiv = document.getElementById("lastNumber");
  const calledList = document.getElementById("calledList");
  const playerListDiv = document.getElementById("playerList");

  // Join UI
  const playerNameInput = document.getElementById("playerNameInput");
  const joinCodeInput = document.getElementById("joinCodeInput");
  const joinGameStartBtn = document.getElementById("joinGameStartBtn");

  // Player UI
  const cardGrid = document.getElementById("cardGrid");
  const calledListPlayer = document.getElementById("calledListPlayer");
  const bingoMessage = document.getElementById("bingoMessage");

  // State
  let gameId = null;
  let playerName = "";
  let card = [];
  let marked = [];
  let calledNumbers = [];
  let playersRef = null;
  let calledRef = null;

  function show(screen) {
    homeScreen.classList.add("hidden");
    hostScreen.classList.add("hidden");
    joinScreen.classList.add("hidden");
    playerScreen.classList.add("hidden");
    screen.classList.remove("hidden");
  }

  function generateGameId() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  function detach() {
    if (playersRef) playersRef.off();
    if (calledRef) calledRef.off();
    playersRef = null;
    calledRef = null;
  }

  // ----- Host: listen for players -----
  function startPlayersListener() {
    if (playersRef) playersRef.off();
    playersRef = db.ref(`games/${gameId}/players`);
    playersRef.on("value", (snap) => {
      const players = snap.val() || {};
      playerListDiv.innerHTML = "";
      Object.keys(players).forEach((name) => {
        const div = document.createElement("div");
        div.className = "player-name";
        div.textContent = name;
        playerListDiv.appendChild(div);
      });
    });
  }

  // ----- Player: listen for called numbers -----
  function startCalledListener() {
    if (calledRef) calledRef.off();
    calledRef = db.ref(`games/${gameId}/calledNumbers`);
    calledRef.on("value", (snap) => {
      calledNumbers = snap.val() || [];
      renderCalledNumbersPlayer();
    });
  }

  // ----- HOST GAME -----
  hostBtn.addEventListener("click", () => {
    detach();

    gameId = generateGameId();
    hostGameCode.textContent = gameId;

    calledNumbers = [];
    lastNumberDiv.textContent = "";
    calledList.innerHTML = "";
    playerListDiv.innerHTML = "";

    const payload = { calledNumbers: [], players: {}, createdAt: Date.now() };

    // WRITE the game
    db.ref(`games/${gameId}`).set(payload)
      .then(() => {
        // READ it back to confirm it truly exists
        return db.ref(`games/${gameId}`).once("value");
      })
      .then((snap) => {
        if (!snap.exists()) {
          alert("Host write did not persist. This is almost always Firebase Rules.");
          return;
        }
        console.log("✅ Game confirmed in DB:", gameId);
        startPlayersListener();
        show(hostScreen);
      })
      .catch((err) => {
        console.error("❌ Host create failed:", err);
        alert("Host create failed: " + err.message + "\n\nFix: Firebase Rules must allow write.");
      });
  });

  // ----- JOIN SCREEN -----
  joinBtn.addEventListener("click", () => show(joinScreen));

  joinGameStartBtn.addEventListener("click", () => {
    detach();

    playerName = playerNameInput.value.trim();
    gameId = joinCodeInput.value.trim();

    if (!playerName || !gameId) {
      alert("Enter your name and join code.");
      return;
    }

    db.ref(`games/${gameId}`).once("value")
      .then((snap) => {
        if (!snap.exists()) {
          alert("Game does not exist.");
          return;
        }

        generateCard();

        return db.ref(`games/${gameId}/players/${playerName}`).set({
          card: card,
          marked: marked
        });
      })
      .then(() => {
        if (!gameId) return;
        startCalledListener();
        show(playerScreen);
      })
      .catch((err) => {
        console.error("❌ Join failed:", err);
        alert("Join failed: " + err.message);
      });
  });

  // ----- HOST CALL NEXT NUMBER -----
  callNumberBtn.addEventListener("click", () => {
    if (!gameId) return;
    if (calledNumbers.length === 75) return;

    let n;
    do {
      n = Math.floor(Math.random() * 75) + 1;
    } while (calledNumbers.includes(n));

    calledNumbers.push(n);

    db.ref(`games/${gameId}/calledNumbers`).set(calledNumbers)
      .catch((err) => alert("Failed to write called number: " + err.message));

    lastNumberDiv.textContent = n;

    const div = document.createElement("div");
    div.className = "called-number";
    div.textContent = n;
    calledList.appendChild(div);
  });

  // ----- CARD GENERATION -----
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
        const v = [b, i, n, g, o][c][r];
        card[r][c] = v;
        marked[r][c] = false;
      }
    }

    card[2][2] = "FREE";
    marked[2][2] = true;

    bingoMessage.classList.add("hidden");
    renderCard();
  }

  function renderCard() {
    cardGrid.innerHTML = "";
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        const cell = document.createElement("div");
        cell.className = "cell";
        if (r === 2 && c === 2) cell.classList.add("free");
        if (marked[r][c]) cell.classList.add("marked");
        cell.textContent = card[r][c];

        cell.addEventListener("click", () => {
          if (card[r][c] === "FREE") return;
          marked[r][c] = !marked[r][c];
          renderCard();
          db.ref(`games/${gameId}/players/${playerName}/marked`).set(marked);
          if (checkBingo()) bingoMessage.classList.remove("hidden");
        });

        cardGrid.appendChild(cell);
      }
    }
  }

  function renderCalledNumbersPlayer() {
    calledListPlayer.innerHTML = "";
    calledNumbers.forEach((n) => {
      const div = document.createElement("div");
      div.className = "called-number";
      div.textContent = n;
      calledListPlayer.appendChild(div);
    });
  }

  function checkBingo() {
    for (let r = 0; r < 5; r++) if (marked[r].every(m => m)) return true;

    for (let c = 0; c < 5; c++) {
      let all = true;
      for (let r = 0; r < 5; r++) {
        if (!marked[r][c]) { all = false; break; }
      }
      if (all) return true;
    }

    let d1 = true, d2 = true;
    for (let i = 0; i < 5; i++) {
      if (!marked[i][i]) d1 = false;
      if (!marked[i][4 - i]) d2 = false;
    }
    return d1 || d2;
  }

  // ----- BACK BUTTONS -----
  backFromHost.addEventListener("click", () => { detach(); show(homeScreen); });
  backFromJoin.addEventListener("click", () => { detach(); show(homeScreen); });
  backFromPlayer.addEventListener("click", () => { detach(); show(homeScreen); });
});
