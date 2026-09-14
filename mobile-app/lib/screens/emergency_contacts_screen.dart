import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import '../models/emergency_contact_model.dart';
import '../models/alert_model.dart';
import '../api/contact_api.dart';
import '../api/alert_api.dart';
import '../services/auth_service.dart';
import '../theme/app_theme.dart';

class EmergencyContactsScreen extends StatefulWidget {
  const EmergencyContactsScreen({super.key});

  @override
  State<EmergencyContactsScreen> createState() => _EmergencyContactsScreenState();
}

class _EmergencyContactsScreenState extends State<EmergencyContactsScreen> {
  List<EmergencyContactModel> _contacts = [];
  AlertModel? _activeAlert;
  String _selectedCategory = 'all';
  String _searchQuery = '';
  bool _isLoading = true;
  String? _error;

  static final List<EmergencyContactModel> defaultEmergencyHotlines = [
    EmergencyContactModel(
      contactId: 1,
      name: 'National Emergency Hotline',
      organization: 'Philippine National Emergency Center',
      phone: '911',
      category: 'disaster',
      sortOrder: 1,
    ),
    EmergencyContactModel(
      contactId: 2,
      name: 'Tupi MDRRMO Hotline',
      organization: 'Municipal Disaster Risk Reduction Management Office',
      phone: '(083) 228-1500',
      category: 'disaster',
      sortOrder: 2,
    ),
    EmergencyContactModel(
      contactId: 3,
      name: 'Tupi MDRRMO Rescue Mobile',
      organization: 'Tupi Disaster Response Team',
      phone: '0917-123-4567',
      category: 'disaster',
      sortOrder: 3,
    ),
    EmergencyContactModel(
      contactId: 4,
      name: 'Bureau of Fire Protection (BFP) Tupi',
      organization: 'Tupi Fire Station',
      phone: '(083) 228-1999',
      category: 'fire',
      sortOrder: 4,
    ),
    EmergencyContactModel(
      contactId: 5,
      name: 'Tupi PNP Police Station',
      organization: 'Philippine National Police - Tupi',
      phone: '(083) 228-1111',
      category: 'police',
      sortOrder: 5,
    ),
    EmergencyContactModel(
      contactId: 6,
      name: 'Tupi PNP Mobile Dispatch',
      organization: 'PNP Patrol Unit',
      phone: '0998-598-6721',
      category: 'police',
      sortOrder: 6,
    ),
    EmergencyContactModel(
      contactId: 7,
      name: 'Tupi Rural Health Unit (RHU)',
      organization: 'Tupi Municipal Health Center',
      phone: '(083) 228-1234',
      category: 'medical',
      sortOrder: 7,
    ),
    EmergencyContactModel(
      contactId: 8,
      name: 'South Cotabato Provincial Hospital',
      organization: 'Provincial Medical Center',
      phone: '(083) 228-2000',
      category: 'medical',
      sortOrder: 8,
    ),
    EmergencyContactModel(
      contactId: 9,
      name: 'Philippine Red Cross (South Cotabato)',
      organization: 'Philippine Red Cross',
      phone: '(083) 228-3333',
      category: 'medical',
      sortOrder: 9,
    ),
    EmergencyContactModel(
      contactId: 10,
      name: 'Polonoling Barangay Hall & Tanod',
      organization: 'Barangay Polonoling LGU',
      phone: '0918-444-5555',
      category: 'school',
      sortOrder: 10,
    ),
    EmergencyContactModel(
      contactId: 11,
      name: 'Polonoling NHS Safety Clinic & DRRM Officer',
      organization: 'Polonoling National High School',
      phone: '0920-111-2222',
      category: 'school',
      sortOrder: 11,
    ),
  ];

  @override
  void initState() {
    super.initState();
    _fetchData();
  }

