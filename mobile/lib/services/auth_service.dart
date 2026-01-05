import 'dart:convert';

import 'package:dio/dio.dart';
import 'package:logger/logger.dart';

import '../models/user_model.dart';
import '../utils/constants.dart';
import 'dio_service.dart';
import 'storage_service.dart';

class AuthService {
  static final AuthService _instance = AuthService._internal();

  factory AuthService() => _instance;

  AuthService._internal();

  final _dio = DioService().dio;
  final _storage = StorageService();
  final _logger = Logger();

  // Login
  Future<UserModel> login(String email, String password) async {
    try {
      final response = await _dio.post(
        ApiConstants.login,
        data: {'email': email, 'password': password},
      );

      if (response.statusCode == 200) {
        final data = response.data;

        // Store tokens (backend returns accessToken and refreshToken)
        await _storage.write(ApiConstants.accessTokenKey, data['accessToken']);
        await _storage.write(
          ApiConstants.refreshTokenKey,
          data['refreshToken'],
        );

        // Parse user from response (backend now returns user object)
        final userData = data['user'];
        final user = UserModel(
          id: userData['id'],
          email: userData['email'],
          username: userData['email'].split('@')[0],
          // Extract username from email
          role: userData['role'],
        );

        await _storage.write(
          ApiConstants.userDataKey,
          jsonEncode(user.toJson()),
        );

        _logger.i('Login successful');
        return user;
      } else {
        throw Exception('Login failed');
      }
    } on DioException catch (e) {
      _logger.e('Login error: ${e.response?.data ?? e.message}');
      throw Exception(e.response?.data['message'] ?? 'Login failed');
    }
  }

  // Register
  Future<UserModel> register(String email, String password, String role) async {
    try {
      final response = await _dio.post(
        ApiConstants.register,
        data: {'email': email, 'password': password, 'role': role},
      );

      if (response.statusCode == 201) {
        final data = response.data;

        // Store tokens (backend returns accessToken and refreshToken)
        await _storage.write(ApiConstants.accessTokenKey, data['accessToken']);
        await _storage.write(
          ApiConstants.refreshTokenKey,
          data['refreshToken'],
        );

        // Parse user from response (backend returns user object)
        final userData = data['user'];
        final user = UserModel(
          id: userData['id'],
          email: userData['email'],
          username: userData['email'].split('@')[0],
          // Extract username from email
          role: userData['role'],
        );

        await _storage.write(
          ApiConstants.userDataKey,
          jsonEncode(user.toJson()),
        );

        _logger.i('Registration successful');
        return user;
      } else {
        throw Exception('Registration failed');
      }
    } on DioException catch (e) {
      _logger.e('Registration error: ${e.response?.data ?? e.message}');
      throw Exception(e.response?.data['message'] ?? 'Registration failed');
    }
  }

  // Logout
  Future<void> logout() async {
    try {
      await _dio.post(ApiConstants.logout);
      await _clearLocalData();
      _logger.i('Logout successful');
    } catch (e) {
      _logger.e('Logout error: $e');
      // Clear local data even if API call fails
      await _clearLocalData();
    }
  }

  // Logout from all devices
  Future<void> logoutAll() async {
    try {
      await _dio.post(ApiConstants.logoutAll);
      await _clearLocalData();
      _logger.i('Logout all successful');
    } catch (e) {
      _logger.e('Logout all error: $e');
      // Clear local data even if API call fails
      await _clearLocalData();
    }
  }

  // Check if user is logged in
  Future<bool> isLoggedIn() async {
    final accessToken = await _storage.read(ApiConstants.accessTokenKey);
    return accessToken != null;
  }

  // Get current user
  Future<UserModel?> getCurrentUser() async {
    try {
      final userDataJson = await _storage.read(ApiConstants.userDataKey);
      if (userDataJson != null) {
        return UserModel.fromJson(jsonDecode(userDataJson));
      }
      return null;
    } catch (e) {
      _logger.e('Error getting current user: $e');
      return null;
    }
  }

  // Clear local data
  Future<void> _clearLocalData() async {
    await _storage.delete(ApiConstants.accessTokenKey);
    await _storage.delete(ApiConstants.refreshTokenKey);
    await _storage.delete(ApiConstants.userDataKey);
  }
}
