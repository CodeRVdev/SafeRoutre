class AlertModel {
  final int alertId;
  final int? hazardId;
  final String title;
  final String message;
  final int sentBy;
  final String sentAt;
  final bool isActive;
  final bool isDrill;

  AlertModel({
    required this.alertId,
    this.hazardId,
    required this.title,
    required this.message,
    required this.sentBy,
    required this.sentAt,
    required this.isActive,
    this.isDrill = false,
  });

  factory AlertModel.fromJson(Map<String, dynamic> json) {
    return AlertModel(
      alertId: json['alert_id'] is int ? json['alert_id'] : int.parse(json['alert_id'].toString()),
      hazardId: json['hazard_id'] != null ? (json['hazard_id'] is int ? json['hazard_id'] : int.parse(json['hazard_id'].toString())) : null,
      title: json['title'] ?? 'EMERGENCY EVACUATION ALERT',
      message: json['message'] ?? 'Please move immediately to a safe assembly zone.',
      sentBy: json['sent_by'] is int ? json['sent_by'] : (json['sent_by'] != null ? int.parse(json['sent_by'].toString()) : 0),
      sentAt: json['sent_at'] ?? DateTime.now().toIso8601String(),
      isActive: json['is_active'] ?? true,
      isDrill: json['is_drill'] == true || json['is_drill'] == 'true',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'alert_id': alertId,
      'hazard_id': hazardId,
      'title': title,
      'message': message,
      'sent_by': sentBy,
      'sent_at': sentAt,
      'is_active': isActive,
      'is_drill': isDrill,
    };
  }
}
