#!/usr/bin/env node

import express, { Request, Response } from "express";
import cors from "cors";

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";

import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";

const app = express();

app.use(cors());
app.use(express.json());

const API_BASE_URL = "https://brainyscout.com/API";
const API_ENDPOINT = `${API_BASE_URL}/rscoregpt`;

interface AnalysisRequest {
  email?: string;
  resume: string;
  jobDescription: string;
}

interface AnalysisResponse {
  overallMatchScore: number;
  hardSkillScore: number;
  softSkillScore: number;
  atsOptimizationScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  missingSections: string[];
  weakKeywords: string[];
  topRecommendations: string[];
  improvedResumeBullet: string;
  recruiterSummary: string;
  interviewQuestions: string[];
}

const tools: Tool[] = [
  {
    name: "analyze_resume",
    description:
      "Analyze a candidate resume against a target job description.",
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

const server = new Server(
  {
    name: "resume-analyzer-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    const { resume, jobDescription, email } = request.params.arguments as {
      resume: string;
      jobDescription: string;
      email?: string;
    };

    const payload: AnalysisRequest = {
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

    const data = (await response.json()) as AnalysisResponse;

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(data, null, 2),
        },
      ],
    };
  } catch (error) {
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

app.get("/", (_: Request, res: Response) => {
  res.send("Resume Analyzer MCP Server Running");
});

app.get("/sse", async (req: Request, res: Response) => {
  const transport = new SSEServerTransport("/messages", res);
  await server.connect(transport);
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`MCP Server running on port ${PORT}`);
});