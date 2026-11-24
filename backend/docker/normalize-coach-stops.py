from pathlib import Path


path = Path("src/apis/tracker/tracksim.py")
source = path.read_text()

# A present but empty or zero mass must not bypass the Car fallback.
source = source.replace(
    '                cargo.setdefault("mass", 100)\n',
    '                if not isinstance(cargo.get("mass"), (int, float)) or cargo["mass"] <= 0:\n'
    '                    cargo["mass"] = 100\n',
    1
)

# Completed trips use the planned route total. Cancelled trips report only
# stops that were actually reached, while still including the departure stop.
source = source.replace(
    '''            stop_count = stops.get("planned") if isinstance(stops, dict) else None
            if not isinstance(stop_count, (int, float)):
                stop_count = len(stop_items)
            # TrackSim counts route legs/destination stops. Include the
            # departure stop in the user-facing total as ETS2 does.
            stop_count = int(stop_count) + 1
''',
    '''            stop_count = stops.get("planned") if isinstance(stops, dict) else None
            if event_type == "bus_job.completed" and isinstance(stop_count, (int, float)):
                # TrackSim counts route legs/destination stops. Include the
                # departure stop in the user-facing total as ETS2 does.
                stop_count = int(stop_count) + 1
            else:
                stop_count = sum(
                    1 for stop in stop_items
                    if isinstance(stop, dict)
                    and isinstance(stop.get("timings"), dict)
                    and any(
                        isinstance(stop["timings"].get(kind), dict)
                        and stop["timings"][kind].get("actual") is not None
                        for kind in ["arrival", "departure"]
                    )
                )
''',
    1
)
source = source.replace(
    '                "mass": passenger_count * 75,\n',
    '                "mass": max(passenger_count * 75, 75),\n',
    1
)

marker = '''                elif current_type == "bus_job.cancelled":
                    event["type"] = "job.cancelled"
                elif current_type == "speeding" and isinstance(event.get("meta"), dict):
                    event["meta"].setdefault("max_speed", event["meta"].get("speed"))

            start_event = next((event for event in events if isinstance(event, dict) and event.get("type") == "job.started"), None)
'''

