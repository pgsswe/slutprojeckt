<?php
require_once "config.php";
?>
<!DOCTYPE html>
<html lang="sv">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Massa</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div id="app">
    <header>
      <h1>MASSA</h1>
      <div id="prestige-info"></div>
    </header>

    <section id="mass-panel">
      <div id="mass-display">0 kg</div>
      <div id="per-sec">+0/s</div>
      <button id="click-btn">Samla massa</button>
    </section>

    <section id="content-panels">
      <section id="upgrades-panel">
        <h2>Uppgraderingar</h2>
        <div id="upgrade-list"></div>
      </section>

      <section id="producers-panel">
        <h2>Atomer</h2>
        <div id="producer-list"></div>
      </section>
    </section>

    <section id="prestige-panel">
      <div id="prestige-text">Krav: 1 000 000 kg</div>
      <button id="prestige-btn" disabled>Kollaps</button>
    </section>

    <div id="save-status"></div>
  </div>

  <script>
    const GAME_CONFIG = {
      producers: <?= json_encode($PRODUCERS) ?>,
      upgrades:  <?= json_encode($UPGRADES) ?>,
      prestigeRequirement: <?= $PRESTIGE_REQUIREMENT ?>
    };
  </script>
  <script src="game.js"></script>
</body>
</html>