#!/usr/bin/env python3
"""
Simple HTTPS server for serving Flutter web build
Usage: python3 serve_https.py [port] [cert_path] [key_path]
"""

import http.server
import os
import ssl
import sys


def main():
    # Default values
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    cert_file = sys.argv[2] if len(sys.argv) > 2 else '../certs/localhost+1.pem'
    key_file = sys.argv[3] if len(sys.argv) > 3 else '../certs/localhost+1-key.pem'

    # Resolve certificate paths to absolute paths BEFORE changing directory
    cert_file = os.path.abspath(cert_file)
    key_file = os.path.abspath(key_file)

    # Change to build/web directory
    web_dir = os.path.join(os.path.dirname(__file__), 'build', 'web')
    if os.path.exists(web_dir):
        os.chdir(web_dir)
        print(f"Serving from: {web_dir}")
    else:
        print(f"Error: {web_dir} does not exist. Run 'flutter build web' first.")
        sys.exit(1)

    # Create HTTPS server
    server_address = ('0.0.0.0', port)
    handler_class = http.server.SimpleHTTPRequestHandler
    httpd = http.server.HTTPServer(server_address, handler_class)  # type: ignore[arg-type]

    # Wrap with SSL using secure defaults (Python 3.10+)
    context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
    context.minimum_version = ssl.TLSVersion.TLSv1_2
    context.load_cert_chain(certfile=cert_file, keyfile=key_file)
    httpd.socket = context.wrap_socket(httpd.socket, server_side=True)

    print(f"✓ HTTPS server running on https://0.0.0.0:{port}")
    print(f"✓ Using certificate: {cert_file}")
    print(f"✓ Using key: {key_file}")
    print("\nPress Ctrl+C to stop the server")

    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n\nServer stopped.")
        sys.exit(0)


if __name__ == '__main__':
    main()
