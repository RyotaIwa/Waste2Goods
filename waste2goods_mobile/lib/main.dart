import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

/// ──────────────────────────────────────────────────────────────
/// 🔌 SAVED ON DEVICE — NO APK REBUILD NEEDED AFTER Wi-Fi CHANGES
/// Uses SharedPreferences (persists across app restarts).
/// Same key name "w2g_api_host" as the React core package so
/// both apps share a convention.
/// ──────────────────────────────────────────────────────────────
class ApiConfig {
  static const _key = 'w2g_api_host';
  static String _cached = '';

  static Future<String> host() async {
    if (_cached.isNotEmpty) return _cached;
    final prefs = await SharedPreferences.getInstance();
    _cached = prefs.getString(_key) ?? _defaultHost();
    return _cached;
  }

  static String _defaultHost() {
    // Android emulator maps 10.0.2.2 → host PC localhost
    if (!kIsWeb && Platform.isAndroid) return '192.168.1.164';
    return 'localhost';
  }

  static Future<void> setHost(String host) async {
    _cached = host.trim();
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_key, _cached);
  }

  /// Full base URL: `http://<host>:3001/api`  (used by every API call)
  static Future<String> baseUrl() async => 'http://${await host()}:3001/api';
}

/// Resolves apiBaseUrl ONCE per widget lifecycle call site.
/// Shorthand used throughout the screens.
Future<String> get apiBaseUrl => ApiConfig.baseUrl();

void main() {
  runApp(const Waste2GoodsApp());
}

class Waste2GoodsApp extends StatelessWidget {
  const Waste2GoodsApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Waste2Goods Mobile',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF16A34A),
          primary: const Color(0xFF16A34A),
          secondary: const Color(0xFF0D9488),
          surface: const Color(0xFFF8FAFC),
        ),
        scaffoldBackgroundColor: const Color(0xFFF8FAFC),
        fontFamily: 'Inter',
      ),
      home: const MainRootScreen(),
    );
  }
}

/// ──────────────────────────────────────────────────────────────
/// 📱 RESPONSIVE SHELL — auto-scales layout whether on real phone
/// or desktop/window (ConstrainedBox centers content when window
/// is wider than a phone; fills device on mobile).
/// ──────────────────────────────────────────────────────────────
class ResponsiveShell extends StatelessWidget {
  final Widget child;
  const ResponsiveShell({super.key, required this.child});

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final isWide = constraints.maxWidth >= 720;
        return Center(
          child: ConstrainedBox(
            constraints: BoxConstraints(
              maxWidth: isWide ? 520 : double.infinity,
            ),
            child: child,
          ),
        );
      },
    );
  }
}

/// ──────────────────────────────────────────────────────────────
/// 🔗 KIOSK SESSION STATUS — polls GET /api/kiosk/session/:userId
/// every 3s so the resident sees live "Connected to K-01" badge.
/// ──────────────────────────────────────────────────────────────
class KioskConnectionStatus extends StatefulWidget {
  final String? userId;
  const KioskConnectionStatus({super.key, required this.userId});

  @override
  State<KioskConnectionStatus> createState() => _KioskConnectionStatusState();
}

class _KioskConnectionStatusState extends State<KioskConnectionStatus> {
  bool connected = false;
  String kioskId = '';
  bool checking = true;
  DateTime? connectedAt;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _poll();
    _timer = Timer.periodic(const Duration(seconds: 3), (_) => _poll());
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  String _elapsed() {
    if (connectedAt == null) return '';
    final sec = DateTime.now().difference(connectedAt!).inSeconds;
    if (sec < 60) return '${sec}s elapsed';
    final min = sec ~/ 60;
    if (min < 60) return '${min}m elapsed';
    return '${min ~/ 60}h ${min % 60}m elapsed';
  }

