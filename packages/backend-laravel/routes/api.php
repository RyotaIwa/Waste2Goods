<?php

require_once __DIR__ . '/../data.php';

// Constants for auth (from core/src/constants)
$ADMIN_CREDENTIALS = [
    'email' => 'admin@waste2goods.ph',
    'password' => 'AdminCabantian2025'
];
$KIOSK_PIN = '7890';
$DEMO_RESIDENT_CREDENTIALS = [
    'email' => 'resident@cabantian.ph',
    'password' => 'ResidentCabantian2025'
];
$VALID_TOKENS = [
    'mock_admin_token_123',
    'mock_resident_token_456',
    'mock_kiosk_token_789'
];

// Simple authentication check function
function authenticate() {
    global $VALID_TOKENS;
    $headers = getallheaders();
    $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
    if (empty($authHeader) || !str_starts_with($authHeader, 'Bearer ')) {
        http_response_code(401);
        echo json_encode(['error' => 'Unauthorized']);
        exit;
    }
    $token = substr($authHeader, 7);
    if (!in_array($token, $VALID_TOKENS)) {
        http_response_code(401);
        echo json_encode(['error' => 'Unauthorized']);
        exit;
    }
}

// Get request method and URI
$method = $_SERVER['REQUEST_METHOD'];
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
// Strip /public from URI if present (for PHP's built-in server)
$uri = preg_replace('#^/public#', '', $uri);

// Route handling
if ($method === 'POST' && $uri === '/api/auth/login') {
    $input = json_decode(file_get_contents('php://input'), true);
    $email = $input['email'] ?? '';
    $password = $input['password'] ?? '';
    
    if ($email === $ADMIN_CREDENTIALS['email'] && $password === $ADMIN_CREDENTIALS['password']) {
        echo json_encode([
            'token' => 'mock_admin_token_123',
            'user' => [
                'id' => 'A-001',
                'name' => 'Juan Reyes',
                'email' => 'admin@waste2goods.ph',
                'role' => 'admin',
                'barangay' => 'Cabantian'
            ]
        ]);
        exit;
    }
    if ($email === $DEMO_RESIDENT_CREDENTIALS['email'] && $password === $DEMO_RESIDENT_CREDENTIALS['password']) {
        echo json_encode([
            'token' => 'mock_resident_token_456',
            'user' => [
                'id' => 'U-001',
                'name' => 'Maria Santos',
                'email' => 'resident@cabantian.ph',
                'role' => 'resident',
                'barangay' => 'Cabantian',
                'points' => 2840
            ]
        ]);
        exit;
    }
    http_response_code(401);
    echo json_encode(['error' => 'Invalid credentials']);
    exit;
}

if ($method === 'POST' && $uri === '/api/auth/kiosk-login') {
    $input = json_decode(file_get_contents('php://input'), true);
    $pin = $input['pin'] ?? '';
    if ($pin === $KIOSK_PIN) {
        echo json_encode([
            'token' => 'mock_kiosk_token_789',
            'user' => [
                'id' => 'K-01',
                'name' => 'Kiosk 01 - Cabantian Hall',
                'email' => 'kiosk01@waste2goods.ph',
                'role' => 'kiosk',
                'barangay' => 'Cabantian'
            ]
        ]);
        exit;
    }
    http_response_code(401);
    echo json_encode(['error' => 'Invalid PIN']);
    exit;
}

// Protected routes
if (str_starts_with($uri, '/api/') && $method === 'GET') {
    authenticate();
    
    if ($uri === '/api/users') {
        echo json_encode($GLOBALS['USERS']);
        exit;
    }
    if (preg_match('#^/api/users/(.+)$#', $uri, $matches)) {
        $id = $matches[1];
        $user = null;
        foreach ($GLOBALS['USERS'] as $u) {
            if ($u['id'] === $id) {
                $user = $u;
                break;
            }
        }
        if ($user) {
            echo json_encode($user);
        } else {
            http_response_code(404);
            echo json_encode(['error' => 'User not found']);
        }
        exit;
    }
    if ($uri === '/api/kiosks') {
        echo json_encode($GLOBALS['KIOSKS']);
        exit;
    }
    if ($uri === '/api/rewards') {
        echo json_encode($GLOBALS['REWARDS']);
        exit;
    }
    if ($uri === '/api/transactions') {
        echo json_encode($GLOBALS['TRANSACTIONS']);
        exit;
    }
    if ($uri === '/api/analytics/weekly') {
        echo json_encode($GLOBALS['WEEKLY_DATA']);
        exit;
    }
    if ($uri === '/api/analytics/monthly') {
        echo json_encode($GLOBALS['MONTHLY_DATA']);
        exit;
    }
    if ($uri === '/api/leaderboard') {
        echo json_encode($GLOBALS['LEADERBOARD']);
        exit;
    }
    if ($uri === '/api/tasks') {
        echo json_encode($GLOBALS['TASKS']);
        exit;
    }
}

// 404
http_response_code(404);
echo json_encode(['error' => 'Not Found']);
