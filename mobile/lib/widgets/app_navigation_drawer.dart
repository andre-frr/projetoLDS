import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../providers/auth_provider.dart';
import '../screens/anos_letivos_screen.dart';
import '../screens/areas_cientificas_screen.dart';
import '../screens/coordinator_assignments_screen.dart';
import '../screens/cursos_screen.dart';
import '../screens/departamentos_screen.dart';
import '../screens/docentes_screen.dart';
import '../screens/dsd_screen.dart';
import '../screens/settings_screen.dart';
import '../screens/ucs_screen.dart';
import '../utils/permission_helper.dart';

class AppNavigationDrawer extends StatelessWidget {
  final String currentRoute;

  const AppNavigationDrawer({super.key, this.currentRoute = ''});

  @override
  Widget build(BuildContext context) {
    final authProvider = context.watch<AuthProvider>();
    final user = authProvider.user;

    return Drawer(
      child: ListView(
        padding: EdgeInsets.zero,
        children: [
          DrawerHeader(
            decoration: BoxDecoration(color: Theme.of(context).primaryColor),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                const Icon(Icons.school, size: 48, color: Colors.white),
                const SizedBox(height: 8),
                const Text(
                  'LDS Project',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                if (user != null) ...[
                  const SizedBox(height: 4),
                  Text(
                    user.username,
                    style: const TextStyle(color: Colors.white70, fontSize: 14),
                  ),
                ],
              ],
            ),
          ),
          _buildDrawerItem(
            context,
            icon: Icons.home,
            title: 'Home',
            route: 'home',
            onTap: () {
              Navigator.of(context).popUntil((route) => route.isFirst);
            },
          ),
          // Departamentos - Only for Admin and Coordenador
          if (authProvider.canViewMenu(PermissionHelper.menuDepartments))
            _buildDrawerItem(
              context,
              icon: Icons.business,
              title: 'Departamentos',
              route: 'departamentos',
              onTap: () {
                _navigateTo(context, const DepartamentosScreen());
              },
            ),
          // Cursos - All roles can view
          if (authProvider.canViewMenu(PermissionHelper.menuCourses))
            _buildDrawerItem(
              context,
              icon: Icons.school,
              title: 'Cursos',
              route: 'cursos',
              onTap: () {
                _navigateTo(context, const CursosScreen());
              },
            ),
          // Docentes - Only for Admin and Coordenador
          if (authProvider.canViewMenu(PermissionHelper.menuProfessors))
            _buildDrawerItem(
              context,
              icon: Icons.person,
              title: 'Docentes',
              route: 'docentes',
              onTap: () {
                _navigateTo(context, const DocentesScreen());
              },
            ),
          // Coordinator Assignments - Only for Admin
          if (authProvider.isAdmin)
            _buildDrawerItem(
              context,
              icon: Icons.admin_panel_settings,
              title: 'Atribuições de Coordenadores',
              route: 'coordinator_assignments',
              onTap: () {
                _navigateTo(context, const CoordinatorAssignmentsScreen());
              },
            ),
          // Áreas Científicas - Only for Admin and Coordenador
          if (authProvider.canViewMenu(PermissionHelper.menuAreas))
            _buildDrawerItem(
              context,
              icon: Icons.science,
              title: 'Áreas Científicas',
              route: 'areas_cientificas',
              onTap: () {
                _navigateTo(context, const AreasCientificasScreen());
              },
            ),
          // Unidades Curriculares - All roles can view
          if (authProvider.canViewMenu(PermissionHelper.menuUCs))
            _buildDrawerItem(
              context,
              icon: Icons.menu_book,
              title: 'Unidades Curriculares',
              route: 'ucs',
              onTap: () {
                _navigateTo(context, const UCsScreen());
              },
            ),
          // DSD - For Admin, Coordenador, and Docente
          if (authProvider.canViewMenu(PermissionHelper.menuDSD))
            _buildDrawerItem(
              context,
              icon: Icons.assignment_ind,
              title: user?.role == PermissionHelper.roleProfessor
                  ? 'Meu Serviço Docente'
                  : 'Distribuição de Serviço Docente',
              route: 'dsd',
              onTap: () {
                _navigateTo(context, const DsdScreen());
              },
            ),
          const Divider(),
          // Anos Letivos - Only for Admin and Coordenador
          if (authProvider.canViewMenu(PermissionHelper.menuAcademicYears))
            _buildDrawerItem(
              context,
              icon: Icons.calendar_today,
              title: 'Anos Letivos',
              route: 'anos_letivos',
              onTap: () {
                _navigateTo(context, const AnosLetivosScreen());
              },
            ),
          const Divider(),
          // Settings - All roles can access
          if (authProvider.canViewMenu(PermissionHelper.menuSettings))
            _buildDrawerItem(
              context,
              icon: Icons.settings,
              title: 'Definições',
              route: 'settings',
              onTap: () {
                _navigateTo(context, const SettingsScreen());
              },
            ),
        ],
      ),
    );
  }

  Widget _buildDrawerItem(
    BuildContext context, {
    required IconData icon,
    required String title,
    required String route,
    required VoidCallback onTap,
  }) {
    final isSelected = currentRoute == route;

    return ListTile(
      leading: Icon(icon),
      title: Text(title),
      selected: isSelected,
      selectedTileColor: Theme.of(context).primaryColor.withValues(alpha: 0.1),
      onTap: isSelected ? () => Navigator.pop(context) : onTap,
    );
  }

  void _navigateTo(BuildContext context, Widget screen) {
    Navigator.pop(context); // Close drawer
    // Replace current screen instead of pushing
    Navigator.of(
      context,
    ).pushReplacement(MaterialPageRoute(builder: (context) => screen));
  }
}