replacement = '''                elif current_type == "bus_job.cancelled":
                    event["type"] = "job.cancelled"
                elif current_type == "speeding" and isinstance(event.get("meta"), dict):
                    event["meta"].setdefault("max_speed", event["meta"].get("speed"))

            # stops.items contains the complete ordered stop list, but its
            # arrival and departure values use the in-game clock. Build a
            # conversion timeline from the job boundaries and all events
            # that contain both clocks. Missing stop timestamps can then be
            # interpolated between their surrounding anchors without
            # changing the normal event timeline used by the frontend.
            start_event = next((event for event in events if isinstance(event, dict) and event.get("type") == "job.started"), None)
            final_event = next((event for event in reversed(events) if isinstance(event, dict) and event.get("type") == normalized["type"]), None)
            time_anchors = []
            first_stop = next((stop for stop in stop_items if isinstance(stop, dict)), None)
            reached_stops = [
                stop for stop in stop_items
                if isinstance(stop, dict)
                and isinstance(stop.get("timings"), dict)
                and any(
                    isinstance(stop["timings"].get(kind), dict)
                    and stop["timings"][kind].get("actual") is not None
                    for kind in ["arrival", "departure"]
                )
            ]
            last_stop = reached_stops[-1] if reached_stops else None
            if first_stop is not None and start_event is not None and isinstance(start_event.get("time"), (int, float)):
                timings = first_stop.get("timings")
                departure = timings.get("departure") if isinstance(timings, dict) else None
                game_time = departure.get("actual") if isinstance(departure, dict) else None
                if isinstance(game_time, (int, float)):
                    time_anchors.append((float(game_time), float(start_event["time"])))
            for event in events:
                if not isinstance(event, dict) or not isinstance(event.get("time"), (int, float)):
                    continue
                meta = event.get("meta")
                game_time = meta.get("game_time") if isinstance(meta, dict) else None
                if isinstance(game_time, (int, float)):
                    time_anchors.append((float(game_time), float(event["time"])))
            if last_stop is not None and final_event is not None and isinstance(final_event.get("time"), (int, float)):
                timings = last_stop.get("timings")
                arrival = timings.get("arrival") if isinstance(timings, dict) else None
                game_time = arrival.get("actual") if isinstance(arrival, dict) else None
                if isinstance(game_time, (int, float)):
                    time_anchors.append((float(game_time), float(final_event["time"])))
            time_anchors.sort()

            coach_stop_events = []
            merged_satisfaction_events = set()
            # Each TrackSim item is a route leg. The first source is the
            # departure, every destination except the final one is an
            # intermediate stop, and the final destination is represented by
            # the completion event.
            for position, stop in enumerate(stop_items[:-1]):
                if not isinstance(stop, dict):
                    continue
                timings = stop.get("timings") if isinstance(stop.get("timings"), dict) else {}
                arrival = timings.get("arrival") if isinstance(timings.get("arrival"), dict) else {}
                arrival_game_time = arrival.get("actual")
                if not isinstance(arrival_game_time, (int, float)):
                    continue
                matching_satisfaction = []
                for event in events:
                    if not isinstance(event, dict) or event.get("type") not in ["satisfaction_increase", "satisfaction_decrease"]:
                        continue
                    meta = event.get("meta")
                    if not isinstance(meta, dict) or meta.get("at_stop") is not True:
                        continue
                    if arrival_game_time is not None and meta.get("game_time") == arrival_game_time:
                        matching_satisfaction.append(event)

                destination_city = stop.get("destination", {}).get("city", {})
                if not isinstance(destination_city, dict):
                    destination_city = {}
                passengers = stop.get("passengers") if isinstance(stop.get("passengers"), dict) else {}
                stop_meta = {
                    "at_stop": True,
                    "role": "intermediate",
                    "stop_index": stop.get("index", position),
                    "name": destination_city.get("name") or "N/A",
                    "city": copy.deepcopy(destination_city),
                    "timings": copy.deepcopy(timings),
                    "passengers": copy.deepcopy(passengers),
                    "game_time": arrival_game_time,
                    "satisfaction": [
                        {"type": event.get("type"), "meta": copy.deepcopy(event.get("meta", {}))}
                        for event in matching_satisfaction
                    ]
                }
                stop_event = {"type": "coach.stop", "meta": stop_meta}

                if matching_satisfaction:
                    reference_event = matching_satisfaction[0]
                    for key in ["real_time", "time", "location"]:
                        if key in reference_event:
                            stop_event[key] = copy.deepcopy(reference_event[key])
                    merged_satisfaction_events.update(id(event) for event in matching_satisfaction)
                else:
                    previous_anchor = next((anchor for anchor in reversed(time_anchors) if anchor[0] <= arrival_game_time), None)
                    next_anchor = next((anchor for anchor in time_anchors if anchor[0] >= arrival_game_time), None)
                    if previous_anchor is None or next_anchor is None:
                        continue
                    if previous_anchor[0] == next_anchor[0]:
                        timestamp = previous_anchor[1]
                        estimated = False
                    else:
                        progress = (arrival_game_time - previous_anchor[0]) / (next_anchor[0] - previous_anchor[0])
                        timestamp = previous_anchor[1] + progress * (next_anchor[1] - previous_anchor[1])
                        estimated = True
                    timestamp = round(timestamp)
                    stop_event["time"] = timestamp
                    stop_event["real_time"] = datetime.fromtimestamp(timestamp, timezone.utc).isoformat().replace("+00:00", "Z")
                    stop_event["meta"]["time_estimated"] = estimated
                coach_stop_events.append(stop_event)

            events = [event for event in events if id(event) not in merged_satisfaction_events]
            events.extend(coach_stop_events)
            events.sort(key = lambda event: event.get("time", 0) if isinstance(event, dict) else 0)
            if first_stop is not None and start_event is not None:
                departure_city = first_stop.get("source", {}).get("city", {})
                if not isinstance(departure_city, dict):
                    departure_city = {}
                start_event.setdefault("meta", {})["coach_stop"] = {
                    "role": "departure",
                    "name": departure_city.get("name") or "N/A",
                    "city": copy.deepcopy(departure_city),
                    "timings": copy.deepcopy(first_stop.get("timings", {})),
                    "passengers": copy.deepcopy(first_stop.get("passengers", {}))
                }
            if last_stop is not None and final_event is not None:
                destination_city = last_stop.get("destination", {}).get("city", {})
                if not isinstance(destination_city, dict):
                    destination_city = {}
                final_event.setdefault("meta", {})["coach_stop"] = {
                    "role": "destination" if normalized["type"] == "job.delivered" else "last_reached",
                    "name": destination_city.get("name") or "N/A",
                    "city": copy.deepcopy(destination_city),
                    "timings": copy.deepcopy(last_stop.get("timings", {})),
                    "passengers": copy.deepcopy(last_stop.get("passengers", {}))
                }
            job["events"] = events

            start_event = next((event for event in events if isinstance(event, dict) and event.get("type") == "job.started"), None)
'''

if "coach_stop_events = []" in source:
    print("TrackSim coach stop normalization already present; no backend changes required.")
elif marker not in source:
    raise SystemExit("Unsupported TrackSim coach event normalization.")
else:
    path.write_text(source.replace(marker, replacement, 1))
    print("Normalized TrackSim coach stops from stops.items.")
