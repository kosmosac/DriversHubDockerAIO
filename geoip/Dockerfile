# syntax=docker/dockerfile:1

FROM python:3.13-alpine

WORKDIR /app

COPY geoip/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir --requirement requirements.txt

COPY geoip/server.py ./server.py

ENV GEOIP_DATABASE=/data/dbip-country-lite.mmdb \
    GEOIP_LISTEN=0.0.0.0 \
    GEOIP_PORT=8080 \
    GEOIP_UPDATE_INTERVAL=86400

VOLUME ["/data"]
EXPOSE 8080

CMD ["python", "/app/server.py"]
