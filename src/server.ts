#!/usr/bin/env node

// Ensure we can find node even with version managers
if (!process.env["NODE_PATH"]) {
  process.env["NODE_PATH"] = __dirname + "/node_modules";
}

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import axios, { AxiosResponse } from "axios";

const HOST = "https://api.agentops.ai";

interface AuthHeaders {
  [key: string]: string;
  Authorization: string;
}

interface ErrorResponse {
  error: string;
}

// Server state to hold JWT token
class ServerState {
  private jwtToken: string | null = null;

  setJwtToken(token: string): void {
    this.jwtToken = token;
  }

  getAuthHeaders(): AuthHeaders | null {
    if (!this.jwtToken) {
      return null;
    }
    return { Authorization: `Bearer ${this.jwtToken}` };
  }

  isAuthenticated(): boolean {
    return this.jwtToken !== null;
  }

  clearAuth(): void {
    this.jwtToken = null;
  }
}

const serverState = new ServerState();

/**
 * Initialize authentication on server startup if API key is available
 */
async function initializeAuth(): Promise<void> {
  const apiKey = process.env["AGENTOPS_API_KEY"];
  if (apiKey) {
    try {
      const authResult = await authWithApiKey(apiKey);
      if (typeof authResult === "string") {
        serverState.setJwtToken(authResult);
        console.error(
          "Auto-authentication successful using environment variable",
        );
      } else {
        console.error(`Auto-authentication failed: ${authResult.error}`);
      }
    } catch (error) {
      console.error(
        `Auto-authentication error: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}

/**
 * Authorize using an AgentOps project API key and return JWT token
 */
async function authWithApiKey(apiKey: string): Promise<string | ErrorResponse> {
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
    return bearer;
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
 * Make authenticated request to AgentOps API using stored JWT token
 */
async function makeAuthenticatedRequest(endpoint: string): Promise<any> {
  const authHeaders = serverState.getAuthHeaders();
  if (!authHeaders) {
    throw new Error(
      "Not authenticated. Please use the 'auth' tool first with your AgentOps API key.",
    );
  }

  try {
    const response = await axios.get(`${HOST}${endpoint}`, {
      headers: authHeaders,
    });
    return clean(response.data);
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : String(error));
  }
}

const server = new Server({
  name: "agentops-mcp",
  version: "0.3.0",
});

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "auth",
        description:
          "Authorize using a AgentOps project API key and store the resulting JWT token.\n    Note: If AGENTOPS_API_KEY environment variable is set, authentication happens automatically on startup.\n\n    Args:\n        api_key: AgentOps project API key (optional if AGENTOPS_API_KEY env var is set).\n\n    Returns:\n        dict: Error message or success.\n    ",
        inputSchema: {
          type: "object",
          properties: {
            api_key: {
              type: "string",
              description:
                "AgentOps project API key (optional if AGENTOPS_API_KEY environment variable is set)",
            },
          },
          required: [],
        },
      },
      {
        name: "get_project",
        description:
          "Get project information.\n\n    Returns:\n        dict: Project information or error message.\n    ",
        inputSchema: {
          type: "object",
          properties: {},
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
          },
          required: ["trace_id"],
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
          },
          required: ["span_id"],
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
          },
          required: ["trace_id"],
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
          },
          required: ["span_id"],
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
        const { api_key } = args as { api_key?: string };

        // Check if already authenticated
        if (serverState.isAuthenticated() && !api_key) {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    success: true,
                    message: "Already authenticated",
                    source:
                      "Previously authenticated (likely from environment variable on startup)",
                  },
                  null,
                  2,
                ),
              },
            ],
          };
        }

        // Try to get API key from environment first, then from parameter
        const actualApiKey = process.env["AGENTOPS_API_KEY"] || api_key;
        if (!actualApiKey) {
          throw new Error(
            "No API key available. Please either set the AGENTOPS_API_KEY environment variable or provide an api_key parameter.",
          );
        }

        const authResult = await authWithApiKey(actualApiKey);
        if (typeof authResult === "object" && "error" in authResult) {
          throw new Error(`Authentication failed: ${authResult.error}`);
        }

        // Store the JWT token in server state
        serverState.setJwtToken(authResult);

        const source = process.env["AGENTOPS_API_KEY"]
          ? "environment variable"
          : "provided parameter";
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  success: true,
                  message: "Authentication successful",
                  source: `API key loaded from ${source}`,
                },
                null,
                2,
              ),
            },
          ],
        };
      }

      case "get_project": {
        const result = await makeAuthenticatedRequest("/public/v1/project");
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
        const { trace_id } = args as { trace_id: string };
        const result = await makeAuthenticatedRequest(
          `/public/v1/traces/${trace_id}`,
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
        const { span_id } = args as { span_id: string };
        const result = await makeAuthenticatedRequest(
          `/public/v1/spans/${span_id}`,
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
        const { trace_id } = args as { trace_id: string };
        const result = await makeAuthenticatedRequest(
          `/public/v1/traces/${trace_id}/metrics`,
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
        const { span_id } = args as { span_id: string };
        const result = await makeAuthenticatedRequest(
          `/public/v1/spans/${span_id}/metrics`,
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

  // Initialize authentication before connecting
  await initializeAuth();

  await server.connect(transport);

  // Debug: Log environment variable and authentication status
  const hasApiKey = !!process.env["AGENTOPS_API_KEY"];
  const isAuthenticated = serverState.isAuthenticated();

  console.error("AgentOps MCP server running on stdio");
  console.error(
    `AGENTOPS_API_KEY environment variable: ${hasApiKey ? "SET" : "NOT SET"}`,
  );
  console.error(
    `Authentication status: ${isAuthenticated ? "AUTHENTICATED" : "NOT AUTHENTICATED"}`,
  );

  if (hasApiKey) {
    const keyPreview = process.env["AGENTOPS_API_KEY"]!.substring(0, 8) + "...";
    console.error(`API Key preview: ${keyPreview}`);
  }
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

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  console.error("Uncaught exception:", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled rejection at:", promise, "reason:", reason);
  process.exit(1);
});

if (require.main === module) {
  main().catch((error) => {
    console.error("Server error:", error);
    console.error("Stack trace:", error.stack);
    process.exit(1);
  });
}