  Future<void> _fetchData() async {
    final auth = Provider.of<AuthService>(context, listen: false);
    if (auth.token == null) {
      if (mounted) {
        setState(() {
          _contacts = List.from(defaultEmergencyHotlines);
          _isLoading = false;
        });
      }
      return;
    }

    try {
      setState(() {
        _isLoading = true;
        _error = null;
      });

      List<EmergencyContactModel> contacts = [];
      try {
        contacts = await ContactApi.getEmergencyContacts(auth.token!);
      } catch (e) {
        debugPrint('⚠️ Remote emergency contacts fetch error: $e');
      }

      if (contacts.isEmpty) {
        contacts = List.from(defaultEmergencyHotlines);
      }

      List<AlertModel> activeAlerts = [];
      try {
        activeAlerts = await AlertApi.getActiveAlerts(auth.token!);
      } catch (_) {}

      final activeAlert = activeAlerts.isNotEmpty ? activeAlerts.first : null;

      // Priority sort if active emergency
      if (activeAlert != null) {
        final alertTitle = activeAlert.title.toLowerCase();
        String priorityCat = 'disaster';

        if (alertTitle.contains('fire') || alertTitle.contains('smoke')) {
          priorityCat = 'fire';
        } else if (alertTitle.contains('medical') || alertTitle.contains('injury') || alertTitle.contains('health')) {
          priorityCat = 'medical';
        } else if (alertTitle.contains('security') || alertTitle.contains('police') || alertTitle.contains('shooter')) {
          priorityCat = 'police';
        }

        contacts.sort((a, b) {
          if (a.category == priorityCat && b.category != priorityCat) return -1;
          if (b.category == priorityCat && a.category != priorityCat) return 1;
          return a.sortOrder.compareTo(b.sortOrder);
        });
      }

      if (mounted) {
        setState(() {
          _contacts = contacts;
          _activeAlert = activeAlert;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _contacts = List.from(defaultEmergencyHotlines);
          _error = null;
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _makePhoneCall(String phoneNumber) async {
    final cleanNumber = phoneNumber.replaceAll(RegExp(r'[^\d+]'), '');
    final uri = Uri.parse('tel:$cleanNumber');
    try {
      if (await canLaunchUrl(uri)) {
        await launchUrl(uri);
      } else {
        await launchUrl(uri);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Calling $phoneNumber...'),
            backgroundColor: AppTheme.safeEmerald,
          ),
        );
      }
    }
  }

  void _copyToClipboard(String text, String label) {
    Clipboard.setData(ClipboardData(text: text));
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('📋 Copied $label ($text) to clipboard'),
        backgroundColor: AppTheme.primaryCyan,
        duration: const Duration(seconds: 2),
      ),
    );
  }

  Color _getCategoryColor(String category) {
    switch (category.toLowerCase()) {
      case 'fire':
        return AppTheme.emergencyRose;
      case 'medical':
        return AppTheme.primaryCyan;
      case 'police':
        return AppTheme.warningAmber;
      case 'school':
        return AppTheme.safeEmerald;
      case 'disaster':
      default:
        return Colors.orangeAccent;
    }
  }

  IconData _getCategoryIcon(String category) {
    switch (category.toLowerCase()) {
      case 'fire':
        return Icons.local_fire_department;
      case 'medical':
        return Icons.local_hospital;
      case 'police':
        return Icons.local_police;
      case 'school':
        return Icons.school;
      case 'disaster':
      default:
        return Icons.warning_amber_rounded;
    }
  }

  String _getCategoryEmoji(String category) {
    switch (category.toLowerCase()) {
      case 'fire':
        return '🚒';
      case 'medical':
        return '🏥';
      case 'police':
        return '👮';
      case 'school':
        return '🏫';
      case 'disaster':
      default:
        return '🌊';
    }
  }

  @override
  Widget build(BuildContext context) {
    final filteredContacts = _contacts.where((c) {
      final matchesCat = _selectedCategory == 'all' || c.category.toLowerCase() == _selectedCategory;
      final matchesSearch = c.name.toLowerCase().contains(_searchQuery.toLowerCase()) ||
          (c.organization?.toLowerCase().contains(_searchQuery.toLowerCase()) ?? false) ||
          c.phone.contains(_searchQuery);
      return matchesCat && matchesSearch;
    }).toList();

    return Scaffold(
      backgroundColor: AppTheme.darkBackground,
      appBar: AppBar(
        backgroundColor: AppTheme.surfaceCard,
        title: const Row(
          children: [
            Icon(Icons.phone_in_talk, color: AppTheme.primaryCyan, size: 24),
            SizedBox(width: 10),
            Text(
              'Emergency Contacts',
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _fetchData,
          ),
        ],
      ),
      body: Column(
        children: [
          // Active Emergency Priority Banner Notice
          if (_activeAlert != null)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
              color: AppTheme.emergencyRose.withOpacity(0.2),
              child: Row(
                children: [
                  const Icon(Icons.error_outline, color: AppTheme.emergencyRose, size: 20),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      '🚨 Active Emergency (${_activeAlert!.title}): Priority emergency services highlighted below',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ],
              ),
            ),

          // Search Bar Input
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 14, 16, 8),
            child: TextField(
              onChanged: (val) => setState(() => _searchQuery = val),
              style: const TextStyle(color: Colors.white, fontSize: 13),
              decoration: InputDecoration(
                hintText: 'Search Tupi, South Cotabato hotline or agency...',
                hintStyle: const TextStyle(color: Colors.grey, fontSize: 12),
                prefixIcon: const Icon(Icons.search, color: AppTheme.primaryCyan, size: 20),
                suffixIcon: _searchQuery.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear, color: Colors.grey, size: 18),
                        onPressed: () => setState(() => _searchQuery = ''),
                      )
                    : null,
                filled: true,
                fillColor: AppTheme.surfaceCard,
                contentPadding: const EdgeInsets.symmetric(vertical: 0, horizontal: 16),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(16),
                  borderSide: BorderSide.none,
                ),
              ),
            ),
          ),

