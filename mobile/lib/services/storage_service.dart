import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:logger/logger.dart';

class StorageService {
  static final StorageService _instance = StorageService._internal();
  factory StorageService() => _instance;
  StorageService._internal();

  final _storage = const FlutterSecureStorage();
  final _logger = Logger();

  // Write data
  Future<void> write(String key, String value) async {
    try {
      await _storage.write(key: key, value: value);
    } catch (e) {
      _logger.e('Error writing to storage: $e');
      rethrow;
    }
  }

  // Read data
  Future<String?> read(String key) async {
    try {
      return await _storage.read(key: key);
    } catch (e) {
      _logger.e('Error reading from storage: $e');
      return null;
    }
  }

  // Delete data
  Future<void> delete(String key) async {
    try {
      await _storage.delete(key: key);
    } catch (e) {
      _logger.e('Error deleting from storage: $e');
      rethrow;
    }
  }

  // Clear all data
  Future<void> deleteAll() async {
    try {
      await _storage.deleteAll();
    } catch (e) {
      _logger.e('Error clearing storage: $e');
      rethrow;
    }
  }

  // Check if key exists
  Future<bool> containsKey(String key) async {
    try {
      return await _storage.containsKey(key: key);
    } catch (e) {
      _logger.e('Error checking key in storage: $e');
      return false;
    }
  }
}
