import os

from pydantic_core.core_schema import ErrorType
import requests
from dotenv import load_dotenv

from fastmcp import FastMCP
from fastmcp.exceptions import FastMCPError

load_dotenv()
mcp = FastMCP("AgentOps")

HOST = os.getenv("HOST", "http://127.0.0.1:8000")  # change default for public API


class State:
    def __init__(self, headers: dict = {}):
        self.headers = headers

    def set_token(self, token: str):
        self.headers["Authorization"] = f"Bearer {token}"

    def get_token(self):
        return self.headers["Authorization"]


state = State()


@mcp.tool
def auth(api_key: str):
    """Authorize using a project API key and store the resulting JWT token.

    Args:
        api_key: AgentOps project API key.
    Returns:
        dict: Error message or success.
    """
    data = {"api_key": api_key}

    try:
        response = requests.post(f"{HOST}/public/v1/auth/access_token", json=data)
        response.raise_for_status()
        state.set_token(response.json().get("bearer"))
    except Exception as e:
        return {"error": str(e)}

    return {"status": "Success."}


def check_auth(state: State):
    if "Authorization" not in state.headers:
        raise KeyError("Authorization error.")


@mcp.tool
def get_project():
    """Get project information."""
    check_auth(state)
    try:
        response = requests.get(f"{HOST}/public/v1/project", headers=state.headers)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        return {"error": str(e)}


@mcp.tool
def get_trace(trace_id: str):
    check_auth(state)
    try:
        response = requests.get(
            f"{HOST}/public/v1/traces/{trace_id}", headers=state.headers
        )
        response.raise_for_status()
        return response.json()
    except Exception as e:
        return {"error": str(e)}


@mcp.tool
def get_trace_metrics(trace_id: str):
    check_auth(state)
    try:
        response = requests.get(
            f"{HOST}/public/v1/traces/{trace_id}/metrics", headers=state.headers
        )
        response.raise_for_status()
        return response.json()
    except Exception as e:
        return {"error": str(e)}


@mcp.tool
def get_span(span_id: str):
    check_auth(state)
    try:
        response = requests.get(
            f"{HOST}/public/v1/spans/{span_id}", headers=state.headers
        )
        response.raise_for_status()
        return response.json()
    except Exception as e:
        return {"error": str(e)}


@mcp.tool
def get_span_metrics(span_id: str):
    check_auth(state)
    try:
        response = requests.get(
            f"{HOST}/public/v1/spans/{span_id}/metrics", headers=state.headers
        )
        response.raise_for_status()
        return response.json()
    except Exception as e:
        return {"error": str(e)}


if __name__ == "__main__":
    mcp.run(transport="stdio")