          // Category Filter Chips Row
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
            child: Row(
              children: [
                _buildCategoryChip('all', 'All Services', '🌐'),
                const SizedBox(width: 8),
                _buildCategoryChip('disaster', 'Disaster & MDRRMO', '🌊'),
                const SizedBox(width: 8),
                _buildCategoryChip('fire', 'Fire BFP', '🚒'),
                const SizedBox(width: 8),
                _buildCategoryChip('police', 'Police PNP', '👮'),
                const SizedBox(width: 8),
                _buildCategoryChip('medical', 'Medical & Hospitals', '🏥'),
                const SizedBox(width: 8),
                _buildCategoryChip('school', 'School & Local', '🏫'),
              ],
            ),
          ),

          const SizedBox(height: 6),

          // Contacts List View
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator(color: AppTheme.primaryCyan))
                : _error != null
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const Icon(Icons.warning_amber_rounded, color: AppTheme.emergencyRose, size: 48),
                            const SizedBox(height: 12),
                            Text(_error!, style: const TextStyle(color: Colors.grey, fontSize: 13)),
                            const SizedBox(height: 12),
                            ElevatedButton(
                              onPressed: _fetchData,
                              style: ElevatedButton.styleFrom(backgroundColor: AppTheme.primaryCyan),
                              child: const Text('Try Again'),
                            ),
                          ],
                        ),
                      )
                    : filteredContacts.isEmpty
                        ? const Center(
                            child: Text(
                              'No emergency contacts match your search query.',
                              style: TextStyle(color: Colors.grey, fontSize: 13),
                            ),
                          )
                        : ListView.builder(
                            padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
                            itemCount: filteredContacts.length,
                            itemBuilder: (context, index) {
                              final contact = filteredContacts[index];
                              final catColor = _getCategoryColor(contact.category);
                              final catIcon = _getCategoryIcon(contact.category);
                              final emoji = _getCategoryEmoji(contact.category);

                              return Card(
                                margin: const EdgeInsets.only(bottom: 12),
                                color: AppTheme.surfaceCard,
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(18),
                                  side: BorderSide(
                                    color: catColor.withOpacity(0.3),
                                    width: 1.5,
                                  ),
                                ),
                                child: InkWell(
                                  onLongPress: () => _copyToClipboard(contact.phone, contact.name),
                                  borderRadius: BorderRadius.circular(18),
                                  child: Padding(
                                    padding: const EdgeInsets.all(16.0),
                                    child: Row(
                                      children: [
                                        // Category Badge Avatar
                                        Container(
                                          width: 48,
                                          height: 48,
                                          decoration: BoxDecoration(
                                            color: catColor.withOpacity(0.15),
                                            borderRadius: BorderRadius.circular(14),
                                            border: Border.all(color: catColor.withOpacity(0.4)),
                                          ),
                                          child: Center(
                                            child: Icon(catIcon, color: catColor, size: 24),
                                          ),
                                        ),
                                        const SizedBox(width: 14),

                                        // Details Column
                                        Expanded(
                                          child: Column(
                                            crossAxisAlignment: CrossAxisAlignment.start,
                                            children: [
                                              Row(
                                                children: [
                                                  Text(
                                                    emoji,
                                                    style: const TextStyle(fontSize: 12),
                                                  ),
                                                  const SizedBox(width: 4),
                                                  Expanded(
                                                    child: Text(
                                                      contact.name,
                                                      style: const TextStyle(
                                                        color: Colors.white,
                                                        fontWeight: FontWeight.bold,
                                                        fontSize: 14,
                                                      ),
                                                      maxLines: 1,
                                                      overflow: TextOverflow.ellipsis,
                                                    ),
                                                  ),
                                                ],
                                              ),
                                              if (contact.organization != null && contact.organization!.isNotEmpty) ...[
                                                const SizedBox(height: 2),
                                                Text(
                                                  contact.organization!,
                                                  style: const TextStyle(color: Colors.grey, fontSize: 11),
                                                  maxLines: 1,
                                                  overflow: TextOverflow.ellipsis,
                                                ),
                                              ],
                                              const SizedBox(height: 6),
                                              Text(
                                                contact.phone,
                                                style: TextStyle(
                                                  color: catColor,
                                                  fontWeight: FontWeight.w900,
                                                  fontSize: 14,
                                                  letterSpacing: 0.5,
                                                ),
                                              ),
                                            ],
                                          ),
                                        ),

                                        const SizedBox(width: 8),

                                        // Quick Dial Green Button
                                        ElevatedButton(
                                          onPressed: () => _makePhoneCall(contact.phone),
                                          style: ElevatedButton.styleFrom(
                                            backgroundColor: AppTheme.safeEmerald,
                                            shape: RoundedRectangleBorder(
                                              borderRadius: BorderRadius.circular(14),
                                            ),
                                            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                                            minimumSize: Size.zero,
                                          ),
                                          child: const Row(
                                            children: [
                                              Icon(Icons.call, color: Colors.white, size: 18),
                                              SizedBox(width: 6),
                                              Text(
                                                'DIAL',
                                                style: TextStyle(
                                                  color: Colors.white,
                                                  fontWeight: FontWeight.w900,
                                                  fontSize: 12,
                                                ),
                                              ),
                                            ],
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                              );
                            },
                          ),
          ),
        ],
      ),
    );
  }

  Widget _buildCategoryChip(String catKey, String label, String emoji) {
    final isSelected = _selectedCategory == catKey;
    return ChoiceChip(
      label: Text('$emoji $label'),
      selected: isSelected,
      onSelected: (selected) {
        if (selected) {
          setState(() => _selectedCategory = catKey);
        }
      },
      selectedColor: AppTheme.primaryCyan,
      backgroundColor: AppTheme.surfaceCard,
      labelStyle: TextStyle(
        color: isSelected ? Colors.white : Colors.grey,
        fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
        fontSize: 11,
      ),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(
          color: isSelected ? AppTheme.primaryCyan : Colors.white12,
        ),
      ),
    );
  }
}
