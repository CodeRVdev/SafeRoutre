import 'package:flutter_test/flutter_test.dart';
import 'package:saferoute_mobile/main.dart';

void main() {
  testWidgets('SafeRoute mobile app smoke test', (WidgetTester tester) async {
    await tester.pumpWidget(const SafeRouteMobileApp());
    expect(find.byType(SafeRouteMobileApp), findsOneWidget);
  });
}