  Future<void> _poll() async {
    if (widget.userId == null) {
      if (mounted) setState(() => checking = false);
      return;
    }
    try {
      final base = await apiBaseUrl;
      final res = await http
          .get(Uri.parse('$base/kiosk/session/${widget.userId}'))
          .timeout(const Duration(seconds: 4));
      if (res.statusCode == 200) {
        final d = jsonDecode(res.body);
        if (mounted) {
          setState(() {
            checking = false;
            connected = d['connected'] == true;
            kioskId = (d['kioskId'] as String?) ?? '';
            final t = d['connectedAt'];
            connectedAt = (t != null) ? DateTime.tryParse(t.toString()) : null;
          });
        }
      }
    } catch (_) {
      if (mounted) setState(() => checking = false);
    }
  }

  Future<void> _disconnect() async {
    try {
      final base = await apiBaseUrl;
      await http.post(
        Uri.parse('$base/kiosk/session/disconnect'),
        headers: {"Content-Type": "application/json"},
        body: jsonEncode({"userId": widget.userId}),
      );
      if (mounted) {
        setState(() {
          connected = false;
          kioskId = '';
          connectedAt = null;
        });
      }
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    if (checking) {
      return Container(
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(
          color: Colors.amber.shade50,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: Colors.amber.shade200),
        ),
        child: const Row(
          children: [
            SizedBox(width: 14, height: 14, child: CircularProgressIndicator(strokeWidth: 2)),
            SizedBox(width: 10),
            Text("Checking kiosk link…", style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
          ],
        ),
      );
    }

    if (!connected) {
      return Container(
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(
          color: Colors.grey.shade100,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: Colors.grey.shade300),
        ),
        child: const Row(
          children: [
            Icon(Icons.link_off, size: 14, color: Colors.grey),
            SizedBox(width: 8),
            Expanded(
              child: Text(
                "No kiosk linked — scan the kiosk QR via Submit tab",
                style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: Colors.black54),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ),
      );
    }

    return Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: Colors.green.shade50,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Colors.green.shade300),
      ),
      child: Row(
        children: [
          Stack(
            clipBehavior: Clip.none,
            children: [
              const Icon(Icons.sensors, size: 16, color: Color(0xFF16A34A)),
              Positioned(
                right: -2,
                top: -2,
                child: Container(
                  width: 7,
                  height: 7,
                  decoration: BoxDecoration(
                    color: const Color(0xFF16A34A),
                    shape: BoxShape.circle,
                    border: Border.all(color: Colors.white, width: 1.2),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text.rich(
                  TextSpan(
                    children: [
                      const TextSpan(text: "Kiosk linked · ", style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: Color(0xFF166534))),
                      TextSpan(text: kioskId.isEmpty ? "K-01" : kioskId, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: Color(0xFF15803D))),
                      if (_elapsed().isNotEmpty)
                        TextSpan(text: "   ·   ${_elapsed()}", style: const TextStyle(fontSize: 10, color: Color(0xFF4D7C0F))),
                    ],
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 2),
                const Text(
                  "You can submit PET plastic here",
                  style: TextStyle(fontSize: 10, color: Color(0xFF4D7C0F), fontWeight: FontWeight.w500),
                ),
              ],
            ),
          ),
          const SizedBox(width: 6),
          GestureDetector(
            onTap: _disconnect,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 5),
              decoration: BoxDecoration(
                color: Colors.red.shade100,
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Text("Disconnect", style: TextStyle(color: Color(0xFFB91C1C), fontSize: 10, fontWeight: FontWeight.w800)),
            ),
          ),
        ],
      ),
    );
  }
}

