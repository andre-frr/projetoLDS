import 'package:flutter/material.dart';

import '../models/area_cientifica_model.dart';
import '../services/area_cientifica_service.dart';

class AreaCientificaProvider with ChangeNotifier {
  final AreaCientificaService _service;

  List<AreaCientificaModel> _areas = [];
  bool _isLoading = false;
  String? _errorMessage;

  AreaCientificaProvider(this._service);

  List<AreaCientificaModel> get areas => _areas;

  bool get isLoading => _isLoading;

  String? get errorMessage => _errorMessage;

  Future<void> loadAll({bool incluirInativos = false}) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      _areas = await _service.getAll(incluirInativos: incluirInativos);
      _errorMessage = null;
    } catch (e) {
      _errorMessage = e.toString();
      _areas = [];
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> create(AreaCientificaModel area) async {
    try {
      final created = await _service.create(area);
      _areas.add(created);
      _errorMessage = null;
      notifyListeners();
      return true;
    } catch (e) {
      _errorMessage = e.toString();
      notifyListeners();
      return false;
    }
  }

  Future<bool> update(int id, AreaCientificaModel area) async {
    try {
      final updated = await _service.update(id, area);
      final index = _areas.indexWhere((a) => a.id == id);
      if (index != -1) {
        _areas[index] = updated;
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
      final index = _areas.indexWhere((a) => a.id == id);
      if (index != -1) {
        _areas[index] = _areas[index].copyWith(ativo: false);
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
      _areas.removeWhere((a) => a.id == id);
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
