
&lt;?php
// PHP Backend for Waste2Goods Platform
require 'data.php';

$allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
    'http://127.0.0.1:3000',
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowedOrigins, true)) {
    header("Access-Control-Allow-Origin: {$origin}");
} else {
    header("Access-Control-Allow-Origin: http://localhost:5173");
}
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle OPTIONS request for CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$request_uri = $_SERVER['REQUEST_URI'];

// Remove query string
$path = parse_url($request_uri, PHP_URL_PATH);

function jsonResponse($data) {
    echo json_encode($data);
    exit();
}

function jsonError($message, $code = 404) {
    http_response_code($code);
    echo json_encode(['error' =&gt; $message]);
    exit();
}

// API Routes
if ($path === '/api/users') {
    jsonResponse($GLOBALS['USERS']);
} elseif (preg_match('#^/api/users/([^/]+)$#', $path, $matches)) {
    $id = $matches[1];
    $user = null;
    foreach ($GLOBALS['USERS'] as $u) {
        if ($u['id'] === $id) {
            $user = $u;
            break;
        }
    }
    if ($user) {
        jsonResponse($user);
    } else {
        jsonError('User not found');
    }
} elseif ($path === '/api/kiosks') {
    jsonResponse($GLOBALS['KIOSKS']);
} elseif ($path === '/api/rewards') {
    jsonResponse($GLOBALS['REWARDS']);
} elseif ($path === '/api/transactions') {
    jsonResponse($GLOBALS['TRANSACTIONS']);
} elseif ($path === '/api/analytics/weekly') {
    jsonResponse($GLOBALS['WEEKLY_DATA']);
} elseif ($path === '/api/analytics/monthly') {
    jsonResponse($GLOBALS['MONTHLY_DATA']);
} elseif ($path === '/api/leaderboard') {
    jsonResponse($GLOBALS['LEADERBOARD']);
} elseif ($path === '/api/tasks') {
    jsonResponse($GLOBALS['TASKS']);
} else {
    jsonError('Not Found');
}
?&gt;

