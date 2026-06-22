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
      <button id="startBtn">Start</button>
      <button id="pauseBtn">Pause</button>
      <button id="shareBtn" class="share-btn">🚀 Share</button>
    </div>

    <div class="touch-controls" id="touchControls">
        <center><button id="accelerateTouch" class="accelerate-btn"><span class="accelerate-icon">&#8607;</span></button></center>
        <div class="touch-row">
          <button id="leftTouch">◀</button>
          <button id="brakeTouch">⏸</button>
          <button id="rightTouch">▶</button>
        </div>
    </div>
  </div>

  <div id="ui">
    <h3>Road Fighter</h3>

    <!-- Updated: compact horizontal stats bar with larger numeric values -->
    <div class="stats">
      <div class="stat">Score <span id="score" class="stat-value">0</span></div>
      <div class="stat">Level <span id="level" class="stat-value">1</span></div>
      <div class="stat">Speed <span id="speed" class="stat-value">0 km/h</span></div>
    </div>

    <!-- Buttons to open separate panels (reordered: Controls, Top Scores, Save Score) -->
    <div class="panelBtns">
      <button id="openControls">Controls</button>
      <button id="openLeaders">Top Scores</button>
      <button id="openSave">Save</button>
    </div>

    <!-- small quick leaders preview -->
    <div id="leaders" class="leaders-quick">
      <h4>Top Scores (Quick)</h4>
      <ol id="leaderList"><li>Loading...</li></ol>
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
      <ol id="leaderListFull">
        <li>Loading...</li>
      </ol>
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

<script>
  // Panel toggle logic and responsive canvas resize
  (function(){
    function $(id){ return document.getElementById(id); }
    var panels = ['savePanel','leadersPanel','controlsPanel'];
    panels.forEach(function(pid){
      var btn = $('open' + pid.replace('Panel',''));
      if(btn) btn.addEventListener('click', function(){ openPanel(pid); });
      var closeBtn = document.querySelector('[data-close="'+pid+'"]');
      if(closeBtn) closeBtn.addEventListener('click', function(){ closePanel(pid); });
    });
    function openPanel(id){
      panels.forEach(function(p){ if(p!==id) closePanel(p); });
      var el = $(id); if(el){ el.style.display='block'; el.setAttribute('aria-hidden','false'); }
    }
    function closePanel(id){ var el=$(id); if(el){ el.style.display='none'; el.setAttribute('aria-hidden','true'); } }

    // Close panels when clicking outside them (mobile friendly)
    document.addEventListener('click', function(e){
      var inside = e.target.closest('.panel') || e.target.matches('#openSave, #openLeaders, #openControls');
      if(!inside){
        panels.forEach(function(p){ closePanel(p); });
      }
    });

    // Responsive canvas sizing: ensure internal scripts relying on canvas size can read attributes
    var canvas = $('game');
    function syncCanvasSize(){
      // keep drawing resolution higher than CSS size for clarity
      var rect = canvas.getBoundingClientRect();
      var scale = window.devicePixelRatio || 1;
      var w = Math.max(480, Math.floor(rect.width * scale));
      var h = Math.max(640, Math.floor(rect.height * scale));
      canvas.width = w;
      canvas.height = h;
      // also keep CSS width at 100% so it fills parent
      canvas.style.width = '100%';
      canvas.style.height = ''; // let CSS rule control height
    }
    window.addEventListener('resize', syncCanvasSize);
    window.addEventListener('orientationchange', syncCanvasSize);
    // initial sync after DOM ready
    document.addEventListener('DOMContentLoaded', function(){ setTimeout(syncCanvasSize,50); });
    // ensure sync also runs if external script loads later
    setTimeout(syncCanvasSize,300);

  })();
</script>

<script src="script.js?v=<?= time() ?>" defer></script>
</body>
</html>
