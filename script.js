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
  const playerListDiv = document.getElementById("playerList");

  const playerNameInput = document.getElementById("playerNameInput");
  const oracleIdInput = document.getElementById("oracleIdInput");
  const joinCodeInput = document.getElementById("joinCodeInput");
  const joinGameStartBtn = document.getElementById("joinGameStartBtn");

  const cardGrid = document.getElementById("cardGrid");
  const calledListPlayer = document.getElementById("calledListPlayer");
  const bingoMessage = document.getElementById("bingoMessage");

  let gameId = null;

  let playerName = "";
  let oracleId = "";

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

  function normalizeCalledNumbers(raw) {
    if (!Array.isArray(raw)) return [];
    return raw.map((n) => Number(n)).filter((n) => Number.isFinite(n));
  }

  function isValidOracleId(id) {
    return /^\d{7}$/.test(id);
  }

  function startPlayersListener() {
    if (playersRef) playersRef.off();
    playersRef = db.ref(`games/${gameId}/players`);
    playersRef.on("value", (snap) => {
      const players = snap.val() || {};
      playerListDiv.innerHTML = "";

      Object.keys(players).forEach((oid) => {
        const data = players[oid] || {};
        const nm = typeof data.name === "string" ? data.name : "Unknown";

        const div = document.createElement("div");
        div.className = "player-name";
        div.textContent = `${nm} (${oid})`;
        playerListDiv.appendChild(div);
      });
    });
  }

  function startCalledListener() {
    if (calledRef) calledRef.off();
    calledRef = db.ref(`games/${gameId}/calledNumbers`);
    calledRef.on("value", (snap) => {
      calledNumbers = normalizeCalledNumbers(snap.val() || []);
      renderCalledNumbersPlayer();
      renderCard();
    });
  }

  hostBtn.addEventListener("click", () => {
    detach();

    gameId = generateGameId();
    hostGameCode.textContent = gameId;

    calledNumbers = [];
    lastNumberDiv.textContent = "";
    calledList.innerHTML = "";
    playerListDiv.innerHTML = "";

    const payload = { calledNumbers: [], players: {}, createdAt: Date.now() };

    db.ref(`games/${gameId}`).set(payload)
      .then(() => db.ref(`games/${gameId}`).once("value"))
      .then((snap) => {
        if (!snap.exists()) {
          alert("Host write did not persist. Check Firebase Realtime Database rules.");
          return;
        }
        startPlayersListener();
        show(hostScreen);
      })
      .catch((err) => {
        console.error("Host create failed:", err);
        alert("Host create failed: " + err.message);
      });
  });

  joinBtn.addEventListener("click", () => show(joinScreen));

  joinGameStartBtn.addEventListener("click", () => {
    detach();

    playerName = playerNameInput.value.trim();
    oracleId = (oracleIdInput.value || "").trim();
    gameId = joinCodeInput.value.trim();

    if (!playerName || !oracleId || !gameId) {
      alert("Enter your name, Oracle ID, and join code.");
      return;
    }

    if (!isValidOracleId(oracleId)) {
      alert("Oracle ID must be exactly 7 digits.");
      return;
    }

    db.ref(`games/${gameId}`).once("value")
      .then((snap) => {
        if (!snap.exists()) {
          alert("Game does not exist.");
          return;
        }

        // Check if this Oracle ID already joined this game
        return db.ref(`games/${gameId}/players/${oracleId}`).once("value");
      })
      .then((playerSnap) => {
        if (!playerSnap) return;

        if (playerSnap.exists()) {
          alert("That Oracle ID has already joined this game.");
          return;
        }

        generateCard();

        // Store player by Oracle ID so it can only exist once
        return db.ref(`games/${gameId}/players/${oracleId}`).set({
          name: playerName,
          oracleId: oracleId,
          card: card,
          marked: marked,
          joinedAt: Date.now()
        });
      })
      .then(() => {
        // If join was blocked above, oracleId exists but we returned without writing.
        // We can confirm the player exists before proceeding.
        if (!gameId || !oracleId) return;

        return db.ref(`games/${gameId}/players/${oracleId}`).once("value");
      })
      .then((confirmSnap) => {
        if (!confirmSnap || !confirmSnap.exists()) return;

        startCalledListener();
        show(playerScreen);
      })
      .catch((err) => {
        console.error("Join failed:", err);
        alert("Join failed: " + err.message);
      });
  });

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
        cell.classList.add("cell");

        if (r === 2 && c === 2) cell.classList.add("free");
        if (marked[r][c]) cell.classList.add("marked");

        const value = card[r][c];
        cell.textContent = value;

        cell.addEventListener("click", () => {
          if (value === "FREE") return;

          const num = Number(value);
          if (!Number.isFinite(num) || !calledNumbers.includes(num)) {
            cell.classList.add("invalid");
            setTimeout(() => cell.classList.remove("invalid"), 2000);
            return;
          }

          marked[r][c] = !marked[r][c];
          renderCard();

          if (oracleId) {
            db.ref(`games/${gameId}/players/${oracleId}/marked`).set(marked);
          }

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
    for (let r = 0; r < 5; r++) if (marked[r].every((m) => m)) return true;

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

    let d1 = true;
    let d2 = true;
    for (let i = 0; i < 5; i++) {
      if (!marked[i][i]) d1 = false;
      if (!marked[i][4 - i]) d2 = false;
    }
    return d1 || d2;
  }

  backFromHost.addEventListener("click", () => {
    detach();
    show(homeScreen);
  });

  backFromJoin.addEventListener("click", () => {
    detach();
    show(homeScreen);
  });

  backFromPlayer.addEventListener("click", () => {
    detach();
    show(homeScreen);
  });
});