/// ──────────────────────────────────────────────────────────────
/// 🌐 SERVER IP SETTINGS DIALOG — lets user edit the backend host
/// at runtime without flutter build / flutter install.
/// ──────────────────────────────────────────────────────────────
Future<void> showServerIpDialog(BuildContext context, TextEditingController ctrl, VoidCallback onSaved) async {
  final saveFocus = TextEditingController(text: ctrl.text);
  String? statusText;
  bool testing = false;
  return showDialog(
    context: context,
    builder: (ctx) => StatefulBuilder(
      builder: (ctx2, setDialogState) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
        title: const Row(
          children: [
            Icon(Icons.language, size: 20, color: Color(0xFF16A34A)),
            SizedBox(width: 8),
            Text("Backend Server IP", style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              "Enter your PC's Wi-Fi LAN IP. Saved on device — no APK rebuild after Wi-Fi changes.",
              style: TextStyle(fontSize: 12, color: Colors.black54),
            ),
            const SizedBox(height: 14),
            TextField(
              controller: saveFocus,
              decoration: InputDecoration(
                labelText: "PC IP Address or Hostname",
                hintText: "e.g. 192.168.1.164 or localhost",
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                prefixIcon: const Icon(Icons.computer_outlined),
              ),
              autofocus: true,
            ),
            const SizedBox(height: 6),
            FutureBuilder<String>(
              future: ApiConfig.host(),
              builder: (_, s) => Text(
                "Current → http://${s.data ?? 'localhost'}:3001/api",
                style: const TextStyle(fontSize: 11, color: Colors.black45, fontFamily: 'monospace'),
              ),
            ),
            if (statusText != null) ...[
              const SizedBox(height: 10),
              Text(
                statusText!,
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                  color: statusText!.startsWith("✅") ? const Color(0xFF15803D) : const Color(0xFFB91C1C),
                ),
              ),
            ],
          ],
        ),
        actions: [
          TextButton(
            onPressed: () async {
              saveFocus.text = 'localhost';
            },
            child: const Text("localhost"),
          ),
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text("Cancel"),
          ),
          StatefulBuilder(builder: (ctx3, setBtnState) {
            return TextButton(
              onPressed: testing
                  ? null
                  : () async {
                      final ip = saveFocus.text.trim();
                      if (ip.isEmpty) {
                        setDialogState(() => statusText = "❌ Enter an IP address");
                        return;
                      }
                      setBtnState(() => testing = true);
                      setDialogState(() {
                        statusText = "🧪 Testing http://$ip:3001 …";
                      });
                      await ApiConfig.setHost(ip);
                      bool ok = false;
                      try {
                        final base = 'http://$ip:3001';
                        final r = await http.get(Uri.parse(base)).timeout(const Duration(seconds: 4));
                        ok = (r.statusCode == 200);
                      } catch (_) {
                        ok = false;
                      }
                      ctrl.text = ip;
                      setBtnState(() => testing = false);
                      setDialogState(() => statusText = ok
                          ? "✅ Connected to http://$ip:3001 — saved!"
                          : "⚠️ Saved, but $ip:3001 unreachable (check Firewall + backend)");
                      await Future.delayed(const Duration(milliseconds: 900));
                      if (ctx.mounted) Navigator.of(ctx).pop();
                      onSaved();
                    },
              child: testing
                  ? const SizedBox(width: 14, height: 14, child: CircularProgressIndicator(strokeWidth: 2))
                  : const Text("💾 Save & Test"),
            );
          }),
        ],
      ),
    ),
  );
}

class MainRootScreen extends StatefulWidget {
  const MainRootScreen({super.key});

  @override
  State<MainRootScreen> createState() => _MainRootScreenState();
}

class _MainRootScreenState extends State<MainRootScreen> {
  Map<String, dynamic>? currentUser;
  int currentTab = 0;
  bool isLoading = false;
  String? errorMessage;

  // Login Controllers
  final emailCtrl = TextEditingController(text: "resident@cabantian.ph");
  final passCtrl = TextEditingController(text: "ResidentCabantian2025");

  // Registration Controllers
  final regFNameCtrl = TextEditingController();
  final regLNameCtrl = TextEditingController();
  final regEmailCtrl = TextEditingController();
  final regPassCtrl = TextEditingController();
  final regPhoneCtrl = TextEditingController();

