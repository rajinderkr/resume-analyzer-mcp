#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const index_js_1 = require("@modelcontextprotocol/sdk/server/index.js");
const sse_js_1 = require("@modelcontextprotocol/sdk/server/sse.js");
const types_js_1 = require("@modelcontextprotocol/sdk/types.js");
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
const API_BASE_URL = "https://brainyscout.com/API";
const API_ENDPOINT = `${API_BASE_URL}/rscoregpt`;
const tools = [
    {
        name: "analyze_resume",
        description: "Analyze a candidate resume against a target job description.",
        inputSchema: {
            type: "object",
            properties: {
                resume: {
                    type: "string",
                },
                jobDescription: {
                    type: "string",
                },
                email: {
                    type: "string",
                },
            },
            required: ["resume", "jobDescription"],
        },
    },
];
const server = new index_js_1.Server({
    name: "resume-analyzer-mcp",
    version: "1.0.0",
}, {
    capabilities: {
        tools: {},
    },
});
server.setRequestHandler(types_js_1.ListToolsRequestSchema, async () => {
    return { tools };
});
server.setRequestHandler(types_js_1.CallToolRequestSchema, async (request) => {
    try {
        const { resume, jobDescription, email } = request.params.arguments;
        const payload = {
            resume,
            jobDescription,
            ...(email && { email }),
        };
        const response = await fetch(API_ENDPOINT, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        });
        const data = (await response.json());
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(data, null, 2),
                },
            ],
        };
    }
    catch (error) {
        return {
            isError: true,
            content: [
                {
                    type: "text",
                    text: String(error),
                },
            ],
        };
    }
});
app.get("/", (_, res) => {
    res.send("Resume Analyzer MCP Server Running");
});
app.get("/sse", async (req, res) => {
    const transport = new sse_js_1.SSEServerTransport("/messages", res);
    await server.connect(transport);
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`MCP Server running on port ${PORT}`);
});
//# sourceMappingURL=index.js.map