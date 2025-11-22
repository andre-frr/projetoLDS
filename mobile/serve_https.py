#!/usr/bin/env python3
"""
Simple HTTPS server for serving Flutter web build
Usage: python3 serve_https.py [port] [cert_path] [key_path]
"""

import http.server
import ssl
import sys
import os

def main():
    # Default values
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    cert_file = sys.argv[2] if len(sys.argv) > 2 else '../certs/localhost+1.pem'
    key_file = sys.argv[3] if len(sys.argv) > 3 else '../certs/localhost+1-key.pem'
    
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
    httpd = http.server.HTTPServer(server_address, http.server.SimpleHTTPRequestHandler)
    
    # Wrap with SSL
    context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
    context.load_cert_chain(certfile=cert_file, keyfile=key_file)
    httpd.socket = context.wrap_socket(httpd.socket, server_side=True)
    
    print(f"✓ HTTPS server running on https://0.0.0.0:{port}")
    print(f"✓ Using certificate: {cert_file}")
    print(f"✓ Using key: {key_file}")
    print(f"\nPress Ctrl+C to stop the server")
    
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n\nServer stopped.")
        sys.exit(0)

if __name__ == '__main__':
    main()
