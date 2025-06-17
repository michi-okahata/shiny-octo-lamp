import requests

from fastmcp import FastMCP

mcp = FastMCP("AgentOps")

HOST = "http://0.0.0.0:8000"
API = "SET_API_KEY" # via model? tool that sets the constant? 

# pass session id?
# pass auth api?

# primitives
# abstraction / use cases
    # ideally -> can plug into agents -> improve coding

# minimal set of primitives
# build abstractions WITHOUT ovewhelming the model\

# when is try/except necessary?
# handle decoding

# limit this? unsure if it would help
# probably a question of prompting
@mcp.tool()
async def set_access(token: str):
    body = {"api_key": token}
    requests.get(f"{HOST}/public/v1/auth/access_token", body)

    # validate, also network request

@mcp.resource("agentops://project")
async def get_docs():
    response = requests.get(f"{HOST}/public/v1/project")
    return response
