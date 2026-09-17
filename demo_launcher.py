#!/usr/bin/env python3
"""
SIH 26105 — Demo Launcher
Serves all three standalone web apps on separate ports for the SIH demonstration.

Apps:
  - App 1 (Attacker Console):   http://localhost:8080
  - App 2 (CyberOptRQ):         http://localhost:5173 (npm run dev)
  - App 3 (Bad Apple):          http://localhost:5174

This script serves App 1 and App 3 using Python's built-in http.server.
Run CyberOptRQ (App 2) separately with 'npm run dev' in the frontend/ directory.
"""

import http.server
import threading
import os
import sys

APPS = {
    "Attacker Console": {
        "port": 8080,
        "dir": os.path.join(os.path.dirname(__file__), "attacker-console"),
    },
    "Bad Apple Visualizer": {
        "port": 5174,
        "dir": os.path.join(os.path.dirname(__file__), "bad-apple-visualizer"),
    },
}


import functools

class CORSHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Cross-Origin-Opener-Policy", "same-origin")
        self.send_header("Cross-Origin-Embedder-Policy", "require-corp")
        super().end_headers()

    def log_message(self, format, *args):
        pass  # Suppress logs for cleaner output


def serve_app(name, port, directory):
    handler = functools.partial(CORSHTTPRequestHandler, directory=directory)
    server = http.server.HTTPServer(("", port), handler)
    print(f"  [OK] {name:<25} -> http://localhost:{port}")
    server.serve_forever()


if __name__ == "__main__":
    print("\n" + "=" * 60)
    print("  SIH 26105 - CyberOptRQ Three-App Demo Launcher")
    print("=" * 60)
    print()

    threads = []
    for name, config in APPS.items():
        if not os.path.isdir(config["dir"]):
            print(f"  [X] {name}: directory not found: {config['dir']}")
            continue
        t = threading.Thread(
            target=serve_app,
            args=(name, config["port"], config["dir"]),
            daemon=True,
        )
        threads.append(t)

    for t in threads:
        t.start()

    print("  App 1: Attacker Console      -> http://localhost:8080")
    print("  App 2: CyberOptRQ Dashboard  -> http://localhost:5173 (npm run dev)")
    print("  App 3: Bad Apple Visualizer  -> http://localhost:5174")
    print()
    print("  Backend: uvicorn app.main:app --port 8000 (in backend/ directory)")
    print()
    print("  Architecture:")
    print("    Attacker Console")
    print("      | POST /api/v1/demo/attack/start")
    print("    CyberOptRQ Backend")
    print("      | state broadcast via GET /api/v1/demo/attack/state")
    print("    +----------------------------------------+")
    print("    CyberOptRQ Dashboard    Bad Apple Visualizer")
    print("    (reads real P1-P6 EAL)  (cinematic layer only)")
    print()
    print("  Press Ctrl+C to stop all servers.")
    print("=" * 60 + "\n")

    try:
        for t in threads:
            t.join()
    except KeyboardInterrupt:
        print("\n  Demo servers stopped.")
        sys.exit(0)
