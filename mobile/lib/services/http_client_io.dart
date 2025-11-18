// Platform-specific implementation for mobile/desktop
import 'dart:io';

import 'package:dio/dio.dart';
import 'package:dio/io.dart';

void configureDioForPlatform(Dio dio) {
  // Allow self-signed certificates for development (localhost)
  (dio.httpClientAdapter as IOHttpClientAdapter).createHttpClient = () {
    final client = HttpClient();
    client.badCertificateCallback =
        (X509Certificate cert, String host, int port) => true;
    return client;
  };
}
