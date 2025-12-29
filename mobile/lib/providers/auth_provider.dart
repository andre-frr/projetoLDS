import 'package:flutter/material.dart';

import '../models/user_model.dart';
import '../services/auth_service.dart';
import '../utils/permission_helper.dart';

class AuthProvider with ChangeNotifier {
  final _authService = AuthService();

  UserModel? _user;
  bool _isLoading = false;
  String? _errorMessage;

  UserModel? get user => _user;

  bool get isLoading => _isLoading;

  String? get errorMessage => _errorMessage;

  bool get isAuthenticated => _user != null;

  String? get userRole => _user?.role;

  // Permission check methods
  bool canViewMenu(String menuItem) {
    return PermissionHelper.canViewMenu(userRole, menuItem);
  }

  bool canCreate(String resource) {
    return PermissionHelper.canCreate(userRole, resource);
  }

  bool canEdit(String resource) {
    return PermissionHelper.canEdit(userRole, resource);
  }

  bool canDelete(String resource) {
    return PermissionHelper.canDelete(userRole, resource);
  }

  bool canManageHours() {
    return PermissionHelper.canManageHours(userRole);
  }

  bool isReadOnly(String resource) {
    return PermissionHelper.isReadOnly(userRole, resource);
  }

  bool get isAdmin => userRole == PermissionHelper.roleAdmin;

  bool get isCoordinator => userRole == PermissionHelper.roleCoordinator;

  bool get isProfessor => userRole == PermissionHelper.roleProfessor;

  bool get isGuest => userRole == PermissionHelper.roleGuest;

  // Initialize - check if user is already logged in
  Future<void> initialize() async {
    _isLoading = true;
    notifyListeners();

    try {
      final isLoggedIn = await _authService.isLoggedIn();
      if (isLoggedIn) {
        _user = await _authService.getCurrentUser();
      }
    } catch (e) {
      _errorMessage = 'Failed to initialize auth';
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  // Login
  Future<bool> login(String username, String password) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      _user = await _authService.login(username, password);
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

  // Register
  Future<bool> register(String email, String password, String role) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      _user = await _authService.register(email, password, role);
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

  // Logout
  Future<void> logout() async {
    _isLoading = true;
    notifyListeners();

    try {
      await _authService.logout();
      _user = null;
    } catch (e) {
      _errorMessage = 'Logout failed';
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  // Logout from all devices
  Future<void> logoutAll() async {
    _isLoading = true;
    notifyListeners();

    try {
      await _authService.logoutAll();
      _user = null;
    } catch (e) {
      _errorMessage = 'Logout all failed';
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  // Clear error message
  void clearError() {
    _errorMessage = null;
    notifyListeners();
  }
}
