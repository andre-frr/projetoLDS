import 'package:dio/dio.dart';
import 'package:logger/logger.dart';

import '../models/curso_model.dart';
import '../utils/constants.dart';

class CursoService {
  final Dio _dio;
  final Logger _logger = Logger();
  final String _basePath = '${ApiConstants.baseUrl}/curso';

  CursoService(this._dio);

  // Get all cursos
  Future<List<CursoModel>> getAll({bool incluirInativos = false}) async {
    try {
      final response = await _dio.get(
        _basePath,
        queryParameters: incluirInativos ? {'incluirInativos': 'true'} : null,
      );

      if (response.statusCode == 200) {
        final List<dynamic> data = response.data as List<dynamic>;
        return data.map((json) => CursoModel.fromJson(json)).toList();
      }

      throw Exception('Failed to load cursos');
    } on DioException catch (e) {
      _logger.e('Error loading cursos: ${e.response?.data ?? e.message}');
      throw Exception(e.response?.data['message'] ?? 'Failed to load cursos');
    }
  }

  // Get curso by ID
  Future<CursoModel> getById(int id) async {
    try {
      final response = await _dio.get('$_basePath/$id');

      if (response.statusCode == 200) {
        return CursoModel.fromJson(response.data);
      }

      throw Exception('Failed to load curso');
    } on DioException catch (e) {
      _logger.e('Error loading curso: ${e.response?.data ?? e.message}');
      throw Exception(e.response?.data['message'] ?? 'Failed to load curso');
    }
  }

  // Create curso
  Future<CursoModel> create(CursoModel curso) async {
    try {
      final response = await _dio.post(
        _basePath,
        data: {'nome': curso.nome, 'sigla': curso.sigla, 'tipo': curso.tipo},
      );

      if (response.statusCode == 201) {
        return CursoModel.fromJson(response.data);
      }

      throw Exception('Failed to create curso');
    } on DioException catch (e) {
      _logger.e('Error creating curso: ${e.response?.data ?? e.message}');
      throw Exception(e.response?.data['message'] ?? 'Failed to create curso');
    }
  }

  // Update curso
  Future<CursoModel> update(int id, CursoModel curso) async {
    try {
      final response = await _dio.put(
        '$_basePath/$id',
        data: {
          'nome': curso.nome,
          'sigla': curso.sigla,
          'tipo': curso.tipo,
          'ativo': curso.ativo,
        },
      );

      if (response.statusCode == 200) {
        return CursoModel.fromJson(response.data);
      }

      throw Exception('Failed to update curso');
    } on DioException catch (e) {
      _logger.e('Error updating curso: ${e.response?.data ?? e.message}');
      throw Exception(e.response?.data['message'] ?? 'Failed to update curso');
    }
  }

  // Deactivate curso
  Future<void> deactivate(int id) async {
    try {
      final response = await _dio.delete('$_basePath/$id/inativar');

      if (response.statusCode != 200) {
        throw Exception('Failed to deactivate curso');
      }
    } on DioException catch (e) {
      _logger.e('Error deactivating curso: ${e.response?.data ?? e.message}');
      throw Exception(
        e.response?.data['message'] ?? 'Failed to deactivate curso',
      );
    }
  }

  // Delete curso
  Future<void> delete(int id) async {
    try {
      final response = await _dio.delete('$_basePath/$id');

      if (response.statusCode != 204 && response.statusCode != 200) {
        throw Exception('Failed to delete curso');
      }
    } on DioException catch (e) {
      _logger.e('Error deleting curso: ${e.response?.data ?? e.message}');
      throw Exception(e.response?.data['message'] ?? 'Failed to delete curso');
    }
  }
}
