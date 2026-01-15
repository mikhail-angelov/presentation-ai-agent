import "dotenv/config";
import { ChatDeepSeek } from "@langchain/deepseek";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";

const config = {
  deepseekApiKey: process.env.DEEPSEEK_API_KEY || "",
  deepseekBaseUrl: "https://api.deepseek.com",
  agentName: "Prez AI Agent",
  agentDescription: "AI agent with thinking critic and planning capabilities",
};

// Validate configuration
if (!config.deepseekApiKey) {
  console.error("Error: DEEPSEEK_API_KEY is not set in .env file");
  console.error("Please add your DeepSeek API key to the .env file");
  console.error("You can get one from: https://platform.deepseek.com/api_keys");
  process.exit(1);
}

// Build configuration for DeepSeek client
const deepSeekConfig = {
  apiKey: config.deepseekApiKey,
  model: "deepseek-chat",
  configuration: {
    baseURL: config.deepseekBaseUrl,
  },
  temperature: 0.7,
  maxTokens: 2000,
};

// Initialize DeepSeek LLM using ChatDeepSeek (DeepSeek is OpenAI-compatible)
console.log("Initializing DeepSeek LLM with API key...");
const llm = new ChatDeepSeek(deepSeekConfig);
if (!llm) {
  console.error("❌ Failed to initialize DeepSeek LLM");
  process.exit(1);
}

console.log(`🚀 ${config.agentName} initializing...`);
console.log(`📝 Description: ${config.agentDescription}`);

// Thinking Critic Tools
const thinkingCriticTools = [
  new DynamicStructuredTool({
    name: "thinking",
    description:
      "Analyze and critique a thought process for logical flaws, biases, and improvements",
    schema: z.object({
      thought_process: z.string().describe("The thinking process to critique"),
      context: z
        .string()
        .optional()
        .describe("Additional context for the critique"),
    }),
    func: async ({ thought_process, context }) => {
      const prompt = `As a thinking critic, analyze this thought process for logical consistency, biases, and potential improvements:

Thought Process: ${thought_process}
${context ? `Context: ${context}` : ""}

Provide a structured critique with:
1. Logical flaws identified
2. Cognitive biases detected  
3. Alternative perspectives
4. Specific improvements suggested
5. Confidence level in the original thinking`;

      const response = await llm.invoke([
        new SystemMessage(
          "You are a critical thinking expert. Analyze thought processes rigorously but constructively."
        ),
        new HumanMessage(prompt),
      ]);

      return JSON.stringify(
        {
          critique: response.content,
          timestamp: new Date().toISOString(),
          tool_used: "thinking",
        },
        null,
        2
      );
    },
  }),
  new DynamicStructuredTool({
    name: "planing",
    description:
      "Generate step-by-step advice for improving thinking or decision making",
    schema: z.object({
      problem: z.string().describe("The problem or decision needing advice"),
      current_approach: z
        .string()
        .optional()
        .describe("Current approach being taken"),
    }),
    func: async ({ problem, current_approach }) => {
      const prompt = `Generate step-by-step advice for this problem:

Problem: ${problem}
${current_approach ? `Current Approach: ${current_approach}` : ""}

Provide actionable advice steps that:
1. Break down the problem systematically
2. Suggest concrete actions
3. Include checkpoints for evaluation
4. Consider potential pitfalls
5. Offer alternative strategies`;

      const response = await llm.invoke([
        new SystemMessage(
          "You are an expert advisor who provides clear, actionable, step-by-step guidance."
        ),
        new HumanMessage(prompt),
      ]);

      return JSON.stringify(
        {
          advice_steps: response.content,
          generated_at: new Date().toISOString(),
          tool_used: "planing",
        },
        null,
        2
      );
    },
  }),
];

// Planning Tools (with simulated user approval)
let currentPlan: any = null;
let planApprovalStatus = "none";

