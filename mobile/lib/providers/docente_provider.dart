import 'package:flutter/material.dart';

import '../models/docente_model.dart';
import '../services/docente_service.dart';

class DocenteProvider with ChangeNotifier {
  final DocenteService _service;

  List<DocenteModel> _docentes = [];
  bool _isLoading = false;
  String? _error;

  DocenteProvider(this._service);

  List<DocenteModel> get docentes => _docentes;
  bool get isLoading => _isLoading;
  String? get error => _error;

  Future<void> loadAll({bool incluirInativos = false}) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _docentes = await _service.getAll(incluirInativos: incluirInativos);
      _error = null;
    } catch (e) {
      _error = e.toString();
      _docentes = [];
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> create(DocenteModel docente) async {
    try {
      final created = await _service.create(docente);
      _docentes.add(created);
      notifyListeners();
      return true;
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      return false;
    }
  }

  Future<bool> update(int id, DocenteModel docente) async {
    try {
      final updated = await _service.update(id, docente);
      final index = _docentes.indexWhere((d) => d.id == id);
      if (index != -1) {
        _docentes[index] = updated;
        notifyListeners();
      }
      return true;
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      return false;
    }
  }

  Future<bool> deactivate(int id) async {
    try {
      await _service.deactivate(id);
      final index = _docentes.indexWhere((d) => d.id == id);
      if (index != -1) {
        _docentes[index] = _docentes[index].copyWith(ativo: false);
        notifyListeners();
      }
      return true;
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      return false;
    }
  }

  Future<bool> delete(int id) async {
    try {
      await _service.delete(id);
      _docentes.removeWhere((d) => d.id == id);
      notifyListeners();
      return true;
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      return false;
    }
  }
}
