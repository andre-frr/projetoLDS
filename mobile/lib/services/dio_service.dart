import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:jwt_decoder/jwt_decoder.dart';
import 'package:logger/logger.dart';

import '../utils/constants.dart';
// Conditional import for platform-specific HTTP client configuration
import 'http_client_stub.dart' if (dart.library.io) 'http_client_io.dart';
import 'storage_service.dart';

class DioService {
  static final DioService _instance = DioService._internal();

  factory DioService() => _instance;

  DioService._internal();

  late Dio _dio;
  final _storage = StorageService();
  final _logger = Logger();
  bool _isRefreshing = false;

  Dio get dio => _dio;

  void initialize() {
    _dio = Dio(
      BaseOptions(
        baseUrl: ApiConstants.baseUrl,
        connectTimeout: const Duration(seconds: 30),
        receiveTimeout: const Duration(seconds: 30),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      ),
    );

    // Configure platform-specific HTTP client
    try {
      configureDioForPlatform(_dio);
      _logger.i('HTTP client configured for platform');
    } catch (e) {
      _logger.w('Could not configure HTTP client adapter: $e');
    }

    // Add interceptors
    _dio.interceptors.add(
      InterceptorsWrapper(onRequest: _onRequest, onError: _onError),
    );

    _logger.i('DioService initialized for ${kIsWeb ? "Web" : "Mobile"}');
  }

  Future<void> _onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) async {
    // Add access token to headers
    final accessToken = await _storage.read(ApiConstants.accessTokenKey);

    if (accessToken != null) {
      // Check if token is about to expire
      if (_shouldRefreshToken(accessToken)) {
        await _refreshToken();
        final newToken = await _storage.read(ApiConstants.accessTokenKey);
        if (newToken != null) {
          options.headers['Authorization'] = 'Bearer $newToken';
        }
      } else {
        options.headers['Authorization'] = 'Bearer $accessToken';
      }
    }

    _logger.d('Request: ${options.method} ${options.path}');
    handler.next(options);
  }

  Future<void> _onError(
    DioException error,
    ErrorInterceptorHandler handler,
  ) async {
    _logger.e('Error: ${error.response?.statusCode} ${error.message}');

    // Handle 401 Unauthorized - try to refresh token
    if (error.response?.statusCode == 401 && !_isRefreshing) {
      try {
        await _refreshToken();

        // Retry the original request
        final options = error.requestOptions;
        final accessToken = await _storage.read(ApiConstants.accessTokenKey);

        if (accessToken != null) {
          options.headers['Authorization'] = 'Bearer $accessToken';
          final response = await _dio.fetch(options);
          return handler.resolve(response);
        }
      } catch (e) {
        _logger.e('Token refresh failed: $e');
        // Clear tokens and force re-login
        await _storage.delete(ApiConstants.accessTokenKey);
        await _storage.delete(ApiConstants.refreshTokenKey);
      }
    }

    handler.next(error);
  }

  bool _shouldRefreshToken(String token) {
    try {
      if (JwtDecoder.isExpired(token)) return true;

      final expiryDate = JwtDecoder.getExpirationDate(token);
      final now = DateTime.now();
      final timeUntilExpiry = expiryDate.difference(now);

      return timeUntilExpiry < AppConstants.tokenRefreshBuffer;
    } catch (e) {
      _logger.e('Error checking token expiry: $e');
      return false;
    }
  }

  Future<void> _refreshToken() async {
    if (_isRefreshing) return;

    _isRefreshing = true;
    _logger.i('Refreshing token...');

    try {
      final refreshToken = await _storage.read(ApiConstants.refreshTokenKey);

      if (refreshToken == null) {
        throw Exception('No refresh token found');
      }

      final response = await _dio.post(
        ApiConstants.refresh,
        data: {'refreshToken': refreshToken},
        options: Options(headers: {'Authorization': 'Bearer $refreshToken'}),
      );

      if (response.statusCode == 200) {
        final newAccessToken = response.data['accessToken'];
        final newRefreshToken = response.data['refreshToken'];

        await _storage.write(ApiConstants.accessTokenKey, newAccessToken);
        if (newRefreshToken != null) {
          await _storage.write(ApiConstants.refreshTokenKey, newRefreshToken);
        }

        _logger.i('Token refreshed successfully');
      }
    } catch (e) {
      _logger.e('Token refresh failed: $e');
      rethrow;
    } finally {
      _isRefreshing = false;
    }
  }
}
