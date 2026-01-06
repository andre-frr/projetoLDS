/// Permission helper for role-based access control
/// Matches the backend permissions system
class PermissionHelper {
  // Role constants
  static const String roleAdmin = 'Administrador';
  static const String roleCoordinator = 'Coordenador';
  static const String roleProfessor = 'Docente';
  static const String roleGuest = 'Convidado';

  // Menu items
  static const String menuDepartments = 'departments';
  static const String menuCourses = 'courses';
  static const String menuProfessors = 'professors';
  static const String menuAreas = 'areas';
  static const String menuUCs = 'ucs';
  static const String menuAcademicYears = 'academic_years';
  static const String menuDSD = 'dsd';
  static const String menuSettings = 'settings';

  /// Check if user can view a specific menu item
  static bool canViewMenu(String? role, String menuItem) {
    if (role == null) return false;

    switch (role) {
      case roleAdmin:
        return true; // Admin can see everything

      case roleCoordinator:
        // Coordenadores can see everything except user management
        return true;

      case roleProfessor:
        // Docentes can see courses, UCs, DSD, and settings
        return menuItem == menuCourses ||
            menuItem == menuUCs ||
            menuItem == menuDSD ||
            menuItem == menuSettings;

      case roleGuest:
        // Convidados can only see courses and UCs
        return menuItem == menuCourses || menuItem == menuUCs;

      default:
        return false;
    }
  }

  /// Check if user can create a resource
  static bool canCreate(String? role, String resource) {
    if (role == null) return false;

    switch (role) {
      case roleAdmin:
        return true; // Admin can create anything

      case roleCoordinator:
        // Coordenadores can create UCs, professors, areas, courses, academic years
        // But NOT departments or users
        return resource != menuDepartments && resource != 'users';

      case roleProfessor:
        // Docentes can only create their own CV entries (handled separately)
        return false;

      case roleGuest:
        return false; // Convidados cannot create anything

      default:
        return false;
    }
  }

  /// Check if user can edit a resource
  static bool canEdit(String? role, String resource) {
    if (role == null) return false;

    switch (role) {
      case roleAdmin:
        return true; // Admin can edit anything

      case roleCoordinator:
        // Coordenadores can edit UCs, professors, areas, courses in their assignments
        // But NOT departments or users
        return resource != menuDepartments && resource != 'users';

      case roleProfessor:
        // Docentes can edit their own data (checked at item level)
        return resource == menuProfessors; // Will be filtered to own data

      case roleGuest:
        return false; // Convidados cannot edit anything

      default:
        return false;
    }
  }

  /// Check if user can delete a resource
  static bool canDelete(String? role, String resource) {
    if (role == null) return false;

    switch (role) {
      case roleAdmin:
        return true; // Admin can delete anything

      case roleCoordinator:
        // Coordenadores can delete UCs in their courses
        // But NOT departments, professors, or users
        return resource == menuUCs ||
            resource == menuAreas ||
            resource == menuAcademicYears;

      case roleProfessor:
      case roleGuest:
        return false; // Docentes and Convidados cannot delete

      default:
        return false;
    }
  }

  /// Check if user can manage hours for UCs
  static bool canManageHours(String? role) {
    if (role == null) return false;

    return role == roleAdmin || role == roleCoordinator;
  }

  /// Check if user has read-only access to a resource
  static bool isReadOnly(String? role, String resource) {
    if (role == null) return true;

    if (role == roleAdmin) return false; // Admin never read-only

    if (role == roleGuest) {
      // Convidado is read-only for courses and UCs only
      return resource == menuCourses || resource == menuUCs;
    }

    if (role == roleProfessor) {
      // Docente is read-only except for their own professor data
      return resource != menuProfessors;
    }

    return false; // Coordenador is not read-only (can edit their assigned resources)
  }

  /// Get user-friendly role name
  static String getRoleName(String? role) {
    switch (role) {
      case roleAdmin:
        return 'Administrador';
      case roleCoordinator:
        return 'Coordenador de Curso';
      case roleProfessor:
        return 'Docente';
      case roleGuest:
        return 'Convidado';
      default:
        return 'Desconhecido';
    }
  }

  /// Get role description
  static String getRoleDescription(String? role) {
    switch (role) {
      case roleAdmin:
        return 'Gestão global do sistema';
      case roleCoordinator:
        return 'Gestão de cursos e áreas científicas';
      case roleProfessor:
        return 'Consulta e gestão de dados pessoais';
      case roleGuest:
        return 'Consulta de informação pública';
      default:
        return '';
    }
  }
}
