import 'package:flutter/material.dart';

import '../models/departamento_model.dart';
import '../services/departamento_service.dart';

class DepartamentoProvider with ChangeNotifier {
  final _service = DepartamentoService();

  List<DepartamentoModel> _departamentos = [];
  bool _isLoading = false;
  String? _errorMessage;

  List<DepartamentoModel> get departamentos => _departamentos;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  // Load all departments
  Future<void> loadAll() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      _departamentos = await _service.getAll();
    } catch (e) {
      _errorMessage = e.toString().replaceAll('Exception: ', '');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  // Create department
  Future<bool> create(DepartamentoModel departamento) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final created = await _service.create(departamento);
      _departamentos.add(created);
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _errorMessage = e.toString().replaceAll('Exception: ', '');
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  // Update department
  Future<bool> update(int id, DepartamentoModel departamento) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final updated = await _service.update(id, departamento);
      final index = _departamentos.indexWhere((d) => d.id == id);
      if (index != -1) {
        _departamentos[index] = updated;
      }
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _errorMessage = e.toString().replaceAll('Exception: ', '');
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  // Deactivate department
  Future<bool> deactivate(int id) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      await _service.deactivate(id);
      final index = _departamentos.indexWhere((d) => d.id == id);
      if (index != -1) {
        _departamentos[index] = _departamentos[index].copyWith(ativo: false);
      }
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _errorMessage = e.toString().replaceAll('Exception: ', '');
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  // Delete department
  Future<bool> delete(int id) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      await _service.delete(id);
      _departamentos.removeWhere((d) => d.id == id);
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _errorMessage = e.toString().replaceAll('Exception: ', '');
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  // Clear error message
  void clearError() {
    _errorMessage = null;
    notifyListeners();
  }
}
