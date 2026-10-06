"""Local server for Duka Tracker — quiet, no console needed."""
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
LOG = os.path.join(HERE, "server.log")
# Detach stdio so it survives being launched without a console (WMI/Task Scheduler)
sys.stdin = open(os.devnull, "r")
sys.stdout = open(LOG, "a", buffering=1)
sys.stderr = sys.stdout

from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer


class Quiet(SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass


if __name__ == "__main__":
    os.chdir(HERE)
    httpd = ThreadingHTTPServer(("127.0.0.1", 8080), Quiet)
    print("serving on http://localhost:8080", flush=True)
    httpd.serve_forever()
