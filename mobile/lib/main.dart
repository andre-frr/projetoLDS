import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'providers/area_cientifica_provider.dart';
import 'providers/auth_provider.dart';
import 'providers/departamento_provider.dart';
import 'providers/docente_provider.dart';
import 'screens/home_screen.dart';
import 'screens/login_screen.dart';
import 'services/area_cientifica_service.dart';
import 'services/dio_service.dart';
import 'services/docente_service.dart';
import 'services/graphql_service.dart';
import 'utils/constants.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize services with error handling
  try {
    DioService().initialize();
    await GraphQLService().initialize();
  } catch (e) {
    print('Error initializing services: $e');
    // Continue anyway - services will be retried on first use
  }

  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProvider(create: (_) => DepartamentoProvider()),
        ChangeNotifierProvider(
          create: (_) => DocenteProvider(DocenteService(DioService().dio)),
        ),
        ChangeNotifierProvider(
          create: (_) => AreaCientificaProvider(AreaCientificaService(DioService().dio)),
        ),
      ],
      child: MaterialApp(
        title: AppConstants.appName,
        debugShowCheckedModeBanner: false,
        theme: ThemeData(
          colorScheme: ColorScheme.fromSeed(
            seedColor: Colors.blue,
            brightness: Brightness.light,
          ),
          useMaterial3: true,
          inputDecorationTheme: InputDecorationTheme(
            filled: true,
            fillColor: Colors.grey[100],
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
          ),
          elevatedButtonTheme: ElevatedButtonThemeData(
            style: ElevatedButton.styleFrom(
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(8),
              ),
            ),
          ),
        ),
        home: const AuthWrapper(),
      ),
    );
  }
}

class AuthWrapper extends StatefulWidget {
  const AuthWrapper({super.key});

  @override
  State<AuthWrapper> createState() => _AuthWrapperState();
}

class _AuthWrapperState extends State<AuthWrapper> {
  @override
  void initState() {
    super.initState();
    // Initialize auth provider
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<AuthProvider>().initialize();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<AuthProvider>(
      builder: (context, authProvider, child) {
        // Show loading screen while initializing
        if (authProvider.isLoading) {
          return const Scaffold(
            body: Center(child: CircularProgressIndicator()),
          );
        }

        // Show appropriate screen based on auth state
        if (authProvider.isAuthenticated) {
          return const HomeScreen();
        } else {
          return const LoginScreen();
        }
      },
    );
  }
}
