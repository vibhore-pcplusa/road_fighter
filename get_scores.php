<?php
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowed = [
    'https://gamemonetize.com',
    'https://html5.gamemonetize.com',
    'https://uncached.gamemonetize.co',
    'https://html5.gamemonetize.co'
];
if (in_array($origin, $allowed)) {
    header("Access-Control-Allow-Origin: $origin");
    header("Vary: Origin");
    header("Access-Control-Allow-Headers: Content-Type");
    header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
}
// get_scores.php
header('Content-Type: application/json');
try {
  $db = new PDO('sqlite:' . __DIR__ . '/scores.db');
  $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
  $stmt = $db->query('SELECT name,score,created_at FROM scores ORDER BY score DESC, created_at ASC LIMIT 10');
  $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
  echo json_encode($rows);
} catch(Exception $e) {
  http_response_code(500);
  echo json_encode([]);
}
