#!/usr/bin/env python3
"""Serve country lookups and keep a DB-IP Country Lite database current."""

from __future__ import annotations

import gzip
import ipaddress
import os
from pathlib import Path
import shutil
import tempfile
import threading
import time
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.request import Request, urlopen

import maxminddb


DATABASE_PATH = Path(os.environ.get("GEOIP_DATABASE", "/data/dbip-country-lite.mmdb"))
SOURCE_MARKER = DATABASE_PATH.with_suffix(DATABASE_PATH.suffix + ".source-month")
UPDATE_INTERVAL = max(int(os.environ.get("GEOIP_UPDATE_INTERVAL", "86400")), 3600)
LISTEN_ADDRESS = os.environ.get("GEOIP_LISTEN", "0.0.0.0")
LISTEN_PORT = int(os.environ.get("GEOIP_PORT", "8080"))
DOWNLOAD_TEMPLATE = os.environ.get(
    "GEOIP_DOWNLOAD_TEMPLATE",
    "https://download.db-ip.com/free/dbip-country-lite-{month}.mmdb.gz",
)


class CountryDatabase:
    def __init__(self, path: Path) -> None:
        self.path = path
        self._reader = None
        self._lock = threading.Lock()

    def load(self) -> bool:
        if not self.path.is_file():
            return False
        try:
            reader = maxminddb.open_database(str(self.path))
        except Exception as exc:
            print(f"[geoip] Cannot open {self.path}: {exc}", flush=True)
            return False
        with self._lock:
            previous = self._reader
            self._reader = reader
            if previous is not None:
                previous.close()
        return True

    def country(self, value: str) -> str:
        try:
            address = ipaddress.ip_address(value)
        except ValueError:
            return "XX"
        if address.is_private or address.is_loopback or address.is_link_local:
            return "00"
        with self._lock:
            if self._reader is None:
                return "XX"
            try:
                record = self._reader.get(str(address))
            except Exception:
                return "XX"
        if not isinstance(record, dict):
            return "XX"
        country = record.get("country")
        if not isinstance(country, dict):
            return "XX"
        code = country.get("iso_code")
        if isinstance(code, str) and len(code) == 2 and code.isalpha():
            return code.upper()
        return "XX"


DATABASE = CountryDatabase(DATABASE_PATH)


def current_month() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m")


def update_database() -> None:
    month = current_month()
    if DATABASE_PATH.is_file() and SOURCE_MARKER.exists():
        if SOURCE_MARKER.read_text(encoding="ascii").strip() == month:
            return

    DATABASE_PATH.parent.mkdir(parents=True, exist_ok=True)
    url = DOWNLOAD_TEMPLATE.format(month=month)
    print(f"[geoip] Downloading DB-IP Country Lite for {month}", flush=True)
    request = Request(url, headers={"User-Agent": "DriversHubDockerAIO-GeoIP/1"})
    temporary_path: Path | None = None
    try:
        with urlopen(request, timeout=60) as response:
            if response.status != 200:
                raise RuntimeError(f"HTTP {response.status}")
            with tempfile.NamedTemporaryFile(
                dir=DATABASE_PATH.parent, prefix="geoip-", suffix=".mmdb", delete=False
            ) as temporary:
                temporary_path = Path(temporary.name)
                with gzip.GzipFile(fileobj=response) as compressed:
                    shutil.copyfileobj(compressed, temporary)

        validation_reader = maxminddb.open_database(str(temporary_path))
        validation_reader.close()
        os.replace(temporary_path, DATABASE_PATH)
        SOURCE_MARKER.write_text(month + "\n", encoding="ascii")
        if not DATABASE.load():
            raise RuntimeError("downloaded database could not be loaded")
        print(f"[geoip] Active database updated to {month}", flush=True)
    except Exception as exc:
        print(f"[geoip] Database update failed: {exc}", flush=True)
    finally:
        if temporary_path is not None:
            temporary_path.unlink(missing_ok=True)


def updater() -> None:
    while True:
        update_database()
        time.sleep(UPDATE_INTERVAL)


class RequestHandler(BaseHTTPRequestHandler):
    def do_GET(self) -> None:  # noqa: N802
        if self.path == "/health":
            self.send_response(200)
            self.end_headers()
            self.wfile.write(b"ok\n")
            return
        if self.path != "/lookup":
            self.send_error(404)
            return
        country = DATABASE.country(self.headers.get("X-GeoIP-Address", ""))
        self.send_response(200)
        self.send_header("CF-IPCountry", country)
        self.end_headers()

    def log_message(self, format: str, *args: object) -> None:
        return


def main() -> None:
    if DATABASE.load():
        print(f"[geoip] Loaded existing database from {DATABASE_PATH}", flush=True)
    threading.Thread(target=updater, name="geoip-updater", daemon=True).start()
    server = ThreadingHTTPServer((LISTEN_ADDRESS, LISTEN_PORT), RequestHandler)
    print(f"[geoip] Listening on {LISTEN_ADDRESS}:{LISTEN_PORT}", flush=True)
    server.serve_forever()


if __name__ == "__main__":
    main()
