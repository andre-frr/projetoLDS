import 'package:dio/dio.dart';
import 'package:logger/logger.dart';

import '../models/area_cientifica_model.dart';
import '../utils/constants.dart';

class AreaCientificaService {
  final Dio _dio;
  final Logger _logger = Logger();
  final String _basePath = '${ApiConstants.baseUrl}/area_cientifica';

  AreaCientificaService(this._dio);

  // Get all areas
  Future<List<AreaCientificaModel>> getAll({bool incluirInativos = false}) async {
    try {
      final response = await _dio.get(
        _basePath,
        queryParameters: incluirInativos ? {'incluirInativos': 'true'} : null,
      );

      if (response.statusCode == 200) {
        final List<dynamic> data = response.data as List<dynamic>;
        return data.map((json) => AreaCientificaModel.fromJson(json)).toList();
      }

      throw Exception('Failed to load areas científicas');
    } on DioException catch (e) {
      _logger.e('Error loading areas: ${e.response?.data ?? e.message}');
      throw Exception(
        e.response?.data['message'] ?? 'Failed to load areas científicas',
      );
    }
  }

  // Get area by ID
  Future<AreaCientificaModel> getById(int id) async {
    try {
      final response = await _dio.get('$_basePath/$id');

      if (response.statusCode == 200) {
        return AreaCientificaModel.fromJson(response.data);
      }

      throw Exception('Failed to load área científica');
    } on DioException catch (e) {
      _logger.e('Error loading area: ${e.response?.data ?? e.message}');
      throw Exception(
        e.response?.data['message'] ?? 'Failed to load área científica',
      );
    }
  }

  // Create area
  Future<AreaCientificaModel> create(AreaCientificaModel area) async {
    try {
      final response = await _dio.post(
        _basePath,
        data: {
          'nome': area.nome,
          'sigla': area.sigla,
          'id_dep': area.idDep,
        },
      );

      if (response.statusCode == 201) {
        return AreaCientificaModel.fromJson(response.data);
      }

      throw Exception('Failed to create área científica');
    } on DioException catch (e) {
      _logger.e('Error creating area: ${e.response?.data ?? e.message}');
      throw Exception(
        e.response?.data['message'] ?? 'Failed to create área científica',
      );
    }
  }

  // Update area
  Future<AreaCientificaModel> update(int id, AreaCientificaModel area) async {
    try {
      final response = await _dio.put(
        '$_basePath/$id',
        data: {
          'nome': area.nome,
          'sigla': area.sigla,
          'id_dep': area.idDep,
          'ativo': area.ativo,
        },
      );

      if (response.statusCode == 200) {
        return AreaCientificaModel.fromJson(response.data);
      }

      throw Exception('Failed to update área científica');
    } on DioException catch (e) {
      _logger.e('Error updating area: ${e.response?.data ?? e.message}');
      throw Exception(
        e.response?.data['message'] ?? 'Failed to update área científica',
      );
    }
  }

  // Deactivate area
  Future<void> deactivate(int id) async {
    try {
      final response = await _dio.delete('$_basePath/$id/inativar');

      if (response.statusCode != 200) {
        throw Exception('Failed to deactivate área científica');
      }
    } on DioException catch (e) {
      _logger.e(
        'Error deactivating area: ${e.response?.data ?? e.message}',
      );
      throw Exception(
        e.response?.data['message'] ?? 'Failed to deactivate área científica',
      );
    }
  }

  // Delete area
  Future<void> delete(int id) async {
    try {
      final response = await _dio.delete('$_basePath/$id');

      if (response.statusCode != 204 && response.statusCode != 200) {
        throw Exception('Failed to delete área científica');
      }
    } on DioException catch (e) {
      _logger.e('Error deleting area: ${e.response?.data ?? e.message}');
      throw Exception(
        e.response?.data['message'] ?? 'Failed to delete área científica',
      );
    }
  }
}
