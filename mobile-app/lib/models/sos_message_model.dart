class SosMessageModel {
  final int messageId;
  final int alertId;
  final int senderId;
  final String senderName;
  final String senderRole;
  final String? senderDepartment;
  final int? receiverId;
  final String? receiverName;
  final String content;
  final bool isRead;
  final String priority;
  final String createdAt;
  final double? latitude;
  final double? longitude;

  SosMessageModel({
    required this.messageId,
    required this.alertId,
    required this.senderId,
    required this.senderName,
    required this.senderRole,
    this.senderDepartment,
    this.receiverId,
    this.receiverName,
    required this.content,
    required this.isRead,
    required this.priority,
    required this.createdAt,
    this.latitude,
    this.longitude,
  });

  factory SosMessageModel.fromJson(Map<String, dynamic> json) {
    double? lat;
    double? lng;

    if (json['location_geojson'] != null &&
        json['location_geojson']['coordinates'] != null &&
        json['location_geojson']['coordinates'] is List &&
        (json['location_geojson']['coordinates'] as List).length >= 2) {
      lng = double.parse((json['location_geojson']['coordinates'][0]).toString());
      lat = double.parse((json['location_geojson']['coordinates'][1]).toString());
    }

    return SosMessageModel(
      messageId: json['message_id'] is int ? json['message_id'] : int.parse(json['message_id'].toString()),
      alertId: json['alert_id'] is int ? json['alert_id'] : int.parse(json['alert_id'].toString()),
      senderId: json['sender_id'] is int ? json['sender_id'] : int.parse(json['sender_id'].toString()),
      senderName: json['sender_name'] ?? 'Anonymous User',
      senderRole: json['sender_role'] ?? 'student',
      senderDepartment: json['sender_department'],
      receiverId: json['receiver_id'] != null ? (json['receiver_id'] is int ? json['receiver_id'] : int.parse(json['receiver_id'].toString())) : null,
      receiverName: json['receiver_name'],
      content: json['content'] ?? '',
      isRead: json['is_read'] ?? false,
      priority: json['priority'] ?? 'normal',
      createdAt: json['created_at'] ?? DateTime.now().toIso8601String(),
      latitude: lat,
      longitude: lng,
    );
  }
}
