#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Ensure we can find node even with version managers
if (!process.env["NODE_PATH"]) {
    process.env["NODE_PATH"] = __dirname + "/node_modules";
}
const index_js_1 = require("@modelcontextprotocol/sdk/server/index.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const types_js_1 = require("@modelcontextprotocol/sdk/types.js");
const axios_1 = __importDefault(require("axios"));
const HOST = "https://api.agentops.ai";
// Server state to hold JWT token
class ServerState {
    constructor() {
        this.jwtToken = null;
    }
    setJwtToken(token) {
        this.jwtToken = token;
    }
    getAuthHeaders() {
        if (!this.jwtToken) {
            return null;
        }
        return { Authorization: `Bearer ${this.jwtToken}` };
    }
    isAuthenticated() {
        return this.jwtToken !== null;
    }
    clearAuth() {
        this.jwtToken = null;
    }
}
const serverState = new ServerState();
/**
 * Authorize using an AgentOps project API key and return JWT token
 */
async function authWithApiKey(apiKey) {
    const data = { api_key: apiKey };
    try {
        const response = await axios_1.default.post(`${HOST}/public/v1/auth/access_token`, data);
        const bearer = response.data?.bearer;
        if (!bearer) {
            throw new Error("No bearer token received from auth endpoint");
        }
        return bearer;
    }
    catch (error) {
        return { error: error instanceof Error ? error.message : String(error) };
    }
}
/**
 * Clean response by removing empty values
 */
function clean(response) {
    if (typeof response === "object" && response !== null) {
        if (Array.isArray(response)) {
            return response
                .map((item) => clean(item))
                .filter((value) => value !== "" &&
                value !== null &&
                !(Array.isArray(value) && value.length === 0) &&
                !(typeof value === "object" && Object.keys(value).length === 0));
        }
        else {
            const cleaned = {};
            for (const [key, value] of Object.entries(response)) {
                const cleanedValue = clean(value);
                if (cleanedValue !== "" &&
                    cleanedValue !== null &&
                    !(Array.isArray(cleanedValue) && cleanedValue.length === 0) &&
                    !(typeof cleanedValue === "object" &&
                        Object.keys(cleanedValue).length === 0)) {
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
async function makeAuthenticatedRequest(endpoint) {
    const authHeaders = serverState.getAuthHeaders();
    if (!authHeaders) {
        throw new Error("Not authenticated. Please use the 'auth' tool first with your AgentOps API key.");
    }
    try {
        const response = await axios_1.default.get(`${HOST}${endpoint}`, {
            headers: authHeaders,
        });
        return clean(response.data);
    }
    catch (error) {
        throw new Error(error instanceof Error ? error.message : String(error));
    }
}
const server = new index_js_1.Server({
    name: "agentops-mcp",
    version: "0.3.0",
});
// List available tools
server.setRequestHandler(types_js_1.ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: "auth",
                description: "Authorize using a AgentOps project API key and store the resulting JWT token.\n    Look for the AgentOps project API key in the primary file or the .env file.\n\n    Args:\n        api_key: AgentOps project API key (optional if AGENTOPS_API_KEY env var is set).\n\n    Returns:\n        dict: Error message or success.\n    ",
                inputSchema: {
                    type: "object",
                    properties: {
                        api_key: {
                            type: "string",
                            description: "AgentOps project API key (optional if AGENTOPS_API_KEY environment variable is set)",
                        },
                    },
                    required: [],
                },
            },
            {
                name: "get_project",
                description: "Get project information.\n\n    Returns:\n        dict: Project information or error message.\n    ",
                inputSchema: {
                    type: "object",
                    properties: {},
                },
            },
            {
                name: "get_trace",
                description: "Get trace information by ID.\n\n    Args:\n        trace_id\n\n    Returns:\n        dict: Trace information or error message.\n    ",
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
                description: "Get span information by ID.\n\n    Args:\n        span_id\n\n    Returns:\n        dict: Span information or error message.\n    ",
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
                description: "Get metrics for a specific trace.\n\n    Args:\n        trace_id\n\n    Returns:\n        dict: Trace metrics or error message.\n    ",
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
                description: "Get metrics for a specific span.\n\n    Args:\n        span_id\n\n    Returns:\n        dict: Span metrics or error message.\n    ",
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
server.setRequestHandler(types_js_1.CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    try {
        switch (name) {
            case "auth": {
                const { api_key } = args;
                // Try to get API key from environment first, then from parameter
                const actualApiKey = process.env["AGENTOPS_API_KEY"] || api_key;
                if (!actualApiKey) {
                    throw new Error("No API key available. Please either set the AGENTOPS_API_KEY environment variable or provide an api_key parameter.");
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
                            text: JSON.stringify({
                                success: true,
                                message: "Authentication successful",
                                source: `API key loaded from ${source}`,
                            }, null, 2),
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
                const { trace_id } = args;
                const result = await makeAuthenticatedRequest(`/public/v1/traces/${trace_id}`);
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
                const { span_id } = args;
                const result = await makeAuthenticatedRequest(`/public/v1/spans/${span_id}`);
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
                const { trace_id } = args;
                const result = await makeAuthenticatedRequest(`/public/v1/traces/${trace_id}/metrics`);
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
                const { span_id } = args;
                const result = await makeAuthenticatedRequest(`/public/v1/spans/${span_id}/metrics`);
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
                throw new types_js_1.McpError(types_js_1.ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
        }
    }
    catch (error) {
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
    const transport = new stdio_js_1.StdioServerTransport();
    await server.connect(transport);
    // Debug: Log environment variable status
    const hasApiKey = !!process.env["AGENTOPS_API_KEY"];
    console.error("AgentOps MCP server running on stdio");
    console.error(`AGENTOPS_API_KEY environment variable: ${hasApiKey ? "SET" : "NOT SET"}`);
    if (hasApiKey) {
        const keyPreview = process.env["AGENTOPS_API_KEY"].substring(0, 8) + "...";
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
//# sourceMappingURL=server.js.map