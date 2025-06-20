import requests

from fastmcp import FastMCP, Context

mcp = FastMCP("AgentOps")

HOST = "http://127.0.0.1:8000"


class State:
    def __init__(self, headers: dict = {}):
        self.headers = headers

    def set_token(self, token: str):
        self.headers["Authorization"] = f"Bearer {token}"


state = State()


@mcp.tool
def auth(api_key: str):
    """Authorize using a project API key and store the resulting JWT token.

    Args:
        api_key: Project API key.
    """
    data = {"api_key": api_key}
    response = requests.post(f"{HOST}/public/v1/auth/access_token", json=data).json()
    state.set_token(response.get("bearer"))

    return {"Status": "Success"}


@mcp.tool
def get_project(ctx: Context):
    if not state.headers.get("Authorization"):
        return {"Error": "Authorization error."}
    else:
        response = requests.get(
            f"{HOST}/public/v1/project", headers=state.headers
        ).json()
        return response


@mcp.tool
def get_trace(trace_id: str, ctx: Context):
    response = requests.get(
        f"{HOST}/public/v1/traces/{trace_id}", headers=state.headers
    ).json()
    return response


@mcp.tool
def get_trace_metrics(trace_id: str, ctx: Context):
    response = requests.get(
        f"{HOST}/public/v1/traces/{trace_id}/metrics", headers=state.headers
    ).json()
    return response


@mcp.tool
def get_span(span_id: str, ctx: Context):
    response = requests.get(
        f"{HOST}/public/v1/spans/{span_id}", headers=state.headers
    ).json()
    return response


@mcp.tool
def get_span_metrics(span_id: str, ctx: Context):
    response = requests.get(
        f"{HOST}/public/v1/spans/{span_id}/metrics", headers=state.headers
    ).json()
    return response


if __name__ == "__main__":
    mcp.run(transport="stdio")
