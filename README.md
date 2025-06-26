# AgentOps MCP Server (TypeScript)

A Model Context Protocol (MCP) server that provides access to the AgentOps Public API for observing and debugging AI agent runs.

## Features

- **Authentication**: Authorize using AgentOps project API keys
- **Project Information**: Get project details and configuration
- **Trace Management**: Retrieve trace information and metrics
- **Span Analysis**: Access span data and performance metrics
- **Complete Trace Data**: Get comprehensive trace information with all spans and metrics

## Installation

### Using npx (Recommended)

```bash
npx agentops-mcp
```

### Local Development

```bash
# Clone and setup
git clone <repository-url>
cd mcp
npm install

# Build the project
npm run build

# Run the server
npm start

# Or run in development mode
npm run dev
```

## Usage

### Configuration

The server connects to the AgentOps API at `https://api.agentops.ai`. All tools require your AgentOps API key to be passed as a parameter.

### MCP Client Configuration

#### Claude Desktop / Windsurf

Add to your MCP configuration file:

```json
{
    "mcpServers": {
        "agentops-mcp": {
            "command": "npx",
            "args": ["agentops-mcp"],
            "env": {
              "AGENTOPS_API_KEY": "API_KEY_OPTIONAL"
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

**Parameters:**
- `api_key` (string): Your AgentOps project API key

### `get_trace`
Retrieve trace information by ID.

**Parameters:**
- `trace_id` (string): The trace ID to retrieve
- `api_key` (string): Your AgentOps project API key

### `get_span`
Get span information by ID.

**Parameters:**
- `span_id` (string): The span ID to retrieve
- `api_key` (string): Your AgentOps project API key

### `get_trace_metrics`
Get performance metrics for a specific trace.

**Parameters:**
- `trace_id` (string): The trace ID
- `api_key` (string): Your AgentOps project API key

### `get_span_metrics`
Get performance metrics for a specific span.

**Parameters:**
- `span_id` (string): The span ID
- `api_key` (string): Your AgentOps project API key

### `get_complete_trace`
Get comprehensive trace information including all spans and their metrics.

**Parameters:**
- `trace_id` (string): The trace ID
- `api_key` (string): Your AgentOps project API key

## Development

### Building

```bash
npm run build
```

### Running in Development Mode

```bash
npm run dev
```

## Error Handling

All tools return JSON responses. On error, you'll receive:

```json
{
  "error": "Error message describing what went wrong"
}
```

## Requirements

- Node.js >= 18.0.0
- AgentOps API key (passed as parameter to tools)

## License

MIT
