import 'package:graphql_flutter/graphql_flutter.dart';
import 'package:logger/logger.dart';

import '../utils/constants.dart';
import 'storage_service.dart';

class GraphQLService {
  static final GraphQLService _instance = GraphQLService._internal();

  factory GraphQLService() => _instance;

  GraphQLService._internal();

  late GraphQLClient _client;
  final _storage = StorageService();
  final _logger = Logger();

  GraphQLClient get client => _client;

  Future<void> initialize() async {
    final httpLink = HttpLink(
      ApiConstants.graphqlUrl,
      defaultHeaders: {'Content-Type': 'application/json'},
    );

    final authLink = AuthLink(
      getToken: () async {
        final token = await _storage.read(ApiConstants.accessTokenKey);
        return token != null ? 'Bearer $token' : null;
      },
    );

    // Allow self-signed certificates for development
    // Note: GraphQL Flutter uses its own HTTP client configuration
    // final httpClient = HttpClient()
    //   ..badCertificateCallback = (cert, host, port) => true;

    final link = authLink.concat(httpLink);

    _client = GraphQLClient(
      link: link,
      cache: GraphQLCache(store: InMemoryStore()),
    );

    _logger.i('GraphQLService initialized');
  }

  Future<QueryResult> query(
    String query, {
    Map<String, dynamic>? variables,
  }) async {
    try {
      final result = await _client.query(
        QueryOptions(
          document: gql(query),
          variables: variables ?? {},
          fetchPolicy: FetchPolicy.networkOnly,
        ),
      );

      if (result.hasException) {
        _logger.e('GraphQL Query Error: ${result.exception}');
      }

      return result;
    } catch (e) {
      _logger.e('GraphQL Query Error: $e');
      rethrow;
    }
  }
}
