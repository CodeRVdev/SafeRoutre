import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/auth_service.dart';
import '../theme/app_theme.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _fullNameController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _idNumberController = TextEditingController();
  final _departmentController = TextEditingController();
  
  String _selectedRole = 'student';
  final _formKey = GlobalKey<FormState>();
  String? _errorMessage;

  @override
  void dispose() {
    _fullNameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _idNumberController.dispose();
    _departmentController.dispose();
    super.dispose();
  }

  Future<void> _handleRegister() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _errorMessage = null);

    try {
      final auth = Provider.of<AuthService>(context, listen: false);
      await auth.register(
        fullName: _fullNameController.text.trim(),
        email: _emailController.text.trim(),
        password: _passwordController.text,
        role: _selectedRole,
        idNumber: _idNumberController.text.trim().isNotEmpty
            ? _idNumberController.text.trim()
            : null,
        department: _departmentController.text.trim().isNotEmpty
            ? _departmentController.text.trim()
            : null,
      );
      if (mounted) Navigator.pop(context);
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = e.toString().replaceAll('ApiException', '').replaceAll(RegExp(r'\(\d+\):'), '').trim();
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthService>(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Create Mobile Account'),
      ),
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24.0),
            child: Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const Text(
                    'Campus Safety Registration',
                    style: TextStyle(
                      fontSize: 22,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                  const SizedBox(height: 4),
                  const Text(
                    'Polonoling National High School Mobile App (Students, Faculty & Staff Only)',
                    style: TextStyle(fontSize: 12, color: Colors.grey),
                  ),
                  const SizedBox(height: 24),

                  if (_errorMessage != null) ...[
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: AppTheme.emergencyRose.withOpacity(0.15),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                            color: AppTheme.emergencyRose.withOpacity(0.4)),
                      ),
                      child: Text(
                        _errorMessage!,
                        style: const TextStyle(
                            color: AppTheme.emergencyRose, fontSize: 12),
                      ),
                    ),
                    const SizedBox(height: 16),
                  ],

                  // Full Name
                  TextFormField(
                    controller: _fullNameController,
                    decoration: const InputDecoration(
                      labelText: 'Full Name',
                      prefixIcon: Icon(Icons.person_outline, size: 20),
                    ),
                    validator: (val) =>
                        val == null || val.isEmpty ? 'Required' : null,
                  ),
                  const SizedBox(height: 14),

                  // Email
                  TextFormField(
                    controller: _emailController,
                    keyboardType: TextInputType.emailAddress,
                    decoration: const InputDecoration(
                      labelText: 'Email Address',
                      prefixIcon: Icon(Icons.email_outlined, size: 20),
                    ),
                    validator: (val) =>
                        val == null || val.isEmpty ? 'Required' : null,
                  ),
                  const SizedBox(height: 14),

                  // Password
                  TextFormField(
                    controller: _passwordController,
                    obscureText: true,
                    decoration: const InputDecoration(
                      labelText: 'Password',
                      prefixIcon: Icon(Icons.lock_outline, size: 20),
                    ),
                    validator: (val) =>
                        val == null || val.length < 6 ? 'Min 6 characters' : null,
                  ),
                  const SizedBox(height: 14),

                  // Role Selection Dropdown (Strictly Student, Faculty, Staff)
                  DropdownButtonFormField<String>(
                    value: _selectedRole,
                    decoration: const InputDecoration(
                      labelText: 'Campus Designation Role',
                      prefixIcon: Icon(Icons.badge_outlined, size: 20),
                    ),
                    items: const [
                      DropdownMenuItem(
                        value: 'student',
                        child: Text('Student'),
                      ),
                      DropdownMenuItem(
                        value: 'faculty',
                        child: Text('Faculty Teacher'),
                      ),
                      DropdownMenuItem(
                        value: 'staff',
                        child: Text('Staff Member'),
                      ),
                    ],
                    onChanged: (val) {
                      if (val != null) setState(() => _selectedRole = val);
                    },
                  ),
                  const SizedBox(height: 14),

                  // ID Number (Optional)
                  TextFormField(
                    controller: _idNumberController,
                    decoration: const InputDecoration(
                      labelText: 'ID / LRN Number (Optional)',
                      prefixIcon: Icon(Icons.numbers_outlined, size: 20),
                    ),
                  ),
                  const SizedBox(height: 14),

                  // Department (Optional)
                  TextFormField(
                    controller: _departmentController,
                    decoration: const InputDecoration(
                      labelText: 'Grade Level / Department (Optional)',
                      prefixIcon: Icon(Icons.school_outlined, size: 20),
                    ),
                  ),
                  const SizedBox(height: 24),

                  // Submit Register Button
                  ElevatedButton(
                    onPressed: auth.isLoading ? null : _handleRegister,
                    child: auth.isLoading
                        ? const SizedBox(
                            height: 20,
                            width: 20,
                            child: CircularProgressIndicator(
                                strokeWidth: 2, color: Colors.white),
                          )
                        : const Text('Complete Registration'),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
