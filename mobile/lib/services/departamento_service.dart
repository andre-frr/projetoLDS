import 'package:dio/dio.dart';
import 'package:logger/logger.dart';

import '../models/departamento_model.dart';
import 'dio_service.dart';

class DepartamentoService {
  static final DepartamentoService _instance = DepartamentoService._internal();
  factory DepartamentoService() => _instance;
  DepartamentoService._internal();

  final _dio = DioService().dio;
  final _logger = Logger();
  static const String _basePath = '/departamento';

  // Get all departments
  Future<List<DepartamentoModel>> getAll() async {
    try {
      final response = await _dio.get(_basePath);

      if (response.statusCode == 200) {
        final List<dynamic> data = response.data;
        return data.map((json) => DepartamentoModel.fromJson(json)).toList();
      } else {
        throw Exception('Failed to load departments');
      }
    } on DioException catch (e) {
      _logger.e('Error getting departments: ${e.response?.data ?? e.message}');
      throw Exception(
        e.response?.data['message'] ?? 'Failed to load departments',
      );
    }
  }

  // Get department by ID
  Future<DepartamentoModel> getById(int id) async {
    try {
      final response = await _dio.get('$_basePath/$id');

      if (response.statusCode == 200) {
        return DepartamentoModel.fromJson(response.data);
      } else {
        throw Exception('Failed to load department');
      }
    } on DioException catch (e) {
      _logger.e('Error getting department: ${e.response?.data ?? e.message}');
      throw Exception(
        e.response?.data['message'] ?? 'Failed to load department',
      );
    }
  }

  // Create department
  Future<DepartamentoModel> create(DepartamentoModel departamento) async {
    try {
      final response = await _dio.post(_basePath, data: departamento.toJson());

      if (response.statusCode == 201) {
        return DepartamentoModel.fromJson(response.data);
      } else {
        throw Exception('Failed to create department');
      }
    } on DioException catch (e) {
      _logger.e('Error creating department: ${e.response?.data ?? e.message}');
      throw Exception(
        e.response?.data['message'] ?? 'Failed to create department',
      );
    }
  }

  // Update department
  Future<DepartamentoModel> update(
    int id,
    DepartamentoModel departamento,
  ) async {
    try {
      final response = await _dio.put(
        '$_basePath/$id',
        data: departamento.toJson(),
      );

      if (response.statusCode == 200) {
        return DepartamentoModel.fromJson(response.data);
      } else {
        throw Exception('Failed to update department');
      }
    } on DioException catch (e) {
      _logger.e('Error updating department: ${e.response?.data ?? e.message}');
      throw Exception(
        e.response?.data['message'] ?? 'Failed to update department',
      );
    }
  }

  // Deactivate department
  Future<void> deactivate(int id) async {
    try {
      final response = await _dio.patch('$_basePath/$id/inativar');

      if (response.statusCode != 200) {
        throw Exception('Failed to deactivate department');
      }
    } on DioException catch (e) {
      _logger.e(
        'Error deactivating department: ${e.response?.data ?? e.message}',
      );
      throw Exception(
        e.response?.data['message'] ?? 'Failed to deactivate department',
      );
    }
  }

  // Delete department
  Future<void> delete(int id) async {
    try {
      final response = await _dio.delete('$_basePath/$id');

      if (response.statusCode != 200 && response.statusCode != 204) {
        throw Exception('Failed to delete department');
      }
    } on DioException catch (e) {
      _logger.e('Error deleting department: ${e.response?.data ?? e.message}');
      throw Exception(
        e.response?.data['message'] ?? 'Failed to delete department',
      );
    }
  }
}
