import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class LanguageProvider extends ChangeNotifier {
  static const String _storageKey = 'app_locale';
  final FlutterSecureStorage _storage = const FlutterSecureStorage();

  Locale _locale = const Locale('en');

  Locale get locale => _locale;
  bool get isFilipino => _locale.languageCode == 'fil';

  LanguageProvider() {
    _loadSavedLocale();
  }

  Future<void> _loadSavedLocale() async {
    try {
      final savedCode = await _storage.read(key: _storageKey);
      if (savedCode != null && (savedCode == 'en' || savedCode == 'fil')) {
        _locale = Locale(savedCode);
        notifyListeners();
      }
    } catch (e) {
      debugPrint('Error loading saved locale: $e');
    }
  }

  Future<void> toggleLanguage() async {
    if (_locale.languageCode == 'en') {
      _locale = const Locale('fil');
    } else {
      _locale = const Locale('en');
    }

    try {
      await _storage.write(key: _storageKey, value: _locale.languageCode);
    } catch (e) {
      debugPrint('Error saving locale preference: $e');
    }

    notifyListeners();
  }

  Future<void> setLocale(String languageCode) async {
    if (languageCode == _locale.languageCode) return;

    _locale = Locale(languageCode);
    try {
      await _storage.write(key: _storageKey, value: languageCode);
    } catch (e) {
      debugPrint('Error saving locale preference: $e');
    }

    notifyListeners();
  }
}
