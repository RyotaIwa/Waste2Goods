<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Kiosk;
use App\Models\Reward;

class ApiController extends Controller
{
    public function login(Request $request)
    {
        $credentials = $request->only('email', 'password');
        
        // Demo credentials check
        if ($credentials['email'] === 'admin@waste2goods.ph' && $credentials['password'] === 'AdminCabantian2025') {
            return response()->json([
                'token' => 'mock_admin_token_123',
                'user' => [
                    'id' => 'A-001',
                    'name' => 'Juan Reyes',
                    'email' => 'admin@waste2goods.ph',
                    'role' => 'admin',
                    'barangay' => 'Cabantian'
                ]
            ]);
        }
        
        if ($credentials['email'] === 'resident@cabantian.ph' && $credentials['password'] === 'ResidentCabantian2025') {
            return response()->json([
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
        }
        
        return response()->json(['error' => 'Invalid credentials'], 401);
    }

    public function getUsers()
    {
        $users = User::all();
        // Add compatibility fields for frontend
        $usersWithCompat = $users->map(function ($user) {
            return [
                ...$user->toArray(),
                'id' => $user->userId,
                'name' => "{$user->firstName} {$user->lastName}",
                'barangay' => 'Cabantian',
                'points' => $user->pointsBalance,
                'joined' => $user->created_at->format('M j, Y'),
                'submissions' => $user->totalSubmissions,
                'redeemed' => 0
            ];
        });
        
        return response()->json($usersWithCompat);
    }

    public function getKiosks()
    {
        $kiosks = Kiosk::all();
        $kiosksWithCompat = $kiosks->map(function ($kiosk) {
            return [
                ...$kiosk->toArray(),
                'id' => $kiosk->kioskId,
                'weight' => '—',
                'submissions' => 0
            ];
        });
        
        return response()->json($kiosksWithCompat);
    }

    public function getRewards()
    {
        return response()->json(Reward::all());
    }
}
