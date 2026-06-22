<?php
// init_db.php - run once in browser or CLI to create DB
$dbFile = __DIR__ . '/scores.db';
$db = new PDO('sqlite:' . $dbFile);
$db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
$db->exec("CREATE TABLE IF NOT EXISTS scores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  score INTEGER,
  created_at TEXT
)");
echo "DB initialized: $dbFile\n";
