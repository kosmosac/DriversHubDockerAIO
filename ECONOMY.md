# Economy garages

The AIO deployment includes an updated garage catalogue for Euro Truck
Simulator 2 and American Truck Simulator. It currently contains 361 garages:
237 for ETS2 and 124 for ATS.

The backend image uses this catalogue for new default configurations. An
existing `config/config.json` is not overwritten during a build. Update it on
the Docker host with:

```bash
python3 backend/docker/update-economy-garages.py \
  --garages examples/economy-garages.json \
  --config config/config.json
docker compose restart backend bannergen
```

The command can be run again after later AIO updates. For garages already in
the configuration it updates the name, game, and map position while retaining
the configured purchase price, base slots, slot price, and additional fields.
It adds missing catalogue entries and leaves operator-defined garages intact.

Back up `config/config.json` before changing it. The command reports how many
garages it updated, added, and retained as custom entries.

## Administration interface

The complete list is also available as
[`examples/economy-garages.csv`](examples/economy-garages.csv). It can be
imported through the economy configuration in the administration interface.
The frontend import replaces the complete garage list and therefore does not
retain locally changed prices or custom garages. Prefer the command above for
an existing installation.
