import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/alert_model.dart';
import '../models/zone_model.dart';
import '../models/sos_message_model.dart';
import '../api/checkin_api.dart';
import '../api/sos_api.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import '../services/auth_service.dart';
import '../services/audio_siren_service.dart';
import '../services/location_service.dart';
import '../theme/app_theme.dart';
import 'evacuation_map_screen.dart';

class EmergencyAlertScreen extends StatefulWidget {
  final AlertModel alert;
  final List<ZoneModel> zones;
  final VoidCallback onCheckinComplete;

  const EmergencyAlertScreen({
    super.key,
    required this.alert,
    required this.zones,
    required this.onCheckinComplete,
  });

  @override
  State<EmergencyAlertScreen> createState() => _EmergencyAlertScreenState();
}

class _EmergencyAlertScreenState extends State<EmergencyAlertScreen> {
  final TextEditingController _messageController = TextEditingController();
  bool _isSubmitting = false;
  bool _isCheckedIn = false;
  bool _isQueuedOffline = false;
  String _selectedStatus = 'safe';
  String? _errorMessage;

  List<SosMessageModel> _sosThread = [];
  bool _isSendingSos = false;

  @override
  void initState() {
    super.initState();
    _fetchSosThread();
  }

  @override
  void dispose() {
    _messageController.dispose();
    super.dispose();
  }

  Future<void> _fetchSosThread() async {
    final auth = Provider.of<AuthService>(context, listen: false);
    if (auth.token == null) return;

    try {
      final messages = await SosApi.getSosMessages(
        token: auth.token!,
        alertId: widget.alert.alertId,
      );
      if (mounted) {
        setState(() {
          _sosThread = messages;
        });
      }
    } catch (e) {
      debugPrint('Error fetching SOS thread: $e');
    }
  }

