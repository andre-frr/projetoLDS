import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/theme_provider.dart';
import '../utils/constants.dart';

class SettingsScreen extends StatelessWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Definições')),
      body: ListView(
        children: [
          // Theme Section
          const Padding(
            padding: EdgeInsets.all(16.0),
            child: Text(
              'Aparência',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
          ),
          Consumer<ThemeProvider>(
            builder: (context, themeProvider, child) {
              return Column(
                children: [
                  // ignore: deprecated_member_use
                  ListTile(
                    title: const Text('Modo Sistema'),
                    subtitle: const Text('Seguir as definições do sistema'),
                    // ignore: deprecated_member_use
                    leading: Radio<ThemeMode>(
                      value: ThemeMode.system,
                      // ignore: deprecated_member_use
                      groupValue: themeProvider.themeMode,
                      // ignore: deprecated_member_use
                      onChanged: (mode) {
                        if (mode != null) {
                          themeProvider.setThemeMode(mode);
                        }
                      },
                    ),
                    onTap: () => themeProvider.setThemeMode(ThemeMode.system),
                  ),
                  // ignore: deprecated_member_use
                  ListTile(
                    title: const Text('Modo Claro'),
                    subtitle: const Text('Sempre usar tema claro'),
                    // ignore: deprecated_member_use
                    leading: Radio<ThemeMode>(
                      value: ThemeMode.light,
                      // ignore: deprecated_member_use
                      groupValue: themeProvider.themeMode,
                      // ignore: deprecated_member_use
                      onChanged: (mode) {
                        if (mode != null) {
                          themeProvider.setThemeMode(mode);
                        }
                      },
                    ),
                    onTap: () => themeProvider.setThemeMode(ThemeMode.light),
                  ),
                  // ignore: deprecated_member_use
                  ListTile(
                    title: const Text('Modo Escuro'),
                    subtitle: const Text('Sempre usar tema escuro'),
                    // ignore: deprecated_member_use
                    leading: Radio<ThemeMode>(
                      value: ThemeMode.dark,
                      // ignore: deprecated_member_use
                      groupValue: themeProvider.themeMode,
                      // ignore: deprecated_member_use
                      onChanged: (mode) {
                        if (mode != null) {
                          themeProvider.setThemeMode(mode);
                        }
                      },
                    ),
                    onTap: () => themeProvider.setThemeMode(ThemeMode.dark),
                  ),
                ],
              );
            },
          ),
          const Divider(),

          // App Info Section
          const Padding(
            padding: EdgeInsets.all(16.0),
            child: Text(
              'Sobre',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
          ),
          ListTile(
            title: const Text('Nome da Aplicação'),
            subtitle: Text(AppConstants.appName),
          ),
          ListTile(
            title: const Text('Domínio de Email'),
            subtitle: Text(AppConstants.emailDomain),
          ),
          ListTile(title: const Text('Versão'), subtitle: const Text('1.0.0')),
        ],
      ),
    );
  }
}
