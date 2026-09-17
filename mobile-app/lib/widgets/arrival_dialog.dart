import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

/// Arrival Completion Dialog / Card shown when reaching the evacuation destination
class ArrivalDialog extends StatelessWidget {
  final String destinationName;
  final VoidCallback onDone;
  final VoidCallback? onSafeCheckin;
  final bool isEmergencyActive;
  final bool isCheckedIn;

  const ArrivalDialog({
    super.key,
    required this.destinationName,
    required this.onDone,
    this.onSafeCheckin,
    this.isEmergencyActive = false,
    this.isCheckedIn = false,
  });

  @override
  Widget build(BuildContext context) {
    return Dialog(
      backgroundColor: Colors.transparent,
      insetPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
      child: Container(
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: const Color(0xFF1E293B),
          borderRadius: BorderRadius.circular(28),
          border: Border.all(color: AppTheme.safeEmerald, width: 2),
          boxShadow: [
            BoxShadow(
              color: AppTheme.safeEmerald.withOpacity(0.35),
              blurRadius: 24,
              offset: const Offset(0, 8),
            ),
          ],
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Success icon with pulsing circle
            Container(
              width: 64,
              height: 64,
              decoration: BoxDecoration(
                color: AppTheme.safeEmerald.withOpacity(0.2),
                shape: BoxShape.circle,
                border: Border.all(color: AppTheme.safeEmerald, width: 2.5),
              ),
              child: const Icon(
                Icons.check_circle_rounded,
                color: AppTheme.safeEmerald,
                size: 38,
              ),
            ),
            const SizedBox(height: 16),

            // Title
            const Text(
              '✓ ARRIVED SAFELY',
              style: TextStyle(
                color: Colors.white,
                fontSize: 20,
                fontWeight: FontWeight.w900,
                letterSpacing: 0.5,
              ),
            ),
            const SizedBox(height: 8),

            // Subtitle
            Text(
              destinationName,
              style: const TextStyle(
                color: AppTheme.primaryCyan,
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 6),

            const Text(
              'You have safely reached the selected evacuation area. SDRRM safety marshals are on site.',
              style: TextStyle(
                color: Color(0xFF94A3B8),
                fontSize: 13,
                fontWeight: FontWeight.w500,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 20),

            // "I AM SAFE" Check-in Button if emergency is active
            if (isEmergencyActive && onSafeCheckin != null) ...[
              SizedBox(
                width: double.infinity,
                height: 48,
                child: ElevatedButton.icon(
                  onPressed: isCheckedIn ? null : onSafeCheckin,
                  icon: Icon(
                    isCheckedIn ? Icons.check_circle : Icons.health_and_safety,
                    color: Colors.white,
                  ),
                  label: Text(
                    isCheckedIn
                        ? 'STATUS RECORDED — SAFE'
                        : 'SUBMIT "I AM SAFE" CHECK-IN',
                    style: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w900,
                      letterSpacing: 0.5,
                    ),
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: isCheckedIn
                        ? AppTheme.safeEmerald.withOpacity(0.6)
                        : AppTheme.safeEmerald,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 12),
            ],

            // Done Button
            SizedBox(
              width: double.infinity,
              height: 48,
              child: OutlinedButton(
                onPressed: onDone,
                style: OutlinedButton.styleFrom(
                  foregroundColor: Colors.white,
                  side: const BorderSide(color: Color(0xFF475569), width: 1.5),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                  ),
                ),
                child: const Text(
                  'DONE',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 0.5,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
