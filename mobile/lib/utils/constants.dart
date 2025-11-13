import 'package:flutter_dotenv/flutter_dotenv.dart';

class ApiConstants {
  static String get baseUrl =>
      dotenv.env['API_BASE_URL'] ?? 'https://localhost:3000/api';
  static String get graphqlUrl =>
      dotenv.env['GRAPHQL_URL'] ?? 'https://localhost:3000/graphql';

  // API Endpoints
  static const String login = '/auth/login';
  static const String register = '/auth/register';
  static const String refresh = '/auth/refresh';
  static const String logout = '/auth/logout';
  static const String logoutAll = '/auth/logout-all';

  // Storage Keys
  static const String accessTokenKey = 'access_token';
  static const String refreshTokenKey = 'refresh_token';
  static const String userDataKey = 'user_data';
}

class AppConstants {
  static const String appName = 'LDS Project';
  static const Duration tokenRefreshBuffer = Duration(minutes: 5);
}
