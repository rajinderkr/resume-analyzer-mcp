declare const mcp: any;
declare const StdioServerTransport: any;
declare const CallToolRequestSchema: any, ErrorCode: any, ListToolsRequestSchema: any;
declare const API_BASE_URL = "https://brainyscout.com/API";
declare const API_ENDPOINT = "https://brainyscout.com/API/rscoregpt";
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
declare const server: any;
declare const tools: {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            resume: {
                type: string;
                description: string;
            };
            jobDescription: {
                type: string;
                description: string;
            };
            email: {
                type: string;
                description: string;
            };
        };
        required: string[];
    };
}[];
declare function main(): Promise<void>;
//# sourceMappingURL=index.d.ts.map