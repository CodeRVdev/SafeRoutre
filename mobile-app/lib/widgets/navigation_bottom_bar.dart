import 'package:flutter/material.dart';
import '../models/navigation_step_model.dart';
import '../theme/app_theme.dart';

/// Bottom navigation info card inspired by Reference Image 1
class NavigationBottomBar extends StatelessWidget {
  final NavigationProgress progress;
  final String destinationName;
  final VoidCallback onExit;
  final VoidCallback? onSafeCheckin;
  final bool isEmergencyActive;
  final bool isCheckedIn;

  const NavigationBottomBar({
    super.key,
    required this.progress,
    required this.destinationName,
    required this.onExit,
    this.onSafeCheckin,
    this.isEmergencyActive = false,
    this.isCheckedIn = false,
  });

  @override
  Widget build(BuildContext context) {
    final remDistStr = NavigationEngine.formatDistance(progress.remainingDistanceMeters);
    final remTimeStr = '${progress.remainingDurationMinutes} min';

    return SafeArea(
      child: Container(
        margin: const EdgeInsets.fromLTRB(16, 0, 16, 16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(24),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.18),
              blurRadius: 18,
              offset: const Offset(0, 6),
            ),
          ],
        ),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 14.0),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Row(
                children: [
                  // Left side: ETA & Remaining distance + Destination Name
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        // "1 min, 23 m"
                        Text(
                          '$remTimeStr, $remDistStr',
                          style: const TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w900,
                            color: Color(0xFF0F172A),
                            letterSpacing: -0.3,
                          ),
                        ),
                        const SizedBox(height: 3),
                        // "To [Destination]"
                        Text(
                          'To $destinationName',
                          style: const TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w600,
                            color: Color(0xFF64748B),
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  ),

                  // Right side: Red Exit Button (Matching Reference Image 1)
                  ElevatedButton(
                    onPressed: onExit,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFFDC2626), // Red Exit button
                      foregroundColor: Colors.white,
                      elevation: 0,
                      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(24),
                      ),
                    ),
                    child: const Text(
                      'Exit',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w800,
                        letterSpacing: 0.2,
                      ),
                    ),
                  ),
                ],
              ),

              // Emergency Check-in quick action if alert is active
              if (isEmergencyActive && onSafeCheckin != null) ...[
                const SizedBox(height: 10),
                SizedBox(
                  width: double.infinity,
                  height: 38,
                  child: ElevatedButton.icon(
                    onPressed: isCheckedIn ? null : onSafeCheckin,
                    icon: Icon(
                      isCheckedIn ? Icons.check_circle : Icons.health_and_safety,
                      size: 18,
                      color: Colors.white,
                    ),
                    label: Text(
                      isCheckedIn ? '✓ YOU ARE MARKED SAFE' : 'I AM SAFE — CHECK IN NOW',
                      style: const TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w800,
                        letterSpacing: 0.5,
                      ),
                    ),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: isCheckedIn
                          ? AppTheme.safeEmerald.withOpacity(0.7)
                          : AppTheme.safeEmerald,
                      foregroundColor: Colors.white,
                      elevation: 0,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(14),
                      ),
                    ),
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