  bool isRegisterView = false;
  final serverHostCtrl = TextEditingController();
  bool serverHostLoaded = false;

  @override
  void initState() {
    super.initState();
    _loadServerHost();
  }

  Future<void> _loadServerHost() async {
    final h = await ApiConfig.host();
    serverHostCtrl.text = h;
    if (mounted) setState(() => serverHostLoaded = true);
  }

  @override
  void dispose() {
    serverHostCtrl.dispose();
    emailCtrl.dispose();
    passCtrl.dispose();
    regFNameCtrl.dispose();
    regLNameCtrl.dispose();
    regEmailCtrl.dispose();
    regPassCtrl.dispose();
    regPhoneCtrl.dispose();
    super.dispose();
  }

  Future<void> handleLogin() async {
    setState(() {
      isLoading = true;
      errorMessage = null;
    });
    try {
      final base = await apiBaseUrl;
      final res = await http.post(
        Uri.parse("$base/users/login"),
        headers: {"Content-Type": "application/json"},
        body: jsonEncode({
          "email": emailCtrl.text.trim(),
          "password": passCtrl.text,
        }),
      );
      final data = jsonDecode(res.body);
      if (res.statusCode == 200 && data["user"] != null) {
        if (mounted) {
          setState(() {
            currentUser = data["user"] as Map<String, dynamic>;
            isLoading = false;
          });
        }
      } else {
        setState(() {
          errorMessage = data["error"] ?? "Invalid credentials. Check email & password.";
          isLoading = false;
        });
      }
    } catch (e) {
      // Demo fallback — mimics the React mobile fallback for offline dev
      setState(() {
        currentUser = {
          "id": "U-002",
          "name": "Demo Reyes",
          "firstName": "Demo",
          "lastName": "Reyes",
          "email": emailCtrl.text.trim(),
          "points": 430,
          "pointsBalance": 430,
          "submissions": 8,
          "barangay": "Cabantian",
          "rank": 17,
          "signupDate": DateTime.now().subtract(const Duration(days: 21)).toIso8601String(),
        };
        isLoading = false;
      });
    }
  }

