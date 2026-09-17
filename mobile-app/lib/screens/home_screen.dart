import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import '../services/auth_service.dart';
import '../services/socket_service.dart';
import '../services/audio_siren_service.dart';
import '../theme/app_theme.dart';
import 'evacuation_map_screen.dart';
import 'status_history_screen.dart';
import 'emergency_contacts_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _currentIndex = 0;
  bool _isNavigating = false;

  late final List<Widget> _pages;

  @override
  void initState() {
    super.initState();
    _pages = [
      EvacuationMapScreen(
        onNavigationStateChanged: (navigating) {
          if (mounted) {
            setState(() {
              _isNavigating = navigating;
            });
          }
        },
      ),
      const StatusHistoryScreen(),
      const EmergencyContactsScreen(),
    ];
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final auth = Provider.of<AuthService>(context, listen: false);
      final socket = Provider.of<SocketService>(context, listen: false);
      final siren = Provider.of<AudioSirenService>(context, listen: false);

      if (auth.token != null) {
        socket.connect(auth.token!, siren);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);

    return Scaffold(
      body: IndexedStack(
        index: _currentIndex,
        children: _pages,
      ),
      bottomNavigationBar: _isNavigating
          ? null
          : Container(

        margin: const EdgeInsets.fromLTRB(16, 0, 16, 16),
        decoration: BoxDecoration(
          color: const Color(0xFF0F172A).withOpacity(0.95),
          borderRadius: BorderRadius.circular(24),
          border: Border.all(color: const Color(0xFF334155), width: 1.2),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.4),
              blurRadius: 16,
              offset: const Offset(0, 6),
            ),
          ],
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(24),
          child: NavigationBarTheme(
            data: NavigationBarThemeData(
              indicatorColor: AppTheme.primaryCyan.withOpacity(0.2),
              labelTextStyle: WidgetStateProperty.resolveWith((states) {
                if (states.contains(WidgetState.selected)) {
                  return const TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w800,
                    color: AppTheme.primaryCyan,
                  );
                }
                return const TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                  color: Colors.grey,
                );
              }),
              iconTheme: WidgetStateProperty.resolveWith((states) {
                if (states.contains(WidgetState.selected)) {
                  return const IconThemeData(color: AppTheme.primaryCyan, size: 22);
                }
                return const IconThemeData(color: Colors.grey, size: 22);
              }),
            ),
            child: NavigationBar(
              height: 64,
              backgroundColor: Colors.transparent,
              elevation: 0,
              selectedIndex: _currentIndex,
              onDestinationSelected: (index) => setState(() => _currentIndex = index),
              destinations: [
                NavigationDestination(
                  icon: const Icon(Icons.map_outlined),
                  selectedIcon: const Icon(Icons.map),
                  label: l10n?.campusMapNav ?? 'Campus Map',
                ),
                NavigationDestination(
                  icon: const Icon(Icons.history_outlined),
                  selectedIcon: const Icon(Icons.history),
                  label: l10n?.statusHistoryNav ?? 'Status & History',
                ),
                const NavigationDestination(
                  icon: Icon(Icons.phone_outlined),
                  selectedIcon: Icon(Icons.phone),
                  label: 'Hotlines',
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
