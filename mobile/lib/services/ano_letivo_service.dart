import 'package:dio/dio.dart';

import '../models/ano_letivo_model.dart';
import 'dio_service.dart';

class AnoLetivoService {
  final Dio _dio = DioService().dio;

  Future<List<AnoLetivoModel>> getAll() async {
    try {
      final response = await _dio.get('/ano_letivo');
      final List<dynamic> data = response.data as List<dynamic>;
      return data
          .map((json) => AnoLetivoModel.fromJson(json as Map<String, dynamic>))
          .toList();
    } catch (e) {
      rethrow;
    }
  }

  Future<AnoLetivoModel> getById(int id) async {
    try {
      final response = await _dio.get('/ano_letivo/$id');
      return AnoLetivoModel.fromJson(response.data as Map<String, dynamic>);
    } catch (e) {
      rethrow;
    }
  }

  Future<AnoLetivoModel?> getCurrent() async {
    try {
      final response = await _dio.get('/ano_letivo/current');
      return AnoLetivoModel.fromJson(response.data as Map<String, dynamic>);
    } on DioException catch (e) {
      if (e.response?.statusCode == 404) {
        return null;
      }
      rethrow;
    }
  }

  Future<AnoLetivoModel> create(
    AnoLetivoModel anoLetivo, {
    bool createNewYear = false,
  }) async {
    try {
      final response = await _dio.post(
        '/ano_letivo',
        data: {
          'anoInicio': anoLetivo.anoInicio,
          'anoFim': anoLetivo.anoFim,
          'createNewYear': createNewYear,
        },
      );
      return AnoLetivoModel.fromJson(response.data as Map<String, dynamic>);
    } catch (e) {
      rethrow;
    }
  }

  Future<AnoLetivoModel> update(AnoLetivoModel anoLetivo) async {
    try {
      final response = await _dio.put(
        '/ano_letivo/${anoLetivo.id}',
        data: {'anoInicio': anoLetivo.anoInicio, 'anoFim': anoLetivo.anoFim},
      );
      return AnoLetivoModel.fromJson(response.data as Map<String, dynamic>);
    } catch (e) {
      rethrow;
    }
  }

  Future<void> delete(int id) async {
    try {
      await _dio.delete('/ano_letivo/$id');
    } catch (e) {
      rethrow;
    }
  }
}
