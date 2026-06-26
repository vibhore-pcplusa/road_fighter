<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Road Fighter</title>
  <meta name="viewport" content="width=device-width,initial-scale=1" />

  <!-- link external stylesheet -->
  <link rel="stylesheet" href="style.css?v=<?= time() ?>">
</head>
<body>
  <div id="game-wrap">
    <div id="hudOverlay" class="hud-overlay">
      <button id="settingsToggle" class="settings-toggle" type="button" aria-label="Open shortcuts" aria-expanded="false">
        <img src="assets/settings.png" alt="Settings" />
      </button>
      <div id="quickMenu" class="quick-menu" aria-hidden="true">
        <button class="quick-action" data-panel="controls" type="button">Help</button>
        <button class="quick-action" data-panel="leaders" type="button">Leaders</button>
        <button class="quick-action" data-panel="save" type="button">Save</button>
      </div>
    </div>
    <canvas id="game" width="720" height="1200"></canvas> <!-- increased logical canvas default -->
    <!-- All game UI (controls, panels, leaders) rendered inside canvas now -->
  </div>

  <!-- In-canvas UI will replace the DOM panels and buttons. vibhore-->

<script src="script.js?v=<?= time() ?>" defer></script>
</body>
</html>
