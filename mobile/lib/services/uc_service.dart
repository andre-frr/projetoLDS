import 'package:dio/dio.dart';
import 'package:logger/logger.dart';

import '../models/uc_horas_model.dart';
import '../models/uc_model.dart';
import 'dio_service.dart';

class UCService {
  static final UCService _instance = UCService._internal();

  factory UCService() => _instance;

  UCService._internal();

  final _dio = DioService().dio;
  final _logger = Logger();

  // Get all UCs
  Future<List<UCModel>> getAll({bool incluirInativos = false}) async {
    try {
      final response = await _dio.get(
        '/uc',
        queryParameters: incluirInativos ? {'incluirInativos': 'true'} : null,
      );

      if (response.statusCode == 200) {
        final List<dynamic> data = response.data as List<dynamic>;
        return data.map((json) => UCModel.fromJson(json)).toList();
      }

      throw Exception('Failed to load UCs');
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
      }

      throw Exception('Failed to load UC');
    } on DioException catch (e) {
      _logger.e('Error loading UC: ${e.response?.data ?? e.message}');
      throw Exception(e.response?.data['message'] ?? 'Failed to load UC');
    }
  }

  // Create UC
  Future<UCModel> create(UCModel uc) async {
    try {
      final response = await _dio.post('/uc', data: uc.toJson());

      if (response.statusCode == 201) {
        return UCModel.fromJson(response.data);
      }

      throw Exception('Failed to create UC');
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
      }

      throw Exception('Failed to update UC');
    } on DioException catch (e) {
      _logger.e('Error updating UC: ${e.response?.data ?? e.message}');
      throw Exception(e.response?.data['message'] ?? 'Failed to update UC');
    }
  }

  // Reactivate UC
  Future<void> reactivate(int id) async {
    try {
      await _dio.put('/uc/$id/reativar');
      _logger.i('UC reactivated successfully: $id');
    } on DioException catch (e) {
      _logger.e('Failed to reactivate UC: ${e.message}');
      throw Exception('Erro ao reativar UC');
    }
  }

  // Get UC hours
  Future<List<UCHorasModel>> getHoras(int ucId) async {
    try {
      final response = await _dio.get('/uc/$ucId/horas');
      _logger.i('UC hours fetched successfully for UC: $ucId');

      final List<dynamic> data = response.data as List<dynamic>;
      return data
          .map((json) => UCHorasModel.fromJson(json as Map<String, dynamic>))
          .toList();
    } on DioException catch (e) {
      // 404 means no hours saved yet - this is normal, return empty list
      if (e.response?.statusCode == 404) {
        _logger.i('No hours found for UC: $ucId (404)');
        return [];
      }
      _logger.e('Failed to fetch UC hours: ${e.message}');
      throw Exception('Erro ao carregar horas da UC');
    }
  }

  // Update UC hours
  Future<void> updateHoras(int ucId, String tipo, int horas) async {
    try {
      await _dio.post('/uc/$ucId/horas', data: {'tipo': tipo, 'horas': horas});
      _logger.i('UC hours updated successfully for UC: $ucId, tipo: $tipo');
    } on DioException catch (e) {
      _logger.e('Failed to update UC hours: ${e.message}');
      throw Exception('Erro ao atualizar horas da UC');
    }
  }

  // Deactivate UC
  Future<void> deactivate(int id) async {
    try {
      final response = await _dio.delete('/uc/$id/inativar');

      if (response.statusCode != 200) {
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
