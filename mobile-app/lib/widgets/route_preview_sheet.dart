import 'package:flutter/material.dart';
import '../models/navigation_step_model.dart';
import '../models/route_guidance_model.dart';
import '../theme/app_theme.dart';

/// Pre-navigation Route Preview and Turn-by-Turn Directions bottom sheet
/// inspired by Reference Image 2
class RoutePreviewSheet extends StatelessWidget {
  final RouteGuidanceModel route;
  final List<NavigationStep> steps;
  final VoidCallback onStartNavigation;
  final VoidCallback onClose;

  const RoutePreviewSheet({
    super.key,
    required this.route,
    required this.steps,
    required this.onStartNavigation,
    required this.onClose,
  });

  @override
  Widget build(BuildContext context) {
    final distStr = NavigationEngine.formatDistance(route.distanceMeters.toDouble());
    final timeStr = '${route.estimatedDurationMinutes} min';

    return Container(
      constraints: BoxConstraints(
        maxHeight: MediaQuery.of(context).size.height * 0.70,
      ),
      decoration: const BoxDecoration(
        color: Color(0xFF1E293B), // Dark slate surface
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
        boxShadow: [
          BoxShadow(
            color: Colors.black54,
            blurRadius: 20,
            offset: Offset(0, -4),
          ),
        ],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Drag handle
          Center(
            child: Container(
              margin: const EdgeInsets.only(top: 12, bottom: 8),
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: const Color(0xFF64748B),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),

          // Header: Destination title + Close button
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 6.0),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        route.destinationName,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 18,
                          fontWeight: FontWeight.w800,
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 2),
                      const Text(
                        'From Current Campus Location',
                        style: TextStyle(
                          color: Color(0xFF94A3B8),
                          fontSize: 12,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.close, color: Colors.white70, size: 22),
                  onPressed: onClose,
                ),
              ],
            ),
          ),

          // Travel Mode Badge & Safety Note
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 8.0),
            child: Row(
              children: [
                // Walking Mode Tag
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                  decoration: BoxDecoration(
                    color: const Color(0xFF0F172A),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppTheme.primaryCyan, width: 1.5),
                  ),
                  child: const Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.directions_walk, color: AppTheme.primaryCyan, size: 20),
                      SizedBox(width: 6),
                      Text(
                        'Walking Evacuation',
                        style: TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.w700,
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 10),

                // Step-Free / Safe Pathway Tag
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  decoration: BoxDecoration(
                    color: const Color(0xFF0F172A),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: const Color(0xFF334155), width: 1),
                  ),
                  child: const Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.accessible, color: AppTheme.safeEmerald, size: 18),
                      SizedBox(width: 4),
                      Text(
                        'Accessible',
                        style: TextStyle(
                          color: Color(0xFFCBD5E1),
                          fontWeight: FontWeight.w600,
                          fontSize: 11,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          const Divider(color: Color(0xFF334155), height: 16),

          // Route Summary: Time, Distance, and START NAVIGATION Button
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 6.0),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        '$timeStr • $distStr away',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 15,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                      const SizedBox(height: 2),
                      const Row(
                        children: [
                          Icon(Icons.verified, color: AppTheme.safeEmerald, size: 14),
                          SizedBox(width: 4),
                          Text(
                            'Hazards bypassed via campus pathways',
                            style: TextStyle(
                              color: AppTheme.safeEmerald,
                              fontSize: 11,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),

                // Start Navigation Button (Matching Reference Image 2 style)
                ElevatedButton(
                  onPressed: onStartNavigation,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFFEA580C), // High visibility evacuation orange
                    foregroundColor: Colors.white,
                    elevation: 4,
                    padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                  ),
                  child: const Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        'Go',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w900,
                          letterSpacing: 0.5,
                        ),
                      ),
                      SizedBox(width: 6),
                      Icon(Icons.navigation, size: 18),
                    ],
                  ),
                ),
              ],
            ),
          ),

          const Divider(color: Color(0xFF334155), height: 16),

          // Scrollable Step-by-Step Directions List (Reference Image 2)
          Flexible(
            child: ListView.separated(
              padding: const EdgeInsets.fromLTRB(20, 4, 20, 24),
              itemCount: steps.length,
              separatorBuilder: (_, __) => const Divider(
                color: Color(0xFF334155),
                height: 16,
              ),
              itemBuilder: (context, index) {
                final step = steps[index];
                final isLast = index == steps.length - 1;
                final legDistStr = NavigationEngine.formatDistance(step.distanceMeters);

                return Row(
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    // Maneuver Icon
                    Container(
                      width: 36,
                      height: 36,
                      decoration: BoxDecoration(
                        color: isLast
                            ? AppTheme.safeEmerald.withOpacity(0.2)
                            : const Color(0xFF0F172A),
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(
                          color: isLast ? AppTheme.safeEmerald : const Color(0xFF475569),
                          width: 1.2,
                        ),
                      ),
                      child: Icon(
                        step.icon,
                        color: isLast ? AppTheme.safeEmerald : Colors.white,
                        size: 20,
                      ),
                    ),
                    const SizedBox(width: 14),

                    // Instruction & Leg Distance
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            step.instruction,
                            style: TextStyle(
                              color: isLast ? AppTheme.safeEmerald : Colors.white,
                              fontSize: 13,
                              fontWeight: isLast ? FontWeight.w800 : FontWeight.w600,
                            ),
                          ),
                          if (step.distanceMeters > 0) ...[
                            const SizedBox(height: 2),
                            Text(
                              legDistStr,
                              style: const TextStyle(
                                color: Color(0xFF94A3B8),
                                fontSize: 11,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ],
                        ],
                      ),
                    ),
                  ],
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