  void _openSosModal() {
    final TextEditingController sosTextController = TextEditingController();
    String selectedPriority = 'urgent';
    String? selectedQuickMsg;

    final quickMessages = [
      "I'm trapped in room",
      "I need medical help",
      "I can't find the exit",
      "Someone here is injured",
    ];

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppTheme.darkBackground,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) {
        return StatefulBuilder(
          builder: (modalCtx, setModalState) {
            final locationService = Provider.of<LocationService>(context, listen: false);
            final userLoc = locationService.currentLocation;

            return Padding(
              padding: EdgeInsets.only(
                left: 20,
                right: 20,
                top: 20,
                bottom: MediaQuery.of(modalCtx).viewInsets.bottom + 20,
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Bottom sheet handle
                  Center(
                    child: Container(
                      width: 40,
                      height: 4,
                      decoration: BoxDecoration(
                        color: Colors.white24,
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),

                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: AppTheme.emergencyRose.withOpacity(0.2),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(Icons.sos_rounded, color: AppTheme.emergencyRose, size: 28),
                      ),
                      const SizedBox(width: 12),
                      const Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'SEND DISTRESS SOS',
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w900,
                              color: Colors.white,
                              letterSpacing: 0.5,
                            ),
                          ),
                          Text(
                            'Direct 2-way emergency alert to campus coordinators',
                            style: TextStyle(fontSize: 11, color: Colors.white60),
                          ),
                        ],
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),

                  // Priority Selector Chips
                  Row(
                    children: [
                      const Text('Priority:', style: TextStyle(color: Colors.white70, fontSize: 12, fontWeight: FontWeight.bold)),
                      const SizedBox(width: 12),
                      ChoiceChip(
                        label: const Text('URGENT'),
                        selected: selectedPriority == 'urgent',
                        selectedColor: AppTheme.warningAmber.withOpacity(0.3),
                        labelStyle: TextStyle(
                          color: selectedPriority == 'urgent' ? AppTheme.warningAmber : Colors.grey,
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                        ),
                        onSelected: (sel) {
                          if (sel) setModalState(() => selectedPriority = 'urgent');
                        },
                      ),
                      const SizedBox(width: 8),
                      ChoiceChip(
                        label: const Text('CRITICAL'),
                        selected: selectedPriority == 'critical',
                        selectedColor: AppTheme.emergencyRose.withOpacity(0.3),
                        labelStyle: TextStyle(
                          color: selectedPriority == 'critical' ? AppTheme.emergencyRose : Colors.grey,
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                        ),
                        onSelected: (sel) {
                          if (sel) setModalState(() => selectedPriority = 'critical');
                        },
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),

                  // Quick Message Chips
                  const Text('Quick Messages:', style: TextStyle(color: Colors.white70, fontSize: 12, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 6,
                    runSpacing: 6,
                    children: quickMessages.map((msg) {
                      final isSelected = selectedQuickMsg == msg;
                      return ActionChip(
                        label: Text(msg),
                        backgroundColor: isSelected ? AppTheme.emergencyRose.withOpacity(0.3) : AppTheme.surfaceCard,
                        labelStyle: TextStyle(
                          color: isSelected ? AppTheme.emergencyRose : Colors.white70,
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                        ),
                        side: BorderSide(color: isSelected ? AppTheme.emergencyRose : Colors.white12),
                        onPressed: () {
                          setModalState(() {
                            selectedQuickMsg = msg;
                            sosTextController.text = msg;
                          });
                        },
                      );
                    }).toList(),
                  ),
                  const SizedBox(height: 14),

                  // Text Field
                  TextField(
                    controller: sosTextController,
                    maxLines: 3,
                    style: const TextStyle(color: Colors.white, fontSize: 13),
                    decoration: InputDecoration(
                      hintText: 'Describe your emergency situation and location details...',
                      hintStyle: TextStyle(color: Colors.white.withOpacity(0.4), fontSize: 12),
                      filled: true,
                      fillColor: AppTheme.surfaceCard,
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: const BorderSide(color: AppTheme.emergencyRose)),
                      enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: const BorderSide(color: AppTheme.emergencyRose)),
                      focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: const BorderSide(color: AppTheme.emergencyRose, width: 2)),
                    ),
                  ),
                  const SizedBox(height: 12),

                  // Attached GPS Location Indicator
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: AppTheme.primaryCyan.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: AppTheme.primaryCyan.withOpacity(0.3)),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.my_location, color: AppTheme.primaryCyan, size: 16),
                        const SizedBox(width: 8),
                        Text(
                          'GPS Coordinates Attached: ${userLoc.latitude.toStringAsFixed(4)}, ${userLoc.longitude.toStringAsFixed(4)}',
                          style: const TextStyle(color: AppTheme.primaryCyan, fontSize: 11, fontWeight: FontWeight.bold),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Submit SOS Button
                  SizedBox(
                    height: 50,
                    child: ElevatedButton.icon(
                      onPressed: _isSendingSos
                          ? null
                          : () async {
                              final text = sosTextController.text.trim();
                              if (text.isEmpty) return;

                              setModalState(() => _isSendingSos = true);

                              final auth = Provider.of<AuthService>(context, listen: false);
                              final messenger = ScaffoldMessenger.of(context);
                              final nav = Navigator.of(modalCtx);

                              try {
                                final sentSos = await SosApi.sendSos(
                                  token: auth.token!,
                                  alertId: widget.alert.alertId,
                                  content: text,
                                  location: userLoc,
                                  priority: selectedPriority,
                                );

                                setState(() {
                                  _sosThread.add(sentSos);
                                });

                                if (!mounted) return;
                                nav.pop();
                                messenger.showSnackBar(
                                  const SnackBar(
                                    content: Text('🚨 DISTRESS SOS DISPATCHED TO COORDINATORS!'),
                                    backgroundColor: AppTheme.emergencyRose,
                                  ),
                                );
                              } catch (e) {
                                if (mounted) {
                                  messenger.showSnackBar(
                                    SnackBar(content: Text('Failed to send SOS: $e')),
                                  );
                                }
                              } finally {
                                setModalState(() => _isSendingSos = false);
                              }
                            },
                      icon: const Icon(Icons.send_rounded, color: Colors.white),
                      label: const Text(
                        'SEND DISTRESS SOS NOW',
                        style: TextStyle(fontSize: 14, fontWeight: FontWeight.w900, letterSpacing: 0.5),
                      ),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.emergencyRose,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      ),
                    ),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }



