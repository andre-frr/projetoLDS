import 'package:dio/dio.dart';
import 'package:logger/logger.dart';

import '../models/docente_model.dart';
import '../utils/constants.dart';

class DocenteService {
  final Dio _dio;
  final Logger _logger = Logger();
  final String _basePath = '${ApiConstants.baseUrl}/docente';

  DocenteService(this._dio);

  // Get all docentes
  Future<List<DocenteModel>> getAll({bool incluirInativos = false}) async {
    try {
      final response = await _dio.get(
        _basePath,
        queryParameters: incluirInativos ? {'incluirInativos': 'true'} : null,
      );

      if (response.statusCode == 200) {
        final List<dynamic> data = response.data as List<dynamic>;
        return data.map((json) => DocenteModel.fromJson(json)).toList();
      }

      throw Exception('Failed to load docentes');
    } on DioException catch (e) {
      _logger.e('Error loading docentes: ${e.response?.data ?? e.message}');
      throw Exception(
        e.response?.data['message'] ?? 'Failed to load docentes',
      );
    }
  }

  // Get docente by ID
  Future<DocenteModel> getById(int id) async {
    try {
      final response = await _dio.get('$_basePath/$id');

      if (response.statusCode == 200) {
        return DocenteModel.fromJson(response.data);
      }

      throw Exception('Failed to load docente');
    } on DioException catch (e) {
      _logger.e('Error loading docente: ${e.response?.data ?? e.message}');
      throw Exception(
        e.response?.data['message'] ?? 'Failed to load docente',
      );
    }
  }

  // Create docente
  Future<DocenteModel> create(DocenteModel docente) async {
    try {
      final response = await _dio.post(
        _basePath,
        data: {
          'nome': docente.nome,
          'email': docente.email,
          'id_area': docente.idArea,
          'convidado': docente.convidado,
        },
      );

      if (response.statusCode == 201) {
        return DocenteModel.fromJson(response.data);
      }

      throw Exception('Failed to create docente');
    } on DioException catch (e) {
      _logger.e('Error creating docente: ${e.response?.data ?? e.message}');
      throw Exception(
        e.response?.data['message'] ?? 'Failed to create docente',
      );
    }
  }

  // Update docente
  Future<DocenteModel> update(int id, DocenteModel docente) async {
    try {
      final response = await _dio.put(
        '$_basePath/$id',
        data: {
          'nome': docente.nome,
          'email': docente.email,
          'id_area': docente.idArea,
          'convidado': docente.convidado,
        },
      );

      if (response.statusCode == 200) {
        return DocenteModel.fromJson(response.data);
      }

      throw Exception('Failed to update docente');
    } on DioException catch (e) {
      _logger.e('Error updating docente: ${e.response?.data ?? e.message}');
      throw Exception(
        e.response?.data['message'] ?? 'Failed to update docente',
      );
    }
  }

  // Deactivate docente
  Future<void> deactivate(int id) async {
    try {
      final response = await _dio.delete('$_basePath/$id/inativar');

      if (response.statusCode != 200) {
        throw Exception('Failed to deactivate docente');
      }
    } on DioException catch (e) {
      _logger.e(
        'Error deactivating docente: ${e.response?.data ?? e.message}',
      );
      throw Exception(
        e.response?.data['message'] ?? 'Failed to deactivate docente',
      );
    }
  }

  // Delete docente
  Future<void> delete(int id) async {
    try {
      final response = await _dio.delete('$_basePath/$id');

      if (response.statusCode != 204 && response.statusCode != 200) {
        throw Exception('Failed to delete docente');
      }
    } on DioException catch (e) {
      _logger.e('Error deleting docente: ${e.response?.data ?? e.message}');
      throw Exception(
        e.response?.data['message'] ?? 'Failed to delete docente',
      );
    }
  }
}
