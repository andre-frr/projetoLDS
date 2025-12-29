import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';

import '../models/ano_letivo_model.dart';
import '../services/ano_letivo_service.dart';

class AnoLetivoProvider with ChangeNotifier {
  final AnoLetivoService _service = AnoLetivoService();

  List<AnoLetivoModel> _items = [];
  AnoLetivoModel? _currentYear;
  bool _isLoading = false;
  String? _errorMessage;

  List<AnoLetivoModel> get items => _items;

  AnoLetivoModel? get currentYear => _currentYear;

  bool get isLoading => _isLoading;

  String? get errorMessage => _errorMessage;

  Future<void> loadAll() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      _items = await _service.getAll();
      _errorMessage = null;
    } on DioException catch (e) {
      _errorMessage =
          e.response?.data['message'] ?? 'Erro ao carregar anos letivos';
    } catch (e) {
      _errorMessage = 'Erro inesperado ao carregar anos letivos';
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> loadCurrent() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      _currentYear = await _service.getCurrent();
      _errorMessage = null;
    } on DioException catch (e) {
      _errorMessage =
          e.response?.data['message'] ?? 'Erro ao carregar ano letivo atual';
    } catch (e) {
      _errorMessage = 'Erro inesperado ao carregar ano letivo atual';
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> create(
    AnoLetivoModel anoLetivo, {
    bool createNewYear = false,
  }) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final created = await _service.create(
        anoLetivo,
        createNewYear: createNewYear,
      );
      _items.insert(0, created);
      if (createNewYear) {
        _currentYear = created;
      }
      _errorMessage = null;
      _isLoading = false;
      notifyListeners();
      return true;
    } on DioException catch (e) {
      _errorMessage = e.response?.data['message'] ?? 'Erro ao criar ano letivo';
      _isLoading = false;
      notifyListeners();
      return false;
    } catch (e) {
      _errorMessage = 'Erro inesperado ao criar ano letivo';
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<bool> update(AnoLetivoModel anoLetivo) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final updated = await _service.update(anoLetivo);
      final index = _items.indexWhere((item) => item.id == updated.id);
      if (index != -1) {
        _items[index] = updated;
      }
      if (_currentYear?.id == updated.id) {
        _currentYear = updated;
      }
      _errorMessage = null;
      _isLoading = false;
      notifyListeners();
      return true;
    } on DioException catch (e) {
      _errorMessage =
          e.response?.data['message'] ?? 'Erro ao atualizar ano letivo';
      _isLoading = false;
      notifyListeners();
      return false;
    } catch (e) {
      _errorMessage = 'Erro inesperado ao atualizar ano letivo';
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<bool> delete(int id) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      await _service.delete(id);
      _items.removeWhere((item) => item.id == id);
      if (_currentYear?.id == id) {
        _currentYear = null;
      }
      _errorMessage = null;
      _isLoading = false;
      notifyListeners();
      return true;
    } on DioException catch (e) {
      _errorMessage =
          e.response?.data['message'] ?? 'Erro ao eliminar ano letivo';
      _isLoading = false;
      notifyListeners();
      return false;
    } catch (e) {
      _errorMessage = 'Erro inesperado ao eliminar ano letivo';
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }
}
