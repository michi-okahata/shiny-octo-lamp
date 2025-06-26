#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import axios, { AxiosResponse } from "axios";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

const HOST = process.env["HOST"] || "https://api.agentops.ai";

interface AuthHeaders {
  [key: string]: string;
  Authorization: string;
}

interface ErrorResponse {
  error: string;
}

/**
 * Authorize using an AgentOps project API key and return JWT token headers
 */
async function auth(apiKey: string): Promise<AuthHeaders | ErrorResponse> {
  const data = { api_key: apiKey };

  try {
    const response: AxiosResponse = await axios.post(
      `${HOST}/public/v1/auth/access_token`,
      data,
    );
    const bearer = response.data?.bearer;
    if (!bearer) {
      throw new Error("No bearer token received from auth endpoint");
    }
    return { Authorization: `Bearer ${bearer}` };
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) };
  }
}

/**
 * Clean response by removing empty values
 */
function clean(response: any): any {
  if (typeof response === "object" && response !== null) {
    if (Array.isArray(response)) {
      return response
        .map((item) => clean(item))
        .filter(
          (value) =>
            value !== "" &&
            value !== null &&
            !(Array.isArray(value) && value.length === 0) &&
            !(typeof value === "object" && Object.keys(value).length === 0),
        );
    } else {
      const cleaned: any = {};
      for (const [key, value] of Object.entries(response)) {
        const cleanedValue = clean(value);
        if (
          cleanedValue !== "" &&
          cleanedValue !== null &&
          !(Array.isArray(cleanedValue) && cleanedValue.length === 0) &&
          !(
            typeof cleanedValue === "object" &&
            Object.keys(cleanedValue).length === 0
          )
        ) {
          cleaned[key] = cleanedValue;
        }
      }
      return cleaned;
    }
  }
  return response;
}

/**
 * Make authenticated request to AgentOps API
 */
async function makeAuthenticatedRequest(
  endpoint: string,
  apiKey: string,
): Promise<any> {
  const authResult = await auth(apiKey);
  if ("error" in authResult) {
    throw new Error(`Authentication failed: ${authResult.error}`);
  }

  try {
    const response = await axios.get(`${HOST}${endpoint}`, {
      headers: authResult,
    });
    return clean(response.data);
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : String(error));
  }
}

