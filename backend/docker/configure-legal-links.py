#!/usr/bin/env python3

from pathlib import Path


path = Path("src/external_plugins/client-config.py")
source = path.read_text(encoding="utf-8")

if "LEGAL_URL_KEYS =" in source:
    print("Compatible legal-link support detected; no backend changes required.")
    raise SystemExit(0)

replacements = [
    (
        "from functions import *\n\n\n",
        'from functions import *\n\n\nLEGAL_URL_KEYS = ("privacy_policy", "cookie_policy", "imprint")\n\n\n',
    ),
    (
        '    config["api_host"] = api_host\n    return config\n',
        '    config["api_host"] = api_host\n'
        '    legal_urls = config.get("legal_urls", {})\n'
        '    if type(legal_urls) != dict:\n'
        '        legal_urls = {}\n'
        '    config["legal_urls"] = {key: legal_urls.get(key, "") for key in LEGAL_URL_KEYS}\n'
        '    return config\n',
    ),
    (
        '        newconfig = data["config"]\n'
        '        whitelist = ["abbr", "name", "color",',
        '        newconfig = data["config"]\n'
        '        legal_urls = newconfig.get("legal_urls", {})\n'
        '        if type(legal_urls) != dict:\n'
        '            raise ValueError("legal_urls must be an object")\n'
        '        normalized_legal_urls = {}\n'
        '        for key in LEGAL_URL_KEYS:\n'
        '            url = legal_urls.get(key, "")\n'
        '            if type(url) != str or len(url) > 2048:\n'
        '                raise ValueError("Invalid legal URL")\n'
        '            url = url.strip()\n'
        '            if url and not (isurl(url) and (url.startswith("https://") or url.startswith("http://localhost"))):\n'
        '                raise ValueError("Legal URLs must use HTTPS")\n'
        '            normalized_legal_urls[key] = url\n'
        '        newconfig["legal_urls"] = normalized_legal_urls\n'
        '        whitelist = ["abbr", "name", "color",',
    ),
    (
        '"truckersmp_vtc_id", "gallery"]',
        '"truckersmp_vtc_id", "legal_urls", "gallery"]',
    ),
    (
        '            "truckersmp_vtc_id": 0,\n'
        '            "logo_key": "",',
        '            "truckersmp_vtc_id": 0,\n'
        '            "legal_urls": {key: "" for key in LEGAL_URL_KEYS},\n'
        '            "logo_key": "",',
    ),
]

for old, new in replacements:
    count = source.count(old)
    if count != 1:
        raise RuntimeError(f"Expected one backend marker, found {count}: {old[:80]!r}")
    source = source.replace(old, new, 1)

compile(source, str(path), "exec")
required = [
    "LEGAL_URL_KEYS =",
    'config["legal_urls"] =',
    'newconfig["legal_urls"] = normalized_legal_urls',
    '"truckersmp_vtc_id", "legal_urls", "gallery"',
    '"legal_urls": {key: "" for key in LEGAL_URL_KEYS}',
]
if any(marker not in source for marker in required):
    raise RuntimeError("The generated backend implementation is incomplete.")

path.write_text(source, encoding="utf-8")
print("Added Hub-specific legal links to the client configuration.")
