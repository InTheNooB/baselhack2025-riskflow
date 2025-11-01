import { openai } from "@ai-sdk/openai";
import { convertToModelMessages, streamText, UIMessage } from "ai";
import { NextRequest } from "next/server";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages, rules } = body;

    const rulesData = typeof rules === "string" ? JSON.parse(rules) : rules;

    // Build context string for AI
    const rulesContext = `
CURRENT CONFIGURATION:

Risk Factors:
${rulesData.riskFactors.map((r: any) => `- ${r.name} (${r.label}): ${r.expression}`).join("\n")}

Decline Rules:
${rulesData.declineRules.map((r: any) => `- ${r.name} (${r.label}): ${r.expression}`).join("\n")}

Gather Info Rules:
${rulesData.gatherInfoRules.map((r: any) => `- ${r.name} (${r.label}): ${r.condition}`).join("\n")}

Mortality Formulas:
${rulesData.mortalityFormulas.map((r: any) => `- ${r.sex}: ${r.formula}`).join("\n")}

You are an AI assistant helping to configure insurance underwriting rules. When the user asks to modify a rule, you should:
1. Identify which rule they want to modify
2. Understand the requested change
3. Generate a new expression using expr-eval syntax
4. Provide the change in JSON format: {"ruleType": "risk_factor|decline_rule|gather_info_rule|mortality_formula", "ruleName": "rule_name", "expression": "new_expression"}

Expression syntax examples:
- Risk factors return multipliers: "isSmoking ? 1.5 : 1.0", "1 + max(0, (bmi - 25) * 0.02)"
- Decline rules return booleans: "severity == 'severe' && status == 'ongoing'"
- Gather info rules return booleans: "isNaN(bmi) || bmi == null"
- Mortality formulas use age: "0.0008 + age * 0.00002"

When you provide a rule change, include it in a JSON code block like:
\`\`\`json
{"ruleType": "risk_factor", "ruleName": "bmi", "expression": "1 + max(0, (bmi - 25) * 0.03)"}
\`\`\`
`;

    const systemPrompt = `You are a helpful AI assistant for configuring insurance underwriting rules. 
${rulesContext}

Be concise but helpful. When generating rule changes, always include the JSON block with the new expression.`;

    const result = await streamText({
      model: openai("gpt-4o"),
      system: systemPrompt,
      messages: convertToModelMessages(messages as UIMessage[]),
      temperature: 0.3,
      maxTokens: 2000,
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("Error in chat API:", error);
    return new Response("Error processing request", { status: 500 });
  }
}

