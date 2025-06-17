import requests

from fastmcp import FastMCP, Context

mcp = FastMCP("AgentOps")

HOST = "http://0.0.0.0:8000"

class State:
    def __init__(self, headers: dict = {}):
        self.headers = headers

    def set_token(self, token: str):
        self.headers["Authorization"] = f"Bearer {token}"

state = State()

"""
pass session id?
pass auth api?

prompt with context for schemas that are returned?

primitives
abstraction / use cases
  # ideally -> can plug into agents -> improve coding

minimal set of primitives
build abstractions WITHOUT ovewhelming the model

when is try/except necessary?
handle decoding

api actually exposed?
how does auth + token work, which api key?

limit this? unsure if it would help
probably a question of prompting
ai agent should be able to access .env/etc to find the api keys
"""

# provide some example for how to get the api key
# prompt -> workflow for finding api key (init, env)

@mcp.tool
def authenticate(api_key: str, ctx: Context):
    """Authentication by project API key"""
    data = {"api_key": api_key}
    response = requests.post(f"{HOST}/public/v1/auth/access_token", json=data).json()
    state.set_token(response.get("bearer"))

@mcp.tool
def get_project(ctx: Context):
    response = requests.get(f"{HOST}/public/v1/project").json()
    return response

@mcp.tool
def get_trace(trace_id: str, ctx: Context):
    response = requests.get(f"{HOST}/public/v1/traces/{trace_id}").json()
    return response

@mcp.tool
def get_trace_metrics(trace_id: str, ctx: Context):
    response = requests.get(f"{HOST}/public/v1/traces/{trace_id}/metrics").json()
    return response

@mcp.tool
def get_span(span_id: str, ctx: Context):
    response = requests.get(f"{HOST}/public/v1/spans/{span_id}").json()
    return response

@mcp.tool
def get_span_metrics(span_id: str, ctx: Context):
    response = requests.get(f"{HOST}/public/v1/spans/{span_id}/metrics").json()
    return response

# v. resources?
