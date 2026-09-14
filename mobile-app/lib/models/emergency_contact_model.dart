class EmergencyContactModel {
  final int contactId;
  final String name;
  final String? organization;
  final String phone;
  final String category; // 'fire' | 'medical' | 'police' | 'disaster' | 'school'
  final bool isActive;
  final int sortOrder;

  EmergencyContactModel({
    required this.contactId,
    required this.name,
    this.organization,
    required this.phone,
    required this.category,
    this.isActive = true,
    this.sortOrder = 0,
  });

  factory EmergencyContactModel.fromJson(Map<String, dynamic> json) {
    return EmergencyContactModel(
      contactId: json['contact_id'] is int ? json['contact_id'] : int.parse(json['contact_id'].toString()),
      name: json['name'] ?? '',
      organization: json['organization'],
      phone: json['phone'] ?? '',
      category: json['category'] ?? 'disaster',
      isActive: json['is_active'] ?? true,
      sortOrder: json['sort_order'] is int ? json['sort_order'] : (int.tryParse(json['sort_order']?.toString() ?? '0') ?? 0),
    );
  }
}
