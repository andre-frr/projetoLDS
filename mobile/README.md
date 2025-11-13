# Flutter Mobile App

## Overview
Flutter Web application for the LDS project with secure authentication and API integration.

## Project Structure

```
lib/
├── main.dart                   # App entry point
├── models/                     # Data models
│   ├── user_model.dart
│   └── departamento_model.dart
├── services/                   # API and business logic
│   ├── auth_service.dart
│   ├── dio_service.dart
│   ├── graphql_service.dart
│   ├── storage_service.dart
│   └── departamento_service.dart
├── providers/                  # State management (Provider)
│   ├── auth_provider.dart
│   └── departamento_provider.dart
├── screens/                    # UI screens
│   ├── login_screen.dart
│   └── home_screen.dart
├── widgets/                    # Reusable components
└── utils/                      # Utilities and constants
    └── constants.dart
```

## Setup

### Prerequisites
- Flutter SDK (latest stable)
- Dart SDK
- A code editor (VS Code, Android Studio, IntelliJ)

### Installation

1. Install dependencies:
```bash
flutter pub get
```

2. Configure environment variables:
   - Edit `.env` file with your API endpoints
   - Default: `https://localhost:3000/api`

3. Run the app:
```bash
# For web
flutter run -d chrome

# For development with hot reload
flutter run -d chrome --web-browser-flag "--disable-web-security"
```

## Environment Variables

Create a `.env` file in the `mobile/` directory:

```env
API_BASE_URL=https://localhost:3000/api
GRAPHQL_URL=https://localhost:3000/graphql
ENVIRONMENT=development
```

## Features

### Implemented
- ✅ JWT Authentication with automatic token refresh
- ✅ Secure token storage (flutter_secure_storage)
- ✅ HTTP client with interceptors (Dio)
- ✅ GraphQL client support
- ✅ State management with Provider
- ✅ Login/Logout functionality
- ✅ Responsive UI
- ✅ Error handling

### To Be Implemented
- 🔲 CRUD screens for all entities
- 🔲 Form validation
- 🔲 Search and filtering
- 🔲 Data tables
- 🔲 User registration flow
- 🔲 Settings screen

## Architecture

### State Management
Uses **Provider** for state management:
- `AuthProvider` - Manages authentication state
- `DepartamentoProvider` - Example entity provider

### Services Layer
- `DioService` - HTTP client with automatic token refresh
- `GraphQLService` - GraphQL client
- `AuthService` - Authentication logic
- `StorageService` - Secure local storage
- Entity-specific services (e.g., `DepartamentoService`)

### API Integration
- Automatic token refresh when tokens are about to expire
- Retry failed requests after token refresh
- Secure HTTPS with self-signed certificate support (development)

## Development Guidelines

### Creating a New Entity

1. **Create Model** (`models/entity_model.dart`):
```dart
class EntityModel {
  final int id;
  final String name;
  
  EntityModel({required this.id, required this.name});
  
  factory EntityModel.fromJson(Map<String, dynamic> json) {
    return EntityModel(
      id: json['id'],
      name: json['name'],
    );
  }
  
  Map<String, dynamic> toJson() => {'id': id, 'name': name};
}
```

2. **Create Service** (`services/entity_service.dart`):
```dart
class EntityService {
  final _dio = DioService().dio;
  static const String _basePath = '/entity';
  
  Future<List<EntityModel>> getAll() async {
    final response = await _dio.get(_basePath);
    return (response.data as List)
        .map((json) => EntityModel.fromJson(json))
        .toList();
  }
}
```

3. **Create Provider** (`providers/entity_provider.dart`):
```dart
class EntityProvider with ChangeNotifier {
  final _service = EntityService();
  List<EntityModel> _items = [];
  
  Future<void> loadAll() async {
    _items = await _service.getAll();
    notifyListeners();
  }
}
```

4. **Create Screen** (`screens/entity_screen.dart`):
```dart
class EntityScreen extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Consumer<EntityProvider>(
      builder: (context, provider, child) {
        // Build UI
      },
    );
  }
}
```

## Testing

Run tests:
```bash
flutter test
```

Run tests with coverage:
```bash
flutter test --coverage
```

## Building for Production

### Web
```bash
flutter build web --release
```

Output will be in `build/web/`

### Android
```bash
flutter build apk --release
```

### iOS
```bash
flutter build ios --release
```

## Troubleshooting

### HTTPS Certificate Issues
For development with self-signed certificates, the app is configured to accept them. In production, use valid SSL certificates.

### Token Refresh Issues
Check the token expiry time and refresh buffer in `utils/constants.dart`:
```dart
static const Duration tokenRefreshBuffer = Duration(minutes: 5);
```

### CORS Issues
When running on web, you may need to disable web security for development:
```bash
flutter run -d chrome --web-browser-flag "--disable-web-security"
```

## Dependencies

Main dependencies:
- `http` - Basic HTTP client
- `dio` - Advanced HTTP client with interceptors
- `graphql_flutter` - GraphQL client
- `provider` - State management
- `flutter_secure_storage` - Secure token storage
- `jwt_decoder` - JWT token handling
- `go_router` - Navigation
- `flutter_dotenv` - Environment configuration
- `logger` - Logging

## License

[Your License]

