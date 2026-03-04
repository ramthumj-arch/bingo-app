document.addEventListener("DOMContentLoaded", () => {
  /* ---------------------------------------------------------
     FIREBASE SETUP
  --------------------------------------------------------- */
  const firebaseConfig = {
    apiKey: "AIzaSyBNq30kO9C38ARmcMXrmooN7o06QTpHi0c",
    authDomain: "bingo-app-2411a.firebaseapp.com",
    databaseURL: "https://bingo-app-2411a-default-rtdb.firebaseio.com",
    projectId: "bingo-app-2411a",
    storageBucket: "bingo-app-2411a.firebasestorage.app",
    messagingSenderId: "422075669233",
    appId: "1:422075669233:web:d9719e10e4e5bf50ebe750"
  };

  // Prevent double-init if the script is ever loaded twice
  if (!firebase.apps || !firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }
  const db = firebase.database();

  /* ---------------------------------------------------------
     SCREEN ELEMENTS
  --------------------------------------------------------- */
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
  const joinCodeInput = document.getElementById("joinCodeInput");
  const joinGameStartBtn = document.getElementById("joinGameStartBtn");

  const cardGrid = document.getElementById("cardGrid");
  const calledListPlayer = document.getElementById("calledListPlayer");
  const bingoMessage = document.getElementById("bingoMessage");

  // Basic DOM sanity check (if anything is null, nothing will work)
  const requiredEls = [
    homeScreen, hostScreen, joinScreen, playerScreen,
    hostBtn, joinBtn, backFromHost, backFromJoin, backFromPlayer,
    hostGameCode, callNumberBtn, lastNumberDiv, calledList, playerListDiv,
    playerNameInput, joinCodeInput, joinGameStartBtn,
    cardGrid, calledListPlayer, bingoMessage
  ];
  if (requiredEls.some(el => !el)) {
    console.error("❌ Missing required DOM element(s). Check index.html ids.");
    alert("HTML is missing one or more required elements. Check console.");
    return;
  }

  /* ---------------------------------------------------------
     GAME STATE
  --------------------------------------------------------- */
  let gameId = null;
  let playerName = "";
  let card = [];
  let marked = [];
  let calledNumbers = [];

  // Keep references so we can detach listeners when leaving screens
  let playersRef = null;
  let calledNumbersRef = null;

  /* ---------------------------------------------------------
     NAVIGATION
  --------------------------------------------------------- */
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

  function detachListeners() {
    if (playersRef) playersRef.off();
    if (calledNumbersRef) calledNumbersRef.off();
    playersRef = null;
    calledNumbersRef = null;
  }

  /* ---------------------------------------------------------
     HOST: PLAYERS LIST LISTENER
  --------------------------------------------------------- */
  function startPlayersListener() {
    if (!gameId) return;
    if (playersRef) playersRef.off();

    playersRef = db.ref(`games/${gameId}/players`);
    playersRef.on("value", (snapshot) => {
      const players = snapshot.val() || {};
      playerListDiv.innerHTML = "";

      Object.keys(players).forEach((name) => {
        const div = document.createElement("div");
        div.classList.add("player-name");
        div.textContent = name;
        playerListDiv.appendChild(div);
      });
    }, (err) => {
      console.error("❌ players listener error:", err);
    });
  }

  /* ---------------------------------------------------------
     HOST GAME
  --------------------------------------------------------- */
  hostBtn.addEventListener("click", () => {
    detachListeners();

    gameId = generateGameId();
    hostGameCode.textContent = gameId;

    // reset host UI
    calledNumbers = [];
    lastNumberDiv.textContent = "";
    calledList.innerHTML = "";
    playerListDiv.innerHTML = "";

    const payload = {
      calledNumbers: [],
      players: {},
      createdAt: Date.now()
    };

    db.ref(`games/${gameId}`).set(payload)
      .then(() => {
        console.log("✅ Game created:", gameId);
        startPlayersListener();
        show(hostScreen);
      })
      .catch((err) => {
        console.error("❌ Host create failed:", err);
        alert("Host failed to create game in Firebase: " + err.message);

        // If this alerts "Permission denied", your DB Rules are blocking writes.
      });
  });

  /* ---------------------------------------------------------
     JOIN GAME
  --------------------------------------------------------- */
  joinBtn.addEventListener("click", () => show(joinScreen));

  joinGameStartBtn.addEventListener("click", () => {
    detachListeners();

    playerName = playerNameInput.value.trim();
    gameId = joinCodeInput.value.trim();

    if (!playerName || !gameId) {
      alert("Enter your name and join code.");
      return;
    }

    db.ref(`games/${gameId}`).once("value")
      .then(snapshot => {
        if (!snapshot.exists()) {
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

        // Listen for called numbers (player)
        calledNumbersRef = db.ref(`games/${gameId}/calledNumbers`);
        calledNumbersRef.on("value", (snapshot) => {
          calledNumbers = snapshot.val() || [];
          renderCalledNumbersPlayer();
        }, (err) => {
          console.error("❌ calledNumbers listener error:", err);
        });

        show(playerScreen);
      })
      .catch(err => {
        console.error("❌ Join failed:", err);
        alert("Join failed: " + err.message);
      });
  });

  /* ---------------------------------------------------------
     HOST CALLS NEXT NUMBER
  --------------------------------------------------------- */
  callNumberBtn.addEventListener("click", () => {
    if (!gameId) return;
    if (calledNumbers.length === 75) return;

    let n;
    do {
      n = Math.floor(Math.random() * 75) + 1;
    } while (calledNumbers.includes(n));

    calledNumbers.push(n);

    db.ref(`games/${gameId}/calledNumbers`).set(calledNumbers)
      .catch(err => {
        console.error("❌ failed to write calledNumbers:", err);
        alert("Failed to write called number: " + err.message);
      });

    lastNumberDiv.textContent = n;

    const div = document.createElement("div");
    div.classList.add("called-number");
    div.textContent = n;
    calledList.appendChild(div);
  });

  /* ---------------------------------------------------------
     BINGO CARD GENERATION
  --------------------------------------------------------- */
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

  /* ---------------------------------------------------------
     RENDER CARD
  --------------------------------------------------------- */
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

          db.ref(`games/${gameId}/players/${playerName}/marked`).set(marked)
            .catch(err => console.error("❌ failed to sync marked:", err));

          if (checkBingo()) bingoMessage.classList.remove("hidden");
        });

        cardGrid.appendChild(cell);
      }
    }
  }

  /* ---------------------------------------------------------
     RENDER CALLED NUMBERS FOR PLAYER
  --------------------------------------------------------- */
  function renderCalledNumbersPlayer() {
    calledListPlayer.innerHTML = "";
    calledNumbers.forEach(n => {
      const div = document.createElement("div");
      div.classList.add("called-number");
      div.textContent = n;
      calledListPlayer.appendChild(div);
    });
  }

  /* ---------------------------------------------------------
     BINGO CHECK
  --------------------------------------------------------- */
  function checkBingo() {
    for (let r = 0; r < 5; r++) {
      if (marked[r].every(m => m)) return true;
    }

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

    let diag1 = true;
    let diag2 = true;
    for (let i = 0; i < 5; i++) {
      if (!marked[i][i]) diag1 = false;
      if (!marked[i][4 - i]) diag2 = false;
    }

    return diag1 || diag2;
  }

  /* ---------------------------------------------------------
     BACK BUTTONS
  --------------------------------------------------------- */
  backFromHost.addEventListener("click", () => {
    detachListeners();
    show(homeScreen);
  });

  backFromJoin.addEventListener("click", () => {
    detachListeners();
    show(homeScreen);
  });

  backFromPlayer.addEventListener("click", () => {
    detachListeners();
    show(homeScreen);
  });
});
