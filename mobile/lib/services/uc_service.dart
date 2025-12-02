import 'package:dio/dio.dart';
import 'package:logger/logger.dart';

import '../models/uc_model.dart';
import 'dio_service.dart';

class UCService {
  static final UCService _instance = UCService._internal();

  factory UCService() => _instance;

  UCService._internal();

  final _dio = DioService().dio;
  final _logger = Logger();

  // Get all UCs
  Future<List<UCModel>> getAll({bool incluirInativos = true}) async {
    try {
      final response = await _dio.get(
        '/uc',
        queryParameters: {'incluirInativos': incluirInativos},
      );

      if (response.statusCode == 200) {
        final List<dynamic> data = response.data;
        return data.map((json) => UCModel.fromJson(json)).toList();
      } else {
        throw Exception('Failed to load UCs');
      }
    } on DioException catch (e) {
      _logger.e('Error loading UCs: ${e.response?.data ?? e.message}');
      throw Exception(e.response?.data['message'] ?? 'Failed to load UCs');
    }
  }

  // Get UC by ID
  Future<UCModel> getById(int id) async {
    try {
      final response = await _dio.get('/uc/$id');

      if (response.statusCode == 200) {
        return UCModel.fromJson(response.data);
      } else {
        throw Exception('UC not found');
      }
    } on DioException catch (e) {
      _logger.e('Error loading UC: ${e.response?.data ?? e.message}');
      throw Exception(e.response?.data['message'] ?? 'UC not found');
    }
  }

  // Create UC
  Future<UCModel> create(UCModel uc) async {
    try {
      final response = await _dio.post('/uc', data: uc.toJson());

      if (response.statusCode == 201) {
        return UCModel.fromJson(response.data['uc']);
      } else {
        throw Exception('Failed to create UC');
      }
    } on DioException catch (e) {
      _logger.e('Error creating UC: ${e.response?.data ?? e.message}');
      throw Exception(e.response?.data['message'] ?? 'Failed to create UC');
    }
  }

  // Update UC
  Future<UCModel> update(int id, UCModel uc) async {
    try {
      final response = await _dio.put('/uc/$id', data: uc.toJson());

      if (response.statusCode == 200) {
        return UCModel.fromJson(response.data);
      } else {
        throw Exception('Failed to update UC');
      }
    } on DioException catch (e) {
      _logger.e('Error updating UC: ${e.response?.data ?? e.message}');
      throw Exception(e.response?.data['message'] ?? 'Failed to update UC');
    }
  }

  // Deactivate UC
  Future<UCModel> deactivate(int id) async {
    try {
      final response = await _dio.delete('/uc/$id/inativar');

      if (response.statusCode == 200) {
        return UCModel.fromJson(response.data);
      } else {
        throw Exception('Failed to deactivate UC');
      }
    } on DioException catch (e) {
      _logger.e('Error deactivating UC: ${e.response?.data ?? e.message}');
      throw Exception(e.response?.data['message'] ?? 'Failed to deactivate UC');
    }
  }

  // Delete UC
  Future<void> delete(int id) async {
    try {
      final response = await _dio.delete('/uc/$id');

      if (response.statusCode != 204 && response.statusCode != 200) {
        throw Exception('Failed to delete UC');
      }
    } on DioException catch (e) {
      _logger.e('Error deleting UC: ${e.response?.data ?? e.message}');
      throw Exception(e.response?.data['message'] ?? 'Failed to delete UC');
    }
  }
}
