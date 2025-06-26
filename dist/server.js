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
/**
 * Authorize using an AgentOps project API key and return JWT token headers
 */
async function auth(apiKey) {
    const data = { api_key: apiKey };
    try {
        const response = await axios_1.default.post(`${HOST}/public/v1/auth/access_token`, data);
        const bearer = response.data?.bearer;
        if (!bearer) {
            throw new Error("No bearer token received from auth endpoint");
        }
        return { Authorization: `Bearer ${bearer}` };
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
 * Make authenticated request to AgentOps API
 */
async function makeAuthenticatedRequest(endpoint, apiKey) {
    const authResult = await auth(apiKey);
    if ("error" in authResult) {
        throw new Error(`Authentication failed: ${authResult.error}`);
    }
    try {
        const response = await axios_1.default.get(`${HOST}${endpoint}`, {
            headers: authResult,
        });
        return clean(response.data);
    }
    catch (error) {
        throw new Error(error instanceof Error ? error.message : String(error));
    }
}
const server = new index_js_1.Server({
    name: "agentops-mcp",
    version: "0.1.0",
});
// List available tools
server.setRequestHandler(types_js_1.ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: "get_project",
                description: "Retrieve comprehensive information about your AgentOps project, including configuration details, recent activity, and project metadata.",
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
                description: "Fetch detailed information about a specific trace execution by its unique identifier. This includes all spans, execution flow, and basic metadata for the trace.",
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
                description: "Retrieve detailed information about a specific span within a trace. Spans represent individual operations or steps in your agent's execution flow.",
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
                description: "Analyze performance metrics for a specific trace, including execution time, token usage, costs, and other quantitative measurements of the trace's performance.",
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
                description: "Access detailed performance metrics for an individual span, including timing data, resource consumption, and efficiency measurements for that specific operation.",
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
                description: "Retrieve comprehensive trace data including the main trace information, all associated spans with their detailed information, and complete performance metrics for both the trace and all its spans. This provides the most thorough view of a trace execution.",
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
server.setRequestHandler(types_js_1.CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    try {
        switch (name) {
            case "get_project": {
                const { api_key } = args;
                const result = await makeAuthenticatedRequest("/public/v1/project", api_key);
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
                const { trace_id, api_key } = args;
                const result = await makeAuthenticatedRequest(`/public/v1/traces/${trace_id}`, api_key);
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
                const { span_id, api_key } = args;
                const result = await makeAuthenticatedRequest(`/public/v1/spans/${span_id}`, api_key);
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
                const { trace_id, api_key } = args;
                const result = await makeAuthenticatedRequest(`/public/v1/traces/${trace_id}/metrics`, api_key);
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
                const { span_id, api_key } = args;
                const result = await makeAuthenticatedRequest(`/public/v1/spans/${span_id}/metrics`, api_key);
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
                const { trace_id, api_key } = args;
                // Get the main trace information
                const trace = await makeAuthenticatedRequest(`/public/v1/traces/${trace_id}`, api_key);
                // Get trace metrics
                const traceMetrics = await makeAuthenticatedRequest(`/public/v1/traces/${trace_id}/metrics`, api_key);
                trace.metrics = traceMetrics;
                // Get detailed information and metrics for each span
                if (trace.spans && Array.isArray(trace.spans)) {
                    for (const spanDict of trace.spans) {
                        if (spanDict.span_id) {
                            try {
                                const spanInfo = await makeAuthenticatedRequest(`/public/v1/spans/${spanDict.span_id}`, api_key);
                                const spanMetrics = await makeAuthenticatedRequest(`/public/v1/spans/${spanDict.span_id}/metrics`, api_key);
                                spanDict.information = spanInfo;
                                spanDict.metrics = spanMetrics;
                            }
                            catch (error) {
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