const planningTools = [
  new DynamicStructuredTool({
    name: "create_plan",
    description:
      "Create or update a detailed plan with milestones and dependencies",
    schema: z.object({
      objective: z.string().describe("The main objective of the plan"),
      constraints: z.string().optional().describe("Constraints or limitations"),
      timeline: z.string().optional().describe("Desired timeline or deadline"),
    }),
    func: async ({ objective, constraints, timeline }) => {
      const prompt = `Create a detailed plan for this objective:

Objective: ${objective}
${constraints ? `Constraints: ${constraints}` : ""}
${timeline ? `Timeline: ${timeline}` : ""}

Create a comprehensive plan with:
1. Clear milestones and deliverables
2. Dependencies between tasks
3. Resource requirements
4. Risk assessment
5. Success criteria
6. Timeline with estimates`;

      const response = await llm.invoke([
        new SystemMessage(
          "You are an expert planner who creates detailed, actionable plans with clear milestones."
        ),
        new HumanMessage(prompt),
      ]);

      currentPlan = {
        objective,
        constraints,
        timeline,
        plan_details: response.content,
        created_at: new Date().toISOString(),
        requires_approval: true,
      };
      planApprovalStatus = "pending_review";

      return JSON.stringify(
        {
          plan: currentPlan,
          message:
            "Plan created successfully. Requires user approval before execution.",
          approval_required: true,
          tool_used: "create_plan",
        },
        null,
        2
      );
    },
  }),
  new DynamicStructuredTool({
    name: "request_plan_approval",
    description:
      "Request user approval for the current plan (simulates user interaction)",
    schema: z.object({
      changes_requested: z
        .string()
        .optional()
        .describe("Any changes requested by the user"),
    }),
    func: async ({ changes_requested }) => {
      if (!currentPlan) {
        return JSON.stringify({
          error: "No plan exists to approve. Create a plan first.",
        });
      }

      if (changes_requested) {
        // Update plan based on requested changes
        const updatePrompt = `Update the existing plan based on these requested changes:

Original Plan Objective: ${currentPlan.objective}
Requested Changes: ${changes_requested}

Provide an updated plan that incorporates the requested changes while maintaining coherence.`;

        const updateResponse = await llm.invoke([
          new SystemMessage(
            "You are a planner who incorporates feedback and updates plans accordingly."
          ),
          new HumanMessage(updatePrompt),
        ]);

        currentPlan.plan_details = updateResponse.content;
        currentPlan.updated_at = new Date().toISOString();
        currentPlan.changes_requested = changes_requested;
      }

      // Simulate user approval process
      console.log("\n⚠️  PLAN APPROVAL REQUIRED ⚠️");
      console.log("Plan requires user approval before execution.");
      console.log("Objective:", currentPlan.objective);
      console.log("Simulating user approval...");

      // Simulate approval delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      planApprovalStatus = "approved";
      currentPlan.approved_at = new Date().toISOString();
      currentPlan.approved_by = "user";

      return JSON.stringify(
        {
          status: "approved",
          plan: currentPlan,
          message: "Plan approved successfully. Ready for execution.",
          timestamp: new Date().toISOString(),
          tool_used: "request_plan_approval",
        },
        null,
        2
      );
    },
  }),
  new DynamicStructuredTool({
    name: "check_plan_status",
    description: "Check the current plan status and approval state",
    schema: z.object({}),
    func: async () => {
      return JSON.stringify(
        {
          current_plan: currentPlan,
          approval_status: planApprovalStatus,
          last_updated: new Date().toISOString(),
          tool_used: "check_plan_status",
        },
        null,
        2
      );
    },
  }),
];

// Combine all tools
const allTools = [...thinkingCriticTools, ...planningTools];

// Simple agent implementation (without complex LangChain agent framework)
async function runAgent(input: string){
  console.log("\n🤖 Agent analyzing request...");

  // Check which tool to use based on input
  const inputLower = input.toLowerCase();

  if (
    inputLower.includes("critique") ||
    inputLower.includes("critic") ||
    inputLower.includes("thinking") ||
    inputLower.includes("analyze")
  ) {
    // Extract thought process from input
    const thoughtProcess =
      input
        .replace(/.*(thinking|thought|analyze|criqtique|critic)/i, "")
        .trim() || input;

    console.log("Using thinking critic tool...");
    const tool = thinkingCriticTools[0];
    const result = await tool.func({
      thought_process: thoughtProcess,
      problem: "",
    });
    return JSON.parse(result).critique;
  } else if (
    inputLower.includes("plan") ||
    inputLower.includes("create") ||
    inputLower.includes("schedule")
  ) {
    // Extract objective from input
    const objective =
      input.replace(/.*(plan|create|schedule|objective)/i, "").trim() || input;

    console.log("Using planning tool...");
    const tool = planningTools[0];
    // Use type assertion to bypass strict type checking
    const result = await (tool.func as any)({
      objective,
      constraints: "",
      timeline: "",
    });
    const parsed = JSON.parse(result);

    // Auto-request approval for demonstration
    console.log("\nAuto-requesting approval for demonstration...");
    const approvalTool = planningTools[1];
    const approvalResult = await (approvalTool.func as any)({
      changes_requested: "",
    });

    return `${parsed.message}\n\n${
      JSON.parse(approvalResult).message
    }\n\nPlan Details:\n${parsed.plan.plan_details}`;
  } else if (
    inputLower.includes("advice") ||
    inputLower.includes("steps") ||
    inputLower.includes("help")
  ) {
    // Extract problem from input
    const problem = input.replace(/.*(advice|steps|help)/i, "").trim() || input;

    console.log("Using advice steps tool...");
    const tool = thinkingCriticTools[1];
    // Use type assertion to bypass strict type checking
    const result = await (tool.func as any)({ problem });
    return JSON.parse(result).advice_steps;
  } else if (inputLower.includes("status") || inputLower.includes("check")) {
    console.log("Checking plan status...");
    const tool = planningTools[2];
    const result = await (tool.func as any)({});
    const parsed = JSON.parse(result);

    if (parsed.current_plan) {
      return `Current Plan Status: ${parsed.approval_status}\nObjective: ${parsed.current_plan.objective}\nLast Updated: ${parsed.last_updated}`;
    } else {
      return 'No active plan. Create a plan first using "create a plan for..."';
    }
  } else {
    // General response using LLM directly
    const response = await llm.invoke([
      new SystemMessage(`You are ${config.agentName}, an AI assistant with thinking critic and planning capabilities. 
      You can help with: critiquing thinking processes, creating plans, providing advice steps, and checking plan status.
      If the user needs specific help, suggest using one of your specialized tools.`),
      new HumanMessage(input),
    ]);

    return response.content;
  }
}

export { runAgent, config, thinkingCriticTools, planningTools };
