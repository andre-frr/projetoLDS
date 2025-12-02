import 'package:flutter/material.dart';

import '../models/uc_model.dart';
import '../services/uc_service.dart';

class UCProvider with ChangeNotifier {
  final _ucService = UCService();

  List<UCModel> _ucs = [];
  bool _isLoading = false;
  String? _errorMessage;

  List<UCModel> get ucs => _ucs;

  bool get isLoading => _isLoading;

  String? get errorMessage => _errorMessage;

  // Load all UCs
  Future<void> loadAll({bool incluirInativos = false}) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      _ucs = await _ucService.getAll(incluirInativos: incluirInativos);
      _errorMessage = null;
    } catch (e) {
      _errorMessage = e.toString().replaceAll('Exception: ', '');
      _ucs = [];
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  // Create UC
  Future<bool> create(UCModel uc) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final newUC = await _ucService.create(uc);
      _ucs.add(newUC);
      _errorMessage = null;
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

  // Update UC
  Future<bool> update(int id, UCModel uc) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final updatedUC = await _ucService.update(id, uc);
      final index = _ucs.indexWhere((u) => u.id == id);
      if (index != -1) {
        _ucs[index] = updatedUC;
      }
      _errorMessage = null;
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

  // Deactivate UC
  Future<bool> deactivate(int id) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      await _ucService.deactivate(id);
      final index = _ucs.indexWhere((u) => u.id == id);
      if (index != -1) {
        _ucs[index] = _ucs[index].copyWith(ativo: false);
      }
      _errorMessage = null;
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

  // Reactivate UC
  Future<bool> reactivate(int id) async {
    final uc = _ucs.firstWhere((u) => u.id == id);
    return update(id, uc.copyWith(ativo: true));
  }

  // Delete UC
  Future<bool> delete(int id) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      await _ucService.delete(id);
      _ucs.removeWhere((u) => u.id == id);
      _errorMessage = null;
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

  // Clear error
  void clearError() {
    _errorMessage = null;
    notifyListeners();
  }
}