const server = new Server({
  name: "agentops-mcp",
  version: "0.1.0",
});

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "auth",
        description:
          "Authorize using a AgentOps project API key and store the resulting JWT token.\n    Look for the AgentOps project API key in the primary file or the .env file.\n\n    Args:\n        api_key: AgentOps project API key.\n\n    Returns:\n        dict: Error message or success.\n    ",
        inputSchema: {
          type: "object",
          properties: {
            api_key: {
              type: "string",
              description: "AgentOps project API key",
            },
          },
          required: ["api_key"],
        },
      },
      {
        name: "get_project",
        description:
          "Get project information.\n\n    Returns:\n        dict: Project information or error message.\n    ",
        inputSchema: {
          type: "object",
          properties: {
            api_key: {
              type: "string",
              description: "AgentOps project API key",
            },
          },
          required: ["api_key"],
        },
      },
      {
        name: "get_trace",
        description:
          "Get trace information by ID.\n\n    Args:\n        trace_id\n\n    Returns:\n        dict: Trace information or error message.\n    ",
        inputSchema: {
          type: "object",
          properties: {
            trace_id: {
              type: "string",
              description: "Trace ID",
            },
            api_key: {
              type: "string",
              description: "AgentOps project API key",
            },
          },
          required: ["trace_id", "api_key"],
        },
      },
      {
        name: "get_span",
        description:
          "Get span information by ID.\n\n    Args:\n        span_id\n\n    Returns:\n        dict: Span information or error message.\n    ",
        inputSchema: {
          type: "object",
          properties: {
            span_id: {
              type: "string",
              description: "Span ID",
            },
            api_key: {
              type: "string",
              description: "AgentOps project API key",
            },
          },
          required: ["span_id", "api_key"],
        },
      },
      {
        name: "get_trace_metrics",
        description:
          "Get metrics for a specific trace.\n\n    Args:\n        trace_id\n\n    Returns:\n        dict: Trace metrics or error message.\n    ",
        inputSchema: {
          type: "object",
          properties: {
            trace_id: {
              type: "string",
              description: "Trace ID",
            },
            api_key: {
              type: "string",
              description: "AgentOps project API key",
            },
          },
          required: ["trace_id", "api_key"],
        },
      },
      {
        name: "get_span_metrics",
        description:
          "Get metrics for a specific span.\n\n    Args:\n        span_id\n\n    Returns:\n        dict: Span metrics or error message.\n    ",
        inputSchema: {
          type: "object",
          properties: {
            span_id: {
              type: "string",
              description: "Span ID",
            },
            api_key: {
              type: "string",
              description: "AgentOps project API key",
            },
          },
          required: ["span_id", "api_key"],
        },
      },
      {
        name: "get_complete_trace",
        description:
          "Get COMPLETE trace information and metrics.\n\n    Args:\n        trace_id\n        api_key\n\n    Returns:\n        dict: Complete trace information and metrics or error message.\n    ",
        inputSchema: {
          type: "object",
          properties: {
            trace_id: {
              type: "string",
              description: "Trace ID",
            },
            api_key: {
              type: "string",
              description: "AgentOps project API key",
            },
          },
          required: ["trace_id", "api_key"],
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "auth": {
        const { api_key } = args as { api_key: string };
        const result = await auth(api_key);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "get_project": {
        const { api_key } = args as { api_key: string };
        const result = await makeAuthenticatedRequest(
          "/public/v1/project",
          api_key,
        );
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "get_trace": {
        const { trace_id, api_key } = args as {
          trace_id: string;
          api_key: string;
        };
        const result = await makeAuthenticatedRequest(
          `/public/v1/traces/${trace_id}`,
          api_key,
        );
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "get_span": {
        const { span_id, api_key } = args as {
          span_id: string;
          api_key: string;
        };
        const result = await makeAuthenticatedRequest(
          `/public/v1/spans/${span_id}`,
          api_key,
        );
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "get_trace_metrics": {
        const { trace_id, api_key } = args as {
          trace_id: string;
          api_key: string;
        };
        const result = await makeAuthenticatedRequest(
          `/public/v1/traces/${trace_id}/metrics`,
          api_key,
        );
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "get_span_metrics": {
        const { span_id, api_key } = args as {
          span_id: string;
          api_key: string;
        };
        const result = await makeAuthenticatedRequest(
          `/public/v1/spans/${span_id}/metrics`,
          api_key,
        );
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "get_complete_trace": {
        const { trace_id, api_key } = args as {
          trace_id: string;
          api_key: string;
        };

        // Get the main trace information
        const trace = await makeAuthenticatedRequest(
          `/public/v1/traces/${trace_id}`,
          api_key,
        );

        // Get trace metrics
        const traceMetrics = await makeAuthenticatedRequest(
          `/public/v1/traces/${trace_id}/metrics`,
          api_key,
        );
        trace.metrics = traceMetrics;

        // Get detailed information and metrics for each span
        if (trace.spans && Array.isArray(trace.spans)) {
          for (const spanDict of trace.spans) {
            if (spanDict.span_id) {
              try {
                const spanInfo = await makeAuthenticatedRequest(
                  `/public/v1/spans/${spanDict.span_id}`,
                  api_key,
                );
                const spanMetrics = await makeAuthenticatedRequest(
                  `/public/v1/spans/${spanDict.span_id}/metrics`,
                  api_key,
                );

                spanDict.information = spanInfo;
                spanDict.metrics = spanMetrics;
              } catch (error) {
                // Continue processing other spans if one fails
                spanDict.error =
                  error instanceof Error ? error.message : String(error);
              }
            }
          }
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(trace, null, 2),
            },
          ],
        };
      }

      default:
        throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({ error: errorMessage }, null, 2),
        },
      ],
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("AgentOps MCP server running on stdio");
}

// Handle process signals gracefully
process.on("SIGINT", () => {
  console.error("Received SIGINT, shutting down gracefully");
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.error("Received SIGTERM, shutting down gracefully");
  process.exit(0);
});

if (require.main === module) {
  main().catch((error) => {
    console.error("Server error:", error);
    process.exit(1);
  });
}
