let state = null;
let producerRates = null;

function initializeState() {
  if (!state) {
    state = {
      mass: 0,
      clickPower: 1,
      prestigeCount: 0,
      prestigeMulti: 1,
      producers: GAME_CONFIG.producers.map(() => 0),
      upgrades: GAME_CONFIG.upgrades.map(() => false)
    };
  }
  if (!producerRates) {
    producerRates = GAME_CONFIG.producers.map(p => p.baseRate);
  }
}

function recalculateRates() {
  producerRates = GAME_CONFIG.producers.map(p => p.baseRate);
  GAME_CONFIG.upgrades.forEach((u, i) => {
    if (state.upgrades[i] && u.type === "producer") {
      producerRates[u.target] *= u.mult;
    }
  });
}

async function saveGame() {
  try {
    const res = await fetch("save.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ state, producerRates })
    });
    const data = await res.json();
    showSaveStatus("Sparat " + data.savedAt);
  } catch (e) {
    showSaveStatus("Kunde inte spara");
  }
}

async function loadGame() {
  initializeState();
  try {
    const res = await fetch("save.php");
    const data = await res.json();
    if (data.empty) {
      render();
      return;
    }
    state = data.state || {};
    if (!Array.isArray(state.producers)) {
      state.producers = GAME_CONFIG.producers.map(() => 0);
    }
    if (!Array.isArray(state.upgrades)) {
      state.upgrades = GAME_CONFIG.upgrades.map(() => false);
    }
    while (state.producers.length < GAME_CONFIG.producers.length) {
      state.producers.push(0);
    }
    while (state.upgrades.length < GAME_CONFIG.upgrades.length) {
      state.upgrades.push(false);
    }
    producerRates = Array.isArray(data.producerRates)
      ? data.producerRates.slice(0, GAME_CONFIG.producers.length)
      : GAME_CONFIG.producers.map(p => p.baseRate);
    if (producerRates.length < GAME_CONFIG.producers.length) {
      producerRates = GAME_CONFIG.producers.map(p => p.baseRate);
    }
    recalculateRates();
    state.clickPower = 1;
    GAME_CONFIG.upgrades.forEach((u, i) => {
      if (state.upgrades[i] && u.type === "click") {
        state.clickPower *= u.mult;
      }
    });
    showSaveStatus("Laddade sparad data");
    render();
  } catch (e) {
    console.error("Error loading game:", e);
    initializeState();
    showSaveStatus("Ingen sparad data");
    render();
  }
}

async function deleteSave() {
  await fetch("save.php", { method: "DELETE" });
}

function showSaveStatus(msg) {
  const el = document.getElementById("save-status");
  el.textContent = msg;
  setTimeout(() => { el.textContent = ""; }, 3000);
}

setInterval(saveGame, 30000);

function formatMass(n) {
  if (n >= 1e12) return (n / 1e12).toFixed(2) + " Tg";
  if (n >= 1e9)  return (n / 1e9).toFixed(2)  + " Gg";
  if (n >= 1e6)  return (n / 1e6).toFixed(2)  + " Mg";
  if (n >= 1000) return (n / 1000).toFixed(2) + " t";
  return Math.floor(n) + " kg";
}

function producerCost(index) {
  initializeState();
  return Math.floor(
    GAME_CONFIG.producers[index].baseCost * Math.pow(1.15, state.producers[index])
  );
}

function getPerSec() {
  initializeState();
  let total = 0;
  for (let i = 0; i < producerRates.length; i++) {
    total += state.producers[i] * producerRates[i];
  }
  return total * state.prestigeMulti;
}

function doClick() {
  initializeState();
  const gain = state.clickPower * state.prestigeMulti;
  state.mass += gain;
  const btn = document.getElementById("click-btn");
  btn.classList.remove("flash");
  void btn.offsetWidth;
  btn.classList.add("flash");
  render();
}

async function buyProducer(index) {
  initializeState();
  const cost = producerCost(index);
  if (state.mass < cost) return;
  state.mass -= cost;
  state.producers[index]++;
  await saveGame();
  render();
}

