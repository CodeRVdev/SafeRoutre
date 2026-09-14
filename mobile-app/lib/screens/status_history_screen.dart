import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/alert_model.dart';
import '../models/checkin_model.dart';
import '../api/alert_api.dart';
import '../api/checkin_api.dart';
import '../services/auth_service.dart';
import '../services/socket_service.dart';
import '../services/location_service.dart';
import '../services/audio_siren_service.dart';
import '../theme/app_theme.dart';

class StatusHistoryScreen extends StatefulWidget {
  const StatusHistoryScreen({super.key});

  @override
  State<StatusHistoryScreen> createState() => _StatusHistoryScreenState();
}

class _StatusHistoryScreenState extends State<StatusHistoryScreen> {
  AlertModel? _activeAlert;
  List<CheckinModel> _history = [];
  bool _isLoading = true;
  bool _isSubmittingCheckin = false;

  @override
  void initState() {
    super.initState();
    _loadStatusAndHistory();
  }

  Future<void> _loadStatusAndHistory() async {
    final auth = Provider.of<AuthService>(context, listen: false);
    if (auth.token == null || auth.user == null) return;

    setState(() => _isLoading = true);

    try {
      AlertModel? alert;
      try {
        final activeAlerts = await AlertApi.getActiveAlerts(auth.token!);
        alert = activeAlerts.isNotEmpty ? activeAlerts.first : null;
      } catch (e) {
        debugPrint('ℹ️ Active alerts fetch note in history: $e');
      }

      List<CheckinModel> historyList = [];
      try {
        historyList = await CheckinApi.fetchCheckinHistory(token: auth.token!);
      } catch (e) {
        debugPrint('ℹ️ Checkin history fetch note: $e');
      }

      if (mounted) {
        setState(() {
          _activeAlert = alert;
          _history = historyList;
          _isLoading = false;
        });
      }
    } catch (_) {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  Future<void> _submitCheckin(String status) async {
    final auth = Provider.of<AuthService>(context, listen: false);
    final siren = Provider.of<AudioSirenService>(context, listen: false);
    final locationService = Provider.of<LocationService>(context, listen: false);
    if (auth.token == null || _activeAlert == null) return;

    setState(() => _isSubmittingCheckin = true);

    try {
      final loc = locationService.currentLocation;
      await CheckinApi.submitCheckin(
        token: auth.token!,
        alertId: _activeAlert!.alertId,
        status: status,
        location: loc,
        message: status == 'safe' ? 'Checked in as safe via Campus Status.' : 'Status report via Campus Status.',
      );

      // Stop siren if safe
      if (status == 'safe') {
        try {
          siren.stopSiren();
        } catch (_) {}
      }

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('✅ Status recorded as ${status.toUpperCase().replaceAll('_', ' ')}. Safety coordinators notified.'),
            backgroundColor: status == 'safe' ? AppTheme.safeEmerald : AppTheme.emergencyRose,
            duration: const Duration(seconds: 4),
          ),
        );
      }

      await _loadStatusAndHistory();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('⚠️ Check-in error: $e'),
            backgroundColor: AppTheme.emergencyRose,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isSubmittingCheckin = false);
      }
    }
  }

  Future<void> _showLogoutDialog(BuildContext context) async {
    final auth = Provider.of<AuthService>(context, listen: false);
    final socket = Provider.of<SocketService>(context, listen: false);

    final confirmed = await showDialog<bool>(
      context: context,
      barrierDismissible: true,
      builder: (ctx) {
        return AlertDialog(
          backgroundColor: AppTheme.surfaceCard,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(20),
            side: BorderSide(color: Colors.white.withOpacity(0.1)),
          ),
          title: const Text(
            'Logout',
            style: TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.bold,
              fontSize: 18,
            ),
          ),
          content: const Text(
            'Are you sure you want to logout?',
            style: TextStyle(color: Colors.grey, fontSize: 14),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(ctx).pop(false),
              child: const Text(
                'Cancel',
                style: TextStyle(color: Colors.grey, fontWeight: FontWeight.w600),
              ),
            ),
            ElevatedButton(
              onPressed: () => Navigator.of(ctx).pop(true),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.emergencyRose,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 10),
              ),
              child: const Text(
                'Logout',
                style: TextStyle(fontWeight: FontWeight.bold),
              ),
            ),
          ],
        );
      },
    );

    if (confirmed == true) {
      // Clean up authenticated realtime socket
      socket.disconnect();

      // Clear local authentication state and secure storage
      await auth.logout();
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthService>(context);
    final user = auth.user;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Campus Status & Check-In History'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            tooltip: 'Refresh History',
            onPressed: _loadStatusAndHistory,
          ),
        ],
      ),
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: _loadStatusAndHistory,
          child: SingleChildScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.all(16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // User Profile Header Card
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        Row(
                          children: [
                            CircleAvatar(
                              radius: 26,
                              backgroundColor: AppTheme.primaryCyan.withOpacity(0.2),
                              child: const Icon(Icons.person,
                                  color: AppTheme.primaryCyan, size: 28),
                            ),
                            const SizedBox(width: 16),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    user?.fullName ?? 'User',
                                    style: const TextStyle(
                                      fontSize: 16,
                                      fontWeight: FontWeight.bold,
                                      color: Colors.white,
                                    ),
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    '${user?.role.toUpperCase()} • ${user?.email}',
                                    style: const TextStyle(
                                        fontSize: 11, color: Colors.grey),
                                  ),
                                  if (user?.department != null)
                                    Text(
                                      'Dept: ${user!.department}',
                                      style: const TextStyle(
                                          fontSize: 11, color: AppTheme.primaryCyan),
                                    ),
                                ],
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 14),
                        const Divider(height: 1, color: Colors.white12),
                        const SizedBox(height: 12),
                        SizedBox(
                          height: 38,
                          child: OutlinedButton.icon(
                            onPressed: auth.isLoggingOut ? null : () => _showLogoutDialog(context),
                            icon: auth.isLoggingOut
                                ? const SizedBox(
                                    width: 14,
                                    height: 14,
                                    child: CircularProgressIndicator(strokeWidth: 2, color: AppTheme.emergencyRose),
                                  )
                                : const Icon(Icons.logout_rounded, size: 18, color: AppTheme.emergencyRose),
                            label: Text(
                              auth.isLoggingOut ? 'Logging out...' : 'Logout',
                              style: const TextStyle(
                                color: AppTheme.emergencyRose,
                                fontWeight: FontWeight.bold,
                                fontSize: 13,
                              ),
                            ),
                            style: OutlinedButton.styleFrom(
                              side: BorderSide(color: AppTheme.emergencyRose.withOpacity(0.4)),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(10),
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 16),

                // Current Campus Emergency Status Card
                Card(
                  color: _activeAlert != null
                      ? AppTheme.emergencyRose.withOpacity(0.15)
                      : AppTheme.safeEmerald.withOpacity(0.15),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                    side: BorderSide(
                      color: _activeAlert != null
                          ? AppTheme.emergencyRose
                          : AppTheme.safeEmerald,
                      width: 1.5,
                    ),
                  ),
                  child: Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Icon(
                              _activeAlert != null
                                  ? Icons.campaign
                                  : Icons.verified_user,
                              color: _activeAlert != null
                                  ? AppTheme.emergencyRose
                                  : AppTheme.safeEmerald,
                              size: 28,
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Text(
                                _activeAlert != null
                                    ? 'ACTIVE EMERGENCY EVACUATION'
                                    : 'CAMPUS STATUS: NORMAL / ALL CLEAR',
                                style: TextStyle(
                                  fontSize: 13,
                                  fontWeight: FontWeight.w800,
                                  color: _activeAlert != null
                                      ? AppTheme.emergencyRose
                                      : AppTheme.safeEmerald,
                                ),
                              ),
                            ),
                          ],
                        ),
                        if (_activeAlert != null) ...[
                          const SizedBox(height: 12),
                          Text(
                            _activeAlert!.title,
                            style: const TextStyle(
                                fontSize: 15,
                                fontWeight: FontWeight.bold,
                                color: Colors.white),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            _activeAlert!.message,
                            style: const TextStyle(
                                fontSize: 13, color: Colors.white70),
                          ),
                          const SizedBox(height: 16),

                          // Quick Check-in Button on this screen during active emergency
                          SizedBox(
                            width: double.infinity,
                            child: ElevatedButton.icon(
                              onPressed: _isSubmittingCheckin ? null : () => _submitCheckin('safe'),
                              icon: _isSubmittingCheckin
                                  ? const SizedBox(
                                      width: 18,
                                      height: 18,
                                      child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                                    )
                                  : const Icon(Icons.shield, color: Colors.white),
                              label: Text(
                                _isSubmittingCheckin ? 'RECORDING STATUS...' : 'I AM SAFE — CHECK IN NOW',
                                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                              ),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: AppTheme.safeEmerald,
                                foregroundColor: Colors.white,
                                padding: const EdgeInsets.symmetric(vertical: 14),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                              ),
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 24),

                // Past Safety Check-Ins Roster Title
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'My Safety Check-In History',
                      style: TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                    ),
                    if (_history.isNotEmpty)
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                        decoration: BoxDecoration(
                          color: AppTheme.primaryCyan.withOpacity(0.2),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text(
                          '${_history.length} Record${_history.length > 1 ? 's' : ''}',
                          style: const TextStyle(fontSize: 11, color: AppTheme.primaryCyan, fontWeight: FontWeight.bold),
                        ),
                      ),
                  ],
                ),
                const SizedBox(height: 12),

                if (_isLoading) ...[
                  const Center(
                    child: Padding(
                      padding: EdgeInsets.all(32.0),
                      child: CircularProgressIndicator(),
                    ),
                  ),
                ] else if (_history.isEmpty) ...[
                  const Card(
                    child: Padding(
                      padding: EdgeInsets.all(32.0),
                      child: Column(
                        children: [
                          Icon(Icons.history, size: 48, color: Colors.grey),
                          SizedBox(height: 12),
                          Text(
                            'No Past Safety Check-Ins',
                            style: TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.bold,
                              color: Colors.white,
                            ),
                          ),
                          SizedBox(height: 4),
                          Text(
                            'Your check-ins during emergency broadcasts will be logged here.',
                            textAlign: TextAlign.center,
                            style: TextStyle(fontSize: 12, color: Colors.grey),
                          ),
                        ],
                      ),
                    ),
                  ),
                ] else ...[
                  ListView.builder(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    itemCount: _history.length,
                    itemBuilder: (context, index) {
                      final item = _history[index];
                      final isSafe = item.status.toLowerCase() == 'safe';
                      final isHelp = item.status.toLowerCase() == 'need_help';
                      final statusColor = isSafe
                          ? AppTheme.safeEmerald
                          : (isHelp ? Colors.amber : AppTheme.emergencyRose);
                      final statusLabel = isSafe
                          ? 'SAFE'
                          : (isHelp ? 'NEED HELP' : 'INJURED');
                      final statusIcon = isSafe
                          ? Icons.check_circle_rounded
                          : (isHelp ? Icons.warning_amber_rounded : Icons.medical_services_rounded);

                      String formattedTime = item.checkedInAt.replaceAll('T', ' ');
                      if (formattedTime.length >= 19) {
                        formattedTime = formattedTime.substring(0, 19);
                      }

                      return Card(
                        margin: const EdgeInsets.only(bottom: 10),
                        child: ListTile(
                          leading: CircleAvatar(
                            backgroundColor: statusColor.withOpacity(0.2),
                            child: Icon(statusIcon, color: statusColor, size: 22),
                          ),
                          title: Text(
                            item.zoneName ?? 'Campus Evacuation Point',
                            style: const TextStyle(
                                fontWeight: FontWeight.bold, fontSize: 14),
                          ),
                          subtitle: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const SizedBox(height: 3),
                              Text(
                                'Alert #${item.alertId} • $formattedTime',
                                style: const TextStyle(
                                    fontSize: 11, color: Colors.grey),
                              ),
                              if (item.message != null && item.message!.isNotEmpty) ...[
                                const SizedBox(height: 3),
                                Text(
                                  item.message!,
                                  style: const TextStyle(
                                      fontSize: 12, color: Colors.white70, fontStyle: FontStyle.italic),
                                ),
                              ],
                            ],
                          ),
                          trailing: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                            decoration: BoxDecoration(
                              color: statusColor.withOpacity(0.15),
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(color: statusColor, width: 1),
                            ),
                            child: Text(
                              statusLabel,
                              style: TextStyle(
                                color: statusColor,
                                fontWeight: FontWeight.bold,
                                fontSize: 11,
                              ),
                            ),
                          ),
                        ),
                      );
                    },
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }
}