  Future<void> handleRegister() async {
    setState(() {
      isLoading = true;
      errorMessage = null;
    });
    try {
      final base = await apiBaseUrl;
      final res = await http.post(
        Uri.parse("$base/users/register"),
        headers: {"Content-Type": "application/json"},
        body: jsonEncode({
          "firstName": regFNameCtrl.text.trim(),
          "lastName": regLNameCtrl.text.trim(),
          "email": regEmailCtrl.text.trim(),
          "password": regPassCtrl.text,
          "phone": regPhoneCtrl.text.trim(),
          "barangay": "Cabantian",
          "city": "Davao City",
          "province": "Davao del Sur",
        }),
      );
      final data = jsonDecode(res.body);
      if (res.statusCode == 200 && data["user"] != null) {
        setState(() {
          currentUser = data["user"] as Map<String, dynamic>;
          isRegisterView = false;
          isLoading = false;
        });
      } else {
        setState(() {
          errorMessage = data["error"] ?? "Registration failed. Try again.";
          isLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        errorMessage = "Cannot connect to server. Check backend + Server IP.";
        isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final body = currentUser == null
        ? SafeArea(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(24),
              child: isRegisterView ? _buildRegisterScreen() : _buildLoginScreen(),
            ),
          )
        : SafeArea(
            child: IndexedStack(
              index: currentTab,
              children: [
                _buildHomeScreen(),
                _buildRewardsScreen(),
                _buildSubmitScreen(),
                _buildProfileScreen(),
              ],
            ),
          );

    return Scaffold(
      body: ResponsiveShell(child: body),
      bottomNavigationBar: currentUser == null
          ? null
          : NavigationBar(
              selectedIndex: currentTab,
              onDestinationSelected: (idx) => setState(() => currentTab = idx),
              indicatorColor: const Color(0xFFDCFCE7),
              destinations: const [
                NavigationDestination(icon: Icon(Icons.home_outlined), selectedIcon: Icon(Icons.home, color: Color(0xFF16A34A)), label: 'Home'),
                NavigationDestination(icon: Icon(Icons.card_giftcard_outlined), selectedIcon: Icon(Icons.card_giftcard, color: Color(0xFF16A34A)), label: 'Rewards'),
                NavigationDestination(icon: Icon(Icons.qr_code_scanner_outlined), selectedIcon: Icon(Icons.qr_code_scanner, color: Color(0xFF16A34A)), label: 'Submit'),
                NavigationDestination(icon: Icon(Icons.person_outline), selectedIcon: Icon(Icons.person, color: Color(0xFF16A34A)), label: 'Profile'),
              ],
            ),
    );
  }

  // ─── LOGIN SCREEN ───
  Widget _buildLoginScreen() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const SizedBox(height: 30),
        Center(
          child: Container(
            width: 68,
            height: 68,
            decoration: BoxDecoration(
              color: const Color(0xFFDCFCE7),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: const Color(0xFFBBF7D0)),
              boxShadow: [BoxShadow(color: Colors.green.withValues(alpha: 0.18), blurRadius: 18, offset: const Offset(0, 6))],
            ),
            child: const Icon(Icons.recycling, size: 38, color: Color(0xFF16A34A)),
          ),
        ),
        const SizedBox(height: 16),
        const Text("Welcome back!", textAlign: TextAlign.center, style: TextStyle(fontSize: 26, fontWeight: FontWeight.w900)),
        const Text("Sign in to your Waste2Goods account", textAlign: TextAlign.center, style: TextStyle(color: Colors.grey, fontSize: 13)),
        const SizedBox(height: 26),

        // ────────────────────────────────────────────
        // 🌐 Server IP Card — ALWAYS VISIBLE on login
        // ────────────────────────────────────────────
        GestureDetector(
          onTap: () => showServerIpDialog(context, serverHostCtrl, _loadServerHost),
          child: Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: Colors.blue.shade50,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: Colors.blue.shade200),
            ),
            child: Row(
              children: [
                const Icon(Icons.language, size: 18, color: Color(0xFF1D4ED8)),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text("Backend Server IP", style: TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: Color(0xFF1E3A8A), letterSpacing: 0.2)),
                      FutureBuilder<String>(
                        future: ApiConfig.host(),
                        builder: (_, s) => Text(
                          "http://${s.data ?? serverHostCtrl.text}:3001 — tap to edit",
                          style: const TextStyle(fontSize: 11, color: Color(0xFF3B82F6), fontFamily: 'monospace'),
                        ),
                      ),
                    ],
                  ),
                ),
                const Icon(Icons.edit_note, size: 18, color: Color(0xFF1D4ED8)),
              ],
            ),
          ),
        ),
        const SizedBox(height: 22),

        TextField(
          controller: emailCtrl,
          decoration: InputDecoration(
            labelText: "Email Address",
            prefixIcon: const Icon(Icons.email_outlined),
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(16)),
          ),
        ),
        const SizedBox(height: 14),
        TextField(
          controller: passCtrl,
          obscureText: true,
          decoration: InputDecoration(
            labelText: "Password",
            prefixIcon: const Icon(Icons.lock_outline),
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(16)),
          ),
        ),
        if (errorMessage != null) ...[
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(color: Colors.red.shade50, borderRadius: BorderRadius.circular(12), border: Border.all(color: Colors.red.shade200)),
            child: Text(errorMessage!, style: TextStyle(color: Colors.red.shade700, fontSize: 13, fontWeight: FontWeight.w600)),
          ),
        ],
        const SizedBox(height: 24),
        ElevatedButton(
          onPressed: isLoading ? null : handleLogin,
          style: ElevatedButton.styleFrom(
            backgroundColor: const Color(0xFF16A34A),
            foregroundColor: Colors.white,
            padding: const EdgeInsets.symmetric(vertical: 16),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          ),
          child: isLoading
              ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
              : const Text("Sign In", style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
        ),
        const SizedBox(height: 18),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Text("New resident? "),
            GestureDetector(
              onTap: () => setState(() => isRegisterView = true),
              child: const Text("Create account", style: TextStyle(color: Color(0xFF16A34A), fontWeight: FontWeight.bold)),
            ),
          ],
        ),
      ],
    );
  }

  // ─── REGISTER SCREEN ───
  Widget _buildRegisterScreen() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const SizedBox(height: 20),
        const Text("Create Account", style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
        const Text("Join Waste2Goods recycling platform", style: TextStyle(color: Colors.grey, fontSize: 13)),
        const SizedBox(height: 22),
        TextField(controller: regFNameCtrl, decoration: InputDecoration(labelText: "First Name", border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)))),
        const SizedBox(height: 10),
        TextField(controller: regLNameCtrl, decoration: InputDecoration(labelText: "Last Name", border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)))),
        const SizedBox(height: 10),
        TextField(controller: regEmailCtrl, decoration: InputDecoration(labelText: "Email Address", border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)))),
        const SizedBox(height: 10),
        TextField(controller: regPassCtrl, obscureText: true, decoration: InputDecoration(labelText: "Password (min 6 chars)", border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)))),
        const SizedBox(height: 10),
        TextField(controller: regPhoneCtrl, decoration: InputDecoration(labelText: "Mobile Phone Number", border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)))),
        const SizedBox(height: 18),
        ElevatedButton(
          onPressed: isLoading ? null : handleRegister,
          style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF16A34A), foregroundColor: Colors.white, padding: const EdgeInsets.symmetric(vertical: 16), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
          child: const Text("Create Account", style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
        ),
        const SizedBox(height: 14),
        TextButton(onPressed: () => setState(() => isRegisterView = false), child: const Text("← Back to Login", style: TextStyle(color: Color(0xFF16A34A)))),
      ],
    );
  }

  // ─── HOME DASHBOARD ───
  Widget _buildHomeScreen() {
    final name = currentUser?["name"] ?? currentUser?["firstName"] ?? "Resident";
    final points = currentUser?["points"] ?? currentUser?["pointsBalance"] ?? 0;
    final subs = currentUser?["submissions"] ?? currentUser?["totalSubmissions"] ?? 0;
    final rank = currentUser?["rank"] ?? currentUser?["weeklyRank"] ?? '—';

    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 28),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text("Mabuhay, $name! 👋", style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
                  Text("Barangay ${currentUser?["barangay"] ?? "Cabantian"}", style: const TextStyle(color: Colors.grey, fontSize: 13)),
                ],
              ),
              const CircleAvatar(backgroundColor: Color(0xFFDCFCE7), child: Text("🌱", style: TextStyle(fontSize: 20))),
            ],
          ),
          const SizedBox(height: 16),
          KioskConnectionStatus(userId: currentUser?["id"]?.toString()),
          const SizedBox(height: 20),
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              gradient: const LinearGradient(colors: [Color(0xFF16A34A), Color(0xFF059669)], begin: Alignment.topLeft, end: Alignment.bottomRight),
              borderRadius: BorderRadius.circular(24),
              boxShadow: [BoxShadow(color: Colors.green.withValues(alpha: 0.3), blurRadius: 15, offset: const Offset(0, 8))],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text("TOTAL REWARDS BALANCE", style: TextStyle(color: Colors.white70, fontSize: 11, fontWeight: FontWeight.bold, letterSpacing: 1)),
                const SizedBox(height: 8),
                Row(children: [
                  Text("$points", style: const TextStyle(color: Colors.white, fontSize: 42, fontWeight: FontWeight.w900)),
                  const SizedBox(width: 8),
                  const Text("PTS", style: TextStyle(color: Colors.greenAccent, fontSize: 18, fontWeight: FontWeight.bold)),
                ]),
                const SizedBox(height: 16),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                  decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.15), borderRadius: BorderRadius.circular(12)),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text("Total Drop-offs: $subs", style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w600)),
                      Text("Weekly Rank #$rank", style: const TextStyle(color: Colors.white70, fontSize: 12, fontWeight: FontWeight.w800)),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),
          const Text("Quick Actions", style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(child: _buildActionTile(Icons.qr_code_scanner, "Recycle", "Scan Kiosk", Colors.green.shade100, Colors.green.shade800, () => setState(() => currentTab = 2))),
              const SizedBox(width: 12),
              Expanded(child: _buildActionTile(Icons.card_giftcard, "Rewards", "Redeem Pts", Colors.teal.shade100, Colors.teal.shade800, () => setState(() => currentTab = 1))),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildActionTile(IconData icon, String title, String sub, Color bg, Color textCol, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(20), border: Border.all(color: Colors.grey.shade200)),
        child: Row(
          children: [
            Container(padding: const EdgeInsets.all(10), decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(14)), child: Icon(icon, color: textCol)),
            const SizedBox(width: 12),
            Expanded(
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                Text(sub, style: TextStyle(color: Colors.grey.shade600, fontSize: 11)),
              ]),
            ),
          ],
        ),
      ),
    );
  }

  // ─── REWARDS SCREEN ───
  Widget _buildRewardsScreen() {
    final points = currentUser?["points"] ?? currentUser?["pointsBalance"] ?? 0;
    final rewards = [
      {"name": "Rice Pack (1kg)", "cost": 300, "category": "Food & Staples", "icon": "🌾"},
      {"name": "Barangay Eco Tote Bag", "cost": 150, "category": "Eco Essentials", "icon": "🛍️"},
      {"name": "Stainless Water Bottle", "cost": 450, "category": "Eco Essentials", "icon": "🍼"},
      {"name": "Groceries Coupon ₱100", "cost": 500, "category": "Vouchers", "icon": "🎟️"},
    ];
    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 28),
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text("Available Rewards", style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(color: const Color(0xFFDCFCE7), borderRadius: BorderRadius.circular(20)),
              child: Text("$points PTS", style: const TextStyle(color: Color(0xFF16A34A), fontWeight: FontWeight.bold, fontSize: 12)),
            ),
          ],
        ),
        const SizedBox(height: 16),
        ...rewards.map((r) => Card(
              margin: const EdgeInsets.only(bottom: 12),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              child: ListTile(
                leading: Text(r["icon"] as String, style: const TextStyle(fontSize: 28)),
                title: Text(r["name"] as String, style: const TextStyle(fontWeight: FontWeight.bold)),
                subtitle: Text("${r["category"]} • ${r["cost"]} PTS", style: const TextStyle(fontSize: 12)),
                trailing: ElevatedButton(
                  style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF16A34A), foregroundColor: Colors.white),
                  onPressed: points >= (r["cost"] as int)
                      ? () => ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text("Redeemed ${r["name"]}! Present code at Barangay Hall.")))
                      : null,
                  child: const Text("Redeem"),
                ),
              ),
            )),
      ],
    );
  }

  // ─── SUBMIT SCREEN ───
  Widget _buildSubmitScreen() {
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        children: [
          const SizedBox(height: 24),
          KioskConnectionStatus(userId: currentUser?["id"]?.toString()),
          const SizedBox(height: 28),
          const Icon(Icons.qr_code_scanner, size: 88, color: Color(0xFF16A34A)),
          const SizedBox(height: 20),
          const Text("Submit Recyclables", style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          const Text(
            "Scan the QR code displayed on the Waste2Goods Kiosk screen to connect your account and record PET plastic drop-offs.",
            textAlign: TextAlign.center,
            style: TextStyle(color: Colors.grey, fontSize: 13),
          ),
          const SizedBox(height: 32),
          ElevatedButton.icon(
            onPressed: () => ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text("Scanner ready! Point camera at Kiosk screen."))),
            icon: const Icon(Icons.camera_alt),
            label: const Text("Open Camera Scanner"),
            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF16A34A), foregroundColor: Colors.white, padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16))),
          ),
        ],
      ),
    );
  }

  // ─── PROFILE SCREEN ───
  Widget _buildProfileScreen() {
    final name = currentUser?["name"] ?? currentUser?["firstName"] ?? "Resident";
    final email = currentUser?["email"] ?? "resident@email.com";
    final submissions = currentUser?["submissions"] ?? 0;
    final redeemed = currentUser?["redeemed"] ?? 0;
    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 28),
      children: [
        KioskConnectionStatus(userId: currentUser?["id"]?.toString()),
        const SizedBox(height: 20),
        Center(
          child: Column(
            children: [
              const CircleAvatar(radius: 40, backgroundColor: Color(0xFFDCFCE7), child: Icon(Icons.person, size: 40, color: Color(0xFF16A34A))),
              const SizedBox(height: 12),
              Text(name, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
              Text(email, style: const TextStyle(color: Colors.grey, fontSize: 13)),
            ],
          ),
        ),
        const SizedBox(height: 22),
        Row(
          children: [
            Expanded(
              child: Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16), border: Border.all(color: Colors.grey.shade200)),
                child: Column(
                  children: [
                    Text("$submissions", style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: Color(0xFF16A34A))),
                    const SizedBox(height: 2),
                    const Text("Submissions", style: TextStyle(fontSize: 11, color: Colors.black54)),
                  ],
                ),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16), border: Border.all(color: Colors.grey.shade200)),
                child: Column(
                  children: [
                    Text("$redeemed", style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: Color(0xFF0D9488))),
                    const SizedBox(height: 2),
                    const Text("Redeemed", style: TextStyle(fontSize: 11, color: Colors.black54)),
                  ],
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 24),

        // ────────────────────────────────────────────
        // 🌐 Server IP Settings Tile — always reachable
        // ────────────────────────────────────────────
        ListTile(
          tileColor: Colors.blue.shade50,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
          leading: const Icon(Icons.language, color: Color(0xFF1D4ED8)),
          title: const Text("Server IP Settings", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
          subtitle: FutureBuilder<String>(
            future: ApiConfig.host(),
            builder: (_, s) => Text("http://${s.data ?? 'localhost'}:3001 — tap to change", style: const TextStyle(fontSize: 11, fontFamily: 'monospace', color: Color(0xFF3B82F6))),
          ),
          trailing: const Icon(Icons.chevron_right),
          onTap: () => showServerIpDialog(context, serverHostCtrl, _loadServerHost),
        ),
        const SizedBox(height: 10),

        ListTile(
          leading: const Icon(Icons.location_on_outlined, color: Color(0xFF16A34A)),
          title: const Text("Barangay"),
          subtitle: Text(currentUser?["barangay"] ?? "Cabantian"),
        ),
        const Divider(height: 2),
        ListTile(
          leading: const Icon(Icons.settings_outlined),
          title: const Text("Account Settings"),
          subtitle: const Text("Name, email, barangay, phone"),
        ),
        const Divider(height: 2),
        ListTile(
          leading: const Icon(Icons.notifications_outlined),
          title: const Text("Notifications"),
          subtitle: Text("0 total"),
        ),
        const Divider(height: 2),
        ListTile(
          leading: const Icon(Icons.logout, color: Colors.red),
          title: const Text("Sign Out", style: TextStyle(color: Colors.red, fontWeight: FontWeight.bold)),
          onTap: () => setState(() => currentUser = null),
        ),
      ],
    );
  }
}
