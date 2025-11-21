import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:logger/logger.dart';

class StorageService {
  static final StorageService _instance = StorageService._internal();

  factory StorageService() => _instance;

  StorageService._internal();

  // Configure storage options based on platform
  final _storage = FlutterSecureStorage(
    webOptions: WebOptions(
      dbName: 'lds_project_storage',
      publicKey: 'lds_project_public_key',
    ),
  );
  final _logger = Logger();

  // Write data
  Future<void> write(String key, String value) async {
    try {
      await _storage.write(key: key, value: value);
      _logger.d('Storage write: $key');
    } catch (e) {
      _logger.e('Error writing to storage: $e');
      rethrow;
    }
  }

  // Read data
  Future<String?> read(String key) async {
    try {
      final value = await _storage.read(key: key);
      _logger.d('Storage read: $key = ${value != null ? "***" : "null"}');
      return value;
    } catch (e) {
      _logger.e('Error reading from storage: $e');
      return null;
    }
  }

  // Delete data
  Future<void> delete(String key) async {
    try {
      await _storage.delete(key: key);
      _logger.d('Storage delete: $key');
    } catch (e) {
      _logger.e('Error deleting from storage: $e');
      rethrow;
    }
  }

  // Clear all data
  Future<void> deleteAll() async {
    try {
      await _storage.deleteAll();
      _logger.d('Storage cleared');
    } catch (e) {
      _logger.e('Error clearing storage: $e');
      rethrow;
    }
  }

  // Check if key exists
  Future<bool> containsKey(String key) async {
    try {
      final exists = await _storage.containsKey(key: key);
      _logger.d('Storage contains $key: $exists');
      return exists;
    } catch (e) {
      _logger.e('Error checking key in storage: $e');
      return false;
    }
  }
}
