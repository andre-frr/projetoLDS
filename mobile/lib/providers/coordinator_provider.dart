import 'package:flutter/material.dart';

import '../services/coordinator_service.dart';
import '../services/dio_service.dart';

class CoordinatorProvider with ChangeNotifier {
  final _service = CoordinatorService(DioService().dio);

  List<Map<String, dynamic>> _coordinators = [];
  CoordinatorAssignment? _selectedAssignment;
  bool _isLoading = false;
  String? _errorMessage;

  List<Map<String, dynamic>> get coordinators => _coordinators;

  CoordinatorAssignment? get selectedAssignment => _selectedAssignment;

  bool get isLoading => _isLoading;

  String? get errorMessage => _errorMessage;

  /// Load all coordinators
  Future<void> loadCoordinators() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      _coordinators = await _service.getAllCoordinators();
    } catch (e) {
      _errorMessage = e.toString().replaceAll('Exception: ', '');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Load assignments for a specific coordinator
  Future<void> loadAssignments(int userId) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      _selectedAssignment = await _service.getAssignments(userId);
    } catch (e) {
      _errorMessage = e.toString().replaceAll('Exception: ', '');
      _selectedAssignment = null;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Assign coordinator to department
  Future<bool> assignToDepartment(int userId, int departmentId) async {
    try {
      await _service.assignToDepartment(userId, departmentId);
      // Reload assignments
      await loadAssignments(userId);
      return true;
    } catch (e) {
      _errorMessage = e.toString().replaceAll('Exception: ', '');
      notifyListeners();
      return false;
    }
  }

  /// Remove coordinator from department
  Future<bool> removeFromDepartment(int userId, int departmentId) async {
    try {
      await _service.removeFromDepartment(userId, departmentId);
      // Reload assignments
      await loadAssignments(userId);
      return true;
    } catch (e) {
      _errorMessage = e.toString().replaceAll('Exception: ', '');
      notifyListeners();
      return false;
    }
  }

  /// Assign coordinator to course
  Future<bool> assignToCourse(int userId, int courseId) async {
    try {
      await _service.assignToCourse(userId, courseId);
      // Reload assignments
      await loadAssignments(userId);
      return true;
    } catch (e) {
      _errorMessage = e.toString().replaceAll('Exception: ', '');
      notifyListeners();
      return false;
    }
  }

  /// Remove coordinator from course
  Future<bool> removeFromCourse(int userId, int courseId) async {
    try {
      await _service.removeFromCourse(userId, courseId);
      // Reload assignments
      await loadAssignments(userId);
      return true;
    } catch (e) {
      _errorMessage = e.toString().replaceAll('Exception: ', '');
      notifyListeners();
      return false;
    }
  }

  void clearError() {
    _errorMessage = null;
    notifyListeners();
  }
}
