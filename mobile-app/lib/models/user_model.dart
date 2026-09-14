class UserModel {
  final int userId;
  final String fullName;
  final String email;
  final String role; // 'student' | 'faculty' | 'staff'
  final String? idNumber;
  final String? department;
  final String? createdAt;

  UserModel({
    required this.userId,
    required this.fullName,
    required this.email,
    required this.role,
    this.idNumber,
    this.department,
    this.createdAt,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      userId: json['user_id'] is int ? json['user_id'] : int.parse(json['user_id'].toString()),
      fullName: json['full_name'] ?? '',
      email: json['email'] ?? '',
      role: json['role'] ?? 'student',
      idNumber: json['id_number'],
      department: json['department'],
      createdAt: json['created_at'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'user_id': userId,
      'full_name': fullName,
      'email': email,
      'role': role,
      'id_number': idNumber,
      'department': department,
      'created_at': createdAt,
    };
  }

  bool get isStudentOrStaff =>
      role == 'student' || role == 'faculty' || role == 'staff';
}
