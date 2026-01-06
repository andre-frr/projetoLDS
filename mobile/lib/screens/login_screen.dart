import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../providers/auth_provider.dart';
import '../utils/constants.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _usernameController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _obscurePassword = true;

  @override
  void dispose() {
    _usernameController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  void _handleLogin() async {
    if (_formKey.currentState!.validate()) {
      final username = _usernameController.text.trim();
      final email = username.contains('@')
          ? username
          : '$username${AppConstants.emailDomain}';
      final password = _passwordController.text;

      final authProvider = context.read<AuthProvider>();
      final messenger = ScaffoldMessenger.of(context);

      // If password is empty, send a placeholder to trigger NULL password detection
      // The backend will check for NULL password before validating credentials
      final passwordToSend = password.isEmpty
          ? '__CHECK_PASSWORD_SETUP__'
          : password;

      final result = await authProvider.login(email, passwordToSend);

      if (!result && mounted) {
        // Check if password setup is required
        if (authProvider.errorMessage?.contains('Password setup required') ==
                true ||
            authProvider.errorMessage?.contains('Password not set') == true) {
          // Show password setup dialog
          _showPasswordSetupDialog(email);
        } else {
          messenger.showSnackBar(
            SnackBar(
              content: Text(authProvider.errorMessage ?? 'Login failed'),
              backgroundColor: Colors.red,
            ),
          );
        }
      }
    }
  }

  void _showPasswordSetupDialog(String email) {
    final passwordController = TextEditingController();
    final confirmPasswordController = TextEditingController();
    final formKey = GlobalKey<FormState>();

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        title: const Text('Setup Your Password'),
        content: Form(
          key: formKey,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text(
                'This is your first login. Please set up your password.',
                style: TextStyle(fontSize: 14),
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: passwordController,
                obscureText: true,
                decoration: const InputDecoration(
                  labelText: 'New Password',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.lock),
                ),
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Please enter a password';
                  }
                  if (value.length < 8) {
                    return 'Password must be at least 8 characters';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: confirmPasswordController,
                obscureText: true,
                decoration: const InputDecoration(
                  labelText: 'Confirm Password',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.lock_outline),
                ),
                validator: (value) {
                  if (value != passwordController.text) {
                    return 'Passwords do not match';
                  }
                  return null;
                },
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () async {
              if (formKey.currentState!.validate()) {
                final authProvider = context.read<AuthProvider>();
                final messenger = ScaffoldMessenger.of(context);
                final navigator = Navigator.of(context);

                final success = await authProvider.setupPassword(
                  email,
                  passwordController.text,
                );

                if (success) {
                  navigator.pop(); // Close dialog
                  messenger.showSnackBar(
                    const SnackBar(
                      content: Text('Password set successfully! Please login.'),
                      backgroundColor: Colors.green,
                    ),
                  );
                } else {
                  messenger.showSnackBar(
                    SnackBar(
                      content: Text(
                        authProvider.errorMessage ?? 'Failed to set password',
                      ),
                      backgroundColor: Colors.red,
                    ),
                  );
                }
              }
            },
            child: const Text('Set Password'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: SingleChildScrollView(
          child: Padding(
            padding: const EdgeInsets.all(24.0),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 400),
              child: Card(
                elevation: 8,
                child: Padding(
                  padding: const EdgeInsets.all(32.0),
                  child: Consumer<AuthProvider>(
                    builder: (context, authProvider, child) {
                      return Form(
                        key: _formKey,
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            // Logo or Title
                            Icon(
                              Icons.lock_outline,
                              size: 64,
                              color: Theme.of(context).primaryColor,
                            ),
                            const SizedBox(height: 16),
                            Text(
                              'Login',
                              style: Theme.of(context).textTheme.headlineMedium,
                              textAlign: TextAlign.center,
                            ),
                            const SizedBox(height: 32),

                            // Username field (email prefix)
                            TextFormField(
                              controller: _usernameController,
                              enabled: !authProvider.isLoading,
                              keyboardType: TextInputType.text,
                              textInputAction: TextInputAction.next,
                              decoration: InputDecoration(
                                labelText: 'Username',
                                hintText: 'username',
                                helperText:
                                    'Email: username${AppConstants.emailDomain}',
                                prefixIcon: const Icon(Icons.person),
                                suffixText: AppConstants.emailDomain,
                                border: const OutlineInputBorder(),
                              ),
                              validator: (value) {
                                if (value == null || value.isEmpty) {
                                  return 'Please enter your username';
                                }
                                if (value.contains('@')) {
                                  return 'Just enter username (without @domain)';
                                }
                                if (value.contains(' ')) {
                                  return 'Username cannot contain spaces';
                                }
                                return null;
                              },
                            ),
                            const SizedBox(height: 16),

                            // Password field
                            TextFormField(
                              controller: _passwordController,
                              enabled: !authProvider.isLoading,
                              obscureText: _obscurePassword,
                              textInputAction: TextInputAction.done,
                              onFieldSubmitted: (_) => _handleLogin(),
                              decoration: InputDecoration(
                                labelText: 'Password',
                                hintText: 'Leave empty if first login',
                                prefixIcon: const Icon(Icons.lock),
                                border: const OutlineInputBorder(),
                                suffixIcon: IconButton(
                                  icon: Icon(
                                    _obscurePassword
                                        ? Icons.visibility
                                        : Icons.visibility_off,
                                  ),
                                  onPressed: () {
                                    setState(() {
                                      _obscurePassword = !_obscurePassword;
                                    });
                                  },
                                ),
                              ),
                              // Removed validator - allow empty password for first-time setup
                            ),
                            const SizedBox(height: 24),

                            // Login button
                            ElevatedButton(
                              onPressed: authProvider.isLoading
                                  ? null
                                  : _handleLogin,
                              style: ElevatedButton.styleFrom(
                                padding: const EdgeInsets.symmetric(
                                  vertical: 16,
                                ),
                              ),
                              child: authProvider.isLoading
                                  ? const SizedBox(
                                      height: 20,
                                      width: 20,
                                      child: CircularProgressIndicator(
                                        strokeWidth: 2,
                                      ),
                                    )
                                  : const Text(
                                      'Login',
                                      style: TextStyle(fontSize: 16),
                                    ),
                            ),
                            const SizedBox(height: 16),

                            // Register link
                            TextButton(
                              onPressed: () {
                                showDialog(
                                  context: context,
                                  builder: (context) => AlertDialog(
                                    title: const Text('Registro de Conta'),
                                    content: const Text(
                                      'O registro de novas contas é feito por administradores. '
                                      'Entre em contato com o administrador do sistema para criar uma conta.',
                                    ),
                                    actions: [
                                      TextButton(
                                        onPressed: () => Navigator.pop(context),
                                        child: const Text('OK'),
                                      ),
                                    ],
                                  ),
                                );
                              },
                              child: const Text(
                                'Don\'t have an account? Register',
                              ),
                            ),
                          ],
                        ),
                      );
                    },
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