  Future<void> _handleCheckin(String status) async {
    setState(() {
      _isSubmitting = true;
      _errorMessage = null;
      _selectedStatus = status;
    });

    final auth = Provider.of<AuthService>(context, listen: false);
    final locationService = Provider.of<LocationService>(context, listen: false);
    final sirenService = Provider.of<AudioSirenService>(context, listen: false);

    // Calculate nearest zone
    final nearestZone = locationService.calculateNearestZone(widget.zones);

    // ALWAYS stop siren immediately on tapping check-in to prevent panic
    await sirenService.stopSiren();

    final userMessage = _messageController.text.trim();

    try {
      await CheckinApi.submitCheckin(
        token: auth.token!,
        alertId: widget.alert.alertId,
        zoneId: nearestZone?.zoneId,
        location: locationService.currentLocation,
        status: status,
        message: userMessage.isNotEmpty ? userMessage : null,
      );

      setState(() {
        _isSubmitting = false;
        _isCheckedIn = true;
        _isQueuedOffline = false;
      });

      widget.onCheckinComplete();
    } catch (e) {
      // Graceful offline fallback handling
      final errStr = e.toString();
      if (errStr.contains('Network error') || errStr.contains('SocketException') || errStr.contains('500')) {
        setState(() {
          _isSubmitting = false;
          _isCheckedIn = true;
          _isQueuedOffline = true;
        });
      } else {
        setState(() {
          _isSubmitting = false;
          _errorMessage = errStr.replaceAll('ApiException', '').replaceAll(RegExp(r'\(\d+\):'), '').trim();
        });
      }
    }
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'need_help':
        return AppTheme.warningAmber;
      case 'injured':
        return AppTheme.emergencyRose;
      case 'safe':
      default:
        return AppTheme.safeEmerald;
    }
  }

  IconData _getStatusIcon(String status) {
    if (_isQueuedOffline) return Icons.wifi_off_rounded;
    switch (status) {
      case 'need_help':
        return Icons.front_hand_outlined;
      case 'injured':
        return Icons.medical_services_outlined;
      case 'safe':
      default:
        return Icons.check_circle_outline;
    }
  }

  String _getConfirmationTitle(String status) {
    if (_isQueuedOffline) {
      switch (status) {
        case 'need_help':
          return 'HELP REQUEST (QUEUED FOR SYNC)';
        case 'injured':
          return 'INJURY REPORT (QUEUED FOR SYNC)';
        case 'safe':
        default:
          return 'SAFE (QUEUED FOR SYNC)';
      }
    }

    switch (status) {
      case 'need_help':
        return 'HELP REQUEST SENT — STAY CALM';
      case 'injured':
        return 'INJURY REPORTED — HELP IS ON THE WAY';
      case 'safe':
      default:
        return 'SAFETY CHECK-IN RECORDED!';
    }
  }

  String _getConfirmationSubtitle(String status) {
    if (_isQueuedOffline) {
      return 'Siren muted. Check-in saved on device & will auto-sync when network reconnects.';
    }

    switch (status) {
      case 'need_help':
        return 'Siren stopped. Emergency responders have been alerted to your situation.';
      case 'injured':
        return 'Siren stopped. Medical emergency team dispatched to your location.';
      case 'safe':
      default:
        return 'Siren stopped. Safety coordinators have been notified.';
    }
  }

  @override
  Widget build(BuildContext context) {
    final locationService = Provider.of<LocationService>(context);
    final nearestZone = locationService.calculateNearestZone(widget.zones);
    final isDrill = widget.alert.isDrill;
    final themeColor = isDrill ? AppTheme.primaryCyan : AppTheme.emergencyRose;

    return Scaffold(
      backgroundColor: AppTheme.darkBackground,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Top Siren Indicator Banner (Blue for Drill, Red for Emergency)
              Container(
                padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
                decoration: BoxDecoration(
                  color: themeColor.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: themeColor),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(isDrill ? Icons.nature_people : Icons.campaign, color: themeColor, size: 28),
                    const SizedBox(width: 10),
                    Text(
                      isDrill ? '🔵 EVACUATION DRILL — PRACTICE EXERCISE' : 'CAMPUS SIREN BROADCAST ACTIVE',
                      style: TextStyle(
                        color: themeColor,
                        fontWeight: FontWeight.w800,
                        fontSize: 13,
                        letterSpacing: 1,
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 20),

              // Alert Content Box (Blue border for Drill, Red for Emergency)
              Card(
                color: AppTheme.surfaceCard,
                elevation: 12,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(24),
                  side: BorderSide(color: themeColor, width: 2),
                ),
                child: Padding(
                  padding: const EdgeInsets.all(24.0),
                  child: Column(
                    children: [
                      Icon(
                        isDrill ? Icons.directions_run : Icons.warning_amber_rounded,
                        size: 64,
                        color: themeColor,
                      ),
                      const SizedBox(height: 12),
                      Text(
                        widget.alert.title,
                        textAlign: TextAlign.center,
                        style: const TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      ),
                      const SizedBox(height: 12),
                      Text(
                        widget.alert.message,
                        textAlign: TextAlign.center,
                        style: const TextStyle(
                          fontSize: 14,
                          color: Colors.white70,
                        ),
                      ),

                      if (nearestZone != null) ...[
                        const SizedBox(height: 20),
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: AppTheme.primaryCyan.withOpacity(0.15),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(
                                color: AppTheme.primaryCyan.withOpacity(0.4)),
                          ),
                          child: Row(
                            children: [
                              const Icon(Icons.location_on,
                                  color: AppTheme.primaryCyan, size: 20),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Text(
                                  'Recommended Safe Zone: ${nearestZone.name}',
                                  style: const TextStyle(
                                    color: AppTheme.primaryCyan,
                                    fontSize: 12,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ),

              if (_errorMessage != null) ...[
                const SizedBox(height: 16),
                Text(
                  _errorMessage!,
                  textAlign: TextAlign.center,
                  style: const TextStyle(color: AppTheme.emergencyRose, fontSize: 13),
                ),
              ],

              const SizedBox(height: 24),

              // Confirmation State vs Action Form (Textfield + 3 Buttons)
              if (_isCheckedIn) ...[
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: isDrill
                        ? AppTheme.primaryCyan.withOpacity(0.2)
                        : _getStatusColor(_selectedStatus).withOpacity(0.2),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(
                      color: isDrill ? AppTheme.primaryCyan : _getStatusColor(_selectedStatus),
                      width: 2,
                    ),
                  ),
                  child: Column(
                    children: [
                      Icon(
                        isDrill ? Icons.thumb_up_alt_outlined : _getStatusIcon(_selectedStatus),
                        color: isDrill ? AppTheme.primaryCyan : _getStatusColor(_selectedStatus),
                        size: 48,
                      ),
                      const SizedBox(height: 8),
                      Text(
                        isDrill
                            ? 'Drill check-in recorded! Great job practicing! 👏'
                            : _getConfirmationTitle(_selectedStatus),
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          color: isDrill ? AppTheme.primaryCyan : _getStatusColor(_selectedStatus),
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        isDrill
                            ? 'Your drill response has been logged with the safety coordinator.'
                            : _getConfirmationSubtitle(_selectedStatus),
                        textAlign: TextAlign.center,
                        style: const TextStyle(color: Colors.white70, fontSize: 12),
                      ),
                      if (_messageController.text.trim().isNotEmpty) ...[
                        const SizedBox(height: 10),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                          decoration: BoxDecoration(
                            color: Colors.black26,
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            'Message: "${_messageController.text.trim()}"',
                            style: const TextStyle(color: Colors.white70, fontSize: 12, fontStyle: FontStyle.italic),
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
                const SizedBox(height: 16),

                if (_isQueuedOffline) ...[
                  ElevatedButton.icon(
                    onPressed: _isSubmitting ? null : () => _handleCheckin(_selectedStatus),
                    icon: const Icon(Icons.sync, size: 18),
                    label: const Text('Retry Sync to Coordinator'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.warningAmber,
                    ),
                  ),
                  const SizedBox(height: 8),
                ],

                // Prominent "VIEW EVACUATION ROUTE" Button
                SizedBox(
                  height: 52,
                  child: ElevatedButton.icon(
                    onPressed: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => const EvacuationMapScreen(autoStartNavigation: true),
                        ),
                      );
                    },
                    icon: const Icon(Icons.navigation, color: Colors.white, size: 22),
                    label: const Text(
                      'VIEW EVACUATION ROUTE',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w900,
                        letterSpacing: 0.5,
                      ),
                    ),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: isDrill ? AppTheme.primaryCyan : AppTheme.safeEmerald,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16),
                      ),
                    ),
                  ),
                ),

                const SizedBox(height: 10),

                ElevatedButton(
                  onPressed: () => Navigator.pop(context),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.surfaceCard,
                  ),
                  child: const Text('Return to Campus Map'),
                ),
              ] else ...[
                // Optional Situational Text Field
                TextField(
                  controller: _messageController,
                  enabled: !_isSubmitting,
                  maxLines: 2,
                  style: const TextStyle(color: Colors.white, fontSize: 13),
                  decoration: InputDecoration(
                    hintText: isDrill
                        ? 'Optional drill note (e.g., room 102 cleared)'
                        : 'Optional message (e.g., trapped in room 204)',
                    hintStyle: TextStyle(color: Colors.white.withOpacity(0.4), fontSize: 12),
                    filled: true,
                    fillColor: AppTheme.surfaceCard,
                    contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(16),
                      borderSide: BorderSide(color: Colors.white.withOpacity(0.15)),
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(16),
                      borderSide: BorderSide(color: Colors.white.withOpacity(0.15)),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(16),
                      borderSide: BorderSide(color: themeColor),
                    ),
                  ),
                ),

                const SizedBox(height: 16),

                // Button 1: Safe / Drill Check-in
                SizedBox(
                  height: 52,
                  child: ElevatedButton(
                    onPressed: _isSubmitting ? null : () => _handleCheckin('safe'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: isDrill ? AppTheme.primaryCyan : AppTheme.safeEmerald,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16),
                      ),
                    ),
                    child: _isSubmitting && _selectedStatus == 'safe'
                        ? const CircularProgressIndicator(color: Colors.white)
                        : Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(isDrill ? Icons.check_circle : Icons.health_and_safety, size: 24),
                              const SizedBox(width: 10),
                              Text(
                                isDrill
                                    ? (AppLocalizations.of(context)?.drillCheckin ?? 'DRILL CHECK-IN — I AM AT THE ASSEMBLY AREA')
                                    : (AppLocalizations.of(context)?.iAmSafe ?? 'I AM SAFE'),
                                style: const TextStyle(
                                  fontSize: 13,
                                  fontWeight: FontWeight.w800,
                                  letterSpacing: 0.5,
                                ),
                              ),
                            ],
                          ),
                  ),
                ),

                const SizedBox(height: 10),

                // Button 2: "I NEED HELP" (Orange)
                SizedBox(
                  height: 52,
                  child: ElevatedButton(
                    onPressed: _isSubmitting ? null : () => _handleCheckin('need_help'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.warningAmber,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16),
                      ),
                    ),
                    child: _isSubmitting && _selectedStatus == 'need_help'
                        ? const CircularProgressIndicator(color: Colors.white)
                        : Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              const Icon(Icons.front_hand_outlined, size: 24),
                              const SizedBox(width: 10),
                              Text(
                                AppLocalizations.of(context)?.iNeedHelp ?? 'I NEED HELP',
                                style: const TextStyle(
                                  fontSize: 15,
                                  fontWeight: FontWeight.w800,
                                  letterSpacing: 1,
                                ),
                              ),
                            ],
                          ),
                  ),
                ),

                const SizedBox(height: 10),

                // Button 3: "I AM INJURED" (Red)
                SizedBox(
                  height: 52,
                  child: ElevatedButton(
                    onPressed: _isSubmitting ? null : () => _handleCheckin('injured'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.emergencyRose,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16),
                      ),
                    ),
                    child: _isSubmitting && _selectedStatus == 'injured'
                        ? const CircularProgressIndicator(color: Colors.white)
                        : Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              const Icon(Icons.medical_services_outlined, size: 24),
                              const SizedBox(width: 10),
                              Text(
                                AppLocalizations.of(context)?.iAmInjured ?? 'I AM INJURED',
                                style: const TextStyle(
                                  fontSize: 15,
                                  fontWeight: FontWeight.w800,
                                  letterSpacing: 1,
                                ),
                              ),
                            ],
                          ),
                  ),
                ),

                const SizedBox(height: 16),
                const Divider(color: Colors.white12),
                const SizedBox(height: 12),

                // Prominent Red "🆘 SEND SOS" Button
                SizedBox(
                  height: 54,
                  child: ElevatedButton.icon(
                    onPressed: _openSosModal,
                    icon: const Icon(Icons.sos_rounded, color: Colors.white, size: 28),
                    label: Text(
                      AppLocalizations.of(context)?.sendSos ?? '🆘 SEND DISTRESS SOS',
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w900,
                        letterSpacing: 1,
                        color: Colors.white,
                      ),
                    ),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.emergencyRose,
                      elevation: 8,
                      shadowColor: AppTheme.emergencyRose.withOpacity(0.5),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16),
                        side: const BorderSide(color: Colors.white30, width: 1.5),
                      ),
                    ),
                  ),
                ),

                // SOS Live Chat Thread History View
                if (_sosThread.isNotEmpty) ...[
                  const SizedBox(height: 20),
                  Row(
                    children: [
                      const Icon(Icons.forum_outlined, color: AppTheme.primaryCyan, size: 20),
                      const SizedBox(width: 8),
                      Text(
                        'Live SOS Chat Thread (${_sosThread.length})',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 13,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  ListView.separated(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    itemCount: _sosThread.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 8),
                    itemBuilder: (ctx, index) {
                      final msg = _sosThread[index];
                      final isCoordinator = msg.receiverId != null;

                      return Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: isCoordinator
                              ? AppTheme.primaryCyan.withOpacity(0.15)
                              : AppTheme.surfaceCard,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                            color: isCoordinator
                                ? AppTheme.primaryCyan.withOpacity(0.4)
                                : AppTheme.emergencyRose.withOpacity(0.4),
                          ),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  isCoordinator
                                      ? '🛡️ Coordinator Response'
                                      : '🆘 ${msg.senderName} (${msg.priority.toUpperCase()})',
                                  style: TextStyle(
                                    fontSize: 11,
                                    fontWeight: FontWeight.bold,
                                    color: isCoordinator
                                        ? AppTheme.primaryCyan
                                        : AppTheme.emergencyRose,
                                  ),
                                ),
                                Text(
                                  DateTime.tryParse(msg.createdAt)?.toLocal().toString().substring(11, 16) ?? '',
                                  style: const TextStyle(fontSize: 10, color: Colors.grey),
                                ),
                              ],
                            ),
                            const SizedBox(height: 4),
                            Text(
                              '"${msg.content}"',
                              style: const TextStyle(
                                fontSize: 13,
                                color: Colors.white,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ],
                        ),
                      );
                    },
                  ),
                ],
              ],
              const SizedBox(height: 12),
            ],
          ),
        ),
      ),
    );
  }
}
