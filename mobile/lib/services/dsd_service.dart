import 'package:dio/dio.dart';
import 'package:logger/logger.dart';

import '../models/dsd_model.dart';
import 'dio_service.dart';

class DsdService {
  static final DsdService _instance = DsdService._internal();

  factory DsdService() => _instance;

  DsdService._internal();

  final _dio = DioService().dio;
  final _logger = Logger();
  static const String _basePath = '/dsd';

  // Get all DSDs (filtered by role on backend)
  Future<List<DsdModel>> getAll({int? anoLetivo, int? idUc, int? idDoc}) async {
    try {
      final queryParams = <String, dynamic>{};
      if (anoLetivo != null) queryParams['ano_letivo'] = anoLetivo;
      if (idUc != null) queryParams['id_uc'] = idUc;
      if (idDoc != null) queryParams['id_doc'] = idDoc;

      final response = await _dio.get(_basePath, queryParameters: queryParams);

      if (response.statusCode == 200) {
        final List<dynamic> data = response.data;
        return data.map((json) => DsdModel.fromJson(json)).toList();
      } else {
        throw Exception('Failed to load DSDs');
      }
    } on DioException catch (e) {
      _logger.e('Error getting DSDs: ${e.response?.data ?? e.message}');
      throw Exception(e.response?.data['message'] ?? 'Failed to load DSDs');
    }
  }

  // Get DSD by ID
  Future<DsdModel> getById(int id) async {
    try {
      final response = await _dio.get('$_basePath/$id');

      if (response.statusCode == 200) {
        return DsdModel.fromJson(response.data);
      } else {
        throw Exception('Failed to load DSD');
      }
    } on DioException catch (e) {
      _logger.e('Error getting DSD: ${e.response?.data ?? e.message}');
      throw Exception(e.response?.data['message'] ?? 'Failed to load DSD');
    }
  }

  // Get DSDs grouped by UC
  Future<List<DsdGroupModel>> getByUc(int idUc, {int? anoLetivo}) async {
    try {
      final queryParams = <String, dynamic>{};
      if (anoLetivo != null) queryParams['ano_letivo'] = anoLetivo;

      final response = await _dio.get(
        '$_basePath/by-uc/$idUc',
        queryParameters: queryParams,
      );

      if (response.statusCode == 200) {
        final List<dynamic> data = response.data;
        return data.map((json) => DsdGroupModel.fromJson(json)).toList();
      } else {
        throw Exception('Failed to load DSD groups');
      }
    } on DioException catch (e) {
      _logger.e('Error getting DSD groups: ${e.response?.data ?? e.message}');
      throw Exception(
        e.response?.data['message'] ?? 'Failed to load DSD groups',
      );
    }
  }

  // Create DSD (Admin only)
  Future<Map<String, dynamic>> create(DsdCreateRequest request) async {
    try {
      final response = await _dio.post(_basePath, data: request.toJson());

      if (response.statusCode == 201) {
        return response.data;
      } else {
        throw Exception('Failed to create DSD');
      }
    } on DioException catch (e) {
      _logger.e('Error creating DSD: ${e.response?.data ?? e.message}');
      throw Exception(e.response?.data['message'] ?? 'Failed to create DSD');
    }
  }

  // Update DSD hours (Admin only)
  Future<DsdModel> updateHoras(int id, int horas) async {
    try {
      final response = await _dio.put('$_basePath/$id', data: {'horas': horas});

      if (response.statusCode == 200) {
        return DsdModel.fromJson(response.data);
      } else {
        throw Exception('Failed to update DSD');
      }
    } on DioException catch (e) {
      _logger.e('Error updating DSD: ${e.response?.data ?? e.message}');
      throw Exception(e.response?.data['message'] ?? 'Failed to update DSD');
    }
  }

  // Delete DSD (Admin only)
  Future<void> delete(int id) async {
    try {
      final response = await _dio.delete('$_basePath/$id');

      if (response.statusCode != 204) {
        throw Exception('Failed to delete DSD');
      }
    } on DioException catch (e) {
      _logger.e('Error deleting DSD: ${e.response?.data ?? e.message}');
      throw Exception(e.response?.data['message'] ?? 'Failed to delete DSD');
    }
  }
}
