# AgentOps MCP Server (TypeScript)

[![smithery badge](https://smithery.ai/badge/@AgentOps-AI/agentops-mcp)](https://smithery.ai/server/@AgentOps-AI/agentops-mcp)

The AgentOps MCP server provides access to observability and tracing data for debugging complex AI agent runs. This adds crucial context about where the AI agent succeeds or fails.

## Installation

### Installing via Smithery

To install agentops-mcp for Claude Desktop automatically via [Smithery](https://smithery.ai/server/@AgentOps-AI/agentops-mcp):

```bash
npx -y @smithery/cli install @AgentOps-AI/agentops-mcp --client claude
```

### Local Development

```bash
# Clone and setup
git clone https://github.com/AgentOps-AI/agentops-mcp.git
cd mcp
npm install

# Build the project
npm run build

# Run the server
npm pack
```

## Usage

### Configuration

The server connects to the AgentOps API at `https://api.agentops.ai`.

### MCP Client Configuration

Add to your MCP configuration file:

```json
{
    "mcpServers": {
        "agentops-mcp": {
            "command": "npx",
            "args": ["agentops-mcp"],
            "env": {
              "AGENTOPS_API_KEY": "PROJECT_KEY_OPTIONAL"
            }
        }
    }
}
```

## Available Tools

### `auth`
Authorize using an AgentOps project API key and return JWT token.

**Parameters:**
- `api_key` (string): Your AgentOps project API key

**Returns:**
- Authorization headers object or error message

### `get_project`
Get project information and configuration.

### `get_trace`
Retrieve trace information by ID.

**Parameters:**
- `trace_id` (string): The trace ID to retrieve

### `get_span`
Get span information by ID.

**Parameters:**
- `span_id` (string): The span ID to retrieve

### `get_trace_metrics`
Get performance metrics for a specific trace.

**Parameters:**
- `trace_id` (string): The trace ID

### `get_span_metrics`
Get performance metrics for a specific span.

**Parameters:**
- `span_id` (string): The span ID

### `get_complete_trace`
Get comprehensive trace information including all spans and their metrics.

**Parameters:**
- `trace_id` (string): The trace ID

## Requirements

- Node.js >= 18.0.0
- AgentOps API key (passed as parameter to tools)
