import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../providers/auth_provider.dart';
import '../screens/areas_cientificas_screen.dart';
import '../screens/departamentos_screen.dart';
import '../screens/docentes_screen.dart';
import '../screens/home_screen.dart';

class AppNavigationDrawer extends StatelessWidget {
  final String currentRoute;

  const AppNavigationDrawer({
    super.key,
    required this.currentRoute,
  });

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
                    style: const TextStyle(
                      color: Colors.white70,
                      fontSize: 14,
                    ),
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
          _buildDrawerItem(
            context,
            icon: Icons.business,
            title: 'Departamentos',
            route: 'departamentos',
            onTap: () {
              _navigateTo(context, const DepartamentosScreen());
            },
          ),
          _buildDrawerItem(
            context,
            icon: Icons.person,
            title: 'Docentes',
            route: 'docentes',
            onTap: () {
              _navigateTo(context, const DocentesScreen());
            },
          ),
          _buildDrawerItem(
            context,
            icon: Icons.science,
            title: 'Áreas Científicas',
            route: 'areas_cientificas',
            onTap: () {
              _navigateTo(context, const AreasCientificasScreen());
            },
          ),
          const Divider(),
          ListTile(
            leading: const Icon(Icons.settings),
            title: const Text('Settings'),
            onTap: () {
              Navigator.pop(context);
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
      selectedTileColor: Theme.of(context).primaryColor.withOpacity(0.1),
      onTap: isSelected ? () => Navigator.pop(context) : onTap,
    );
  }

  void _navigateTo(BuildContext context, Widget screen) {
    Navigator.pop(context); // Close drawer
    // Replace current screen instead of pushing
    Navigator.of(context).pushReplacement(
      MaterialPageRoute(builder: (context) => screen),
    );
  }
}
