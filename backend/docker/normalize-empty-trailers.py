from pathlib import Path

path = Path("src/apis/tracker/tracksim.py")
source = path.read_text()

car_placeholder = """            # The current frontend assumes that trailers[0] exists while
            # rendering delivery details. Use a neutral placeholder that is
            # ignored by trailer statistics and displayed as unavailable.
            job.setdefault("trailers", [{
                "brand": None,
                "name": None,
                "license_plate": None,
                "license_plate_country": None
            }])
"""
car_empty = '            job.setdefault("trailers", [])\n'
bus_placeholder = """            job["trailers"] = [{
                "brand": None,
                "name": None,
                "license_plate": None,
                "license_plate_country": None
            }]
"""
bus_empty = '            job["trailers"] = []\n'

if car_placeholder in source:
    source = source.replace(car_placeholder, car_empty)
elif car_empty not in source:
    raise SystemExit("Unsupported TrackSim car trailer normalization.")

if bus_placeholder in source:
    source = source.replace(bus_placeholder, bus_empty)
elif bus_empty not in source:
    raise SystemExit("Unsupported TrackSim coach trailer normalization.")

path.write_text(source)
