import 'package:flutter/material.dart';

import '../models/dsd_model.dart';
import '../services/dsd_service.dart';

class DsdProvider with ChangeNotifier {
  final _service = DsdService();

  List<DsdModel> _dsds = [];
  List<DsdGroupModel> _dsdGroups = [];
  bool _isLoading = false;
  String? _errorMessage;

  List<DsdModel> get dsds => _dsds;

  List<DsdGroupModel> get dsdGroups => _dsdGroups;

  bool get isLoading => _isLoading;

  String? get errorMessage => _errorMessage;

  // Load all DSDs (filtered by role on backend)
  Future<void> loadAll({int? anoLetivo, int? idUc, int? idDoc}) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      _dsds = await _service.getAll(
        anoLetivo: anoLetivo,
        idUc: idUc,
        idDoc: idDoc,
      );
    } catch (e) {
      _errorMessage = e.toString().replaceAll('Exception: ', '');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  // Load DSDs grouped by UC
  Future<void> loadByUc(int idUc, {int? anoLetivo}) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      _dsdGroups = await _service.getByUc(idUc, anoLetivo: anoLetivo);
    } catch (e) {
      _errorMessage = e.toString().replaceAll('Exception: ', '');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  // Create DSD (Admin only)
  Future<bool> create(DsdCreateRequest request) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      await _service.create(request);
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


  // Delete DSD (Admin only)
  Future<bool> delete(int id) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      await _service.delete(id);
      _dsds.removeWhere((d) => d.idDsd == id);
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

  void clearError() {
    _errorMessage = null;
    notifyListeners();
  }
}
