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
  <div id="game-wrap"
     style="
       background-image: url('assets/explosion.gif');
       /*background-repeat: no-repeat;
       background-position: center bottom;
       background-size: cover;*/
     ">
    <canvas id="game" width="720" height="1200" style="margin-top:40px;"></canvas> <!-- increased logical canvas default -->
    <!-- All game UI (controls, panels, leaders) rendered inside canvas now -->
  </div>

  <!-- In-canvas UI will replace the DOM panels and buttons. vibhore-->

<script src="script.js?v=<?= time() ?>" defer></script>
</body>
</html>
