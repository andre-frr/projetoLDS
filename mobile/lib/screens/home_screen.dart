import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../providers/auth_provider.dart';
import '../utils/permission_helper.dart';
import 'anos_letivos_screen.dart';
import 'areas_cientificas_screen.dart';
import 'cursos_screen.dart';
import 'departamentos_screen.dart';
import 'docentes_screen.dart';
import 'settings_screen.dart';
import 'ucs_screen.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final authProvider = context.watch<AuthProvider>();
    final user = authProvider.user;

    return Scaffold(
      appBar: AppBar(
        title: const Text('LDS Project'),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () async {
              final authProvider = context.read<AuthProvider>();

              final shouldLogout = await showDialog<bool>(
                context: context,
                builder: (context) => AlertDialog(
                  title: const Text('Logout'),
                  content: const Text('Are you sure you want to logout?'),
                  actions: [
                    TextButton(
                      onPressed: () => Navigator.pop(context, false),
                      child: const Text('Cancel'),
                    ),
                    TextButton(
                      onPressed: () => Navigator.pop(context, true),
                      child: const Text('Logout'),
                    ),
                  ],
                ),
              );

              if (shouldLogout == true && context.mounted) {
                await authProvider.logout();
              }
            },
          ),
        ],
      ),
      drawer: Drawer(
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
                      style: const TextStyle(
                        color: Colors.white70,
                        fontSize: 14,
                      ),
                    ),
                    Text(
                      PermissionHelper.getRoleName(user.role),
                      style: const TextStyle(
                        color: Colors.white60,
                        fontSize: 12,
                      ),
                    ),
                  ],
                ],
              ),
            ),
            ListTile(
              leading: const Icon(Icons.home),
              title: const Text('Home'),
              onTap: () {
                Navigator.pop(context);
              },
            ),
            // Departamentos - Only for Admin and Coordenador
            if (authProvider.canViewMenu(PermissionHelper.menuDepartments))
              ListTile(
                leading: const Icon(Icons.business),
                title: const Text('Departamentos'),
                onTap: () {
                  Navigator.pop(context);
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => const DepartamentosScreen(),
                    ),
                  );
                },
              ),
            // Cursos - All roles can view
            if (authProvider.canViewMenu(PermissionHelper.menuCourses))
              ListTile(
                leading: const Icon(Icons.school),
                title: const Text('Cursos'),
                onTap: () {
                  Navigator.pop(context);
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => const CursosScreen(),
                    ),
                  );
                },
              ),
            // Docentes - Only for Admin and Coordenador
            if (authProvider.canViewMenu(PermissionHelper.menuProfessors))
              ListTile(
                leading: const Icon(Icons.person),
                title: const Text('Docentes'),
                onTap: () {
                  Navigator.pop(context);
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => const DocentesScreen(),
                    ),
                  );
                },
              ),
            // Áreas Científicas - Only for Admin and Coordenador
            if (authProvider.canViewMenu(PermissionHelper.menuAreas))
              ListTile(
                leading: const Icon(Icons.science),
                title: const Text('Áreas Científicas'),
                onTap: () {
                  Navigator.pop(context);
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => const AreasCientificasScreen(),
                    ),
                  );
                },
              ),
            // Unidades Curriculares - All roles can view
            if (authProvider.canViewMenu(PermissionHelper.menuUCs))
              ListTile(
                leading: const Icon(Icons.menu_book),
                title: const Text('Unidades Curriculares'),
                onTap: () {
                  Navigator.pop(context);
                  Navigator.push(
                    context,
                    MaterialPageRoute(builder: (context) => const UCsScreen()),
                  );
                },
              ),
            const Divider(),
            // Anos Letivos - Only for Admin and Coordenador
            if (authProvider.canViewMenu(PermissionHelper.menuAcademicYears))
              ListTile(
                leading: const Icon(Icons.calendar_today),
                title: const Text('Anos Letivos'),
                onTap: () {
                  Navigator.pop(context);
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => const AnosLetivosScreen(),
                    ),
                  );
                },
              ),
            const Divider(),
            // Settings - All roles can access
            if (authProvider.canViewMenu(PermissionHelper.menuSettings))
              ListTile(
                leading: const Icon(Icons.settings),
                title: const Text('Definições'),
                onTap: () {
                  Navigator.pop(context);
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => const SettingsScreen(),
                    ),
                  );
                },
              ),
          ],
        ),
      ),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.school,
              size: 100,
              color: Theme.of(context).primaryColor,
            ),
            const SizedBox(height: 24),
            Text(
              'Welcome to LDS Project',
              style: Theme.of(context).textTheme.headlineMedium,
            ),
            const SizedBox(height: 16),
            const Text(
              'Select an option from the menu',
              style: TextStyle(fontSize: 16),
            ),
          ],
        ),
      ),
    );
  }
}