async function buyUpgrade(index) {
  initializeState();
  const u = GAME_CONFIG.upgrades[index];
  if (!u || state.upgrades[index] || state.mass < u.cost) return;
  state.mass -= u.cost;
  state.upgrades[index] = true;
  if (u.type === "click") {
    state.clickPower *= u.mult;
  } else if (u.type === "producer") {
    producerRates[u.target] *= u.mult;
  }
  await saveGame();
  render();
}

async function doPrestige() {
  if (state.mass < GAME_CONFIG.prestigeRequirement) return;
  state.prestigeCount++;
  state.prestigeMulti = 1 + state.prestigeCount * 0.5;
  state.mass = 0;
  state.clickPower = 1;
  state.producers = GAME_CONFIG.producers.map(() => 0);
  state.upgrades = GAME_CONFIG.upgrades.map(() => false);
  producerRates = GAME_CONFIG.producers.map(p => p.baseRate);
  await deleteSave();
  await saveGame();
  render();
}

function render() {
  initializeState();
  document.getElementById("mass-display").textContent = formatMass(state.mass);
  document.getElementById("per-sec").textContent = "+" + formatMass(getPerSec()) + "/s";

  const req = GAME_CONFIG.prestigeRequirement;
  const pBtn = document.getElementById("prestige-btn");
  pBtn.disabled = state.mass < req;
  document.getElementById("prestige-text").textContent =
    state.prestigeCount > 0
      ? "Prestige x" + state.prestigeCount + " — multiplikator: x" + state.prestigeMulti.toFixed(1)
      : "Krav: " + formatMass(req);
  document.getElementById("prestige-info").textContent =
    state.prestigeCount > 0 ? "x" + state.prestigeMulti.toFixed(1) + " bonus aktiv" : "";

  const ul = document.getElementById("upgrade-list");
  ul.innerHTML = "";
  GAME_CONFIG.upgrades.forEach((u, i) => {
    if (state.upgrades[i]) return;
    const canAfford = state.mass >= u.cost;
    
    const div = document.createElement("div");
    div.className = "item" + (canAfford ? " can-afford" : " disabled");

    const leftDiv = document.createElement("div");
    leftDiv.className = "item-left";
    leftDiv.innerHTML = `<div class="name">${u.name}</div><div class="desc">${u.desc}</div>`;

    const rightDiv = document.createElement("div");
    rightDiv.className = "item-right";

    const btn = document.createElement("button");
    btn.className = "buy-btn";
    btn.disabled = !canAfford;
    btn.textContent = formatMass(u.cost);
    
    btn.addEventListener("click", () => buyUpgrade(i));

    rightDiv.appendChild(btn);
    div.appendChild(leftDiv);
    div.appendChild(rightDiv);
    ul.appendChild(div);
  });

  const pl = document.getElementById("producer-list");
  pl.innerHTML = "";
  GAME_CONFIG.producers.forEach((p, i) => {
    const cost = producerCost(i);
    const canAfford = state.mass >= cost;
    
    const div = document.createElement("div");
    div.className = "item" + (canAfford ? " can-afford" : " disabled");

    const leftDiv = document.createElement("div");
    leftDiv.className = "item-left";
    leftDiv.innerHTML = `<div class="name">${p.name}</div><div class="desc">${p.desc}</div>`;

    const rightDiv = document.createElement("div");
    rightDiv.className = "item-right";

    const countSpan = document.createElement("span");
    countSpan.className = "item-count";
    countSpan.textContent = state.producers[i];

    const btn = document.createElement("button");
    btn.className = "buy-btn";
    btn.disabled = !canAfford;
    btn.textContent = formatMass(cost);
    
    btn.addEventListener("click", () => buyProducer(i));

    rightDiv.appendChild(countSpan);
    rightDiv.appendChild(btn);
    div.appendChild(leftDiv);
    div.appendChild(rightDiv);
    pl.appendChild(div);
  });
}

document.getElementById("click-btn").addEventListener("click", doClick);
document.getElementById("prestige-btn").addEventListener("click", doPrestige);

async function startGame() {
  await loadGame();
  setInterval(() => {
    const ps = getPerSec();
    if (ps > 0) {
      state.mass += ps / 20;
      render();
    }
  }, 50);
}

startGame();