"""Minimal backend counterpart for the frontend plugin example."""

from fastapi import Request
from fastapi.responses import JSONResponse
from fastapi.routing import APIRoute


async def get_example_message(request: Request):
    return {
        "hub": request.app.config.name,
        "message": "The frontend plugin example is active for this Hub.",
    }


def init(config: dict, print_log: bool = False):
    routes = [
        APIRoute("/frontend-plugin-example/message", get_example_message, methods=["GET"], response_class=JSONResponse),
    ]
    return (True, routes, {}, {})
