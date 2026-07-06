<?php
// --- simple debug logger ---
$logFile = __DIR__ . '/save_score.log';
$rawBody = file_get_contents('php://input');
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

// make log entry
file_put_contents(
    $logFile,
    date('c') . " " . $_SERVER['REMOTE_ADDR'] .
    " Origin: " . $origin . PHP_EOL .
    "Headers: " . json_encode(function_exists('getallheaders') ? getallheaders() : []) . PHP_EOL .
    "Body: " . $rawBody . PHP_EOL . str_repeat("-", 40) . PHP_EOL,
    FILE_APPEND
);
// --- end logger ---

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

header('Content-Type: application/json');

// decode JSON
$input = json_decode($rawBody, true);

if (!$input || !isset($input['name']) || !isset($input['score'])) {
    echo json_encode(['success' => false, 'error' => 'invalid']);
    exit;
}

$name = preg_replace('/[^a-zA-Z0-9_\-\s]/', '', $input['name']); // allow only safe characters
$name = trim($name);
$name = substr($name, 0, 13);
if ($name === '') {
    echo json_encode(['success' => false, 'error' => 'invalid name']);
    exit;
}
$score = (int)$input['score'];

try {
    $db = new PDO('sqlite:' . __DIR__ . '/scores.db');
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // 🔎 Check if name already exists and fetch old score
    $stmt = $db->prepare('SELECT score FROM scores WHERE name = :n LIMIT 1');
    $stmt->execute([':n' => $name]);
    $oldScore = $stmt->fetchColumn();

    if ($oldScore === false) {
        // ✅ No record found → insert new
        $stmt = $db->prepare(
            'INSERT INTO scores (name, score, created_at) VALUES (:n, :s, :t)'
        );
        $stmt->execute([
            ':n' => $name,
            ':s' => $score,
            ':t' => date('c')
        ]);
        echo json_encode(['success' => true, 'action' => 'inserted']);
    } elseif ($score > $oldScore) {
        // 🔄 Better score → update existing
        $stmt = $db->prepare(
            'UPDATE scores SET score = :s, created_at = :t WHERE name = :n'
        );
        $stmt->execute([
            ':s' => $score,
            ':t' => date('c'),
            ':n' => $name
        ]);
        echo json_encode(['success' => true, 'action' => 'updated']);
    } else {
        // ⏹ Score not better → do nothing
        echo json_encode(['success' => false, 'error' => 'score not improved']);
    }

} catch (Exception $e) {
    // log exception too
    file_put_contents(
        $logFile,
        date('c') . " EXCEPTION: " . $e->getMessage() . PHP_EOL,
        FILE_APPEND
    );

    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
