import 'package:dio/dio.dart';
import 'package:logger/logger.dart';

class CoordinatorAssignment {
  final int userId;
  final String email;
  final String role;
  final List<Department> departments;
  final List<Course> courses;

  CoordinatorAssignment({
    required this.userId,
    required this.email,
    required this.role,
    required this.departments,
    required this.courses,
  });

  factory CoordinatorAssignment.fromJson(Map<String, dynamic> json) {
    return CoordinatorAssignment(
      userId: json['user']['id'],
      email: json['user']['email'],
      role: json['user']['role'],
      departments:
          (json['departments'] as List?)
              ?.map((d) => Department.fromJson(d))
              .toList() ??
          [],
      courses:
          (json['courses'] as List?)?.map((c) => Course.fromJson(c)).toList() ??
          [],
    );
  }
}

class Department {
  final int id;
  final String nome;
  final String sigla;

  Department({required this.id, required this.nome, required this.sigla});

  factory Department.fromJson(Map<String, dynamic> json) {
    return Department(
      id: json['id_dep'],
      nome: json['nome'],
      sigla: json['sigla'],
    );
  }
}

class Course {
  final int id;
  final String nome;
  final String sigla;

  Course({required this.id, required this.nome, required this.sigla});

  factory Course.fromJson(Map<String, dynamic> json) {
    return Course(
      id: json['id_curso'],
      nome: json['nome'],
      sigla: json['sigla'],
    );
  }
}

class CoordinatorService {
  final Dio _dio;
  final _logger = Logger();

  CoordinatorService(this._dio);

  /// Get coordinator assignments for a user
  Future<CoordinatorAssignment> getAssignments(int userId) async {
    try {
      final response = await _dio.get('/coordenador-assignments/$userId');

      if (response.statusCode == 200) {
        return CoordinatorAssignment.fromJson(response.data);
      }

      throw Exception('Failed to load coordinator assignments');
    } on DioException catch (e) {
      _logger.e(
        'Error loading coordinator assignments: ${e.response?.data ?? e.message}',
      );
      throw Exception(
        e.response?.data['message'] ?? 'Failed to load assignments',
      );
    }
  }

  /// Assign coordinator to department
  Future<void> assignToDepartment(int userId, int departmentId) async {
    try {
      final response = await _dio.post(
        '/coordenador-assignments/$userId',
        data: {'type': 'department', 'resourceId': departmentId},
      );

      if (response.statusCode != 201) {
        throw Exception('Failed to assign coordinator to department');
      }
    } on DioException catch (e) {
      _logger.e(
        'Error assigning coordinator to department: ${e.response?.data ?? e.message}',
      );
      throw Exception(
        e.response?.data['message'] ?? 'Failed to assign to department',
      );
    }
  }

  /// Remove coordinator from department
  Future<void> removeFromDepartment(int userId, int departmentId) async {
    try {
      final response = await _dio.delete(
        '/coordenador-assignments/$userId',
        data: {'type': 'department', 'resourceId': departmentId},
      );

      if (response.statusCode != 200) {
        throw Exception('Failed to remove coordinator from department');
      }
    } on DioException catch (e) {
      _logger.e(
        'Error removing coordinator from department: ${e.response?.data ?? e.message}',
      );
      throw Exception(
        e.response?.data['message'] ?? 'Failed to remove from department',
      );
    }
  }

  /// Assign coordinator to course
  Future<void> assignToCourse(int userId, int courseId) async {
    try {
      final response = await _dio.post(
        '/coordenador-assignments/$userId',
        data: {'type': 'course', 'resourceId': courseId},
      );

      if (response.statusCode != 201) {
        throw Exception('Failed to assign coordinator to course');
      }
    } on DioException catch (e) {
      _logger.e(
        'Error assigning coordinator to course: ${e.response?.data ?? e.message}',
      );
      throw Exception(
        e.response?.data['message'] ?? 'Failed to assign to course',
      );
    }
  }

  /// Remove coordinator from course
  Future<void> removeFromCourse(int userId, int courseId) async {
    try {
      final response = await _dio.delete(
        '/coordenador-assignments/$userId',
        data: {'type': 'course', 'resourceId': courseId},
      );

      if (response.statusCode != 200) {
        throw Exception('Failed to remove coordinator from course');
      }
    } on DioException catch (e) {
      _logger.e(
        'Error removing coordinator from course: ${e.response?.data ?? e.message}',
      );
      throw Exception(
        e.response?.data['message'] ?? 'Failed to remove from course',
      );
    }
  }

  /// Get all coordinators (users with role Coordenador)
  Future<List<Map<String, dynamic>>> getAllCoordinators() async {
    try {
      final response = await _dio.get('/users');

      if (response.statusCode == 200) {
        final users = response.data as List;
        return users
            .where((user) => user['role'] == 'Coordenador')
            .cast<Map<String, dynamic>>()
            .toList();
      }

      throw Exception('Failed to load coordinators');
    } on DioException catch (e) {
      _logger.e('Error loading coordinators: ${e.response?.data ?? e.message}');
      throw Exception(
        e.response?.data['message'] ?? 'Failed to load coordinators',
      );
    }
  }
}
