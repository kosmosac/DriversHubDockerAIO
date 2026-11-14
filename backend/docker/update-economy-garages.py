#!/usr/bin/env python3

import argparse
import ast
import json
from pathlib import Path


POSITION_FIELDS = ("name", "game", "x", "z")
REQUIRED_FIELDS = (
    "id",
    "name",
    "game",
    "x",
    "z",
    "price",
    "base_slots",
    "slot_price",
)


def parse_args():
    parser = argparse.ArgumentParser(
        description="Merge the current AIO economy garage catalogue into Drivers Hub configuration."
    )
    parser.add_argument("--garages", required=True, type=Path)
    parser.add_argument("--config", action="append", default=[], type=Path)
    parser.add_argument("--python-source", action="append", default=[], type=Path)
    return parser.parse_args()


def load_catalogue(path):
    garages = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(garages, list) or not garages:
        raise ValueError(f"{path} must contain a non-empty JSON array.")

    identifiers = set()
    for index, garage in enumerate(garages):
        if not isinstance(garage, dict):
            raise ValueError(f"Garage {index} is not an object.")
        missing = [field for field in REQUIRED_FIELDS if field not in garage]
        if missing:
            raise ValueError(f"Garage {index} is missing: {', '.join(missing)}.")
        if garage["game"] not in {"ets2", "ats"}:
            raise ValueError(f"Garage {garage['id']} has unsupported game {garage['game']!r}.")
        if garage["id"] in identifiers:
            raise ValueError(f"Duplicate garage ID: {garage['id']}.")
        identifiers.add(garage["id"])
    return garages


def merge_garages(existing, catalogue):
    if not isinstance(existing, list):
        raise ValueError("economy.garages is not a list.")

    canonical = {garage["id"]: garage for garage in catalogue}
    merged = []
    seen = set()
    updated = 0
    custom = 0

    for garage in existing:
        if not isinstance(garage, dict) or not isinstance(garage.get("id"), str):
            raise ValueError("Every existing garage must be an object with a string ID.")
        identifier = garage["id"]
        if identifier in seen:
            raise ValueError(f"Duplicate existing garage ID: {identifier}.")
        seen.add(identifier)

        if identifier in canonical:
            item = dict(garage)
            item.update({field: canonical[identifier][field] for field in POSITION_FIELDS})
            merged.append(item)
            updated += 1
        else:
            merged.append(garage)
            custom += 1

    additions = [dict(garage) for garage in catalogue if garage["id"] not in seen]
    merged.extend(additions)
    return merged, updated, len(additions), custom


def update_json_config(path, catalogue):
    config = json.loads(path.read_text(encoding="utf-8"))
    economy = config.get("economy")
    if not isinstance(economy, dict) or "garages" not in economy:
        raise ValueError(f"{path} does not contain economy.garages.")

    garages, updated, added, custom = merge_garages(economy["garages"], catalogue)
    economy["garages"] = garages
    path.write_text(json.dumps(config, ensure_ascii=False, indent=4) + "\n", encoding="utf-8")
    print(f"{path}: updated {updated}, added {added}, retained {custom} custom garages")


def find_default_garages(module):
    for node in module.body:
        if not isinstance(node, ast.Assign):
            continue
        if not any(isinstance(target, ast.Name) and target.id == "default_config" for target in node.targets):
            continue
        if not isinstance(node.value, ast.Dict):
            break
        for key, value in zip(node.value.keys, node.value.values):
            if isinstance(key, ast.Constant) and key.value == "economy" and isinstance(value, ast.Dict):
                for economy_key, economy_value in zip(value.keys, value.values):
                    if isinstance(economy_key, ast.Constant) and economy_key.value == "garages":
                        return economy_value
    raise ValueError("default_config.economy.garages was not found.")


def source_offset(lines, line_number, byte_column):
    line = lines[line_number - 1]
    prefix = line.encode("utf-8")[:byte_column].decode("utf-8")
    return sum(len(item) for item in lines[: line_number - 1]) + len(prefix)


def update_python_source(path, catalogue):
    source = path.read_text(encoding="utf-8")
    module = ast.parse(source, filename=str(path))
    garages_node = find_default_garages(module)
    if not isinstance(garages_node, ast.List):
        raise ValueError(f"{path} default_config.economy.garages is not a list literal.")

    lines = source.splitlines(keepends=True)
    start = source_offset(lines, garages_node.lineno, garages_node.col_offset)
    end = source_offset(lines, garages_node.end_lineno, garages_node.end_col_offset)
    replacement = repr(catalogue)
    updated_source = source[:start] + replacement + source[end:]

    updated_module = ast.parse(updated_source, filename=str(path))
    updated_node = find_default_garages(updated_module)
    if ast.literal_eval(updated_node) != catalogue:
        raise ValueError(f"Could not verify the updated catalogue in {path}.")
    path.write_text(updated_source, encoding="utf-8")
    print(f"{path}: installed {len(catalogue)} default garages")


def main():
    args = parse_args()
    if not args.config and not args.python_source:
        raise SystemExit("Provide at least one --config or --python-source target.")

    catalogue = load_catalogue(args.garages)
    for path in args.config:
        update_json_config(path, catalogue)
    for path in args.python_source:
        update_python_source(path, catalogue)


if __name__ == "__main__":
    main()
