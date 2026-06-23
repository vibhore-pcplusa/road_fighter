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
    <canvas id="game" width="720" height="1200"></canvas> <!-- increased logical canvas default -->
    <div class="controls-row">
      <button id="startBtn" class="btn-full">Start</button>
      <button id="pauseBtn" class="btn-full">Pause</button>
      
      
      <!--<button id="shareBtn" class="share-btn">🚀 Share</button>-->
    </div>

    <div class="touch-controls" id="touchControls">
        <div class="touch-center" role="group" aria-label="Accelerate">
          <button id="accelerateTouch" class="accelerate-btn"><span class="accelerate-icon">&#8607;</span></button>
        </div>
        <div class="touch-row">
          <button id="leftTouch">◀</button>
          <button id="brakeTouch">⏸</button>
          <button id="rightTouch">▶</button>
        </div>
    </div>
  </div>

  <div id="ui">
    <!--<h3>Road Fighter</h3>

    <-- Updated: compact horizontal stats bar with larger numeric values --
    <div class="stats">
      <div class="stat">Score <span id="score" class="stat-value">0</span></div>
      <div class="stat">Level <span id="level" class="stat-value">1</span></div>
      <div class="stat">Speed <span id="speed" class="stat-value">0 km/h</span></div>
    </div>-->

    <!-- Buttons to open separate panels (reordered: Controls, Top Scores, Save Score) -->
    <div class="panelBtns">
      <button id="openControls">Controls</button>
      <button id="openLeaders">Top Scores</button>
      <button id="openSave">Save</button>
    </div>

  </div>

  <!-- Panels: Save, Leaders, Controls -->
  <div id="savePanel" class="panel" aria-hidden="true">
    <header>
      <strong>Save Score</strong>
      <button class="close" data-close="savePanel">✕</button>
    </header>
    <div>
      <label>Name</label>
      <input id="playerName" type="text" maxlength="20" placeholder="Player">
      <button id="saveBtn" class="btn-full">Save Score</button>
    </div>
  </div>

  <div id="leadersPanel" class="panel" aria-hidden="true">
    <header>
      <strong>Top Scores</strong>
      <button class="close" data-close="leadersPanel">✕</button>
    </header>
    <div id="leadersFull">
      <ol id="leaderList"><li>Loading...</li></ol>
    </div>
  </div>

  <div id="controlsPanel" class="panel" aria-hidden="true">
    <header>
      <strong>Controls & Rules</strong>
      <button class="close" data-close="controlsPanel">✕</button>
    </header>
    <div class="panel-content">
      <ul>
        <li>Arrow keys / A D to move left/right</li>
        <li>Up to speed up, Down to slow</li>
        <li>Touch controls appear on small screens</li>
        <li>Initial Minimum speed is 20Km/hr and Maximum is 120Km/hr, it will increase gradually as you level up.</li>
        <li>At every 400 score level changes, then minimum speed and maximum speed limits will be increased by 20km/hr</li>
        <li>Developed by Vibhore Jain - vibhore.mit@gmail.com</li>
      </ul>
    </div>
  </div>

<script src="script.js?v=<?= time() ?>" defer></script>
</body>
</html>
