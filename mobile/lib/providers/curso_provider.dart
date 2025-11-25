import 'package:flutter/material.dart';

import '../models/curso_model.dart';
import '../services/curso_service.dart';

class CursoProvider with ChangeNotifier {
  final CursoService _service;

  List<CursoModel> _cursos = [];
  bool _isLoading = false;
  String? _errorMessage;

  CursoProvider(this._service);

  List<CursoModel> get cursos => _cursos;

  bool get isLoading => _isLoading;

  String? get errorMessage => _errorMessage;

  Future<void> loadAll({bool incluirInativos = false}) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      _cursos = await _service.getAll(incluirInativos: incluirInativos);
      _errorMessage = null;
    } catch (e) {
      _errorMessage = e.toString();
      _cursos = [];
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> create(CursoModel curso) async {
    try {
      final created = await _service.create(curso);
      _cursos.add(created);
      _errorMessage = null;
      notifyListeners();
      return true;
    } catch (e) {
      _errorMessage = e.toString();
      notifyListeners();
      return false;
    }
  }

  Future<bool> update(int id, CursoModel curso) async {
    try {
      final updated = await _service.update(id, curso);
      final index = _cursos.indexWhere((c) => c.id == id);
      if (index != -1) {
        _cursos[index] = updated;
        _errorMessage = null;
        notifyListeners();
      }
      return true;
    } catch (e) {
      _errorMessage = e.toString();
      notifyListeners();
      return false;
    }
  }

  Future<bool> deactivate(int id) async {
    try {
      await _service.deactivate(id);
      final index = _cursos.indexWhere((c) => c.id == id);
      if (index != -1) {
        _cursos[index] = _cursos[index].copyWith(ativo: false);
        _errorMessage = null;
        notifyListeners();
      }
      return true;
    } catch (e) {
      _errorMessage = e.toString();
      notifyListeners();
      return false;
    }
  }

  Future<bool> delete(int id) async {
    try {
      await _service.delete(id);
      _cursos.removeWhere((c) => c.id == id);
      _errorMessage = null;
      notifyListeners();
      return true;
    } catch (e) {
      _errorMessage = e.toString();
      notifyListeners();
      return false;
    }
  }
}
