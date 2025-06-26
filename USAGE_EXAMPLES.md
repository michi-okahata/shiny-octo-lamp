# AgentOps MCP Server Usage Examples

This document provides practical examples of how to use the AgentOps MCP server with different MCP clients.

## Basic Setup

### 1. Install via NPX (Recommended)

```bash
# Test the server directly
npx agentops-mcp

# Or install globally
npm install -g agentops-mcp
```

### 2. MCP Client Configuration

Add to your MCP client configuration (e.g., Claude Desktop, Windsurf):

```json
{
    "mcpServers": {
        "agentops": {
            "command": "npx",
            "args": ["agentops-mcp"]
        }
    }
}
```

**Note:** No environment variables needed! API keys are passed as parameters to each tool.

## Tool Usage Examples

### Authentication

First, test your API key:

```json
{
    "tool": "auth",
    "parameters": {
        "api_key": "your-agentops-api-key-here"
    }
}
```

**Response:**
```json
{
    "Authorization": "Bearer jwt_token_here"
}
```

### Get Project Information

```json
{
    "tool": "get_project",
    "parameters": {
        "api_key": "your-agentops-api-key-here"
    }
}
```

### Get Trace Information

```json
{
    "tool": "get_trace",
    "parameters": {
        "trace_id": "trace-uuid-here",
        "api_key": "your-agentops-api-key-here"
    }
}
```

### Get Span Information

```json
{
    "tool": "get_span",
    "parameters": {
        "span_id": "span-uuid-here", 
        "api_key": "your-agentops-api-key-here"
    }
}
```

### Get Trace Metrics

```json
{
    "tool": "get_trace_metrics",
    "parameters": {
        "trace_id": "trace-uuid-here",
        "api_key": "your-agentops-api-key-here"
    }
}
```

### Get Span Metrics

```json
{
    "tool": "get_span_metrics",
    "parameters": {
        "span_id": "span-uuid-here",
        "api_key": "your-agentops-api-key-here"
    }
}
```

### Get Complete Trace (Comprehensive)

This tool fetches the trace along with all span information and metrics:

```json
{
    "tool": "get_complete_trace",
    "parameters": {
        "trace_id": "trace-uuid-here",
        "api_key": "your-agentops-api-key-here"
    }
}
```

## Real-World Usage Scenarios

### Scenario 1: Debugging a Failed Agent Run

1. **Get project overview:**
   ```
   Use get_project tool with your API key
   ```

2. **Find recent traces:**
   ```
   Use get_project to see recent activity
   ```

3. **Analyze specific trace:**
   ```
   Use get_complete_trace with the trace ID
   ```

### Scenario 2: Performance Analysis

1. **Get trace metrics:**
   ```
   Use get_trace_metrics to see overall performance
   ```

2. **Drill down into spans:**
   ```
   Use get_span_metrics for detailed timing analysis
   ```

### Scenario 3: Error Investigation

1. **Get complete trace:**
   ```
   Use get_complete_trace to see full execution flow
   ```

2. **Check individual spans:**
   ```
   Use get_span for specific error details
   ```

## Command Line Testing

You can test the server directly from the command line:

```bash
# Test tools listing
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | npx agentops-mcp

# Test auth tool
echo '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"auth","arguments":{"api_key":"your-key"}}}' | npx agentops-mcp

# Test get_project tool
echo '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"get_project","arguments":{"api_key":"your-key"}}}' | npx agentops-mcp
```

## Error Handling

All tools return JSON responses. Common error patterns:

### Authentication Errors
```json
{
    "error": "Request failed with status code 401"
}
```
**Solution:** Check your API key is valid and has proper permissions.

### Invalid Parameters
```json
{
    "error": "Request failed with status code 400"
}
```
**Solution:** Verify trace_id or span_id format and existence.

### Network Errors
```json
{
    "error": "Network Error"
}
```
**Solution:** Check internet connection and AgentOps API status.

## Tips for MCP Client Users

1. **Claude Desktop/Windsurf:** The tools will appear in your tool palette. Simply describe what you want to analyze and the AI will call the appropriate tools with your API key.

2. **API Key Management:** Since API keys are passed as parameters, you can use different keys for different projects or environments.

3. **Batch Operations:** Use `get_complete_trace` for comprehensive analysis, or individual tools for specific data points.

4. **Debugging Workflow:** Start with `get_project` → `get_trace` → `get_complete_trace` for thorough investigation.

## Security Best Practices

- Never hardcode API keys in client configurations
- Use environment variables or secure vaults in production
- Rotate API keys regularly
- Monitor API key usage through AgentOps dashboard

## Getting Your API Key

1. Visit [AgentOps Dashboard](https://app.agentops.ai)
2. Create or select a project
3. Go to Settings → API Keys
4. Generate a new key or copy existing one
5. Use the key as a parameter in tool calls

## Support

For issues with the MCP server:
- Check the [GitHub repository](https://github.com/AgentOps-AI/agentops-mcp)
- Review error messages for specific guidance
- Ensure you're using the latest version: `npm install -g agentops-mcp@latest`

For AgentOps API issues:
- Visit [AgentOps Documentation](https://docs.agentops.ai)
- Check API status at [AgentOps Status Page](https://status.agentops.ai)