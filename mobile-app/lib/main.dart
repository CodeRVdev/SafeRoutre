import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'services/auth_service.dart';
import 'services/audio_siren_service.dart';
import 'services/socket_service.dart';
import 'services/location_service.dart';
import 'services/fcm_service.dart';
import 'services/language_provider.dart';
import 'theme/app_theme.dart';
import 'screens/login_screen.dart';
import 'screens/home_screen.dart';

import 'package:flutter/foundation.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  if (!kIsWeb) {
    try {
      FirebaseMessaging.onBackgroundMessage(firebaseMessagingBackgroundHandler);
    } catch (e) {
      debugPrint('⚠️ Native FCM background messaging not initialized: $e');
    }
  }
  runApp(const SafeRouteMobileApp());
}

class SafeRouteMobileApp extends StatelessWidget {
  const SafeRouteMobileApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthService()),
        ChangeNotifierProvider(create: (_) => AudioSirenService()),
        ChangeNotifierProvider(create: (_) => SocketService()),
        ChangeNotifierProvider(create: (_) => LocationService()),
        ChangeNotifierProvider(create: (_) => LanguageProvider()),
      ],
      child: Consumer2<AuthService, LanguageProvider>(
        builder: (context, auth, languageProvider, _) {
          if (auth.isAuthenticated && auth.token != null) {
            FcmService().initialize(
              context: context,
              userToken: auth.token!,
              apiBaseUrl: auth.apiBaseUrl,
            );
          }

          return MaterialApp(
            navigatorKey: FcmService.navigatorKey,
            title: 'SafeRoute Mobile',
            debugShowCheckedModeBanner: false,
            theme: AppTheme.darkTheme,
            locale: languageProvider.locale,
            localizationsDelegates: const [
              AppLocalizations.delegate,
              GlobalMaterialLocalizations.delegate,
              GlobalWidgetsLocalizations.delegate,
              GlobalCupertinoLocalizations.delegate,
            ],
            supportedLocales: const [
              Locale('en'),
              Locale('fil'),
            ],
            home: auth.isInitializing
                ? const Scaffold(
                    body: Center(
                      child: CircularProgressIndicator(),
                    ),
                  )
                : (auth.isAuthenticated
                    ? const HomeScreen()
                    : const LoginScreen()),
          );
        },
      ),
    );
  }
}
