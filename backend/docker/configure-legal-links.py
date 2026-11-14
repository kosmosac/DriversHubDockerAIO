#!/usr/bin/env python3

from pathlib import Path


path = Path("src/external_plugins/client-config.py")
source = path.read_text(encoding="utf-8")

aio_repository_url = "https://github.com/kosmosac/DriversHubDockerAIO"

if "LEGAL_URL_KEYS =" in source and aio_repository_url in source:
    print("Compatible legal-link and source-credit support detected; no backend changes required.")
    raise SystemExit(0)

legal_replacements = [
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

if "LEGAL_URL_KEYS =" not in source:
    for old, new in legal_replacements:
        count = source.count(old)
        if count != 1:
            raise RuntimeError(f"Expected one backend marker, found {count}: {old[:80]!r}")
        source = source.replace(old, new, 1)

source_replacements = [
    (
        'LEGAL_URL_KEYS = ("privacy_policy", "cookie_policy", "imprint")\n',
        'LEGAL_URL_KEYS = ("privacy_policy", "cookie_policy", "imprint")\n'
        'SOURCE_REPOSITORIES = (\n'
        '    {"name": "HubFrontend", "url": "https://github.com/CharlesWithC/HubFrontend"},\n'
        '    {"name": "HubBackend", "url": "https://github.com/CharlesWithC/HubBackend"},\n'
        '    {"name": "DriversHubDockerAIO", "url": "https://github.com/kosmosac/DriversHubDockerAIO"},\n'
        ')\n',
    ),
    (
        '    config["legal_urls"] = {key: legal_urls.get(key, "") for key in LEGAL_URL_KEYS}\n'
        '    return config\n',
        '    config["legal_urls"] = {key: legal_urls.get(key, "") for key in LEGAL_URL_KEYS}\n'
        '    config["source_repositories"] = [dict(repository) for repository in SOURCE_REPOSITORIES]\n'
        '    return config\n',
    ),
]

if "SOURCE_REPOSITORIES =" not in source:
    for old, new in source_replacements:
        count = source.count(old)
        if count != 1:
            raise RuntimeError(f"Expected one source-credit marker, found {count}: {old[:80]!r}")
        source = source.replace(old, new, 1)
elif aio_repository_url not in source:
    marker = "SOURCE_REPOSITORIES = (\n"
    count = source.count(marker)
    if count != 1:
        raise RuntimeError(f"Expected one upstream source repository declaration, found {count}.")
    source = source.replace(
        marker,
        marker + f'    {{"name": "DriversHubDockerAIO", "url": "{aio_repository_url}"}},\n',
        1,
    )

compile(source, str(path), "exec")
required = [
    "LEGAL_URL_KEYS =",
    aio_repository_url,
    'config["legal_urls"] =',
    'newconfig["legal_urls"] = normalized_legal_urls',
    'config["source_repositories"] = [dict(repository) for repository in SOURCE_REPOSITORIES]',
    '"legal_urls": {key: "" for key in LEGAL_URL_KEYS}',
]
if any(marker not in source for marker in required):
    raise RuntimeError("The generated backend implementation is incomplete.")

path.write_text(source, encoding="utf-8")
print("Added Hub-specific legal links and source credits to the client configuration.")
