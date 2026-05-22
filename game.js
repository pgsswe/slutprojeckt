// ─── Konfiguration från PHP (via index.php) ──────────────────────────────────
// GAME_CONFIG.producers, GAME_CONFIG.upgrades, GAME_CONFIG.prestigeRequirement

// ─── State ───────────────────────────────────────────────────────────────────

let state = {
  mass: 0,
  clickPower: 1,
  prestigeCount: 0,
  prestigeMulti: 1,
  producers: GAME_CONFIG.producers.map(() => 0),
  upgrades: GAME_CONFIG.upgrades.map(() => false)
};

let producerRates = GAME_CONFIG.producers.map(p => p.baseRate);

// ─── Spara / Ladda via save.php ───────────────────────────────────────────────

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
  try {
    const res = await fetch("save.php");
    const data = await res.json();
    if (data.empty) return;
    state = data.state;
    producerRates = data.producerRates;
    showSaveStatus("Laddade sparad data");
    render();
  } catch (e) {
    showSaveStatus("Ingen sparad data");
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

// ─── Hjälpfunktioner ─────────────────────────────────────────────────────────

function formatMass(n) {
  if (n >= 1e12) return (n / 1e12).toFixed(2) + " Tg";
  if (n >= 1e9)  return (n / 1e9).toFixed(2)  + " Gg";
  if (n >= 1e6)  return (n / 1e6).toFixed(2)  + " Mg";
  if (n >= 1000) return (n / 1000).toFixed(2) + " t";
  return Math.floor(n) + " kg";
}

function producerCost(index) {
  return Math.floor(
    GAME_CONFIG.producers[index].baseCost * Math.pow(1.15, state.producers[index])
  );
}

function getPerSec() {
  let total = 0;
  for (let i = 0; i < producerRates.length; i++) {
    total += state.producers[i] * producerRates[i];
  }
  return total * state.prestigeMulti;
}

// ─── Åtgärder ────────────────────────────────────────────────────────────────

function doClick() {
  const gain = state.clickPower * state.prestigeMulti;
  state.mass += gain;
  const btn = document.getElementById("click-btn");
  btn.classList.remove("flash");
  void btn.offsetWidth;
  btn.classList.add("flash");
  render();
}

function buyProducer(index) {
  const cost = producerCost(index);
  if (state.mass < cost) return;
  state.mass -= cost;
  state.producers[index]++;
  render();
}

function buyUpgrade(index) {
  if (index < 0 || index >= GAME_CONFIG.upgrades.length) return;
  if (!state.upgrades[index]) {
    state.upgrades[index] = false;
  }
  const u = GAME_CONFIG.upgrades[index];
  if (state.upgrades[index] || state.mass < u.cost) return;
  state.mass -= u.cost;
  state.upgrades[index] = true;
  if (u.type === "click") {
    state.clickPower *= u.mult;
  } else if (u.type === "producer") {
    producerRates[u.target] *= u.mult;
  }
  saveGame();
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

// ─── Render ──────────────────────────────────────────────────────────────────

function render() {
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
    div.innerHTML = `
      <div class="item-left">
        <div class="name">${u.name}</div>
        <div class="desc">${u.desc}</div>
      </div>
      <div class="item-right">
        <button class="buy-btn" ${canAfford ? "" : "disabled"} onclick="buyUpgrade(${i})">
          ${formatMass(u.cost)}
        </button>
      </div>`;
    ul.appendChild(div);
  });

  const pl = document.getElementById("producer-list");
  pl.innerHTML = "";
  GAME_CONFIG.producers.forEach((p, i) => {
    const cost = producerCost(i);
    const canAfford = state.mass >= cost;
    const div = document.createElement("div");
    div.className = "item" + (canAfford ? " can-afford" : " disabled");
    div.innerHTML = `
      <div class="item-left">
        <div class="name">${p.name}</div>
        <div class="desc">${p.desc}</div>
      </div>
      <div class="item-right">
        <span class="item-count">${state.producers[i]}</span>
        <button class="buy-btn" ${canAfford ? "" : "disabled"} onclick="buyProducer(${i})">
          ${formatMass(cost)}
        </button>
      </div>`;
    pl.appendChild(div);
  });
}

// ─── Event listeners ─────────────────────────────────────────────────────────

document.getElementById("click-btn").addEventListener("click", doClick);
document.getElementById("prestige-btn").addEventListener("click", doPrestige);

// ─── Game loop ───────────────────────────────────────────────────────────────

setInterval(() => {
  const ps = getPerSec();
  if (ps > 0) {
    state.mass += ps / 20;
    render();
  }
}, 50);

loadGame();