from pathlib import Path


path = Path("src/apis/tracker/unitracker.py")
source = path.read_text()

replacements = [
    (
        '    d = copy.deepcopy(data["JobData"])\n',
        '''    d = copy.deepcopy(data["JobData"])
    bus_events = data.get("scsbusEvents")
    bus_events = bus_events if isinstance(bus_events, list) else []
    job_type = str(d.get("jobType") or "").lower()
    is_coach_job = job_type == "bus" or bool(bus_events) or str(d.get("cargoID") or "").lower() == "passengers"
    is_car_job = job_type == "car"
'''
    ),
    (
        '        et = event_type_mapping[event["name"]]\n',
        '        et = event_type_mapping.get(event["name"], event["name"])\n'
    ),
    (
        '        events.append({"location": {"x": float(event["mapX"]), "mapZ": float(event["mapZ"])},',
        '        events.append({"location": {"x": float(event["mapX"]), "y": 0, "z": float(event["mapZ"])},'
    ),
    (
        '    return {\n        "object": "event",\n',
        '''    if is_coach_job:
        for stop in bus_events[1:-1]:
            if not isinstance(stop, dict):
                continue
            stop_time = stop.get("arrivalTime")
            if not stop_time or stop_time == "0000-00-00 00:00:00":
                stop_time = stop.get("departureTime")
            if not stop_time or stop_time == "0000-00-00 00:00:00":
                continue
            events.append({
                "location": None,
                "real_time": stop_time,
                "time": int(datetime.strptime(stop_time, "%Y-%m-%d %H:%M:%S").replace(tzinfo=timezone.utc).timestamp()),
                "type": "coach.stop",
                "meta": {
                    "at_stop": True,
                    "role": "intermediate",
                    "name": stop.get("stopName") or "N/A",
                    "unique_id": stop.get("stopID"),
                    "passengers_in": int(stop.get("passengersEntering") or 0),
                    "passengers_out": int(stop.get("passengersLeaving") or 0)
                }
            })
        events.sort(key = lambda event: event["time"])

    passenger_count = sum(int(stop.get("passengersEntering") or 0) for stop in bus_events if isinstance(stop, dict))
    stop_count = len(bus_events)
    coach_cargo_name = f"Coach: {passenger_count} passengers, {stop_count} stops"
    coach_mass = int(d["cargoMass"] or 0) or max(passenger_count * 75, 75)
    car_cargo_name = f"Car: {d.get('cargo') or d.get('cargoID') or 'N/A'}"
    car_mass = int(d["cargoMass"] or 0) or 100

    normalized = {
        "object": "event",
'''
    ),
    (
        '                    "name": d["cargo"],\n                    "mass": int(d["cargoMass"]),\n',
        '                    "name": coach_cargo_name if is_coach_job else car_cargo_name if is_car_job else d["cargo"],\n'
        '                    "mass": coach_mass if is_coach_job else car_mass if is_car_job else int(d["cargoMass"]),\n'
    ),
    (
        '                    "unique_id": d["sourceCompanyID"],\n                    "name": d["sourceCompany"]\n',
        '                    "unique_id": "coach_stop" if is_coach_job else d["sourceCompanyID"],\n'
        '                    "name": "Coach Stop" if is_coach_job else d["sourceCompany"]\n'
    ),
    (
        '                    "unique_id": d["destinationCompanyID"],\n                    "name": d["destinationCompany"]\n',
        '                    "unique_id": "coach_stop" if is_coach_job else d["destinationCompanyID"],\n'
        '                    "name": "Coach Stop" if is_coach_job else d["destinationCompany"]\n'
    ),
    (
        '''        }
    }

async def post_update''',
        '''        }
    }
    if is_coach_job:
        job = normalized["data"]["object"]
        job["bus"] = copy.deepcopy(job["truck"])
        job["trailers"] = []
        if events:
            events[0].setdefault("meta", {})["coach_stop"] = {
                "role": "departure",
                "name": bus_events[0].get("stopName") if bus_events else "N/A"
            }
            events[-1].setdefault("meta", {})["coach_stop"] = {
                "role": "destination" if job_event_type == "job.delivered" else "last_reached",
                "name": bus_events[-1].get("stopName") if bus_events else "N/A"
            }
    elif is_car_job:
        job = normalized["data"]["object"]
        job["car"] = copy.deepcopy(job["truck"])
        job["trailers"] = []
    return normalized

async def post_update'''
    )
]

if 'is_car_job = job_type == "car"' in source:
    print("UniTracker Car and Coach normalization already present; no backend changes required.")
else:
    for old, new in replacements:
        if old not in source:
            raise SystemExit(f"Unsupported UniTracker implementation near: {old[:80]!r}")
        source = source.replace(old, new, 1)
    path.write_text(source)
    print("Normalized UniTracker Car and Coach jobs and stop events.")
