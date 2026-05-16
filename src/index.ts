#!/usr/bin/env node

import {
  Server,
  StdioServerTransport,
} from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";

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

// Initialize server with tools capability
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

// Define tools
const tools: Tool[] = [
  {
    name: "analyze_resume",
    description:
      "Analyze a candidate resume against a target job description. Returns ATS match scores, skill analysis, missing keywords, and improvement recommendations.",
    inputSchema: {
      type: "object",
      properties: {
        resume: {
          type: "string",
          description: "Full extracted text from the candidate resume",
        },
        jobDescription: {
          type: "string",
          description: "Full target job description text",
        },
        email: {
          type: "string",
          description: "Optional: Candidate email address",
        },
      },
      required: ["resume", "jobDescription"],
    },
  },
];

// List tools handler
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});

// Call tool handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name !== "analyze_resume") {
    return {
      isError: true,
      content: [
        {
          type: "text",
          text: `Unknown tool: ${request.params.name}`,
        },
      ],
    };
  }

  const { resume, jobDescription, email } = request.params.arguments as {
    resume: string;
    jobDescription: string;
    email?: string;
  };

  if (!resume || !jobDescription) {
    return {
      isError: true,
      content: [
        {
          type: "text",
          text: "Missing required parameters: resume and jobDescription",
        },
      ],
    };
  }

  try {
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

    if (!response.ok) {
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: `API error: ${response.status} ${response.statusText}`,
          },
        ],
      };
    }

    const data = (await response.json()) as AnalysisResponse;

    const summary = `
**Resume vs Job Description Analysis**

📊 **Overall Match Score:** ${data.overallMatchScore.toFixed(1)}%
🔧 **Hard Skill Match:** ${data.hardSkillScore.toFixed(1)}%
💬 **Soft Skill Match:** ${data.softSkillScore.toFixed(1)}%
✅ **ATS Optimization:** ${data.atsOptimizationScore.toFixed(1)}%

**Matched Skills:**
${data.matchedSkills.map((s) => `• ${s}`).join("\n")}

**Missing Skills:**
${data.missingSkills.map((s) => `• ${s}`).join("\n")}

**Missing Resume Sections:**
${data.missingSections.map((s) => `• ${s}`).join("\n")}

**Weak Keywords:**
${data.weakKeywords.map((w) => `• ${w}`).join("\n")}

**Top Recommendations:**
${data.topRecommendations.map((r) => `• ${r}`).join("\n")}

**Improved Resume Bullet:**
${data.improvedResumeBullet}

**Recruiter Summary:**
${data.recruiterSummary}

**Potential Interview Questions:**
${data.interviewQuestions.map((q) => `• ${q}`).join("\n")}
    `;

    return {
      isError: false,
      content: [
        {
          type: "text",
          text: summary,
        },
      ],
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    return {
      isError: true,
      content: [
        {
          type: "text",
          text: `Error calling Resume Analyzer API: ${errorMessage}`,
        },
      ],
    };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Resume Analyzer MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});